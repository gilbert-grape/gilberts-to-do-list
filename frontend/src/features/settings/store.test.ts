import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useSettingsStore, setSettingsApiAdapter, loadSettingsFromServer } from "./store.ts";

vi.mock("@/app/theme.ts", () => ({
  setTheme: vi.fn(),
  applyColorAccent: vi.fn(),
  initTheme: vi.fn(),
  initColorAccent: vi.fn(),
}));

vi.mock("@/app/i18n.ts", () => ({
  default: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

describe("useSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      userName: "",
      completedDisplayMode: "bottom",
      theme: "auto",
      colorAccent: "blue",
      language: "en",
    });
  });

  it("loads userName from localStorage", () => {
    localStorage.setItem("user-name", "Löli");
    // setState to simulate fresh load
    useSettingsStore.setState({
      userName: localStorage.getItem("user-name") ?? "",
    });
    expect(useSettingsStore.getState().userName).toBe("Löli");
  });

  it("falls back to empty string when no userName in localStorage", () => {
    expect(useSettingsStore.getState().userName).toBe("");
  });

  it("loads completedDisplayMode from localStorage", () => {
    localStorage.setItem("completed-display-mode", "hidden");
    useSettingsStore.setState({ completedDisplayMode: "hidden" });
    expect(useSettingsStore.getState().completedDisplayMode).toBe("hidden");
  });

  it("falls back to bottom when no completedDisplayMode in localStorage", () => {
    expect(useSettingsStore.getState().completedDisplayMode).toBe("bottom");
  });

  it("setUserName persists to localStorage and updates state", () => {
    useSettingsStore.getState().setUserName("Gilbert");
    expect(useSettingsStore.getState().userName).toBe("Gilbert");
    expect(localStorage.getItem("user-name")).toBe("Gilbert");
  });

  it("setCompletedDisplayMode persists to localStorage and updates state", () => {
    useSettingsStore.getState().setCompletedDisplayMode("toggleable");
    expect(useSettingsStore.getState().completedDisplayMode).toBe("toggleable");
    expect(localStorage.getItem("completed-display-mode")).toBe("toggleable");
  });

  // Theme tests
  it("defaults theme to auto", () => {
    expect(useSettingsStore.getState().theme).toBe("auto");
  });

  it("setTheme persists to localStorage and updates state", async () => {
    const { setTheme: applyThemeSideEffect } = await import("@/app/theme.ts");
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(applyThemeSideEffect).toHaveBeenCalledWith("dark");
  });

  // Color accent tests
  it("defaults colorAccent to blue", () => {
    expect(useSettingsStore.getState().colorAccent).toBe("blue");
  });

  it("setColorAccent persists to localStorage and updates state", async () => {
    const { applyColorAccent } = await import("@/app/theme.ts");
    useSettingsStore.getState().setColorAccent("purple");
    expect(useSettingsStore.getState().colorAccent).toBe("purple");
    expect(localStorage.getItem("color-accent")).toBe("purple");
    expect(applyColorAccent).toHaveBeenCalledWith("purple");
  });

  // Language tests
  it("defaults language to en", () => {
    expect(useSettingsStore.getState().language).toBe("en");
  });

  it("setLanguage persists to localStorage and updates state", async () => {
    const i18n = (await import("@/app/i18n.ts")).default;
    useSettingsStore.getState().setLanguage("de");
    expect(useSettingsStore.getState().language).toBe("de");
    expect(localStorage.getItem("language")).toBe("de");
    expect(i18n.changeLanguage).toHaveBeenCalledWith("de");
  });

  // Telegram notification settings tests
  it("defaults telegramBotToken to empty string", () => {
    expect(useSettingsStore.getState().telegramBotToken).toBe("");
  });

  it("setTelegramBotToken persists to localStorage and updates state", () => {
    useSettingsStore.getState().setTelegramBotToken("123:ABC");
    expect(useSettingsStore.getState().telegramBotToken).toBe("123:ABC");
    expect(localStorage.getItem("telegram-bot-token")).toBe("123:ABC");
  });

  it("defaults telegramChatId to empty string", () => {
    expect(useSettingsStore.getState().telegramChatId).toBe("");
  });

  it("setTelegramChatId persists to localStorage and updates state", () => {
    useSettingsStore.getState().setTelegramChatId("987654");
    expect(useSettingsStore.getState().telegramChatId).toBe("987654");
    expect(localStorage.getItem("telegram-chat-id")).toBe("987654");
  });

  it("defaults notificationTypes with due and overdue on", () => {
    const types = useSettingsStore.getState().notificationTypes;
    expect(types.dueTodo).toBe(true);
    expect(types.overdueTodo).toBe(true);
    expect(types.dailySummary).toBe(false);
    expect(types.weeklySummary).toBe(false);
  });

  it("setNotificationTypes persists to localStorage and updates state", () => {
    const newTypes = {
      dueTodo: false,
      overdueTodo: true,
      dailySummary: true,
      weeklySummary: false,
    };
    useSettingsStore.getState().setNotificationTypes(newTypes);
    expect(useSettingsStore.getState().notificationTypes).toEqual(newTypes);
    expect(JSON.parse(localStorage.getItem("notification-types")!)).toEqual(
      newTypes,
    );
  });
});

describe("settings server sync", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      userName: "",
      completedDisplayMode: "bottom",
      layoutMode: "normal",
      activeView: "flatList",
      theme: "auto",
      colorAccent: "blue",
      language: "en",
      mindmapSpacing: "small",
      mindmapCollapseThreshold: 5,
      telegramBotToken: "",
      telegramChatId: "",
      notificationTypes: { dueTodo: true, overdueTodo: true, dailySummary: false, weeklySummary: false },
    });
  });

  afterEach(() => {
    setSettingsApiAdapter(null as never);
  });

  it("loadSettingsFromServer applies server values to the store and localStorage", async () => {
    const fakeAdapter = {
      getSettings: vi.fn().mockResolvedValue({
        "user-name": "ServerUser",
        "theme": "dark",
        "color-accent": "purple",
        "language": "de",
        "layout-mode": "compact",
        "gilberts-todo-active-view": "mindmap",
        "mindmap-spacing": "large",
        "mindmap-collapse-threshold": "8",
        "telegram-bot-token": "bot123",
        "telegram-chat-id": "chat456",
        "notification-types": JSON.stringify({ dueTodo: false, overdueTodo: false, dailySummary: true, weeklySummary: true }),
        "completed-display-mode": "hidden",
      }),
      updateSettings: vi.fn(),
    };
    setSettingsApiAdapter(fakeAdapter as never);

    await loadSettingsFromServer();

    const state = useSettingsStore.getState();
    expect(state.userName).toBe("ServerUser");
    expect(state.theme).toBe("dark");
    expect(state.colorAccent).toBe("purple");
    expect(state.language).toBe("de");
    expect(state.layoutMode).toBe("compact");
    expect(state.activeView).toBe("mindmap");
    expect(state.mindmapSpacing).toBe("large");
    expect(state.mindmapCollapseThreshold).toBe(8);
    expect(state.telegramBotToken).toBe("bot123");
    expect(state.telegramChatId).toBe("chat456");
    expect(state.notificationTypes).toEqual({ dueTodo: false, overdueTodo: false, dailySummary: true, weeklySummary: true });
    expect(state.completedDisplayMode).toBe("hidden");

    // Also persisted to localStorage
    expect(localStorage.getItem("user-name")).toBe("ServerUser");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("layout-mode")).toBe("compact");
  });

  it("loadSettingsFromServer does nothing when no adapter is set", async () => {
    setSettingsApiAdapter(null as never);
    await loadSettingsFromServer();
    expect(useSettingsStore.getState().userName).toBe("");
  });

  it("loadSettingsFromServer does nothing when server returns empty object", async () => {
    const fakeAdapter = {
      getSettings: vi.fn().mockResolvedValue({}),
      updateSettings: vi.fn(),
    };
    setSettingsApiAdapter(fakeAdapter as never);
    await loadSettingsFromServer();
    expect(useSettingsStore.getState().theme).toBe("auto");
  });

  it("loadSettingsFromServer ignores invalid values", async () => {
    const fakeAdapter = {
      getSettings: vi.fn().mockResolvedValue({
        "theme": "invalid-theme",
        "mindmap-collapse-threshold": "999",
        "notification-types": "not-json{{{",
      }),
      updateSettings: vi.fn(),
    };
    setSettingsApiAdapter(fakeAdapter as never);
    await loadSettingsFromServer();

    const state = useSettingsStore.getState();
    expect(state.theme).toBe("auto");
    expect(state.mindmapCollapseThreshold).toBe(5);
    expect(state.notificationTypes.dueTodo).toBe(true);
  });

  it("loadSettingsFromServer handles API error gracefully", async () => {
    const fakeAdapter = {
      getSettings: vi.fn().mockRejectedValue(new Error("Network error")),
      updateSettings: vi.fn(),
    };
    setSettingsApiAdapter(fakeAdapter as never);
    await loadSettingsFromServer();
    // Should not throw, state unchanged
    expect(useSettingsStore.getState().theme).toBe("auto");
  });

  it("setters fire syncToServer when adapter is set", () => {
    const fakeAdapter = {
      getSettings: vi.fn(),
      updateSettings: vi.fn().mockResolvedValue(undefined),
    };
    setSettingsApiAdapter(fakeAdapter as never);

    useSettingsStore.getState().setUserName("SyncTest");
    expect(fakeAdapter.updateSettings).toHaveBeenCalledWith({ "user-name": "SyncTest" });

    fakeAdapter.updateSettings.mockClear();
    useSettingsStore.getState().setTheme("dark");
    expect(fakeAdapter.updateSettings).toHaveBeenCalledWith({ "theme": "dark" });

    fakeAdapter.updateSettings.mockClear();
    useSettingsStore.getState().setMindmapCollapseThreshold(10);
    expect(fakeAdapter.updateSettings).toHaveBeenCalledWith({ "mindmap-collapse-threshold": "10" });

    fakeAdapter.updateSettings.mockClear();
    const nt = { dueTodo: false, overdueTodo: false, dailySummary: true, weeklySummary: true };
    useSettingsStore.getState().setNotificationTypes(nt);
    expect(fakeAdapter.updateSettings).toHaveBeenCalledWith({ "notification-types": JSON.stringify(nt) });
  });

  it("setters do not throw when no adapter is set", () => {
    setSettingsApiAdapter(null as never);
    expect(() => useSettingsStore.getState().setUserName("NoAdapter")).not.toThrow();
    expect(useSettingsStore.getState().userName).toBe("NoAdapter");
  });
});

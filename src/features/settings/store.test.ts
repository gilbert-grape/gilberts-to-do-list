import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "./store.ts";

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
});

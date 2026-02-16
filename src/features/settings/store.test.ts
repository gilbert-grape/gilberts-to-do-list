import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "./store.ts";

describe("useSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      userName: "",
      completedDisplayMode: "bottom",
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
});

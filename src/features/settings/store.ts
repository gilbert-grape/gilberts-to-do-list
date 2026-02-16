import { create } from "zustand";
import { USER_NAME_KEY } from "@/features/onboarding/constants.ts";

export type CompletedDisplayMode = "hidden" | "bottom" | "toggleable";

const COMPLETED_DISPLAY_MODE_KEY = "completed-display-mode";
const VALID_MODES: CompletedDisplayMode[] = ["hidden", "bottom", "toggleable"];

function loadUserName(): string {
  try {
    return localStorage.getItem(USER_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function loadCompletedDisplayMode(): CompletedDisplayMode {
  try {
    const saved = localStorage.getItem(COMPLETED_DISPLAY_MODE_KEY);
    if (saved && VALID_MODES.includes(saved as CompletedDisplayMode)) {
      return saved as CompletedDisplayMode;
    }
  } catch {
    // localStorage unavailable
  }
  return "bottom";
}

export interface SettingsState {
  userName: string;
  completedDisplayMode: CompletedDisplayMode;
  setUserName: (name: string) => void;
  setCompletedDisplayMode: (mode: CompletedDisplayMode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  userName: loadUserName(),
  completedDisplayMode: loadCompletedDisplayMode(),

  setUserName: (name) => {
    try {
      localStorage.setItem(USER_NAME_KEY, name);
    } catch {
      // localStorage unavailable
    }
    set({ userName: name });
  },

  setCompletedDisplayMode: (mode) => {
    try {
      localStorage.setItem(COMPLETED_DISPLAY_MODE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
    set({ completedDisplayMode: mode });
  },
}));

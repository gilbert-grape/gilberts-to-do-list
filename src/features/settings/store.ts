import { create } from "zustand";
import { USER_NAME_KEY } from "@/features/onboarding/constants.ts";
import {
  setTheme as applyThemeSideEffect,
  applyColorAccent,
} from "@/app/theme.ts";
import type { Theme, ColorAccent } from "@/app/theme.ts";
import i18n from "@/app/i18n.ts";

export type CompletedDisplayMode = "hidden" | "bottom" | "toggleable";
export type { Theme, ColorAccent };
export type Language = "en" | "de";

const COMPLETED_DISPLAY_MODE_KEY = "completed-display-mode";
const VALID_MODES: CompletedDisplayMode[] = ["hidden", "bottom", "toggleable"];

const THEME_KEY = "theme";
const VALID_THEMES: Theme[] = ["light", "dark", "auto"];

const COLOR_ACCENT_KEY = "color-accent";
const VALID_ACCENTS: ColorAccent[] = ["blue", "purple", "green", "orange"];

const LANGUAGE_KEY = "language";
const VALID_LANGUAGES: Language[] = ["en", "de"];

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

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && VALID_THEMES.includes(saved as Theme)) {
      return saved as Theme;
    }
  } catch {
    // localStorage unavailable
  }
  return "auto";
}

function loadColorAccent(): ColorAccent {
  try {
    const saved = localStorage.getItem(COLOR_ACCENT_KEY);
    if (saved && VALID_ACCENTS.includes(saved as ColorAccent)) {
      return saved as ColorAccent;
    }
  } catch {
    // localStorage unavailable
  }
  return "blue";
}

function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && VALID_LANGUAGES.includes(saved as Language)) {
      return saved as Language;
    }
  } catch {
    // localStorage unavailable
  }
  return "en";
}

export interface SettingsState {
  userName: string;
  completedDisplayMode: CompletedDisplayMode;
  theme: Theme;
  colorAccent: ColorAccent;
  language: Language;
  setUserName: (name: string) => void;
  setCompletedDisplayMode: (mode: CompletedDisplayMode) => void;
  setTheme: (theme: Theme) => void;
  setColorAccent: (accent: ColorAccent) => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  userName: loadUserName(),
  completedDisplayMode: loadCompletedDisplayMode(),
  theme: loadTheme(),
  colorAccent: loadColorAccent(),
  language: loadLanguage(),

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

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage unavailable
    }
    applyThemeSideEffect(theme);
    set({ theme });
  },

  setColorAccent: (accent) => {
    try {
      localStorage.setItem(COLOR_ACCENT_KEY, accent);
    } catch {
      // localStorage unavailable
    }
    applyColorAccent(accent);
    set({ colorAccent: accent });
  },

  setLanguage: (language) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // localStorage unavailable
    }
    void i18n.changeLanguage(language);
    set({ language });
  },
}));

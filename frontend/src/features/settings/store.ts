import { create } from "zustand";
import { USER_NAME_KEY, ONBOARDING_COMPLETE_KEY } from "@/features/onboarding/constants.ts";
import {
  setTheme as applyThemeSideEffect,
  applyColorAccent,
} from "@/app/theme.ts";
import type { Theme, ColorAccent } from "@/app/theme.ts";
import type { ApiAdapter } from "@/services/storage/api/api-adapter.ts";
import i18n from "@/app/i18n.ts";

export type CompletedDisplayMode = "hidden" | "bottom" | "toggleable";
export type LayoutMode = "normal" | "compact";
export type MindmapSpacing = "small" | "medium" | "large";
export type ViewType = "flatList" | "tagTabs" | "grouped" | "mindmap" | "hardcore";
export type { Theme, ColorAccent };
export type Language = "en" | "de";

export interface NotificationTypes {
  dueTodo: boolean;
  overdueTodo: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
}

const COMPLETED_DISPLAY_MODE_KEY = "completed-display-mode";
const VALID_MODES: CompletedDisplayMode[] = ["hidden", "bottom", "toggleable"];

const THEME_KEY = "theme";
const VALID_THEMES: Theme[] = ["light", "dark", "auto"];

const COLOR_ACCENT_KEY = "color-accent";
const VALID_ACCENTS: ColorAccent[] = ["blue", "purple", "green", "orange"];

const LAYOUT_MODE_KEY = "layout-mode";
const VALID_LAYOUT_MODES: LayoutMode[] = ["normal", "compact"];

const LANGUAGE_KEY = "language";
const VALID_LANGUAGES: Language[] = ["en", "de"];

const VIEW_TYPE_KEY = "gilberts-todo-active-view";
const VALID_VIEW_TYPES: ViewType[] = ["flatList", "tagTabs", "grouped", "mindmap", "hardcore"];

const MINDMAP_SPACING_KEY = "mindmap-spacing";
const VALID_MINDMAP_SPACINGS: MindmapSpacing[] = ["small", "medium", "large"];

const MINDMAP_COLLAPSE_THRESHOLD_KEY = "mindmap-collapse-threshold";
const DEFAULT_COLLAPSE_THRESHOLD = 5;
const MIN_COLLAPSE_THRESHOLD = 3;
const MAX_COLLAPSE_THRESHOLD = 15;

const TELEGRAM_BOT_TOKEN_KEY = "telegram-bot-token";
const TELEGRAM_CHAT_ID_KEY = "telegram-chat-id";
const NOTIFICATION_TYPES_KEY = "notification-types";

const DEFAULT_NOTIFICATION_TYPES: NotificationTypes = {
  dueTodo: true,
  overdueTodo: true,
  dailySummary: false,
  weeklySummary: false,
};

// --- Server sync plumbing ---

let _apiAdapter: ApiAdapter | null = null;

export function setSettingsApiAdapter(adapter: ApiAdapter) {
  _apiAdapter = adapter;
}

function syncToServer(changes: Record<string, string>) {
  void _apiAdapter?.updateSettings(changes);
}

export { syncToServer };

export async function loadSettingsFromServer(): Promise<void> {
  if (!_apiAdapter) return;
  let remote: Record<string, string>;
  try {
    remote = await _apiAdapter.getSettings();
  } catch {
    return;
  }
  if (!remote || Object.keys(remote).length === 0) return;

  const store = useSettingsStore.getState();
  const patch: Partial<SettingsState> = {};

  if (remote[USER_NAME_KEY] !== undefined) {
    patch.userName = remote[USER_NAME_KEY];
    try { localStorage.setItem(USER_NAME_KEY, remote[USER_NAME_KEY]); } catch { /* */ }
  }
  if (remote[ONBOARDING_COMPLETE_KEY] === "true") {
    try { localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true"); } catch { /* */ }
  }
  if (remote[COMPLETED_DISPLAY_MODE_KEY] !== undefined && VALID_MODES.includes(remote[COMPLETED_DISPLAY_MODE_KEY] as CompletedDisplayMode)) {
    patch.completedDisplayMode = remote[COMPLETED_DISPLAY_MODE_KEY] as CompletedDisplayMode;
    try { localStorage.setItem(COMPLETED_DISPLAY_MODE_KEY, remote[COMPLETED_DISPLAY_MODE_KEY]); } catch { /* */ }
  }
  if (remote[LAYOUT_MODE_KEY] !== undefined && VALID_LAYOUT_MODES.includes(remote[LAYOUT_MODE_KEY] as LayoutMode)) {
    patch.layoutMode = remote[LAYOUT_MODE_KEY] as LayoutMode;
    try { localStorage.setItem(LAYOUT_MODE_KEY, remote[LAYOUT_MODE_KEY]); } catch { /* */ }
  }
  if (remote[VIEW_TYPE_KEY] !== undefined && VALID_VIEW_TYPES.includes(remote[VIEW_TYPE_KEY] as ViewType)) {
    patch.activeView = remote[VIEW_TYPE_KEY] as ViewType;
    try { localStorage.setItem(VIEW_TYPE_KEY, remote[VIEW_TYPE_KEY]); } catch { /* */ }
  }
  if (remote[THEME_KEY] !== undefined && VALID_THEMES.includes(remote[THEME_KEY] as Theme)) {
    patch.theme = remote[THEME_KEY] as Theme;
    try { localStorage.setItem(THEME_KEY, remote[THEME_KEY]); } catch { /* */ }
    applyThemeSideEffect(remote[THEME_KEY] as Theme);
  }
  if (remote[COLOR_ACCENT_KEY] !== undefined && VALID_ACCENTS.includes(remote[COLOR_ACCENT_KEY] as ColorAccent)) {
    patch.colorAccent = remote[COLOR_ACCENT_KEY] as ColorAccent;
    try { localStorage.setItem(COLOR_ACCENT_KEY, remote[COLOR_ACCENT_KEY]); } catch { /* */ }
    applyColorAccent(remote[COLOR_ACCENT_KEY] as ColorAccent);
  }
  if (remote[LANGUAGE_KEY] !== undefined && VALID_LANGUAGES.includes(remote[LANGUAGE_KEY] as Language)) {
    patch.language = remote[LANGUAGE_KEY] as Language;
    try { localStorage.setItem(LANGUAGE_KEY, remote[LANGUAGE_KEY]); } catch { /* */ }
    void i18n.changeLanguage(remote[LANGUAGE_KEY] as Language);
  }
  if (remote[MINDMAP_SPACING_KEY] !== undefined && VALID_MINDMAP_SPACINGS.includes(remote[MINDMAP_SPACING_KEY] as MindmapSpacing)) {
    patch.mindmapSpacing = remote[MINDMAP_SPACING_KEY] as MindmapSpacing;
    try { localStorage.setItem(MINDMAP_SPACING_KEY, remote[MINDMAP_SPACING_KEY]); } catch { /* */ }
  }
  if (remote[MINDMAP_COLLAPSE_THRESHOLD_KEY] !== undefined) {
    const num = Number(remote[MINDMAP_COLLAPSE_THRESHOLD_KEY]);
    if (Number.isInteger(num) && num >= MIN_COLLAPSE_THRESHOLD && num <= MAX_COLLAPSE_THRESHOLD) {
      patch.mindmapCollapseThreshold = num;
      try { localStorage.setItem(MINDMAP_COLLAPSE_THRESHOLD_KEY, remote[MINDMAP_COLLAPSE_THRESHOLD_KEY]); } catch { /* */ }
    }
  }
  if (remote[TELEGRAM_BOT_TOKEN_KEY] !== undefined) {
    patch.telegramBotToken = remote[TELEGRAM_BOT_TOKEN_KEY];
    try { localStorage.setItem(TELEGRAM_BOT_TOKEN_KEY, remote[TELEGRAM_BOT_TOKEN_KEY]); } catch { /* */ }
  }
  if (remote[TELEGRAM_CHAT_ID_KEY] !== undefined) {
    patch.telegramChatId = remote[TELEGRAM_CHAT_ID_KEY];
    try { localStorage.setItem(TELEGRAM_CHAT_ID_KEY, remote[TELEGRAM_CHAT_ID_KEY]); } catch { /* */ }
  }
  if (remote[NOTIFICATION_TYPES_KEY] !== undefined) {
    try {
      const parsed = JSON.parse(remote[NOTIFICATION_TYPES_KEY]);
      patch.notificationTypes = { ...DEFAULT_NOTIFICATION_TYPES, ...parsed };
      try { localStorage.setItem(NOTIFICATION_TYPES_KEY, remote[NOTIFICATION_TYPES_KEY]); } catch { /* */ }
    } catch {
      // invalid JSON — ignore
    }
  }

  if (Object.keys(patch).length > 0) {
    useSettingsStore.setState(patch);
  }
}

// --- localStorage loaders ---

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

function loadLayoutMode(): LayoutMode {
  try {
    const saved = localStorage.getItem(LAYOUT_MODE_KEY);
    if (saved && VALID_LAYOUT_MODES.includes(saved as LayoutMode)) {
      return saved as LayoutMode;
    }
  } catch {
    // localStorage unavailable
  }
  return "normal";
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

function loadViewType(): ViewType {
  try {
    const saved = localStorage.getItem(VIEW_TYPE_KEY);
    if (saved && VALID_VIEW_TYPES.includes(saved as ViewType)) {
      return saved as ViewType;
    }
  } catch {
    // localStorage unavailable
  }
  return "flatList";
}

function loadMindmapSpacing(): MindmapSpacing {
  try {
    const saved = localStorage.getItem(MINDMAP_SPACING_KEY);
    if (saved && VALID_MINDMAP_SPACINGS.includes(saved as MindmapSpacing)) {
      return saved as MindmapSpacing;
    }
  } catch {
    // localStorage unavailable
  }
  return "small";
}

function loadMindmapCollapseThreshold(): number {
  try {
    const saved = localStorage.getItem(MINDMAP_COLLAPSE_THRESHOLD_KEY);
    if (saved) {
      const num = Number(saved);
      if (Number.isInteger(num) && num >= MIN_COLLAPSE_THRESHOLD && num <= MAX_COLLAPSE_THRESHOLD) {
        return num;
      }
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_COLLAPSE_THRESHOLD;
}

function loadTelegramBotToken(): string {
  try {
    return localStorage.getItem(TELEGRAM_BOT_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function loadTelegramChatId(): string {
  try {
    return localStorage.getItem(TELEGRAM_CHAT_ID_KEY) ?? "";
  } catch {
    return "";
  }
}

function loadNotificationTypes(): NotificationTypes {
  try {
    const saved = localStorage.getItem(NOTIFICATION_TYPES_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_TYPES, ...JSON.parse(saved) };
    }
  } catch {
    // localStorage unavailable or invalid JSON
  }
  return { ...DEFAULT_NOTIFICATION_TYPES };
}

export interface SettingsState {
  userName: string;
  completedDisplayMode: CompletedDisplayMode;
  layoutMode: LayoutMode;
  activeView: ViewType;
  theme: Theme;
  colorAccent: ColorAccent;
  language: Language;
  telegramBotToken: string;
  telegramChatId: string;
  mindmapSpacing: MindmapSpacing;
  mindmapCollapseThreshold: number;
  notificationTypes: NotificationTypes;
  setUserName: (name: string) => void;
  setCompletedDisplayMode: (mode: CompletedDisplayMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setActiveView: (view: ViewType) => void;
  setTheme: (theme: Theme) => void;
  setColorAccent: (accent: ColorAccent) => void;
  setLanguage: (language: Language) => void;
  setMindmapSpacing: (spacing: MindmapSpacing) => void;
  setMindmapCollapseThreshold: (threshold: number) => void;
  setTelegramBotToken: (token: string) => void;
  setTelegramChatId: (chatId: string) => void;
  setNotificationTypes: (types: NotificationTypes) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  userName: loadUserName(),
  completedDisplayMode: loadCompletedDisplayMode(),
  layoutMode: loadLayoutMode(),
  activeView: loadViewType(),
  theme: loadTheme(),
  colorAccent: loadColorAccent(),
  language: loadLanguage(),
  mindmapSpacing: loadMindmapSpacing(),
  mindmapCollapseThreshold: loadMindmapCollapseThreshold(),
  telegramBotToken: loadTelegramBotToken(),
  telegramChatId: loadTelegramChatId(),
  notificationTypes: loadNotificationTypes(),

  setUserName: (name) => {
    try {
      localStorage.setItem(USER_NAME_KEY, name);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [USER_NAME_KEY]: name });
    set({ userName: name });
  },

  setCompletedDisplayMode: (mode) => {
    try {
      localStorage.setItem(COMPLETED_DISPLAY_MODE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [COMPLETED_DISPLAY_MODE_KEY]: mode });
    set({ completedDisplayMode: mode });
  },

  setLayoutMode: (mode) => {
    try {
      localStorage.setItem(LAYOUT_MODE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [LAYOUT_MODE_KEY]: mode });
    set({ layoutMode: mode });
  },

  setActiveView: (view) => {
    try {
      localStorage.setItem(VIEW_TYPE_KEY, view);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [VIEW_TYPE_KEY]: view });
    set({ activeView: view });
  },

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [THEME_KEY]: theme });
    applyThemeSideEffect(theme);
    set({ theme });
  },

  setColorAccent: (accent) => {
    try {
      localStorage.setItem(COLOR_ACCENT_KEY, accent);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [COLOR_ACCENT_KEY]: accent });
    applyColorAccent(accent);
    set({ colorAccent: accent });
  },

  setLanguage: (language) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [LANGUAGE_KEY]: language });
    void i18n.changeLanguage(language);
    set({ language });
  },

  setMindmapSpacing: (spacing) => {
    try {
      localStorage.setItem(MINDMAP_SPACING_KEY, spacing);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [MINDMAP_SPACING_KEY]: spacing });
    set({ mindmapSpacing: spacing });
  },

  setMindmapCollapseThreshold: (threshold) => {
    const clamped = Math.max(MIN_COLLAPSE_THRESHOLD, Math.min(MAX_COLLAPSE_THRESHOLD, Math.round(threshold)));
    try {
      localStorage.setItem(MINDMAP_COLLAPSE_THRESHOLD_KEY, String(clamped));
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [MINDMAP_COLLAPSE_THRESHOLD_KEY]: String(clamped) });
    set({ mindmapCollapseThreshold: clamped });
  },

  setTelegramBotToken: (token) => {
    try {
      localStorage.setItem(TELEGRAM_BOT_TOKEN_KEY, token);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [TELEGRAM_BOT_TOKEN_KEY]: token });
    set({ telegramBotToken: token });
  },

  setTelegramChatId: (chatId) => {
    try {
      localStorage.setItem(TELEGRAM_CHAT_ID_KEY, chatId);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [TELEGRAM_CHAT_ID_KEY]: chatId });
    set({ telegramChatId: chatId });
  },

  setNotificationTypes: (types) => {
    const json = JSON.stringify(types);
    try {
      localStorage.setItem(NOTIFICATION_TYPES_KEY, json);
    } catch {
      // localStorage unavailable
    }
    syncToServer({ [NOTIFICATION_TYPES_KEY]: json });
    set({ notificationTypes: types });
  },
}));

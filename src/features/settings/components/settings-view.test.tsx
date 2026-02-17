import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsView } from "./settings-view.tsx";
import { useSettingsStore } from "../store.ts";
import { useTagStore } from "@/features/tags/store.ts";
import { useTodoStore } from "@/features/todos/store.ts";

vi.mock("@/app/theme.ts", () => ({
  setTheme: vi.fn(),
  applyColorAccent: vi.fn(),
}));

vi.mock("@/app/i18n.ts", () => ({
  default: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

vi.mock("@/services/notifications/telegram.ts", () => ({
  sendTestNotification: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/services/sync/folder-sync.ts", () => ({
  useFolderSyncStore: (selector?: (s: { status: string; folderName: string }) => unknown) => {
    const state = { status: "disconnected", folderName: "" };
    return selector ? selector(state) : state;
  },
  isFolderSyncSupported: () => false,
  connectFolder: vi.fn(),
  disconnectFolder: vi.fn(),
  restoreFolder: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "nav.settings": "Settings",
        "settings.profile": "Profile",
        "settings.displayName": "Display Name",
        "settings.completedDisplay": "Completed Todos Display",
        "settings.completedHidden": "Hidden",
        "settings.completedBottom": "Show at Bottom",
        "settings.completedToggleable": "Toggleable",
        "common.save": "Save",
        "tags.title": "Tag Management",
        "tags.namePlaceholder": "Tag name...",
        "tags.create": "Create",
        "tags.colorPicker": "Color picker",
        "tags.default": "Default",
        "tags.setDefault": "Set as default",
        "common.edit": "Edit",
        "common.delete": "Delete",
        "settings.appearance": "Appearance",
        "settings.theme": "Theme",
        "settings.themeLight": "Light",
        "settings.themeDark": "Dark",
        "settings.themeAuto": "Auto",
        "settings.colorAccent": "Color Accent",
        "settings.accentBlue": "Blue",
        "settings.accentPurple": "Purple",
        "settings.accentGreen": "Green",
        "settings.accentOrange": "Orange",
        "settings.language": "Language",
        "settings.languageEn": "English",
        "settings.languageDe": "Deutsch",
        "settings.importExport": "Import & Export",
        "settings.export": "Export",
        "settings.import": "Import",
        "settings.downloadMd": "Download .md",
        "settings.importDescription": "Upload .md files to import to-dos.",
        "settings.selectFiles": "Select .md Files",
        "settings.localFolder": "Local Folder",
        "settings.folderSyncUnsupported":
          "Folder sync is only available in Chrome and Edge.",
        "settings.notifications": "Notifications",
        "settings.notificationsDescription":
          "Configure Telegram notifications for your to-dos.",
        "settings.botToken": "Bot Token",
        "settings.botTokenPlaceholder": "Enter bot token...",
        "settings.chatId": "Chat ID",
        "settings.chatIdPlaceholder": "Enter chat ID...",
        "settings.toggleTokenVisibility": "Toggle token visibility",
        "settings.testNotification": "Test Notification",
        "settings.testSending": "Sending...",
        "settings.testSuccess": "Notification sent successfully!",
        "settings.testFailed": "Notification failed",
        "settings.notificationTypes": "Notification Types",
        "settings.notifyDueTodo": "To-do due",
        "settings.notifyOverdueTodo": "To-do overdue",
        "settings.notifyDailySummary": "Daily summary",
        "settings.notifyWeeklySummary": "Weekly summary",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("SettingsView", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      userName: "Löli",
      completedDisplayMode: "bottom",
      theme: "auto",
      colorAccent: "blue",
      language: "en",
      setUserName: vi.fn(),
      setCompletedDisplayMode: vi.fn(),
      setTheme: vi.fn(),
      setColorAccent: vi.fn(),
      setLanguage: vi.fn(),
      telegramBotToken: "",
      telegramChatId: "",
      notificationTypes: {
        dueTodo: true,
        overdueTodo: true,
        dailySummary: false,
        weeklySummary: false,
      },
      setTelegramBotToken: vi.fn(),
      setTelegramChatId: vi.fn(),
      setNotificationTypes: vi.fn(),
    });
    useTagStore.setState({
      tags: [
        { id: "tag-1", name: "General", color: "#ef4444", isDefault: true },
      ],
      isLoaded: true,
    });
    useTodoStore.setState({
      todos: [],
      isLoaded: true,
    });
  });

  it("renders settings heading", () => {
    render(<SettingsView />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders profile section", () => {
    render(<SettingsView />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Löli")).toBeInTheDocument();
  });

  it("renders tag manager section", () => {
    render(<SettingsView />);
    expect(screen.getByText("Tag Management")).toBeInTheDocument();
  });

  it("renders completed display section", () => {
    render(<SettingsView />);
    expect(screen.getByText("Completed Todos Display")).toBeInTheDocument();
    expect(screen.getByLabelText("Show at Bottom")).toBeChecked();
  });

  it("renders appearance section", () => {
    render(<SettingsView />);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByLabelText("Auto")).toBeChecked();
  });

  it("renders language section", () => {
    render(<SettingsView />);
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByLabelText("English")).toBeChecked();
  });

  it("renders notifications section", () => {
    render(<SettingsView />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });
});

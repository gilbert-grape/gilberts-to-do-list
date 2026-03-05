import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationsSection } from "./notifications-section.tsx";
import { useSettingsStore } from "../store.ts";

vi.mock("@/app/theme.ts", () => ({
  setTheme: vi.fn(),
  applyColorAccent: vi.fn(),
}));

vi.mock("@/app/i18n.ts", () => ({
  default: { changeLanguage: vi.fn(() => Promise.resolve()) },
}));

const mockSendTestNotification = vi.fn();

vi.mock("@/services/notifications/telegram.ts", () => ({
  sendTestNotification: (...args: unknown[]) =>
    mockSendTestNotification(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
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
        "common.save": "Save",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("NotificationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
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
  });

  it("renders section heading", () => {
    render(<NotificationsSection />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders bot token and chat ID fields", () => {
    render(<NotificationsSection />);
    expect(screen.getByText("Bot Token")).toBeInTheDocument();
    expect(screen.getByText("Chat ID")).toBeInTheDocument();
  });

  it("renders notification type checkboxes", () => {
    render(<NotificationsSection />);
    expect(screen.getByText("Notification Types")).toBeInTheDocument();
    expect(screen.getByLabelText("To-do due")).toBeChecked();
    expect(screen.getByLabelText("To-do overdue")).toBeChecked();
    expect(screen.getByLabelText("Daily summary")).not.toBeChecked();
    expect(screen.getByLabelText("Weekly summary")).not.toBeChecked();
  });

  it("renders test notification button", () => {
    render(<NotificationsSection />);
    expect(screen.getByText("Test Notification")).toBeInTheDocument();
  });

  it("toggles token visibility when eye button is clicked", async () => {
    const user = userEvent.setup();
    useSettingsStore.setState({ telegramBotToken: "123456:ABCDEFGH" });
    render(<NotificationsSection />);

    const input = screen.getByPlaceholderText("Enter bot token...");
    expect(input).toHaveAttribute("type", "password");

    const toggleButton = screen.getByLabelText("Toggle token visibility");
    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");
  });

  it("saves token and chat ID when Save is clicked", async () => {
    const user = userEvent.setup();
    const mockSetToken = vi.fn();
    const mockSetChatId = vi.fn();
    useSettingsStore.setState({
      setTelegramBotToken: mockSetToken,
      setTelegramChatId: mockSetChatId,
    });
    render(<NotificationsSection />);

    const tokenInput = screen.getByPlaceholderText("Enter bot token...");
    await user.click(tokenInput);
    await user.type(tokenInput, "my-token");

    const chatInput = screen.getByPlaceholderText("Enter chat ID...");
    await user.type(chatInput, "12345");

    await user.click(screen.getByText("Save"));
    expect(mockSetToken).toHaveBeenCalledWith("my-token");
    expect(mockSetChatId).toHaveBeenCalledWith("12345");
  });

  it("sends test notification when button is clicked", async () => {
    const user = userEvent.setup();
    mockSendTestNotification.mockResolvedValue({ ok: true });
    useSettingsStore.setState({
      telegramBotToken: "123:ABC",
      telegramChatId: "456",
    });
    render(<NotificationsSection />);

    await user.click(screen.getByText("Test Notification"));
    expect(mockSendTestNotification).toHaveBeenCalledWith("123:ABC", "456");
  });

  it("shows success message after successful test", async () => {
    const user = userEvent.setup();
    mockSendTestNotification.mockResolvedValue({ ok: true });
    useSettingsStore.setState({
      telegramBotToken: "123:ABC",
      telegramChatId: "456",
    });
    render(<NotificationsSection />);

    await user.click(screen.getByText("Test Notification"));
    expect(
      await screen.findByText("Notification sent successfully!"),
    ).toBeInTheDocument();
  });

  it("shows error message after failed test", async () => {
    const user = userEvent.setup();
    mockSendTestNotification.mockResolvedValue({
      ok: false,
      error: "Unauthorized",
    });
    useSettingsStore.setState({
      telegramBotToken: "bad",
      telegramChatId: "456",
    });
    render(<NotificationsSection />);

    await user.click(screen.getByText("Test Notification"));
    expect(
      await screen.findByText(/Notification failed.*Unauthorized/),
    ).toBeInTheDocument();
  });

  it("toggles notification type when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const mockSetTypes = vi.fn();
    useSettingsStore.setState({ setNotificationTypes: mockSetTypes });
    render(<NotificationsSection />);

    await user.click(screen.getByLabelText("Daily summary"));
    expect(mockSetTypes).toHaveBeenCalledWith(
      expect.objectContaining({ dailySummary: true }),
    );
  });

  it("disables test button when no credentials", () => {
    render(<NotificationsSection />);
    expect(screen.getByText("Test Notification")).toBeDisabled();
  });
});

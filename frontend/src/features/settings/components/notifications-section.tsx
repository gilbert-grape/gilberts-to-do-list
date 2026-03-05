import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store.ts";
import type { NotificationTypes } from "../store.ts";
import { sendTestNotification } from "@/services/notifications/telegram.ts";

export function NotificationsSection() {
  const { t } = useTranslation();
  const botToken = useSettingsStore((s) => s.telegramBotToken);
  const chatId = useSettingsStore((s) => s.telegramChatId);
  const notificationTypes = useSettingsStore((s) => s.notificationTypes);
  const setBotToken = useSettingsStore((s) => s.setTelegramBotToken);
  const setChatId = useSettingsStore((s) => s.setTelegramChatId);
  const setNotificationTypes = useSettingsStore(
    (s) => s.setNotificationTypes,
  );

  const [tokenDraft, setTokenDraft] = useState(botToken);
  const [chatIdDraft, setChatIdDraft] = useState(chatId);
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const maskedToken =
    tokenDraft.length > 8
      ? tokenDraft.slice(0, 4) + "…" + tokenDraft.slice(-4)
      : tokenDraft ? "••••" : "";

  const hasChanges =
    tokenDraft !== botToken || chatIdDraft !== chatId;

  const handleSave = () => {
    setBotToken(tokenDraft.trim());
    setChatId(chatIdDraft.trim());
    setShowSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setShowSaved(false), 2000);
  };

  const handleTest = async () => {
    setTestStatus("sending");
    setTestError("");
    const savedToken = tokenDraft.trim() || botToken;
    const savedChatId = chatIdDraft.trim() || chatId;
    const result = await sendTestNotification(savedToken, savedChatId);
    if (result.ok) {
      setTestStatus("success");
    } else {
      setTestStatus("error");
      setTestError(result.error ?? "Unknown error");
    }
  };

  const handleTypeChange = (key: keyof NotificationTypes) => {
    setNotificationTypes({
      ...notificationTypes,
      [key]: !notificationTypes[key],
    });
  };

  const canTest = (tokenDraft.trim() || botToken) && (chatIdDraft.trim() || chatId);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {t("settings.notifications")}
      </h2>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {t("settings.notificationsDescription")}
      </p>

      {/* Bot Token */}
      <label className="block text-sm text-[var(--color-text-secondary)]">
        {t("settings.botToken")}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showToken ? "text" : "password"}
            value={showToken ? tokenDraft : maskedToken}
            onChange={(e) => {
              setShowToken(true);
              setTokenDraft(e.target.value);
            }}
            onFocus={() => setShowToken(true)}
            placeholder={t("settings.botTokenPlaceholder")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            aria-label={t("settings.toggleTokenVisibility")}
          >
            {showToken ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z"
                  clipRule="evenodd"
                />
                <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0110 17c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.838-4.494l2.06 2.06A4 4 0 0010.748 13.93z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path
                  fillRule="evenodd"
                  d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Chat ID */}
      <label className="block text-sm text-[var(--color-text-secondary)]">
        {t("settings.chatId")}
      </label>
      <input
        type="text"
        value={chatIdDraft}
        onChange={(e) => setChatIdDraft(e.target.value)}
        placeholder={t("settings.chatIdPlaceholder")}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
      />

      {/* Save + Test buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {t("common.save")}
        </button>
        {showSaved && (
          <span className="self-center text-sm text-[var(--color-success)]">
            {t("settings.saved")}
          </span>
        )}
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={!canTest || testStatus === "sending"}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          {testStatus === "sending"
            ? t("settings.testSending")
            : t("settings.testNotification")}
        </button>
      </div>

      {/* Test result feedback */}
      {testStatus === "success" && (
        <p className="text-sm text-[var(--color-success)]">{t("settings.testSuccess")}</p>
      )}
      {testStatus === "error" && (
        <p className="text-sm text-[var(--color-danger)]">
          {t("settings.testFailed")}: {testError}
        </p>
      )}

      {/* Notification types */}
      <h3 className="text-sm font-medium text-[var(--color-text)]">
        {t("settings.notificationTypes")}
      </h3>
      <div className="space-y-2">
        {(
          [
            ["dueTodo", "settings.notifyDueTodo"],
            ["overdueTodo", "settings.notifyOverdueTodo"],
            ["dailySummary", "settings.notifyDailySummary"],
            ["weeklySummary", "settings.notifyWeeklySummary"],
          ] as const
        ).map(([key, labelKey]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notificationTypes[key]}
              onChange={() => handleTypeChange(key)}
              className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-text)]">
              {t(labelKey)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<TelegramResult> {
  if (!botToken || !chatId) {
    return { ok: false, error: "Bot token and chat ID are required" };
  }

  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        ok: false,
        error: (data as { description?: string }).description ?? "Request failed",
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function sendTestNotification(
  botToken: string,
  chatId: string,
): Promise<TelegramResult> {
  return sendTelegramMessage(
    botToken,
    chatId,
    "✅ *Gilbert's To-Do List* — Test notification successful!",
  );
}

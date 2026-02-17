import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendTelegramMessage, sendTestNotification } from "./telegram.ts";

describe("sendTelegramMessage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns error when bot token is empty", async () => {
    const result = await sendTelegramMessage("", "123", "hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("required");
  });

  it("returns error when chat ID is empty", async () => {
    const result = await sendTelegramMessage("token", "", "hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("required");
  });

  it("sends message and returns ok on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const result = await sendTelegramMessage("123:ABC", "456", "Test");
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:ABC/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "456",
          text: "Test",
          parse_mode: "Markdown",
        }),
      }),
    );
  });

  it("returns error on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ ok: false, description: "Unauthorized" }),
        { status: 401 },
      ),
    );

    const result = await sendTelegramMessage("bad", "456", "Test");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("returns error on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await sendTelegramMessage("123:ABC", "456", "Test");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Network error");
  });
});

describe("sendTestNotification", () => {
  it("sends a test message with correct text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const result = await sendTestNotification("123:ABC", "456");
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("Test notification successful"),
      }),
    );
  });
});

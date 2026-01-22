import { describe, expect, test, beforeEach, mock } from "bun:test";
import TelegramProvider from "../telegram";

describe("TelegramProvider", () => {
  let provider: TelegramProvider;
  let originalFetch: typeof global.fetch;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = { ...process.env };

    // Set required env vars
    process.env.TELEGRAM_BOT_ID = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
    process.env.TELEGRAM_CHAT_ID = "-1001234567890";

    provider = new TelegramProvider();
  });

  describe("sendMessage", () => {
    test("should send message successfully", async () => {
      // #given - mock successful response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await provider.sendMessage("Test message");

      // #then
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: "-1001234567890",
            text: "Test message",
            parse_mode: "Markdown",
          }),
        }
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should send message with markdown formatting", async () => {
      // #given - mock successful response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;
      const markdownMessage = "**Bold** text and *italic* text";

      // #when
      await provider.sendMessage(markdownMessage);

      // #then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.parse_mode).toBe("Markdown");
      expect(body.text).toBe(markdownMessage);

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should send multiline message", async () => {
      // #given - mock successful response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;
      const multilineMessage = "Line 1\nLine 2\nLine 3";

      // #when
      await provider.sendMessage(multilineMessage);

      // #then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.text).toBe(multilineMessage);

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should send empty message", async () => {
      // #given - mock successful response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await provider.sendMessage("");

      // #then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.text).toBe("");

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should send very long message", async () => {
      // #given - mock successful response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;
      const longMessage = "A".repeat(4000);

      // #when
      await provider.sendMessage(longMessage);

      // #then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.text).toBe(longMessage);

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should throw error on 400 Bad Request", async () => {
      // #given - bad request response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 400,
            statusText: "Bad Request",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow(
        "[Telegram] HTTP error: 400 Bad Request"
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should throw error on 401 Unauthorized", async () => {
      // #given - unauthorized response (invalid bot token)
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 401,
            statusText: "Unauthorized",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow(
        "[Telegram] HTTP error: 401 Unauthorized"
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should throw error on 403 Forbidden", async () => {
      // #given - forbidden response (bot blocked by user)
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 403,
            statusText: "Forbidden",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow(
        "[Telegram] HTTP error: 403 Forbidden"
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should throw error on 404 Not Found", async () => {
      // #given - not found response (invalid chat ID)
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 404,
            statusText: "Not Found",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow(
        "[Telegram] HTTP error: 404 Not Found"
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should throw error on 429 Too Many Requests", async () => {
      // #given - rate limit response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 429,
            statusText: "Too Many Requests",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow(
        "[Telegram] HTTP error: 429 Too Many Requests"
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should throw error on 500 Internal Server Error", async () => {
      // #given - server error response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 500,
            statusText: "Internal Server Error",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow(
        "[Telegram] HTTP error: 500 Internal Server Error"
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should handle network errors", async () => {
      // #given - network error
      global.fetch = mock(() =>
        Promise.reject(new Error("Network error"))
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.sendMessage("Test")).rejects.toThrow("Network error");

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should construct correct URL from env variables", async () => {
      // #given - different bot ID
      process.env.TELEGRAM_BOT_ID = "999888:XYZ-ABC9876def";
      const customProvider = new TelegramProvider();

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await customProvider.sendMessage("Test");

      // #then
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bot999888:XYZ-ABC9876def/sendMessage",
        expect.any(Object)
      );

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should use correct chat ID from env variables", async () => {
      // #given - different chat ID
      process.env.TELEGRAM_CHAT_ID = "-9876543210";
      const customProvider = new TelegramProvider();

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await customProvider.sendMessage("Test");

      // #then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.chat_id).toBe("-9876543210");

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should handle missing TELEGRAM_CHAT_ID env variable", async () => {
      // #given - missing chat ID
      delete process.env.TELEGRAM_CHAT_ID;
      const customProvider = new TelegramProvider();

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await customProvider.sendMessage("Test");

      // #then - should use empty string as default
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.chat_id).toBe("");

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });

    test("should send POST request with correct headers", async () => {
      // #given - mock successful response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await provider.sendMessage("Test");

      // #then
      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");

      // cleanup
      global.fetch = originalFetch;
      process.env = originalEnv;
    });
  });
});

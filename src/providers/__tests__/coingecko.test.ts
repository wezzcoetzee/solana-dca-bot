import { describe, expect, test, beforeEach, mock } from "bun:test";
import CoinGeckoProvider from "../coingecko";

describe("CoinGeckoProvider", () => {
  let provider: CoinGeckoProvider;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    provider = new CoinGeckoProvider();
    originalFetch = global.fetch;
  });

  describe("getPriceAsync", () => {
    test("should fetch and return token price successfully", async () => {
      // #given - mock successful response
      const mockResponse = {
        bitcoin: { usd: 50000 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      const price = await provider.getPriceAsync("bitcoin");

      // #then
      expect(price).toBe(50000);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should fetch price for different token", async () => {
      // #given - ethereum price
      const mockResponse = {
        ethereum: { usd: 3000 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      const price = await provider.getPriceAsync("ethereum");

      // #then
      expect(price).toBe(3000);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should handle fractional prices", async () => {
      // #given - token with fractional price
      const mockResponse = {
        "usd-coin": { usd: 1.0001 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      const price = await provider.getPriceAsync("usd-coin");

      // #then
      expect(price).toBe(1.0001);

      // cleanup
      global.fetch = originalFetch;
    });

    test("should handle very large prices", async () => {
      // #given - high value token
      const mockResponse = {
        bitcoin: { usd: 100000 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      const price = await provider.getPriceAsync("bitcoin");

      // #then
      expect(price).toBe(100000);

      // cleanup
      global.fetch = originalFetch;
    });

    test("should handle very small prices", async () => {
      // #given - low value token
      const mockResponse = {
        "shiba-inu": { usd: 0.00001234 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      const price = await provider.getPriceAsync("shiba-inu");

      // #then
      expect(price).toBe(0.00001234);

      // cleanup
      global.fetch = originalFetch;
    });

    test("should throw error when response is not ok", async () => {
      // #given - failed response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 404,
            statusText: "Not Found",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.getPriceAsync("invalid-token")).rejects.toThrow(
        "[CoinGecko] HTTP error: 404 Not Found"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should throw error on 429 rate limit", async () => {
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
      await expect(provider.getPriceAsync("bitcoin")).rejects.toThrow(
        "[CoinGecko] HTTP error: 429 Too Many Requests"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should throw error on 500 server error", async () => {
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
      await expect(provider.getPriceAsync("bitcoin")).rejects.toThrow(
        "[CoinGecko] HTTP error: 500 Internal Server Error"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should throw error on 503 service unavailable", async () => {
      // #given - service unavailable response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(null, {
            status: 503,
            statusText: "Service Unavailable",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.getPriceAsync("bitcoin")).rejects.toThrow(
        "[CoinGecko] HTTP error: 503 Service Unavailable"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should throw error when token data is missing", async () => {
      // #given - response without requested token
      const mockResponse = {
        "different-token": { usd: 100 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when / #then - should throw TypeError when accessing undefined
      await expect(provider.getPriceAsync("bitcoin")).rejects.toThrow();

      // cleanup
      global.fetch = originalFetch;
    });

    test("should throw error when JSON parsing fails", async () => {
      // #given - invalid JSON response
      global.fetch = mock(() =>
        Promise.resolve(
          new Response("invalid json", {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.getPriceAsync("bitcoin")).rejects.toThrow();

      // cleanup
      global.fetch = originalFetch;
    });

    test("should handle network errors", async () => {
      // #given - network error
      global.fetch = mock(() =>
        Promise.reject(new Error("Network error"))
      ) as typeof global.fetch;

      // #when / #then
      await expect(provider.getPriceAsync("bitcoin")).rejects.toThrow("Network error");

      // cleanup
      global.fetch = originalFetch;
    });

    test("should construct correct URL with token parameter", async () => {
      // #given - custom token ID
      const mockResponse = {
        "wrapped-bitcoin": { usd: 45000 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      await provider.getPriceAsync("wrapped-bitcoin");

      // #then - verify URL construction
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd"
      );

      // cleanup
      global.fetch = originalFetch;
    });

    test("should handle zero price", async () => {
      // #given - token with zero price (edge case)
      const mockResponse = {
        "dead-token": { usd: 0 },
      };
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: "OK",
          })
        )
      ) as typeof global.fetch;

      // #when
      const price = await provider.getPriceAsync("dead-token");

      // #then
      expect(price).toBe(0);

      // cleanup
      global.fetch = originalFetch;
    });
  });
});

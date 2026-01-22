import { describe, expect, test } from "bun:test";
import { lamportsToToken, usdToUsdcLamports, USDC_DECIMALS } from "../token-utils";

describe("token-utils", () => {
  describe("lamportsToToken", () => {
    test("should convert lamports to tokens with standard decimals", () => {
      // #given - 1 SOL (9 decimals) = 1_000_000_000 lamports
      const lamports = 1_000_000_000;
      const decimals = 9;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(1);
    });

    test("should convert lamports to tokens with USDC decimals", () => {
      // #given - 1 USDC (6 decimals) = 1_000_000 lamports
      const lamports = 1_000_000;
      const decimals = 6;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(1);
    });

    test("should convert lamports to tokens with 8 decimals (cbBTC)", () => {
      // #given - 0.5 cbBTC (8 decimals) = 50_000_000 lamports
      const lamports = 50_000_000;
      const decimals = 8;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(0.5);
    });

    test("should handle bigint input", () => {
      // #given - bigint lamports
      const lamports = 5_000_000_000n;
      const decimals = 9;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(5);
    });

    test("should handle zero lamports", () => {
      // #given
      const lamports = 0;
      const decimals = 9;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(0);
    });

    test("should handle zero decimals", () => {
      // #given - edge case where token has no decimals
      const lamports = 42;
      const decimals = 0;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(42);
    });

    test("should handle fractional tokens", () => {
      // #given - 0.123456 SOL
      const lamports = 123_456_000;
      const decimals = 9;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBeCloseTo(0.123456, 6);
    });

    test("should handle very large amounts", () => {
      // #given - 1 billion tokens
      const lamports = 1_000_000_000_000_000_000;
      const decimals = 9;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(1_000_000_000);
    });

    test("should handle single lamport", () => {
      // #given - smallest possible unit
      const lamports = 1;
      const decimals = 9;

      // #when
      const result = lamportsToToken(lamports, decimals);

      // #then
      expect(result).toBe(0.000000001);
    });
  });

  describe("usdToUsdcLamports", () => {
    test("should convert USD to USDC lamports", () => {
      // #given - $100 USD
      const usd = 100;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(100_000_000); // 100 * 10^6
    });

    test("should convert fractional USD to USDC lamports", () => {
      // #given - $5.50 USD
      const usd = 5.5;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(5_500_000);
    });

    test("should handle zero USD", () => {
      // #given
      const usd = 0;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(0);
    });

    test("should handle very small USD amounts", () => {
      // #given - $0.01 USD
      const usd = 0.01;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(10_000);
    });

    test("should handle large USD amounts", () => {
      // #given - $1,000,000 USD
      const usd = 1_000_000;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(1_000_000_000_000);
    });

    test("should handle default USD amount from config", () => {
      // #given - default $5 USD
      const usd = 5;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(5_000_000);
    });

    test("should use USDC_DECIMALS constant correctly", () => {
      // #given
      const usd = 1;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(10 ** USDC_DECIMALS);
    });

    test("should handle precision for typical DCA amounts", () => {
      // #given - typical DCA amount
      const usd = 25.75;

      // #when
      const result = usdToUsdcLamports(usd);

      // #then
      expect(result).toBe(25_750_000);
    });
  });
});

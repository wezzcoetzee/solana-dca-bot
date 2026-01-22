import { describe, expect, test } from "bun:test";
import { formatNotificationMessage } from "../message-formatter";
import type { Notification } from "../../interfaces";

describe("message-formatter", () => {
  describe("formatNotificationMessage", () => {
    test("should format complete notification message", () => {
      // #given - complete notification data
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.5,
          sellTokenBalance: 500,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("Successfully bought **0.01 BTC** ($5) @ $50000 per BTC!");
      expect(result).toContain("SOL: 0.5");
      expect(result).toContain("USDC: 500");
      expect(result).toContain("BTC: 0.05");
      expect(result).toContain("Total Spent: $250");
      expect(result).toContain("Value: $2500");
      expect(result).toContain("Average Buy Price: $50000");
      expect(result).toContain("Profit: $2250");
      expect(result).toContain("ROI: 900%");
      expect(result).toContain("[View on Orbmarkets]");
      expect(result).toContain("abc123");
    });

    test("should include SOL topup warning when balance is below threshold", () => {
      // #given - low SOL balance (< 0.01)
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.005,
          sellTokenBalance: 500,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("SOL: 0.005 TOPUP REQUIRED");
    });

    test("should include USDC topup warning when balance is below threshold", () => {
      // #given - low USDC balance (< 100)
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.5,
          sellTokenBalance: 50,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("USDC: 50 TOPUP REQUIRED");
    });

    test("should include both topup warnings when both balances are low", () => {
      // #given - both balances low
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.001,
          sellTokenBalance: 10,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("SOL: 0.001 TOPUP REQUIRED");
      expect(result).toContain("USDC: 10 TOPUP REQUIRED");
    });

    test("should not include topup warnings when balances are sufficient", () => {
      // #given - sufficient balances
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 1.0,
          sellTokenBalance: 500,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).not.toContain("TOPUP REQUIRED");
    });

    test("should handle exactly at threshold for SOL (0.01)", () => {
      // #given - exactly at threshold
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.01,
          sellTokenBalance: 500,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).not.toContain("SOL: 0.01 TOPUP REQUIRED");
      expect(result).toContain("SOL: 0.01");
    });

    test("should handle exactly at threshold for USDC (100)", () => {
      // #given - exactly at threshold
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.5,
          sellTokenBalance: 100,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 2500,
          profit: 2250,
          roi: 900,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).not.toContain("USDC: 100 TOPUP REQUIRED");
      expect(result).toContain("USDC: 100");
    });

    test("should format negative ROI correctly", () => {
      // #given - negative ROI
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 40000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.5,
          sellTokenBalance: 500,
          buyTokenBalance: 0.05,
        },
        stats: {
          totalSpent: 250,
          currentValue: 200,
          profit: -50,
          roi: -20,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("Profit: $-50");
      expect(result).toContain("ROI: -20%");
    });

    test("should calculate cold wallet value correctly", () => {
      // #given - specific token price and balance
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.5,
          tokenPrice: 100,
          transactionSignature: "abc123",
          usdAmountPurchased: 50,
          tokenSymbol: "TOKEN",
        },
        balances: {
          gasTokenBalance: 0.5,
          sellTokenBalance: 500,
          buyTokenBalance: 10,
        },
        stats: {
          totalSpent: 1000,
          currentValue: 1000,
          profit: 0,
          roi: 0,
          averageBuyPrice: 100,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then - 10 * 100 = 1000
      expect(result).toContain("Value: $1000");
    });

    test("should handle zero balances", () => {
      // #given - zero balances
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.01,
          tokenPrice: 50000,
          transactionSignature: "abc123",
          usdAmountPurchased: 5,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0,
          sellTokenBalance: 0,
          buyTokenBalance: 0,
        },
        stats: {
          totalSpent: 5,
          currentValue: 0,
          profit: -5,
          roi: -100,
          averageBuyPrice: 50000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("SOL: 0 TOPUP REQUIRED");
      expect(result).toContain("USDC: 0 TOPUP REQUIRED");
      expect(result).toContain("BTC: 0");
    });

    test("should handle different token symbols", () => {
      // #given - different token (ETH)
      const notification: Notification = {
        transaction: {
          amountPurchased: 1,
          tokenPrice: 3000,
          transactionSignature: "abc123",
          usdAmountPurchased: 3000,
          tokenSymbol: "ETH",
        },
        balances: {
          gasTokenBalance: 0.5,
          sellTokenBalance: 5000,
          buyTokenBalance: 10,
        },
        stats: {
          totalSpent: 30000,
          currentValue: 30000,
          profit: 0,
          roi: 0,
          averageBuyPrice: 3000,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("Successfully bought **1 ETH**");
      expect(result).toContain("per ETH!");
      expect(result).toContain("ETH: 10");
      expect(result).toContain("Total ETH: 10");
    });

    test("should handle fractional amounts correctly", () => {
      // #given - fractional amounts
      const notification: Notification = {
        transaction: {
          amountPurchased: 0.123456,
          tokenPrice: 89123.45,
          transactionSignature: "abc123",
          usdAmountPurchased: 11.01,
          tokenSymbol: "BTC",
        },
        balances: {
          gasTokenBalance: 0.087654,
          sellTokenBalance: 234.56,
          buyTokenBalance: 0.987654,
        },
        stats: {
          totalSpent: 123.45,
          currentValue: 88000.12,
          profit: 87876.67,
          roi: 71200.5,
          averageBuyPrice: 87654.32,
        },
      };

      // #when
      const result = formatNotificationMessage(notification);

      // #then
      expect(result).toContain("0.123456");
      expect(result).toContain("89123.45");
      expect(result).toContain("11.01");
      expect(result).toContain("0.087654");
      expect(result).toContain("234.56");
      expect(result).toContain("0.987654");
    });
  });
});

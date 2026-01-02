import { describe, expect, test, beforeEach } from "bun:test";
import Notify from "../../src/utils/notify";
import { MockNotificationProvider } from "../mocks";
import type { Notification } from "../../src/interfaces";

describe("Notify", () => {
  let notify: Notify;
  let mockProvider: MockNotificationProvider;

  const createNotification = (
    overrides: Partial<Notification> = {}
  ): Notification => ({
    amountPurchased: 0.001,
    buyTokenBalance: 0.01,
    gasTokenBalance: 1.5,
    sellTokenBalance: 500,
    tokenPrice: 50000,
    transactionSignature: "abc123",
    usdAmountPurchased: 50,
    totalSpent: 1000,
    currentValue: 1200,
    profit: 200,
    roi: 20,
    averageBuyPrice: 45000,
    tokenSymbol: "cbBTC",
    ...overrides,
  });

  beforeEach(() => {
    mockProvider = new MockNotificationProvider();
    notify = new Notify(mockProvider);
  });

  describe("notifyAsync", () => {
    test("sends message via notification provider", async () => {
      await notify.notifyAsync(createNotification());

      expect(mockProvider.messages).toHaveLength(1);
    });

    test("includes purchase amount in message", async () => {
      await notify.notifyAsync(createNotification({ amountPurchased: 0.002 }));

      const message = mockProvider.getLastMessage();
      expect(message).toContain("0.002 cbBTC");
    });

    test("includes USD amount in message", async () => {
      await notify.notifyAsync(
        createNotification({ usdAmountPurchased: 100 })
      );

      const message = mockProvider.getLastMessage();
      expect(message).toContain("$100");
    });

    test("includes token price in message", async () => {
      await notify.notifyAsync(createNotification({ tokenPrice: 60000 }));

      const message = mockProvider.getLastMessage();
      expect(message).toContain("$60000");
    });

    test("includes ROI in message", async () => {
      await notify.notifyAsync(createNotification({ roi: 25 }));

      const message = mockProvider.getLastMessage();
      expect(message).toContain("ROI: 25%");
    });

    test("includes profit in message", async () => {
      await notify.notifyAsync(createNotification({ profit: 500 }));

      const message = mockProvider.getLastMessage();
      expect(message).toContain("Profit: $500");
    });

    test("includes low SOL balance warning", async () => {
      await notify.notifyAsync(createNotification({ gasTokenBalance: 0.005 }));

      const message = mockProvider.getLastMessage();
      expect(message).toContain("TOPUP REQUIRED");
    });

    test("includes low USDC balance warning", async () => {
      await notify.notifyAsync(createNotification({ sellTokenBalance: 50 }));

      const message = mockProvider.getLastMessage();
      expect(message).toContain("TOPUP REQUIRED");
    });

    test("does not include warning when balances are sufficient", async () => {
      await notify.notifyAsync(
        createNotification({
          gasTokenBalance: 1.0,
          sellTokenBalance: 500,
        })
      );

      const message = mockProvider.getLastMessage();
      expect(message).not.toContain("TOPUP REQUIRED");
    });

    test("includes Orbmarkets link", async () => {
      await notify.notifyAsync(
        createNotification({ transactionSignature: "txsig123" })
      );

      const message = mockProvider.getLastMessage();
      expect(message).toContain("Orbmarkets");
      expect(message).toContain("txsig123");
    });

    test("includes wallet balances", async () => {
      await notify.notifyAsync(
        createNotification({
          gasTokenBalance: 2.5,
          sellTokenBalance: 750,
          buyTokenBalance: 0.05,
        })
      );

      const message = mockProvider.getLastMessage();
      expect(message).toContain("SOL: 2.5");
      expect(message).toContain("USDC: 750");
      expect(message).toContain("cbBTC: 0.05");
    });

    test("includes stats section", async () => {
      await notify.notifyAsync(
        createNotification({
          totalSpent: 2000,
          currentValue: 2500,
          averageBuyPrice: 48000,
        })
      );

      const message = mockProvider.getLastMessage();
      expect(message).toContain("Total Spent: $2000");
      expect(message).toContain("Value: $2500");
      expect(message).toContain("Average Buy Price: $48000");
    });
  });
});

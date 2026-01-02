import { describe, expect, test, beforeEach } from "bun:test";
import Calculator from "../../src/utils/calculator";
import { MockTransactionRepository } from "../mocks";

describe("Calculator", () => {
  let calculator: Calculator;
  let mockRepo: MockTransactionRepository;

  beforeEach(() => {
    mockRepo = new MockTransactionRepository();
    calculator = new Calculator(mockRepo);
  });

  describe("determineBotStatsAsync", () => {
    test("returns zero stats when no transactions exist", async () => {
      const stats = await calculator.determineBotStatsAsync("wallet1", 0, 50000);

      expect(stats.totalSpent).toBe(0);
      expect(stats.currentValue).toBe(0);
      expect(stats.profit).toBe(0);
      expect(stats.roi).toBe(0);
      expect(stats.averageBuyPrice).toBe(0);
    });

    test("calculates positive ROI correctly", async () => {
      mockRepo.seedTransactions([
        { date: new Date(), wallet: "wallet1", amount: 100, tokenPrice: 40000 },
        { date: new Date(), wallet: "wallet1", amount: 100, tokenPrice: 45000 },
      ]);

      const stats = await calculator.determineBotStatsAsync(
        "wallet1",
        0.005,
        50000
      );

      expect(stats.totalSpent).toBe(200);
      expect(stats.currentValue).toBe(250);
      expect(stats.profit).toBe(50);
      expect(stats.roi).toBe(25);
    });

    test("calculates negative ROI correctly", async () => {
      mockRepo.seedTransactions([
        { date: new Date(), wallet: "wallet1", amount: 100, tokenPrice: 60000 },
      ]);

      const stats = await calculator.determineBotStatsAsync(
        "wallet1",
        0.001,
        50000
      );

      expect(stats.totalSpent).toBe(100);
      expect(stats.currentValue).toBe(50);
      expect(stats.profit).toBe(-50);
      expect(stats.roi).toBe(-50);
    });

    test("only includes transactions for specified wallet", async () => {
      mockRepo.seedTransactions([
        { date: new Date(), wallet: "wallet1", amount: 100, tokenPrice: 40000 },
        { date: new Date(), wallet: "wallet2", amount: 200, tokenPrice: 45000 },
      ]);

      const stats = await calculator.determineBotStatsAsync(
        "wallet1",
        0.002,
        50000
      );

      expect(stats.totalSpent).toBe(100);
    });

    test("calculates average buy price correctly", async () => {
      mockRepo.seedTransactions([
        { date: new Date(), wallet: "wallet1", amount: 50, tokenPrice: 40000 },
        { date: new Date(), wallet: "wallet1", amount: 50, tokenPrice: 60000 },
      ]);

      const stats = await calculator.determineBotStatsAsync(
        "wallet1",
        0.002,
        50000
      );

      expect(stats.totalSpent).toBe(100);
      expect(stats.averageBuyPrice).toBe(50000);
    });

    test("handles single transaction", async () => {
      mockRepo.seedTransactions([
        { date: new Date(), wallet: "wallet1", amount: 50, tokenPrice: 45000 },
      ]);

      const stats = await calculator.determineBotStatsAsync(
        "wallet1",
        0.001,
        50000
      );

      expect(stats.totalSpent).toBe(50);
      expect(stats.currentValue).toBe(50);
      expect(stats.profit).toBe(0);
      expect(stats.roi).toBe(0);
    });
  });
});

import { describe, expect, test, beforeEach, mock } from "bun:test";
import DatabaseProvider from "../../src/providers/database";

describe("DatabaseProvider", () => {
  let mockPrisma: any;
  let provider: DatabaseProvider;

  beforeEach(() => {
    mockPrisma = {
      transaction: {
        create: mock(() => Promise.resolve({ id: "test-id" })),
        findMany: mock(() => Promise.resolve([])),
      },
      $connect: mock(() => Promise.resolve()),
      $disconnect: mock(() => Promise.resolve()),
    };

    provider = new (DatabaseProvider as any)(mockPrisma);
  });

  describe("insertTransactionAsync", () => {
    test("calls prisma create with correct data", async () => {
      await provider.insertTransactionAsync("wallet1", 100, 50000, "BTC");

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          wallet: "wallet1",
          amount: 100,
          tokenPrice: 50000,
          symbol: "BTC",
        },
      });
    });

    test("handles multiple inserts", async () => {
      await provider.insertTransactionAsync("wallet1", 100, 50000, "BTC");
      await provider.insertTransactionAsync("wallet2", 200, 55000, "ETH");

      expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTransactionsAsync", () => {
    test("queries by wallet address", async () => {
      await provider.getTransactionsAsync("wallet1");

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { wallet: "wallet1" },
      });
    });

    test("returns empty array when no transactions", async () => {
      const transactions = await provider.getTransactionsAsync("wallet1");

      expect(transactions).toEqual([]);
    });

    test("maps database records to Transaction type", async () => {
      const dbRecords = [
        {
          id: "1",
          date: new Date("2024-01-01"),
          wallet: "wallet1",
          amount: 100,
          tokenPrice: 50000,
          symbol: "BTC",
        },
      ];

      mockPrisma.transaction.findMany = mock(() => Promise.resolve(dbRecords));
      provider = new (DatabaseProvider as any)(mockPrisma);

      const transactions = await provider.getTransactionsAsync("wallet1");

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        id: "1",
        date: new Date("2024-01-01"),
        wallet: "wallet1",
        amount: 100,
        tokenPrice: 50000,
        symbol: "BTC",
      });
    });
  });

  describe("disconnect", () => {
    test("calls prisma disconnect", async () => {
      await provider.disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});

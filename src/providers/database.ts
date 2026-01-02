import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";
import type { ITransactionRepository, Transaction } from "../interfaces";

dotenv.config();

export default class DatabaseProvider implements ITransactionRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  static async create(): Promise<DatabaseProvider> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    await prisma.$connect();
    return new DatabaseProvider(prisma);
  }

  async insertTransactionAsync(
    wallet: string,
    amount: number,
    tokenPrice: number,
    symbol: string
  ): Promise<void> {
    await this.prisma.transaction.create({
      data: {
        wallet,
        amount,
        tokenPrice,
        symbol,
      },
    });
    console.log("Database: Transaction saved");
  }

  async getTransactionsAsync(wallet: string): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { wallet },
    });

    return transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      wallet: tx.wallet,
      amount: tx.amount,
      tokenPrice: tx.tokenPrice,
      symbol: tx.symbol,
    }));
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

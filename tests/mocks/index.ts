import type {
  ITransactionRepository,
  INotificationProvider,
  Transaction,
} from "../../src/interfaces";

export class MockTransactionRepository implements ITransactionRepository {
  private transactions: Transaction[] = [];

  async insertTransactionAsync(
    wallet: string,
    amount: number,
    tokenPrice: number,
    symbol: string
  ): Promise<void> {
    this.transactions.push({
      date: new Date(),
      wallet,
      amount,
      tokenPrice,
      symbol,
    });
  }

  async getTransactionsAsync(wallet: string): Promise<Transaction[]> {
    return this.transactions.filter((tx) => tx.wallet === wallet);
  }

  reset(): void {
    this.transactions = [];
  }

  seedTransactions(txs: Transaction[]): void {
    this.transactions = [...txs];
  }
}

export class MockNotificationProvider implements INotificationProvider {
  public messages: string[] = [];

  async sendMessage(message: string): Promise<void> {
    this.messages.push(message);
  }

  reset(): void {
    this.messages = [];
  }

  getLastMessage(): string | undefined {
    return this.messages[this.messages.length - 1];
  }
}

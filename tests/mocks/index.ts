import type {
  ITransactionRepository,
  INotificationProvider,
  IPriceProvider,
  ISwapProvider,
  SwapResult,
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

export class MockPriceProvider implements IPriceProvider {
  private prices: Map<string, number> = new Map();
  private defaultPrice = 50000;

  async getPriceAsync(token: string): Promise<number> {
    const price = this.prices.get(token);
    if (price !== undefined) {
      return price;
    }
    return this.defaultPrice;
  }

  setPrice(token: string, price: number): void {
    this.prices.set(token, price);
  }

  setDefaultPrice(price: number): void {
    this.defaultPrice = price;
  }

  reset(): void {
    this.prices.clear();
    this.defaultPrice = 50000;
  }
}

export class MockSwapProvider implements ISwapProvider {
  public swapCalls: Array<{
    inputMint: string;
    outputMint: string;
    amount: number;
    destinationWallet: string;
    slippageBps: number;
  }> = [];

  private shouldFail = false;
  private failureError = new Error("Swap failed");
  private outAmount = "10000000";
  private signature = "mock-signature-123";

  async executeSwapAsync(
    inputMint: string,
    outputMint: string,
    amount: number,
    destinationWallet: string,
    slippageBps: number
  ): Promise<SwapResult> {
    this.swapCalls.push({
      inputMint,
      outputMint,
      amount,
      destinationWallet,
      slippageBps,
    });

    if (this.shouldFail) {
      throw this.failureError;
    }

    return {
      outAmount: this.outAmount,
      signature: this.signature,
    };
  }

  setShouldFail(fail: boolean, error?: Error): void {
    this.shouldFail = fail;
    if (error) {
      this.failureError = error;
    }
  }

  setOutAmount(amount: string): void {
    this.outAmount = amount;
  }

  setSignature(sig: string): void {
    this.signature = sig;
  }

  reset(): void {
    this.swapCalls = [];
    this.shouldFail = false;
    this.failureError = new Error("Swap failed");
    this.outAmount = "10000000";
    this.signature = "mock-signature-123";
  }
}

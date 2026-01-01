export interface Transaction {
  id?: string;
  date: Date;
  wallet: string;
  amount: number;
  btcPrice: number;
}

export interface ITransactionRepository {
  insertTransactionAsync(
    wallet: string,
    amount: number,
    btcPrice: number
  ): Promise<void>;
  getTransactionsAsync(wallet: string): Promise<Transaction[]>;
}

export interface IPriceProvider {
  getBitcoinPriceAsync(): Promise<number>;
  getPriceAsync(token: string): Promise<number>;
}

export interface INotificationProvider {
  sendMessage(message: string): Promise<void>;
}

export interface CalculatorResponse {
  totalSpent: number;
  currentValue: number;
  profit: number;
  roi: number;
  averageBuyPrice: number;
}

export interface Notification extends CalculatorResponse {
  amountPurchased: number;
  buyTokenBalance: number;
  gasTokenBalance: number;
  sellTokenBalance: number;
  tokenPrice: number;
  transactionSignature: string;
  usdAmountPurchased: number;
}

export interface Transaction {
  id?: string;
  date: Date;
  wallet: string;
  amount: number;
  tokenPrice: number;
  symbol: string;
}

export interface ITransactionRepository {
  insertTransactionAsync(
    wallet: string,
    amount: number,
    tokenPrice: number,
    symbol: string
  ): Promise<void>;
  getTransactionsAsync(wallet: string): Promise<Transaction[]>;
}

export interface IPriceProvider {
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

export interface WalletBalances {
  gasTokenBalance: number;
  sellTokenBalance: number;
  buyTokenBalance: number;
}

export interface TransactionDetails {
  amountPurchased: number;
  tokenPrice: number;
  transactionSignature: string;
  usdAmountPurchased: number;
  tokenSymbol: string;
}

export interface Notification {
  transaction: TransactionDetails;
  balances: WalletBalances;
  stats: CalculatorResponse;
}

export interface SwapResult {
  outAmount: string;
  signature: string;
}

export interface ISwapProvider {
  executeSwapAsync(
    inputMint: string,
    outputMint: string,
    amount: number,
    destinationWallet: string,
    slippageBps: number
  ): Promise<SwapResult>;
}

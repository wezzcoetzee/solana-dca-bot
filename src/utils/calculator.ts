import type {
  ITransactionRepository,
  CalculatorResponse,
} from "../interfaces";

export default class Calculator {
  constructor(private repository: ITransactionRepository) {}

  async determineBotStatsAsync(
    wallet: string,
    buyTokenBalance: number,
    buyTokenPrice: number
  ): Promise<CalculatorResponse> {
    const allTransactions = await this.repository.getTransactionsAsync(wallet);

    const totalSpent = allTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const currentValue = buyTokenBalance * buyTokenPrice;
    const profit = currentValue - totalSpent;
    const roi = totalSpent > 0 ? (profit / totalSpent) * 100 : 0;
    const averageBuyPrice =
      buyTokenBalance > 0 ? totalSpent / buyTokenBalance : 0;

    return {
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      averageBuyPrice: parseFloat(averageBuyPrice.toFixed(2)),
    };
  }
}

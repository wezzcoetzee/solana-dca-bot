import type { INotificationProvider, Notification } from "../interfaces";
import { Config } from "./config";

export default class Notify {
  constructor(private notificationProvider: INotificationProvider) {}

  async notifyAsync(inputs: Notification): Promise<void> {
    const {
      amountPurchased,
      buyTokenBalance,
      gasTokenBalance,
      sellTokenBalance,
      tokenPrice,
      transactionSignature,
      usdAmountPurchased,
      totalSpent,
      currentValue,
      profit,
      roi,
      averageBuyPrice,
    } = inputs;

    await this.notificationProvider.sendMessage(
      `Successfully bought **${amountPurchased} cbBTC** ($${usdAmountPurchased}) @ $${tokenPrice} per BTC!

Bot Wallet Balances:
  - SOL: ${gasTokenBalance} ${gasTokenBalance < 0.01 ? "TOPUP REQUIRED" : ""}
  - USDC: ${sellTokenBalance} ${sellTokenBalance < 100 ? "TOPUP REQUIRED" : ""}

Cold Wallet Balances:
  - cbBTC: ${buyTokenBalance}
  - Value: $${Number(buyTokenBalance) * tokenPrice}

Stats
  - Total Spent: $${totalSpent}
  - Total BTC: ${buyTokenBalance}
  - Value: $${currentValue}
  - Average Buy Price: $${averageBuyPrice}
  - Profit: $${profit}
  - ROI: ${roi}%

-----------------------------------------
[View on Solscan](${Config.solscan.txUrl}/${transactionSignature})
      `
    );
  }
}

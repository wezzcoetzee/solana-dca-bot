import type { Notification } from "../interfaces";
import { Config } from "./config";

const LOW_SOL_THRESHOLD = 0.01;
const LOW_USDC_THRESHOLD = 100;

export function formatNotificationMessage(notification: Notification): string {
  const { transaction, balances, stats } = notification;

  const solWarning = balances.gasTokenBalance < LOW_SOL_THRESHOLD ? " TOPUP REQUIRED" : "";
  const usdcWarning = balances.sellTokenBalance < LOW_USDC_THRESHOLD ? " TOPUP REQUIRED" : "";

  return `Successfully bought **${transaction.amountPurchased} ${transaction.tokenSymbol}** ($${transaction.usdAmountPurchased}) @ $${transaction.tokenPrice} per ${transaction.tokenSymbol}!

Bot Wallet Balances:
  - SOL: ${balances.gasTokenBalance}${solWarning}
  - USDC: ${balances.sellTokenBalance}${usdcWarning}

Cold Wallet Balances:
  - ${transaction.tokenSymbol}: ${balances.buyTokenBalance}
  - Value: $${Number(balances.buyTokenBalance) * transaction.tokenPrice}

Stats
  - Total Spent: $${stats.totalSpent}
  - Total ${transaction.tokenSymbol}: ${balances.buyTokenBalance}
  - Value: $${stats.currentValue}
  - Average Buy Price: $${stats.averageBuyPrice}
  - Profit: $${stats.profit}
  - ROI: ${stats.roi}%

-----------------------------------------
[View on Orbmarkets](${Config.blockchainExplorer.txUrl}/${transaction.transactionSignature})
      `;
}

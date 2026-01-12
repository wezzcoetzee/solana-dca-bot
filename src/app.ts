import { PublicKey } from "@solana/web3.js";
import * as schedule from "node-schedule";
import * as dotenv from "dotenv";
import DatabaseProvider from "./providers/database";
import CoinGeckoProvider from "./providers/coingecko";
import TelegramProvider from "./providers/telegram";
import { uptimeLogger } from "./utils/logger";
import Bot from "./utils/solana-bot";
import Notify from "./utils/notify";
import Calculator from "./utils/calculator";
import { usdToUsdcLamports } from "./utils/token-utils";
import { withRetry } from "./utils/retry";

dotenv.config();

const VERSION = "1.1.0";
console.log("\x1b[31m===== STARTING ======\x1b[0m");
console.log(new Date());
console.log("\x1b[31m===== Version ======\x1b[0m");
console.log(VERSION);
console.log("");

const destinationWallet = new PublicKey(process.env.DEST_WALLET || "");
const buyingTokenAddress = new PublicKey(process.env.TARGET_TOKEN_ADDRESS || "");
const sellingTokenAddress = new PublicKey(process.env.USDC_ADDRESS || "");
const targetTokenSymbol = process.env.TARGET_TOKEN_SYMBOL || "TOKEN";
const targetTokenDecimals = Number(process.env.TARGET_TOKEN_DECIMALS) || 8;
const targetTokenCoingeckoId = process.env.TARGET_TOKEN_COINGECKO_ID || "bitcoin";
const usdAmount = Number(process.env.USD_AMOUNT_BUY) || 5;
const amountLamports = usdToUsdcLamports(usdAmount);
const runSchedule = process.env.SCHEDULE || "0 0,12 * * *";

const bot = new Bot();
console.log("\x1b[33m===== Bot Wallet =====\x1b[0m");
console.log(bot.publicKey.toString());
console.log("Fund this wallet with SOL (for fees) and USDC (to swap)");
console.log("");

console.log('ENVIRONMENT VARIABLES:');
console.log('DEST_WALLET:', process.env.DEST_WALLET);
console.log('TARGET_TOKEN_ADDRESS:', process.env.TARGET_TOKEN_ADDRESS);
console.log('USDC_ADDRESS:', process.env.USDC_ADDRESS);
console.log('TARGET_TOKEN_SYMBOL:', process.env.TARGET_TOKEN_SYMBOL);
console.log('TARGET_TOKEN_DECIMALS:', process.env.TARGET_TOKEN_DECIMALS);
console.log('TARGET_TOKEN_COINGECKO_ID:', process.env.TARGET_TOKEN_COINGECKO_ID);
console.log('USD_AMOUNT_BUY:', process.env.USD_AMOUNT_BUY);
console.log('SCHEDULE:', process.env.SCHEDULE);
console.log('LOCAL_TEST:', process.env.LOCAL_TEST);
console.log('--------------------------------');

const databaseProvider = await DatabaseProvider.create();
const coingecko = new CoinGeckoProvider();
const notify = new Notify(new TelegramProvider());
const calculator = new Calculator(databaseProvider);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 10000;

async function executeBotRun(): Promise<void> {
  console.log(`🤖 Bot running with wallet: ${bot.publicKey.toString()}`);

  const { outAmount, swapTxSignature } = await bot.buyAndTransferAsync(
    buyingTokenAddress,
    sellingTokenAddress,
    amountLamports,
    destinationWallet
  );

  const price = await coingecko.getPriceAsync(targetTokenCoingeckoId);

  await databaseProvider.insertTransactionAsync(
    destinationWallet.toString(),
    usdAmount,
    price,
    targetTokenSymbol
  );

  const { amountPurchased, gasTokenBalance, sellTokenBalance, buyTokenBalance } =
    await bot.getWalletBalancesAsync(
      destinationWallet,
      sellingTokenAddress,
      buyingTokenAddress,
      outAmount,
      targetTokenDecimals
    );

  const botStats = await calculator.determineBotStatsAsync(
    destinationWallet.toString(),
    buyTokenBalance,
    price
  );

  await notify.notifyAsync({
    transaction: {
      amountPurchased,
      tokenPrice: price,
      transactionSignature: swapTxSignature,
      usdAmountPurchased: usdAmount,
      tokenSymbol: targetTokenSymbol,
    },
    balances: {
      gasTokenBalance,
      sellTokenBalance,
      buyTokenBalance,
    },
    stats: botStats,
  });

  console.log("🤖 Bot run completed successfully");
}

async function run(): Promise<void> {
  try {
    await withRetry(executeBotRun, {
      maxAttempts: MAX_RETRIES,
      delayMs: RETRY_DELAY_MS,
      onRetry: (attempt) => console.log(`Retrying attempt ${attempt}`),
    });
  } catch (error) {
    console.error(`🤖 Bot run failed after ${MAX_RETRIES} retries, check logs for more info`);
  }
}

const localTest = process.env.LOCAL_TEST === "true";

if (localTest) {
  console.log("🧪 LOCAL_TEST mode enabled - running immediately");
  run();
} else {
  schedule.scheduleJob(runSchedule, () => {
    console.log(
      `🤖 Running ${targetTokenSymbol} buy and transfer at`,
      new Date()
    );
    run();
  });

  uptimeLogger(() => {
    console.log(`🤖 Bot (USDC -> ${targetTokenSymbol}) started at`, new Date());
  });
}

async function shutdown(): Promise<void> {
  console.log("\n🛑 Shutting down gracefully...");
  await databaseProvider.disconnect();
  console.log("✅ Database disconnected");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

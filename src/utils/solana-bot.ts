import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";
import type { ISwapProvider } from "../interfaces";
import {
  createBotWallet,
  getSolanaBalanceAsync,
  getTokenBalanceAsync,
} from "./solana";
import { lamportsToToken, USDC_DECIMALS } from "./token-utils";
import JupiterSwapProvider from "../providers/jupiter";

dotenv.config();

export default class SolanaBot {
  private connection: Connection;
  private wallet: Keypair;
  private swapProvider: ISwapProvider;
  private slippage = Number(process.env.SLIPPAGE) || 4;

  publicKey: PublicKey;

  constructor(swapProvider?: ISwapProvider) {
    console.log("Bot is running...");

    this.wallet = createBotWallet();
    this.publicKey = this.wallet.publicKey;

    const rpcEndpoint = process.env.RPC_ENDPOINT || "";
    this.connection = new Connection(rpcEndpoint, "confirmed");

    if (swapProvider) {
      this.swapProvider = swapProvider;
    } else {
      const jupiterApiKey = process.env.JUPITER_API_KEY;
      if (!jupiterApiKey) {
        throw new Error("JUPITER_API_KEY environment variable is required");
      }
      this.swapProvider = new JupiterSwapProvider(
        this.connection,
        this.wallet,
        jupiterApiKey
      );
    }
  }

  async buyAndTransferAsync(
    buying: PublicKey,
    selling: PublicKey,
    amount: number,
    destinationWallet: PublicKey
  ) {
    const result = await this.swapProvider.executeSwapAsync(
      selling.toString(),
      buying.toString(),
      amount,
      destinationWallet.toString(),
      this.slippage
    );

    return { outAmount: result.outAmount, swapTxSignature: result.signature };
  }

  async getWalletBalancesAsync(
    destinationWalletAddress: PublicKey,
    sellTokenAddress: PublicKey,
    buyTokenAddress: PublicKey,
    outAmount: string,
    buyTokenDecimals: number = 8
  ): Promise<{
    amountPurchased: number;
    gasTokenBalance: number;
    sellTokenBalance: number;
    buyTokenBalance: number;
  }> {
    const amountPurchased = lamportsToToken(outAmount, buyTokenDecimals);

    const solBalance = await getSolanaBalanceAsync(
      this.connection,
      this.wallet
    );
    const usdcBalance = await getTokenBalanceAsync(
      this.connection,
      this.wallet.publicKey,
      sellTokenAddress,
      USDC_DECIMALS
    );
    const destinationTokenBalance = await getTokenBalanceAsync(
      this.connection,
      destinationWalletAddress,
      buyTokenAddress,
      buyTokenDecimals
    );

    return {
      amountPurchased,
      gasTokenBalance: solBalance,
      sellTokenBalance: usdcBalance,
      buyTokenBalance: destinationTokenBalance,
    };
  }
}

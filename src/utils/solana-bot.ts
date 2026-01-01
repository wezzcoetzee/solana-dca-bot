import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import * as dotenv from "dotenv";
import { createJupiterApiClient, type QuoteResponse } from "@jup-ag/api";
import { Config } from "./config";
import {
  createBotWallet,
  getSolanaBalanceAsync,
  getTokenBalanceAsync,
} from "./solana";

dotenv.config();

export default class SolanaBot {
  private connection: Connection;
  private wallet: Keypair;
  private jupiterApi: ReturnType<typeof createJupiterApiClient>;
  private slippage = Number(process.env.SLIPPAGE) || 4;

  publicKey: PublicKey;

  constructor() {
    console.log("Bot is running...");

    this.wallet = createBotWallet();
    this.publicKey = this.wallet.publicKey;

    const jupiterApiKey = process.env.JUPITER_API_KEY;
    if (!jupiterApiKey) {
      throw new Error("JUPITER_API_KEY environment variable is required");
    }

    this.jupiterApi = createJupiterApiClient({
      basePath: "https://public.jupiterapi.com",
      headers: {
        "x-api-key": jupiterApiKey,
      },
    });

    const rpcEndpoint = process.env.RPC_ENDPOINT || "";
    this.connection = new Connection(rpcEndpoint, "confirmed");
  }

  async buyAndTransferAsync(
    buying: PublicKey,
    selling: PublicKey,
    amount: number,
    destinationWallet: PublicKey
  ) {
    const quote: QuoteResponse = await this.jupiterApi.quoteGet({
      inputMint: selling.toString(),
      outputMint: buying.toString(),
      amount: amount,
      slippageBps: this.slippage,
    });

    if (!quote) throw new Error("No quote found for swap");

    const cbBtcAccounts = await this.connection.getTokenAccountsByOwner(
      destinationWallet,
      { mint: buying }
    );
    let destinationTokenAccount;
    if (cbBtcAccounts.value.length === 0) {
      throw new Error(
        "Destination wallet has no cbBTC token account - use destinationWallet instead or create one"
      );
    } else {
      destinationTokenAccount = cbBtcAccounts.value[0].pubkey;
    }

    const swapResponse = await this.jupiterApi.swapPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey: this.wallet.publicKey.toString(),
        wrapAndUnwrapSol: false,
        destinationTokenAccount: destinationTokenAccount.toString(),
      },
    });

    const swapTransactionBuf = Buffer.from(
      swapResponse.swapTransaction,
      "base64"
    );
    const swapTransaction =
      VersionedTransaction.deserialize(swapTransactionBuf);
    swapTransaction.sign([this.wallet]);

    const swapTxSignature = await this.connection.sendRawTransaction(
      swapTransaction.serialize(),
      {
        skipPreflight: false,
      }
    );
    console.log(`✅ Swap transaction sent: ${swapTxSignature}`);

    const swapConfirmation = await this.connection.confirmTransaction(
      { signature: swapTxSignature } as any,
      "confirmed"
    );
    if (swapConfirmation.value.err)
      throw new Error("Swap transaction failed to confirm");
    console.log(
      `✅ Swap transaction confirmed: ${Config.solscan.txUrl}/${swapTxSignature}`
    );

    return { outAmount: quote.outAmount, swapTxSignature };
  }

  async getWalletBalancesAsync(
    destinationWalletAddress: PublicKey,
    sellTokenAddress: PublicKey,
    buyTokenAddress: PublicKey,
    outAmount: string
  ): Promise<{
    amountPurchased: number;
    gasTokenBalance: number;
    sellTokenBalance: number;
    buyTokenBalance: number;
  }> {
    const cbBTCDecimals = 8;
    const usdcDecimals = 6;
    const amountPurchased = Number(outAmount) / 10 ** cbBTCDecimals;

    const solBalance = await getSolanaBalanceAsync(
      this.connection,
      this.wallet
    );
    const usdcBalance = await getTokenBalanceAsync(
      this.connection,
      this.wallet.publicKey,
      sellTokenAddress,
      usdcDecimals
    );
    const destinationcbBTCBalance = await getTokenBalanceAsync(
      this.connection,
      destinationWalletAddress,
      buyTokenAddress,
      cbBTCDecimals
    );

    return {
      amountPurchased,
      gasTokenBalance: solBalance,
      sellTokenBalance: usdcBalance,
      buyTokenBalance: destinationcbBTCBalance,
    };
  }
}

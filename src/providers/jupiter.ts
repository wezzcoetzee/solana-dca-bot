import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import { createJupiterApiClient } from "@jup-ag/api";
import type { ISwapProvider, SwapResult } from "../interfaces";
import { Config } from "../utils/config";

export default class JupiterSwapProvider implements ISwapProvider {
  private jupiterApi: ReturnType<typeof createJupiterApiClient>;

  constructor(
    private connection: Connection,
    private wallet: Keypair,
    apiKey: string
  ) {
    this.jupiterApi = createJupiterApiClient({
      basePath: "https://public.jupiterapi.com",
      headers: { "x-api-key": apiKey },
    });
  }

  async executeSwapAsync(
    inputMint: string,
    outputMint: string,
    amount: number,
    destinationWallet: string,
    slippageBps: number
  ): Promise<SwapResult> {
    const quote = await this.jupiterApi.quoteGet({
      inputMint,
      outputMint,
      amount,
      slippageBps,
    });

    if (!quote) throw new Error("No quote found for swap");

    const destinationPubkey = new PublicKey(destinationWallet);
    const outputMintPubkey = new PublicKey(outputMint);

    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      destinationPubkey,
      { mint: outputMintPubkey }
    );

    if (tokenAccounts.value.length === 0) {
      throw new Error(
        "Destination wallet has no token account for the target token - create one first"
      );
    }

    const destinationTokenAccount = tokenAccounts.value[0].pubkey;

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
    const swapTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
    swapTransaction.sign([this.wallet]);

    const signature = await this.connection.sendRawTransaction(
      swapTransaction.serialize(),
      { skipPreflight: false }
    );
    console.log(`✅ Swap transaction sent: ${signature}`);

    const confirmation = await this.connection.confirmTransaction(
      signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Swap transaction failed to confirm");
    }

    console.log(
      `✅ Swap transaction confirmed: ${Config.blockchainExplorer.txUrl}/${signature}`
    );

    return { outAmount: quote.outAmount, signature };
  }
}

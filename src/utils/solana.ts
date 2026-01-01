import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  type Connection,
} from "@solana/web3.js";
import bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";

export function createBotWallet(): Keypair {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("MNEMONIC not set in .env file");
  }

  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");
  const derivationPath = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(derivationPath, seed).key;

  return Keypair.fromSeed(derivedSeed);
}

export async function getSolanaBalanceAsync(
  connection: Connection,
  wallet: Keypair
): Promise<number> {
  const solBalanceLamports = await connection.getBalance(wallet.publicKey);
  return solBalanceLamports / LAMPORTS_PER_SOL;
}

export async function getTokenBalanceAsync(
  connection: Connection,
  wallet: PublicKey,
  tokenAddress: PublicKey,
  decimals: number
): Promise<number> {
  const usdcATA = await getAssociatedTokenAddress(tokenAddress, wallet);
  const tokenAccount = await getAccount(connection, usdcATA);
  return Number(tokenAccount.amount) / 10 ** decimals;
}

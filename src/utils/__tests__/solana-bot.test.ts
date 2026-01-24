import { describe, expect, test, beforeEach, mock } from "bun:test";
import { PublicKey } from "@solana/web3.js";
import SolanaBot from "../solana-bot";
import { MockSwapProvider } from "../../../tests/mocks";

// Mock the solana utility functions
const mockGetSolanaBalanceAsync = mock(() => Promise.resolve(0.5));
const mockGetTokenBalanceAsync = mock(() => Promise.resolve(100));
const mockCreateBotWallet = mock(() => ({
  publicKey: new PublicKey("11111111111111111111111111111111"),
  secretKey: new Uint8Array(64),
}));

// Mock the solana module
const originalImport = await import("../solana");
mock.module("../solana", () => ({
  createBotWallet: mockCreateBotWallet,
  getSolanaBalanceAsync: mockGetSolanaBalanceAsync,
  getTokenBalanceAsync: mockGetTokenBalanceAsync,
}));

describe("SolanaBot", () => {
  let bot: SolanaBot;
  let mockSwapProvider: MockSwapProvider;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    // Set required env vars
    process.env.RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
    process.env.MNEMONIC =
      "test test test test test test test test test test test junk";
    process.env.SLIPPAGE = "4";

    // Reset mocks
    mockCreateBotWallet.mockClear();
    mockGetSolanaBalanceAsync.mockClear();
    mockGetTokenBalanceAsync.mockClear();

    // Create mock swap provider
    mockSwapProvider = new MockSwapProvider();

    // Create bot with mock swap provider
    bot = new SolanaBot(mockSwapProvider);
  });

  describe("constructor", () => {
    test("should initialize bot with swap provider", () => {
      // #given / #when - bot created in beforeEach

      // #then
      expect(bot.publicKey).toBeDefined();
      expect(bot.publicKey).toBeInstanceOf(PublicKey);

      // cleanup
      process.env = originalEnv;
    });

    test("should use slippage from environment variable", async () => {
      // #given - custom slippage
      process.env.SLIPPAGE = "10";
      const customBot = new SolanaBot(mockSwapProvider);

      // #when - perform swap to check slippage
      const buyToken = new PublicKey("So11111111111111111111111111111111111111112");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const destWallet = new PublicKey("11111111111111111111111111111111");

      await customBot.buyAndTransferAsync(buyToken, sellToken, 5000000, destWallet);

      // #then - check slippage in swap call
      expect(mockSwapProvider.swapCalls[0].slippageBps).toBe(10);

      // cleanup
      process.env = originalEnv;
    });

    test("should use default slippage when env variable not set", async () => {
      // #given - no slippage env var
      delete process.env.SLIPPAGE;
      const customBot = new SolanaBot(mockSwapProvider);

      // #when
      const buyToken = new PublicKey("So11111111111111111111111111111111111111112");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const destWallet = new PublicKey("11111111111111111111111111111111");

      await customBot.buyAndTransferAsync(buyToken, sellToken, 5000000, destWallet);

      // #then - default is 4
      expect(mockSwapProvider.swapCalls[0].slippageBps).toBe(4);

      // cleanup
      process.env = originalEnv;
    });
  });

  describe("buyAndTransferAsync", () => {
    test("should execute swap successfully", async () => {
      // #given
      const buyToken = new PublicKey("So11111111111111111111111111111111111111112");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const amount = 5000000;
      const destWallet = new PublicKey("11111111111111111111111111111111");

      mockSwapProvider.setOutAmount("20000000");
      mockSwapProvider.setSignature("test-signature-abc123");

      // #when
      const result = await bot.buyAndTransferAsync(
        buyToken,
        sellToken,
        amount,
        destWallet
      );

      // #then
      expect(result.outAmount).toBe("20000000");
      expect(result.swapTxSignature).toBe("test-signature-abc123");
      expect(mockSwapProvider.swapCalls).toHaveLength(1);
      expect(mockSwapProvider.swapCalls[0]).toEqual({
        inputMint: sellToken.toString(),
        outputMint: buyToken.toString(),
        amount: amount,
        destinationWallet: destWallet.toString(),
        slippageBps: 4,
      });

      // cleanup
      process.env = originalEnv;
    });

    test("should pass correct parameters to swap provider", async () => {
      // #given
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const amount = 10000000;
      const destWallet = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");

      // #when
      await bot.buyAndTransferAsync(buyToken, sellToken, amount, destWallet);

      // #then
      const call = mockSwapProvider.swapCalls[0];
      expect(call.inputMint).toBe(sellToken.toString());
      expect(call.outputMint).toBe(buyToken.toString());
      expect(call.amount).toBe(amount);
      expect(call.destinationWallet).toBe(destWallet.toString());
      expect(call.slippageBps).toBe(4);

      // cleanup
      process.env = originalEnv;
    });

    test("should throw error when swap fails", async () => {
      // #given - swap provider that fails
      const buyToken = new PublicKey("So11111111111111111111111111111111111111112");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const amount = 5000000;
      const destWallet = new PublicKey("11111111111111111111111111111111");

      mockSwapProvider.setShouldFail(true, new Error("Insufficient liquidity"));

      // #when / #then
      await expect(
        bot.buyAndTransferAsync(buyToken, sellToken, amount, destWallet)
      ).rejects.toThrow("Insufficient liquidity");

      // cleanup
      process.env = originalEnv;
    });

    test("should handle different amounts", async () => {
      // #given - small amount
      const buyToken = new PublicKey("So11111111111111111111111111111111111111112");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const smallAmount = 1000000; // $1 USDC
      const destWallet = new PublicKey("11111111111111111111111111111111");

      mockSwapProvider.setOutAmount("5000000");

      // #when
      const result = await bot.buyAndTransferAsync(
        buyToken,
        sellToken,
        smallAmount,
        destWallet
      );

      // #then
      expect(result.outAmount).toBe("5000000");
      expect(mockSwapProvider.swapCalls[0].amount).toBe(smallAmount);

      // cleanup
      process.env = originalEnv;
    });

    test("should handle large amounts", async () => {
      // #given - large amount
      const buyToken = new PublicKey("So11111111111111111111111111111111111111112");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const largeAmount = 1000000000; // $1000 USDC
      const destWallet = new PublicKey("11111111111111111111111111111111");

      mockSwapProvider.setOutAmount("500000000000");

      // #when
      const result = await bot.buyAndTransferAsync(
        buyToken,
        sellToken,
        largeAmount,
        destWallet
      );

      // #then
      expect(result.outAmount).toBe("500000000000");
      expect(mockSwapProvider.swapCalls[0].amount).toBe(largeAmount);

      // cleanup
      process.env = originalEnv;
    });
  });

  describe("getWalletBalancesAsync", () => {
    test("should return wallet balances", async () => {
      // #given
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(0.75));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(250)) // USDC balance
        .mockReturnValueOnce(Promise.resolve(0.05)); // BTC balance

      const destWallet = new PublicKey("11111111111111111111111111111111");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const outAmount = "10000000"; // 0.1 BTC (8 decimals)

      // #when
      const balances = await bot.getWalletBalancesAsync(
        destWallet,
        sellToken,
        buyToken,
        outAmount,
        8
      );

      // #then
      expect(balances.amountPurchased).toBe(0.1);
      expect(balances.gasTokenBalance).toBe(0.75);
      expect(balances.sellTokenBalance).toBe(250);
      expect(balances.buyTokenBalance).toBe(0.05);

      // cleanup
      process.env = originalEnv;
    });

    test("should calculate amount purchased with different decimals", async () => {
      // #given - token with 6 decimals
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(0.5));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(100))
        .mockReturnValueOnce(Promise.resolve(50));

      const destWallet = new PublicKey("11111111111111111111111111111111");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // USDT
      const outAmount = "5500000"; // 5.5 USDT (6 decimals)

      // #when
      const balances = await bot.getWalletBalancesAsync(
        destWallet,
        sellToken,
        buyToken,
        outAmount,
        6
      );

      // #then
      expect(balances.amountPurchased).toBe(5.5);

      // cleanup
      process.env = originalEnv;
    });

    test("should handle zero balances", async () => {
      // #given - empty wallets
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(0));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(0))
        .mockReturnValueOnce(Promise.resolve(0));

      const destWallet = new PublicKey("11111111111111111111111111111111");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const outAmount = "10000000";

      // #when
      const balances = await bot.getWalletBalancesAsync(
        destWallet,
        sellToken,
        buyToken,
        outAmount,
        8
      );

      // #then
      expect(balances.gasTokenBalance).toBe(0);
      expect(balances.sellTokenBalance).toBe(0);
      expect(balances.buyTokenBalance).toBe(0);

      // cleanup
      process.env = originalEnv;
    });

    test("should handle very large balances", async () => {
      // #given - large balances
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(1000));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(1000000))
        .mockReturnValueOnce(Promise.resolve(100));

      const destWallet = new PublicKey("11111111111111111111111111111111");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const outAmount = "1000000000";

      // #when
      const balances = await bot.getWalletBalancesAsync(
        destWallet,
        sellToken,
        buyToken,
        outAmount,
        8
      );

      // #then
      expect(balances.gasTokenBalance).toBe(1000);
      expect(balances.sellTokenBalance).toBe(1000000);
      expect(balances.buyTokenBalance).toBe(100);

      // cleanup
      process.env = originalEnv;
    });

    test("should handle fractional balances", async () => {
      // #given - fractional balances
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(0.123456));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(99.99))
        .mockReturnValueOnce(Promise.resolve(0.00123456));

      const destWallet = new PublicKey("11111111111111111111111111111111");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const outAmount = "123456";

      // #when
      const balances = await bot.getWalletBalancesAsync(
        destWallet,
        sellToken,
        buyToken,
        outAmount,
        8
      );

      // #then
      expect(balances.gasTokenBalance).toBeCloseTo(0.123456, 6);
      expect(balances.sellTokenBalance).toBeCloseTo(99.99, 2);
      expect(balances.buyTokenBalance).toBeCloseTo(0.00123456, 8);

      // cleanup
      process.env = originalEnv;
    });

    test("should call balance functions with correct parameters", async () => {
      // #given
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(0.5));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(100))
        .mockReturnValueOnce(Promise.resolve(0.05));

      const destWallet = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const outAmount = "10000000";

      // #when
      await bot.getWalletBalancesAsync(destWallet, sellToken, buyToken, outAmount, 8);

      // #then
      expect(mockGetSolanaBalanceAsync).toHaveBeenCalledTimes(1);
      expect(mockGetTokenBalanceAsync).toHaveBeenCalledTimes(2);

      // cleanup
      process.env = originalEnv;
    });

    test("should use default decimals of 8 when not provided", async () => {
      // #given
      mockGetSolanaBalanceAsync.mockReturnValue(Promise.resolve(0.5));
      mockGetTokenBalanceAsync
        .mockReturnValueOnce(Promise.resolve(100))
        .mockReturnValueOnce(Promise.resolve(0.05));

      const destWallet = new PublicKey("11111111111111111111111111111111");
      const sellToken = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const buyToken = new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo");
      const outAmount = "10000000";

      // #when - not providing decimals parameter
      const balances = await bot.getWalletBalancesAsync(
        destWallet,
        sellToken,
        buyToken,
        outAmount
      );

      // #then - should use 8 decimals by default
      expect(balances.amountPurchased).toBe(0.1);

      // cleanup
      process.env = originalEnv;
    });
  });
});

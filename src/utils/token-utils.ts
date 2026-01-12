export const USDC_DECIMALS = 6;

export function lamportsToToken(amount: bigint | number, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

export function usdToUsdcLamports(usd: number): number {
  return usd * 10 ** USDC_DECIMALS;
}

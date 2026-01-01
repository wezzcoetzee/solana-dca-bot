import type { IPriceProvider } from "../interfaces";

export default class CoinGeckoProvider implements IPriceProvider {
  private readonly baseUrl = "https://api.coingecko.com/api";

  async getBitcoinPriceAsync(): Promise<number> {
    return await this.getPriceAsync("bitcoin");
  }

  async getPriceAsync(token: string): Promise<number> {
    const url = `${this.baseUrl}/v3/simple/price?ids=${token}&vs_currencies=usd`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const tokenPrice: number = (data as { [key: string]: { usd: number } })[
      token
    ].usd;

    console.log(`CoinGecko: ${token} price: $${tokenPrice}`);
    return tokenPrice;
  }
}

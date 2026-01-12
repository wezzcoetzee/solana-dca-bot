import type { IPriceProvider } from "../interfaces";
import { validateResponse } from "../utils/http-utils";

export default class CoinGeckoProvider implements IPriceProvider {
  private readonly baseUrl = "https://api.coingecko.com/api";

  async getPriceAsync(token: string): Promise<number> {
    const url = `${this.baseUrl}/v3/simple/price?ids=${token}&vs_currencies=usd`;
    const response = await fetch(url);

    validateResponse(response, "CoinGecko");

    const data = await response.json();
    const tokenPrice: number = (data as { [key: string]: { usd: number } })[
      token
    ].usd;

    console.log(`CoinGecko: ${token} price: $${tokenPrice}`);
    return tokenPrice;
  }
}

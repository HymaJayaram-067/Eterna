import { config } from '../config';
import { DexScreenerPair, TokenData } from '../types';
import { RateLimiter, fetchWithRateLimit } from '../utils/rateLimiter';

const rateLimiter = new RateLimiter(
  config.rateLimit.maxRequests,
  config.rateLimit.windowMs
);

export class DexScreenerService {
  private baseUrl = config.apis.dexScreener.baseUrl;

  async searchTokens(query: string): Promise<TokenData[]> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      const response = await fetchWithRateLimit<{ pairs: DexScreenerPair[] }>(
        url,
        rateLimiter
      );

      if (!response.pairs || response.pairs.length === 0) {
        return [];
      }

      return response.pairs
        .filter(pair => pair.chainId === 'solana')
        .map(pair => this.transformPair(pair));
    } catch (error) {
      console.error('DexScreener search error:', error);
      return [];
    }
  }

  async getTokenByAddress(address: string): Promise<TokenData | null> {
    try {
      const url = `${this.baseUrl}/tokens/${address}`;
      const response = await fetchWithRateLimit<{ pairs: DexScreenerPair[] }>(
        url,
        rateLimiter
      );

      if (!response.pairs || response.pairs.length === 0) {
        return null;
      }

      // Get the first Solana pair
      const solanaPair = response.pairs.find(pair => pair.chainId === 'solana');
      return solanaPair ? this.transformPair(solanaPair) : null;
    } catch (error) {
      console.error('DexScreener getToken error:', error);
      return null;
    }
  }

  async getTrendingTokens(): Promise<TokenData[]> {
    try {
      // DexScreener doesn't have a direct trending endpoint, so we search for popular tokens
      const popularQueries = ['bonk', 'wif', 'myro', 'wen', 'popcat'];
      const allTokens: TokenData[] = [];

      for (const query of popularQueries) {
        const tokens = await this.searchTokens(query);
        allTokens.push(...tokens);
      }

      // Remove duplicates based on token_address
      const uniqueTokens = Array.from(
        new Map(allTokens.map(token => [token.token_address, token])).values()
      );

      // Sort by volume and return top 30
      return uniqueTokens
        .sort((a, b) => b.volume_sol - a.volume_sol)
        .slice(0, 30);
    } catch (error) {
      console.error('DexScreener getTrending error:', error);
      return [];
    }
  }

  private transformPair(pair: DexScreenerPair): TokenData {
    const priceNative = parseFloat(pair.priceNative) || 0;
    const volume24h = pair.volume?.h24 || 0;
    const liquidity = pair.liquidity?.base || 0;
    const txCount = 
      (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);

    return {
      token_address: pair.baseToken.address,
      token_name: pair.baseToken.name,
      token_ticker: pair.baseToken.symbol,
      price_sol: priceNative,
      market_cap_sol: pair.marketCap ? pair.marketCap / priceNative : 0,
      volume_sol: volume24h,
      liquidity_sol: liquidity,
      transaction_count: txCount,
      price_1hr_change: pair.priceChange?.h1 || 0,
      price_24hr_change: pair.priceChange?.h24 || 0,
      price_7d_change: 0, // Not provided by DexScreener
      protocol: pair.dexId || 'Unknown',
      source: 'DexScreener',
      last_updated: Date.now(),
    };
  }
}

export const dexScreenerService = new DexScreenerService();

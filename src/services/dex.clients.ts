import { config } from '../config';
import { RateLimiter, makeRequest } from '../utils/rateLimiter';
import { DexScreenerToken, JupiterPriceData, GeckoTerminalToken } from '../types';

export class DexScreenerClient {
  private rateLimiter: RateLimiter;
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.api.dexScreener.baseUrl;
    // 300 requests per minute = 5 per second
    this.rateLimiter = new RateLimiter(5, 1000);
  }

  async searchTokens(query: string): Promise<DexScreenerToken[]> {
    try {
      const data = await makeRequest<{ pairs: DexScreenerToken[] }>(
        {
          method: 'GET',
          url: `${this.baseUrl}/search`,
          params: { q: query },
        },
        this.rateLimiter
      );
      return data.pairs || [];
    } catch (error) {
      console.error('DexScreener search error:', error);
      return [];
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<DexScreenerToken[]> {
    try {
      const data = await makeRequest<{ pairs: DexScreenerToken[] }>(
        {
          method: 'GET',
          url: `${this.baseUrl}/tokens/${tokenAddress}`,
        },
        this.rateLimiter
      );
      return data.pairs || [];
    } catch (error) {
      console.error('DexScreener token info error:', error);
      return [];
    }
  }

  async getTopTokens(chainId: string = 'solana'): Promise<DexScreenerToken[]> {
    try {
      // Search for popular meme coins on Solana
      const queries = ['bonk', 'wif', 'myro', 'samo', 'cope'];
      const results: DexScreenerToken[] = [];

      for (const query of queries) {
        const tokens = await this.searchTokens(query);
        const solanaTokens = tokens.filter((t) => t.chainId === chainId);
        results.push(...solanaTokens.slice(0, 5));
      }

      return results;
    } catch (error) {
      console.error('DexScreener top tokens error:', error);
      return [];
    }
  }
}

export class JupiterClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.api.jupiter.baseUrl;
  }

  async getPrices(tokenIds: string[]): Promise<Map<string, JupiterPriceData>> {
    try {
      const data = await makeRequest<{ data: Record<string, JupiterPriceData> }>({
        method: 'GET',
        url: `${this.baseUrl}/price`,
        params: { ids: tokenIds.join(',') },
      });

      const priceMap = new Map<string, JupiterPriceData>();
      if (data.data) {
        Object.entries(data.data).forEach(([id, priceData]) => {
          priceMap.set(id, priceData);
        });
      }
      return priceMap;
    } catch (error) {
      console.error('Jupiter price error:', error);
      return new Map();
    }
  }
}

export class GeckoTerminalClient {
  private baseUrl: string;
  private rateLimiter: RateLimiter;

  constructor() {
    this.baseUrl = config.api.geckoTerminal.baseUrl;
    // Conservative rate limiting
    this.rateLimiter = new RateLimiter(30, 60000); // 30 per minute
  }

  async getNetworkTokens(network: string = 'solana'): Promise<GeckoTerminalToken[]> {
    try {
      const data = await makeRequest<{ data: GeckoTerminalToken[] }>(
        {
          method: 'GET',
          url: `${this.baseUrl}/networks/${network}/tokens`,
          params: { page: 1 },
        },
        this.rateLimiter
      );
      return data.data || [];
    } catch (error) {
      console.error('GeckoTerminal network tokens error:', error);
      return [];
    }
  }

  async getTokenInfo(network: string, address: string): Promise<GeckoTerminalToken | null> {
    try {
      const data = await makeRequest<{ data: GeckoTerminalToken }>(
        {
          method: 'GET',
          url: `${this.baseUrl}/networks/${network}/tokens/${address}`,
        },
        this.rateLimiter
      );
      return data.data || null;
    } catch (error) {
      console.error('GeckoTerminal token info error:', error);
      return null;
    }
  }
}

import { config } from '../config';
import { GeckoTerminalToken, TokenData } from '../types';
import { RateLimiter, fetchWithRateLimit } from '../utils/rateLimiter';

const rateLimiter = new RateLimiter(30, 60000); // GeckoTerminal has lower limits

export class GeckoTerminalService {
  private baseUrl = config.apis.geckoTerminal.baseUrl;

  async getTrendingTokens(): Promise<TokenData[]> {
    try {
      const url = `${this.baseUrl}/networks/solana/trending_pools`;
      const response = await fetchWithRateLimit<{ data: unknown[] }>(
        url,
        rateLimiter
      );

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data
        .filter((pool: unknown): pool is Record<string, unknown> => {
          return typeof pool === 'object' && pool !== null && 'attributes' in pool;
        })
        .map(pool => this.transformPool(pool))
        .filter((token): token is TokenData => token !== null);
    } catch (error) {
      console.error('GeckoTerminal trending error:', error);
      return [];
    }
  }

  async getTokenByAddress(address: string): Promise<TokenData | null> {
    try {
      const url = `${this.baseUrl}/networks/solana/tokens/${address}`;
      const response = await fetchWithRateLimit<{ data: GeckoTerminalToken }>(
        url,
        rateLimiter
      );

      if (!response.data) {
        return null;
      }

      return this.transformToken(response.data);
    } catch (error) {
      console.error('GeckoTerminal getToken error:', error);
      return null;
    }
  }

  private transformPool(pool: Record<string, unknown>): TokenData | null {
    try {
      const attrs = pool.attributes as Record<string, unknown>;
      const baseToken = attrs.base_token as Record<string, unknown>;
      
      if (!baseToken) {
        return null;
      }

      // Convert USD values to SOL (approximate using SOL price)
      const solPriceUsd = 100; // Rough estimate, should be fetched in production
      
      return {
        token_address: baseToken.address as string,
        token_name: baseToken.name as string,
        token_ticker: baseToken.symbol as string,
        price_sol: parseFloat(String(attrs.base_token_price_usd || '0')) / solPriceUsd,
        market_cap_sol: parseFloat(String(attrs.market_cap_usd || '0')) / solPriceUsd,
        volume_sol: parseFloat(String((attrs.volume_usd as Record<string, unknown>)?.h24 || '0')) / solPriceUsd,
        liquidity_sol: parseFloat(String(attrs.reserve_in_usd || '0')) / solPriceUsd,
        transaction_count: ((attrs.transactions as Record<string, Record<string, number>>)?.h24?.buys || 0) + ((attrs.transactions as Record<string, Record<string, number>>)?.h24?.sells || 0),
        price_1hr_change: parseFloat(String((attrs.price_change_percentage as Record<string, unknown>)?.h1 || '0')),
        price_24hr_change: parseFloat(String((attrs.price_change_percentage as Record<string, unknown>)?.h24 || '0')),
        price_7d_change: 0,
        protocol: String(attrs.dex || 'Unknown'),
        source: 'GeckoTerminal',
        last_updated: Date.now(),
      };
    } catch (error) {
      console.error('Error transforming pool:', error);
      return null;
    }
  }

  private transformToken(token: GeckoTerminalToken): TokenData {
    const attrs = token.attributes;
    const solPriceUsd = 100;

    return {
      token_address: attrs.address,
      token_name: attrs.name,
      token_ticker: attrs.symbol,
      price_sol: parseFloat(attrs.price_usd) / solPriceUsd,
      market_cap_sol: parseFloat(attrs.market_cap_usd || '0') / solPriceUsd,
      volume_sol: parseFloat(attrs.volume_usd?.h24 || '0') / solPriceUsd,
      liquidity_sol: parseFloat(attrs.total_reserve_in_usd) / solPriceUsd,
      transaction_count: 0,
      price_1hr_change: 0,
      price_24hr_change: 0,
      price_7d_change: 0,
      protocol: 'Unknown',
      source: 'GeckoTerminal',
      last_updated: Date.now(),
    };
  }
}

export const geckoTerminalService = new GeckoTerminalService();

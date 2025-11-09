import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { Token } from '../types';
import { RateLimiter, ExponentialBackoff } from '../utils/rateLimiter';
import logger from '../utils/logger';
import { config } from '../config';

export class GeckoTerminalClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private backoff: ExponentialBackoff;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.geckoterminal.com/api/v2',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status === 429;
      },
    });

    this.rateLimiter = new RateLimiter(config.rateLimits.geckoTerminal, 1);
    this.backoff = new ExponentialBackoff();
  }

  async getTrendingTokens(): Promise<Token[]> {
    await this.rateLimiter.waitForSlot();

    return this.backoff.execute(async () => {
      try {
        // Fetch trending pools (usually returns ~10-20 tokens)
        const trendingResponse = await this.client.get('/networks/solana/trending_pools');
        const trendingPools = trendingResponse.data?.data || [];
        
        logger.info(`GeckoTerminal: Fetched ${trendingPools.length} trending pools`);

        // Also fetch new pools to get more variety
        let newPools: any[] = [];
        try {
          const newPoolsResponse = await this.client.get('/networks/solana/new_pools', {
            params: { page: 1 }
          });
          newPools = newPoolsResponse.data?.data || [];
          logger.info(`GeckoTerminal: Fetched ${newPools.length} new pools`);
        } catch (error) {
          logger.debug('GeckoTerminal: Could not fetch new pools', error);
        }

        // Combine both sources
        const allPools = [...trendingPools, ...newPools];

        if (allPools.length === 0) {
          logger.warn('GeckoTerminal: No pools found');
          return [];
        }

        return this.transformPools(allPools);
      } catch (error) {
        logger.error('GeckoTerminal trending tokens error', error);
        return [];
      }
    });
  }

  async getTokenInfo(address: string): Promise<Token | null> {
    await this.rateLimiter.waitForSlot();

    return this.backoff.execute(async () => {
      try {
        const response = await this.client.get(`/networks/solana/tokens/${address}`);

        if (!response.data || !response.data.data) {
          logger.warn(`GeckoTerminal: No data found for token ${address}`);
          return null;
        }

        const tokenData = response.data.data;
        return this.transformToken(tokenData);
      } catch (error) {
        logger.error(`GeckoTerminal token fetch error for ${address}`, error);
        return null;
      }
    });
  }

  private transformPools(pools: any[]): Token[] {
    return pools.map(pool => {
      const attributes = pool.attributes || {};
      const baseToken = attributes.base_token || {};
      
      return {
        token_address: baseToken.address || '',
        token_name: baseToken.name || 'Unknown',
        token_ticker: baseToken.symbol || 'UNKNOWN',
        price_sol: this.parsePrice(attributes.base_token_price_native_currency),
        market_cap_sol: this.parseValue(attributes.market_cap_usd) / 100, // Approximate SOL conversion
        volume_sol: this.parseValue(attributes.volume_usd?.h24) / 100,
        liquidity_sol: this.parseValue(attributes.reserve_in_usd) / 100,
        transaction_count: parseInt(attributes.transactions?.h24?.buys || '0') + 
                          parseInt(attributes.transactions?.h24?.sells || '0'),
        price_1hr_change: parseFloat(attributes.price_change_percentage?.h1 || '0'),
        price_24hr_change: parseFloat(attributes.price_change_percentage?.h24 || '0'),
        protocol: pool.relationships?.dex?.data?.id || 'Unknown',
        last_updated: Date.now(),
      };
    }).filter(token => token.token_address);
  }

  private transformToken(tokenData: any): Token | null {
    const attributes = tokenData.attributes || {};
    
    if (!attributes.address) return null;

    return {
      token_address: attributes.address,
      token_name: attributes.name || 'Unknown',
      token_ticker: attributes.symbol || 'UNKNOWN',
      price_sol: this.parsePrice(attributes.price_native_currency),
      market_cap_sol: this.parseValue(attributes.market_cap_usd) / 100,
      volume_sol: this.parseValue(attributes.volume_usd?.h24) / 100,
      liquidity_sol: 0, // Not available in token endpoint
      transaction_count: 0, // Not available in token endpoint
      price_1hr_change: parseFloat(attributes.price_change_percentage?.h1 || '0'),
      price_24hr_change: parseFloat(attributes.price_change_percentage?.h24 || '0'),
      protocol: 'GeckoTerminal',
      last_updated: Date.now(),
    };
  }

  private parsePrice(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? 0 : parsed;
  }

  private parseValue(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? 0 : parsed;
  }
}

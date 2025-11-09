import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { Token } from '../types';
import { RateLimiter, ExponentialBackoff } from '../utils/rateLimiter';
import logger from '../utils/logger';
import { config } from '../config';

export class DexScreenerClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private backoff: ExponentialBackoff;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.dexscreener.com',
      timeout: 10000,
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status === 429;
      },
    });

    this.rateLimiter = new RateLimiter(config.rateLimits.dexScreener, 1);
    this.backoff = new ExponentialBackoff();
  }

  async searchTokens(query: string = 'solana'): Promise<Token[]> {
    await this.rateLimiter.waitForSlot();

    return this.backoff.execute(async () => {
      try {
        // Try to get token boosted pairs for Solana first (returns more results)
        let response;
        try {
          response = await this.client.get(`/token-boosts/top/v1/solana`);
          if (response.data && response.data.length > 0) {
            logger.info(`DexScreener: Fetched ${response.data.length} boosted tokens`);
            return this.transformBoostedTokens(response.data);
          }
        } catch (boostedError) {
          logger.debug('DexScreener: Boosted tokens endpoint not available, falling back to search');
        }

        // Fallback to search endpoint with multiple popular searches
        const searches = ['SOL', 'USDC', 'meme', 'WIF', 'BONK'];
        const allPairs: any[] = [];

        for (const searchTerm of searches) {
          try {
            const searchResponse = await this.client.get(`/latest/dex/search`, {
              params: { q: searchTerm },
            });

            if (searchResponse.data && searchResponse.data.pairs) {
              allPairs.push(...searchResponse.data.pairs);
              logger.debug(`DexScreener: Found ${searchResponse.data.pairs.length} pairs for "${searchTerm}"`);
            }
          } catch (searchError) {
            logger.debug(`DexScreener: Search failed for "${searchTerm}"`, searchError);
          }

          // Small delay between searches to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (allPairs.length === 0) {
          logger.warn('DexScreener: No pairs found in any search');
          return [];
        }

        logger.info(`DexScreener: Total pairs found: ${allPairs.length}`);
        return this.transformPairs(allPairs);
      } catch (error) {
        logger.error('DexScreener search error', error);
        throw error;
      }
    });
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    await this.rateLimiter.waitForSlot();

    return this.backoff.execute(async () => {
      try {
        const response = await this.client.get(`/latest/dex/tokens/${address}`);

        if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
          logger.warn(`DexScreener: No data found for token ${address}`);
          return null;
        }

        const tokens = this.transformPairs(response.data.pairs);
        return tokens[0] || null;
      } catch (error) {
        logger.error(`DexScreener token fetch error for ${address}`, error);
        throw error;
      }
    });
  }

  private transformPairs(pairs: any[]): Token[] {
    return pairs
      .filter(pair => pair.chainId === 'solana')
      .map(pair => ({
        token_address: pair.baseToken?.address || '',
        token_name: pair.baseToken?.name || 'Unknown',
        token_ticker: pair.baseToken?.symbol || 'UNKNOWN',
        price_sol: this.calculateSolPrice(pair.priceUsd, pair.priceNative),
        market_cap_sol: this.calculateSolValue(pair.fdv || pair.marketCap, pair.priceUsd, pair.priceNative),
        volume_sol: this.calculateSolValue(pair.volume?.h24 || 0, pair.priceUsd, pair.priceNative),
        liquidity_sol: this.calculateSolValue(pair.liquidity?.usd || 0, pair.priceUsd, pair.priceNative),
        transaction_count: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        price_1hr_change: pair.priceChange?.h1 || 0,
        price_24hr_change: pair.priceChange?.h24 || 0,
        price_7d_change: pair.priceChange?.h7 || 0,
        protocol: pair.dexId || 'Unknown DEX',
        last_updated: Date.now(),
      }))
      .filter(token => token.token_address);
  }

  private transformBoostedTokens(tokens: any[]): Token[] {
    // Transform boosted tokens which have a different structure
    return tokens
      .filter(token => token.chainId === 'solana')
      .map(token => ({
        token_address: token.tokenAddress || '',
        token_name: token.name || 'Unknown',
        token_ticker: token.symbol || 'UNKNOWN',
        price_sol: parseFloat(token.priceNative || '0'),
        market_cap_sol: parseFloat(token.marketCap || '0') / 100,
        volume_sol: parseFloat(token.volume?.h24 || '0') / 100,
        liquidity_sol: parseFloat(token.liquidity || '0') / 100,
        transaction_count: token.txCount || 0,
        price_1hr_change: parseFloat(token.priceChange?.h1 || '0'),
        price_24hr_change: parseFloat(token.priceChange?.h24 || '0'),
        price_7d_change: parseFloat(token.priceChange?.h7 || '0'),
        protocol: token.dexId || 'Unknown DEX',
        last_updated: Date.now(),
      }))
      .filter(token => token.token_address);
  }

  private calculateSolPrice(priceUsd?: string, _priceNative?: string): number {
    if (_priceNative) {
      return parseFloat(_priceNative);
    }
    if (priceUsd) {
      // Approximate SOL price (this is a fallback, ideally fetch real SOL price)
      const solPriceUsd = 100; // Approximate, should be fetched from an oracle
      return parseFloat(priceUsd) / solPriceUsd;
    }
    return 0;
  }

  private calculateSolValue(usdValue: number | string, _priceUsd?: string, _priceNative?: string): number {
    const value = typeof usdValue === 'string' ? parseFloat(usdValue) : usdValue;
    if (isNaN(value)) return 0;
    
    // If we have native price, use it to calculate SOL value
    const solPriceUsd = 100; // Approximate
    return value / solPriceUsd;
  }
}

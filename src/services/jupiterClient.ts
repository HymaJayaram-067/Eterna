import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { Token } from '../types';
import { RateLimiter, ExponentialBackoff } from '../utils/rateLimiter';
import logger from '../utils/logger';
import { config } from '../config';

export class JupiterClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private backoff: ExponentialBackoff;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://price.jup.ag',
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

    this.rateLimiter = new RateLimiter(config.rateLimits.jupiter, 1);
    this.backoff = new ExponentialBackoff();
  }

  async getPrices(tokenIds: string[]): Promise<Map<string, number>> {
    if (tokenIds.length === 0) return new Map();

    await this.rateLimiter.waitForSlot();

    return this.backoff.execute(async () => {
      try {
        const idsParam = tokenIds.join(',');
        const response = await this.client.get(`/v4/price`, {
          params: { ids: idsParam },
        });

        const priceMap = new Map<string, number>();
        
        if (response.data && response.data.data) {
          Object.entries(response.data.data).forEach(([id, priceData]: [string, any]) => {
            if (priceData && priceData.price) {
              priceMap.set(id, priceData.price);
            }
          });
        }

        return priceMap;
      } catch (error) {
        logger.error('Jupiter price fetch error', error);
        return new Map();
      }
    });
  }

  async enrichTokensWithPrices(tokens: Token[]): Promise<Token[]> {
    const tokenIds = tokens.map(t => t.token_address).filter(Boolean);
    
    if (tokenIds.length === 0) return tokens;

    const priceMap = await this.getPrices(tokenIds);
    
    return tokens.map(token => {
      const jupiterPrice = priceMap.get(token.token_address);
      if (jupiterPrice) {
        // Jupiter returns USD price, convert to SOL
        const solPriceUsd = 100; // Approximate
        token.price_sol = jupiterPrice / solPriceUsd;
      }
      return token;
    });
  }
}

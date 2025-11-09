import { TokenData, TokenFilter, PaginatedResponse } from '../types';
import { dexScreenerService } from './dexscreener.service';
import { geckoTerminalService } from './geckoterminal.service';
import { cacheService } from './cache.service';

export class AggregationService {
  private inMemoryCache: Map<string, { data: TokenData[]; timestamp: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds

  async getTokens(filter?: TokenFilter): Promise<PaginatedResponse<TokenData>> {
    const cacheKey = this.getCacheKey(filter);
    
    // Try cache first
    let tokens = await this.getFromCache(cacheKey);
    
    if (!tokens || tokens.length === 0) {
      // Fetch from multiple sources
      tokens = await this.fetchAndMergeTokens();
      
      // Cache the results
      await this.saveToCache(cacheKey, tokens);
    }

    // Apply filtering and sorting
    tokens = this.applyFilters(tokens, filter);

    // Apply pagination
    return this.paginate(tokens, filter);
  }

  async getTokenByAddress(address: string): Promise<TokenData | null> {
    const cacheKey = `token:${address}`;
    
    // Try cache
    const cached = await cacheService.get<TokenData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from multiple sources in parallel
    const [dexToken, geckoToken] = await Promise.all([
      dexScreenerService.getTokenByAddress(address),
      geckoTerminalService.getTokenByAddress(address),
    ]);

    // Merge the results
    const token = this.mergeTokenData([dexToken, geckoToken].filter(Boolean) as TokenData[]);
    const mergedToken = token.length > 0 ? token[0] : null;

    // Cache the result
    if (mergedToken) {
      await cacheService.set(cacheKey, mergedToken);
    }

    return mergedToken;
  }

  async searchTokens(query: string): Promise<TokenData[]> {
    const cacheKey = `search:${query}`;
    
    // Try cache
    const cached = await cacheService.get<TokenData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Search from DexScreener (primary source for search)
    const tokens = await dexScreenerService.searchTokens(query);

    // Cache the results
    await cacheService.set(cacheKey, tokens);

    return tokens;
  }

  private async fetchAndMergeTokens(): Promise<TokenData[]> {
    try {
      // Fetch from multiple sources in parallel
      const [dexTokens, geckoTokens] = await Promise.all([
        dexScreenerService.getTrendingTokens(),
        geckoTerminalService.getTrendingTokens(),
      ]);

      // Combine and merge
      const allTokens = [...dexTokens, ...geckoTokens];
      return this.mergeTokenData(allTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }
  }

  private mergeTokenData(tokens: TokenData[]): TokenData[] {
    const merged = new Map<string, TokenData>();

    for (const token of tokens) {
      const existing = merged.get(token.token_address);

      if (!existing) {
        merged.set(token.token_address, token);
      } else {
        // Merge by taking the most recent data and averaging numeric values
        merged.set(token.token_address, {
          ...existing,
          price_sol: (existing.price_sol + token.price_sol) / 2,
          volume_sol: Math.max(existing.volume_sol, token.volume_sol),
          liquidity_sol: Math.max(existing.liquidity_sol, token.liquidity_sol),
          transaction_count: Math.max(existing.transaction_count, token.transaction_count),
          price_1hr_change: existing.price_1hr_change || token.price_1hr_change,
          price_24hr_change: existing.price_24hr_change || token.price_24hr_change,
          price_7d_change: existing.price_7d_change || token.price_7d_change,
          source: `${existing.source},${token.source}`,
          last_updated: Math.max(existing.last_updated, token.last_updated),
        });
      }
    }

    return Array.from(merged.values());
  }

  private applyFilters(tokens: TokenData[], filter?: TokenFilter): TokenData[] {
    let filtered = [...tokens];

    // Sort
    if (filter?.sortBy) {
      filtered = this.sortTokens(filtered, filter.sortBy, filter.sortOrder || 'desc');
    }

    return filtered;
  }

  private sortTokens(
    tokens: TokenData[],
    sortBy: string,
    order: 'asc' | 'desc'
  ): TokenData[] {
    return tokens.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'volume':
          comparison = a.volume_sol - b.volume_sol;
          break;
        case 'price_change':
          comparison = a.price_1hr_change - b.price_1hr_change;
          break;
        case 'market_cap':
          comparison = a.market_cap_sol - b.market_cap_sol;
          break;
        case 'liquidity':
          comparison = a.liquidity_sol - b.liquidity_sol;
          break;
        default:
          comparison = 0;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }

  private paginate(
    tokens: TokenData[],
    filter?: TokenFilter
  ): PaginatedResponse<TokenData> {
    const limit = filter?.limit || 30;
    const cursor = filter?.cursor ? parseInt(filter.cursor, 10) : 0;

    const paginatedData = tokens.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < tokens.length ? cursor + limit : undefined;

    return {
      data: paginatedData,
      pagination: {
        limit,
        nextCursor: nextCursor?.toString(),
        hasMore: nextCursor !== undefined,
      },
    };
  }

  private async getFromCache(key: string): Promise<TokenData[] | null> {
    // Try Redis first
    const redisCache = await cacheService.get<TokenData[]>(key);
    if (redisCache) {
      return redisCache;
    }

    // Fall back to in-memory cache
    const memCache = this.inMemoryCache.get(key);
    if (memCache && Date.now() - memCache.timestamp < this.cacheTTL) {
      return memCache.data;
    }

    return null;
  }

  private async saveToCache(key: string, data: TokenData[]): Promise<void> {
    // Save to both caches
    await cacheService.set(key, data);
    this.inMemoryCache.set(key, { data, timestamp: Date.now() });

    // Clean up old in-memory cache entries
    this.cleanupInMemoryCache();
  }

  private cleanupInMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.inMemoryCache.entries()) {
      if (now - value.timestamp > this.cacheTTL * 2) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  private getCacheKey(filter?: TokenFilter): string {
    return `tokens:${JSON.stringify(filter || {})}`;
  }

  clearCache(): void {
    this.inMemoryCache.clear();
  }
}

export const aggregationService = new AggregationService();

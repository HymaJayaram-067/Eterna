import { Token, TokenQueryParams, PaginatedResponse } from '../types';
import { DexScreenerClient } from './dexScreenerClient';
import { JupiterClient } from './jupiterClient';
import { GeckoTerminalClient } from './geckoTerminalClient';
import { cacheService } from './cacheService';
import logger from '../utils/logger';

export class TokenAggregatorService {
  private dexScreener: DexScreenerClient;
  private jupiter: JupiterClient;
  private geckoTerminal: GeckoTerminalClient;

  constructor() {
    this.dexScreener = new DexScreenerClient();
    this.jupiter = new JupiterClient();
    this.geckoTerminal = new GeckoTerminalClient();
  }

  async aggregateTokens(useCache = true): Promise<Token[]> {
    const cacheKey = 'tokens:all';
    
    // Try cache first
    if (useCache) {
      const cachedTokens = await cacheService.getTokens(cacheKey);
      if (cachedTokens && cachedTokens.length > 0) {
        logger.debug(`Returning ${cachedTokens.length} tokens from cache`);
        return cachedTokens;
      }
    }

    logger.info('Fetching fresh token data from all sources');

    // Fetch from all sources in parallel
    const [dexTokens, geckoTokens] = await Promise.allSettled([
      this.dexScreener.searchTokens('solana'),
      this.geckoTerminal.getTrendingTokens(),
    ]);

    const allTokens: Token[] = [];

    if (dexTokens.status === 'fulfilled') {
      allTokens.push(...dexTokens.value);
      logger.info(`Fetched ${dexTokens.value.length} tokens from DexScreener`);
    } else {
      logger.error('DexScreener fetch failed', dexTokens.reason);
    }

    if (geckoTokens.status === 'fulfilled') {
      allTokens.push(...geckoTokens.value);
      logger.info(`Fetched ${geckoTokens.value.length} tokens from GeckoTerminal`);
    } else {
      logger.error('GeckoTerminal fetch failed', geckoTokens.reason);
    }

    // Merge duplicate tokens
    const mergedTokens = this.mergeTokens(allTokens);
    
    // Enrich with Jupiter prices (optional, can be commented out to reduce API calls)
    // const enrichedTokens = await this.jupiter.enrichTokensWithPrices(mergedTokens);
    
    // Cache the results
    await cacheService.setTokens(cacheKey, mergedTokens);
    
    logger.info(`Aggregated ${mergedTokens.length} unique tokens`);
    return mergedTokens;
  }

  private mergeTokens(tokens: Token[]): Token[] {
    const tokenMap = new Map<string, Token>();

    for (const token of tokens) {
      const existing = tokenMap.get(token.token_address);
      
      if (!existing) {
        tokenMap.set(token.token_address, token);
      } else {
        // Merge: prefer non-zero values and most recent data
        tokenMap.set(token.token_address, {
          ...existing,
          token_name: existing.token_name || token.token_name,
          token_ticker: existing.token_ticker || token.token_ticker,
          price_sol: token.price_sol > 0 ? token.price_sol : existing.price_sol,
          market_cap_sol: Math.max(token.market_cap_sol, existing.market_cap_sol),
          volume_sol: Math.max(token.volume_sol, existing.volume_sol),
          liquidity_sol: Math.max(token.liquidity_sol, existing.liquidity_sol),
          transaction_count: Math.max(token.transaction_count, existing.transaction_count),
          price_1hr_change: token.price_1hr_change !== 0 ? token.price_1hr_change : existing.price_1hr_change,
          price_24hr_change: token.price_24hr_change || existing.price_24hr_change,
          price_7d_change: token.price_7d_change || existing.price_7d_change,
          protocol: existing.protocol !== 'Unknown DEX' ? existing.protocol : token.protocol,
          last_updated: Math.max(token.last_updated || 0, existing.last_updated || 0),
        });
      }
    }

    return Array.from(tokenMap.values());
  }

  async getFilteredTokens(params: TokenQueryParams): Promise<PaginatedResponse<Token>> {
    const tokens = await this.aggregateTokens(true);
    
    // Apply filters
    let filtered = this.filterTokens(tokens, params);
    
    // Sort
    filtered = this.sortTokens(filtered, params);
    
    // Pagination
    const limit = params.limit || 30;
    const cursorIndex = params.cursor ? parseInt(params.cursor, 10) : 0;
    
    const paginatedTokens = filtered.slice(cursorIndex, cursorIndex + limit);
    const hasMore = cursorIndex + limit < filtered.length;
    const nextCursor = hasMore ? String(cursorIndex + limit) : null;

    return {
      data: paginatedTokens,
      nextCursor,
      hasMore,
      total: filtered.length,
    };
  }

  private filterTokens(tokens: Token[], params: TokenQueryParams): Token[] {
    let filtered = [...tokens];

    // Filter by minimum volume
    if (params.minVolume !== undefined) {
      filtered = filtered.filter(t => t.volume_sol >= params.minVolume!);
    }

    // Filter by minimum market cap
    if (params.minMarketCap !== undefined) {
      filtered = filtered.filter(t => t.market_cap_sol >= params.minMarketCap!);
    }

    return filtered;
  }

  private sortTokens(tokens: Token[], params: TokenQueryParams): Token[] {
    const { sortBy = 'volume', sortOrder = 'desc' } = params;
    
    return tokens.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'volume':
          comparison = a.volume_sol - b.volume_sol;
          break;
        case 'price_change':
          const aChange = a.price_1hr_change || 0;
          const bChange = b.price_1hr_change || 0;
          comparison = aChange - bChange;
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

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    // Try cache first
    const cacheKey = `token:${address}`;
    const cached = await cacheService.get<Token>(cacheKey);
    if (cached) return cached;

    // Try fetching from sources
    const [dexToken, geckoToken] = await Promise.allSettled([
      this.dexScreener.getTokenByAddress(address),
      this.geckoTerminal.getTokenInfo(address),
    ]);

    let token: Token | null = null;

    if (dexToken.status === 'fulfilled' && dexToken.value) {
      token = dexToken.value;
    } else if (geckoToken.status === 'fulfilled' && geckoToken.value) {
      token = geckoToken.value;
    }

    if (token) {
      await cacheService.set(cacheKey, token, 60); // Cache for 1 minute
    }

    return token;
  }

  async refreshCache(): Promise<void> {
    logger.info('Refreshing token cache...');
    await this.aggregateTokens(false);
  }
}

export const tokenAggregator = new TokenAggregatorService();

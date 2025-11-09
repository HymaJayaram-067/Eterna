import { TokenData, TokenFilter, PaginatedResponse, DexScreenerToken, GeckoTerminalToken } from '../types';
import { DexScreenerClient, GeckoTerminalClient, JupiterClient } from './dex.clients';
import { cacheService } from './cache.service';

export class TokenAggregationService {
  private dexScreener: DexScreenerClient;
  private geckoTerminal: GeckoTerminalClient;
  private jupiter: JupiterClient;
  private cacheKey = 'tokens:aggregated';

  constructor() {
    this.dexScreener = new DexScreenerClient();
    this.geckoTerminal = new GeckoTerminalClient();
    this.jupiter = new JupiterClient();
  }

  async fetchAndAggregateTokens(): Promise<TokenData[]> {
    try {
      // Check cache first
      const cached = await cacheService.get<TokenData[]>(this.cacheKey);
      if (cached && cached.length > 0) {
        console.log('Returning cached tokens');
        return cached;
      }

      console.log('Fetching fresh token data from DEX sources...');

      // Fetch from multiple sources in parallel
      const [dexTokens, geckoTokens] = await Promise.all([
        this.dexScreener.getTopTokens('solana'),
        this.geckoTerminal.getNetworkTokens('solana'),
      ]);

      // Convert to unified format
      const aggregatedTokens = new Map<string, TokenData>();

      // Process DexScreener tokens
      dexTokens.forEach((token) => {
        const tokenData = this.convertDexScreenerToken(token);
        if (tokenData) {
          aggregatedTokens.set(tokenData.token_address, tokenData);
        }
      });

      // Merge GeckoTerminal tokens
      geckoTokens.slice(0, 30).forEach((token) => {
        const tokenData = this.convertGeckoTerminalToken(token);
        if (tokenData) {
          const existing = aggregatedTokens.get(tokenData.token_address);
          if (existing) {
            // Merge data, prefer more complete data
            aggregatedTokens.set(tokenData.token_address, {
              ...existing,
              ...tokenData,
              volume_sol: Math.max(existing.volume_sol, tokenData.volume_sol),
              liquidity_sol: Math.max(existing.liquidity_sol, tokenData.liquidity_sol),
            });
          } else {
            aggregatedTokens.set(tokenData.token_address, tokenData);
          }
        }
      });

      const result = Array.from(aggregatedTokens.values());
      
      // Cache the results
      await cacheService.set(this.cacheKey, result);

      console.log(`Aggregated ${result.length} unique tokens`);
      return result;
    } catch (error) {
      console.error('Error aggregating tokens:', error);
      return [];
    }
  }

  private convertDexScreenerToken(token: DexScreenerToken): TokenData | null {
    try {
      const solPrice = parseFloat(token.priceNative || '0');
      const volumeUsd = token.volume?.h24 || 0;
      const liquidityUsd = token.liquidity?.usd || 0;

      // Rough conversion: assume 1 SOL = $100 for simplicity
      const solToUsd = 100;
      const volumeSol = volumeUsd / solToUsd;
      const liquiditySol = liquidityUsd / solToUsd;

      return {
        token_address: token.baseToken?.address || token.pairAddress,
        token_name: token.baseToken?.name || 'Unknown',
        token_ticker: token.baseToken?.symbol || 'UNKNOWN',
        price_sol: solPrice,
        market_cap_sol: token.marketCap ? token.marketCap / solToUsd : 0,
        volume_sol: volumeSol,
        liquidity_sol: liquiditySol,
        transaction_count: (token.txns?.h24?.buys || 0) + (token.txns?.h24?.sells || 0),
        price_1hr_change: token.priceChange?.h1 || 0,
        price_24hr_change: token.priceChange?.h24 || 0,
        protocol: token.dexId || 'Unknown DEX',
        last_updated: Date.now(),
      };
    } catch (error) {
      console.error('Error converting DexScreener token:', error);
      return null;
    }
  }

  private convertGeckoTerminalToken(token: GeckoTerminalToken): TokenData | null {
    try {
      const attrs = token.attributes;
      const priceUsd = parseFloat(attrs.price_usd || '0');
      const volumeUsd = parseFloat(attrs.volume_usd?.h24 || '0');
      const marketCapUsd = parseFloat(attrs.market_cap_usd || '0');

      // Rough conversion: assume 1 SOL = $100
      const solToUsd = 100;

      return {
        token_address: attrs.address,
        token_name: attrs.name,
        token_ticker: attrs.symbol,
        price_sol: priceUsd / solToUsd,
        market_cap_sol: marketCapUsd / solToUsd,
        volume_sol: volumeUsd / solToUsd,
        liquidity_sol: 0, // Not available in this API
        transaction_count: 0, // Not available in this API
        price_1hr_change: parseFloat(attrs.price_change_percentage?.h1 || '0'),
        price_24hr_change: parseFloat(attrs.price_change_percentage?.h24 || '0'),
        protocol: 'GeckoTerminal',
        last_updated: Date.now(),
      };
    } catch (error) {
      console.error('Error converting GeckoTerminal token:', error);
      return null;
    }
  }

  async getFilteredTokens(filter: TokenFilter): Promise<PaginatedResponse<TokenData>> {
    const tokens = await this.fetchAndAggregateTokens();

    let filtered = [...tokens];

    // Apply filters
    if (filter.minVolume) {
      filtered = filtered.filter((t) => t.volume_sol >= filter.minVolume!);
    }

    if (filter.minMarketCap) {
      filtered = filtered.filter((t) => t.market_cap_sol >= filter.minMarketCap!);
    }

    // Sort
    const sortBy = filter.sortBy || 'volume';
    const sortOrder = filter.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      switch (sortBy) {
        case 'volume':
          aVal = a.volume_sol;
          bVal = b.volume_sol;
          break;
        case 'market_cap':
          aVal = a.market_cap_sol;
          bVal = b.market_cap_sol;
          break;
        case 'liquidity':
          aVal = a.liquidity_sol;
          bVal = b.liquidity_sol;
          break;
        case 'price_change': {
          const timePeriod = filter.timePeriod || '24h';
          if (timePeriod === '1h') {
            aVal = a.price_1hr_change;
            bVal = b.price_1hr_change;
          } else if (timePeriod === '24h') {
            aVal = a.price_24hr_change || 0;
            bVal = b.price_24hr_change || 0;
          }
          break;
        }
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Pagination
    const limit = Math.min(filter.limit || 20, 100);
    const cursor = parseInt(filter.cursor || '0', 10);
    const start = cursor;
    const end = start + limit;

    const paginatedData = filtered.slice(start, end);
    const hasMore = end < filtered.length;
    const nextCursor = hasMore ? end.toString() : undefined;

    return {
      data: paginatedData,
      nextCursor,
      hasMore,
      total: filtered.length,
    };
  }

  async invalidateCache(): Promise<void> {
    await cacheService.del(this.cacheKey);
  }
}

export const tokenAggregationService = new TokenAggregationService();

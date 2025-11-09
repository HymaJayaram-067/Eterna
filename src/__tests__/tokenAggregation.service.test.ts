import { TokenAggregationService } from '../services/tokenAggregation.service';
import { DexScreenerClient, GeckoTerminalClient } from '../services/dex.clients';
import { cacheService } from '../services/cache.service';

// Mock the services
jest.mock('../services/dex.clients');
jest.mock('../services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe('TokenAggregationService', () => {
  let service: TokenAggregationService;
  let mockDexScreener: jest.Mocked<DexScreenerClient>;
  let mockGeckoTerminal: jest.Mocked<GeckoTerminalClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenAggregationService();
    mockDexScreener = (DexScreenerClient as jest.MockedClass<typeof DexScreenerClient>).mock
      .instances[0] as jest.Mocked<DexScreenerClient>;
    mockGeckoTerminal = (GeckoTerminalClient as jest.MockedClass<typeof GeckoTerminalClient>).mock
      .instances[0] as jest.Mocked<GeckoTerminalClient>;
  });

  describe('fetchAndAggregateTokens', () => {
    it('should return cached tokens if available', async () => {
      const cachedTokens = [
        {
          token_address: 'addr1',
          token_name: 'Token1',
          token_ticker: 'TK1',
          price_sol: 1.0,
          market_cap_sol: 1000,
          volume_sol: 500,
          liquidity_sol: 200,
          transaction_count: 100,
          price_1hr_change: 5,
          protocol: 'Test',
        },
      ];

      (cacheService.get as jest.Mock).mockResolvedValue(cachedTokens);

      const result = await service.fetchAndAggregateTokens();

      expect(result).toEqual(cachedTokens);
      expect(cacheService.get).toHaveBeenCalled();
      expect(mockDexScreener.getTopTokens).not.toHaveBeenCalled();
    });

    it('should fetch from APIs when cache is empty', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);

      const dexTokens = [
        {
          chainId: 'solana',
          dexId: 'raydium',
          pairAddress: 'pair1',
          baseToken: {
            address: 'addr1',
            name: 'Token1',
            symbol: 'TK1',
          },
          quoteToken: {
            address: 'sol',
            name: 'Solana',
            symbol: 'SOL',
          },
          priceNative: '1.0',
          volume: { h24: 10000 },
          priceChange: { h1: 5, h24: 10 },
          txns: { h24: { buys: 50, sells: 50 } },
          liquidity: { usd: 20000 },
        },
      ];

      const geckoTokens = [
        {
          id: '1',
          type: 'token',
          attributes: {
            address: 'addr2',
            name: 'Token2',
            symbol: 'TK2',
            decimals: 9,
            price_usd: '100',
            fdv_usd: '1000000',
            market_cap_usd: '800000',
            total_supply: '10000',
            volume_usd: { h24: '50000' },
            price_change_percentage: { h1: '3', h24: '7' },
          },
        },
      ];

      mockDexScreener.getTopTokens = jest.fn().mockResolvedValue(dexTokens);
      mockGeckoTerminal.getNetworkTokens = jest.fn().mockResolvedValue(geckoTokens);

      const result = await service.fetchAndAggregateTokens();

      expect(result.length).toBeGreaterThan(0);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('getFilteredTokens', () => {
    beforeEach(() => {
      const mockTokens = [
        {
          token_address: 'addr1',
          token_name: 'Token1',
          token_ticker: 'TK1',
          price_sol: 1.0,
          market_cap_sol: 1000,
          volume_sol: 500,
          liquidity_sol: 200,
          transaction_count: 100,
          price_1hr_change: 5,
          price_24hr_change: 10,
          protocol: 'Test',
        },
        {
          token_address: 'addr2',
          token_name: 'Token2',
          token_ticker: 'TK2',
          price_sol: 2.0,
          market_cap_sol: 2000,
          volume_sol: 1000,
          liquidity_sol: 400,
          transaction_count: 200,
          price_1hr_change: 10,
          price_24hr_change: 20,
          protocol: 'Test',
        },
      ];

      (cacheService.get as jest.Mock).mockResolvedValue(mockTokens);
    });

    it('should filter tokens by minimum volume', async () => {
      const result = await service.getFilteredTokens({ minVolume: 600 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].token_ticker).toBe('TK2');
    });

    it('should sort tokens by volume descending', async () => {
      const result = await service.getFilteredTokens({
        sortBy: 'volume',
        sortOrder: 'desc',
      });

      expect(result.data[0].token_ticker).toBe('TK2');
      expect(result.data[1].token_ticker).toBe('TK1');
    });

    it('should sort tokens by price change', async () => {
      const result = await service.getFilteredTokens({
        sortBy: 'price_change',
        timePeriod: '24h',
        sortOrder: 'desc',
      });

      expect(result.data[0].token_ticker).toBe('TK2');
      expect(result.data[0].price_24hr_change).toBe(20);
    });

    it('should paginate results correctly', async () => {
      const result = await service.getFilteredTokens({
        limit: 1,
        cursor: '0',
      });

      expect(result.data.length).toBe(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('1');
    });

    it('should handle cursor-based pagination', async () => {
      const page1 = await service.getFilteredTokens({ limit: 1, cursor: '0' });
      const page2 = await service.getFilteredTokens({ limit: 1, cursor: page1.nextCursor });

      expect(page1.data[0].token_address).not.toBe(page2.data[0].token_address);
    });
  });
});

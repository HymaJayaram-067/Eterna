import { TokenAggregatorService } from '../services/tokenAggregator';
import { Token } from '../types';

// Mock the dependencies
jest.mock('../services/dexScreenerClient');
jest.mock('../services/jupiterClient');
jest.mock('../services/geckoTerminalClient');
jest.mock('../services/cacheService');

import { DexScreenerClient } from '../services/dexScreenerClient';
import { GeckoTerminalClient } from '../services/geckoTerminalClient';
import { cacheService } from '../services/cacheService';

describe('TokenAggregatorService', () => {
  let aggregator: TokenAggregatorService;
  let mockDexScreener: jest.Mocked<DexScreenerClient>;
  let mockGeckoTerminal: jest.Mocked<GeckoTerminalClient>;

  const mockTokens: Token[] = [
    {
      token_address: 'addr1',
      token_name: 'Token 1',
      token_ticker: 'TK1',
      price_sol: 0.5,
      market_cap_sol: 1000,
      volume_sol: 500,
      liquidity_sol: 300,
      transaction_count: 100,
      price_1hr_change: 5,
      protocol: 'Raydium',
      last_updated: Date.now(),
    },
    {
      token_address: 'addr2',
      token_name: 'Token 2',
      token_ticker: 'TK2',
      price_sol: 1.5,
      market_cap_sol: 2000,
      volume_sol: 1000,
      liquidity_sol: 600,
      transaction_count: 200,
      price_1hr_change: 10,
      protocol: 'Orca',
      last_updated: Date.now(),
    },
  ];

  beforeEach(() => {
    aggregator = new TokenAggregatorService();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup cache mock
    (cacheService.getTokens as jest.Mock) = jest.fn().mockResolvedValue(null);
    (cacheService.setTokens as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe('aggregateTokens', () => {
    it('should return cached tokens when available', async () => {
      (cacheService.getTokens as jest.Mock).mockResolvedValue(mockTokens);

      const result = await aggregator.aggregateTokens(true);

      expect(result).toEqual(mockTokens);
      expect(cacheService.getTokens).toHaveBeenCalledWith('tokens:all');
    });

    it('should fetch from multiple sources when cache is empty', async () => {
      (cacheService.getTokens as jest.Mock).mockResolvedValue(null);
      
      // Mock DexScreener
      const mockSearchTokens = jest.fn().mockResolvedValue([mockTokens[0]]);
      DexScreenerClient.prototype.searchTokens = mockSearchTokens;
      
      // Mock GeckoTerminal
      const mockGetTrending = jest.fn().mockResolvedValue([mockTokens[1]]);
      GeckoTerminalClient.prototype.getTrendingTokens = mockGetTrending;

      const result = await aggregator.aggregateTokens(false);

      expect(result.length).toBeGreaterThan(0);
      expect(cacheService.setTokens).toHaveBeenCalled();
    });
  });

  describe('getFilteredTokens', () => {
    beforeEach(() => {
      (cacheService.getTokens as jest.Mock).mockResolvedValue(mockTokens);
    });

    it('should return paginated results', async () => {
      const result = await aggregator.getFilteredTokens({ limit: 1 });

      expect(result.data.length).toBe(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('1');
    });

    it('should filter by minimum volume', async () => {
      const result = await aggregator.getFilteredTokens({ minVolume: 600 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].volume_sol).toBeGreaterThanOrEqual(600);
    });

    it('should sort by volume descending', async () => {
      const result = await aggregator.getFilteredTokens({
        sortBy: 'volume',
        sortOrder: 'desc',
      });

      expect(result.data[0].volume_sol).toBeGreaterThanOrEqual(
        result.data[result.data.length - 1].volume_sol
      );
    });

    it('should sort by price change', async () => {
      const result = await aggregator.getFilteredTokens({
        sortBy: 'price_change',
        sortOrder: 'desc',
      });

      expect(result.data[0].price_1hr_change).toBeGreaterThanOrEqual(
        result.data[result.data.length - 1].price_1hr_change
      );
    });
  });

  describe('getTokenByAddress', () => {
    it('should return token from cache if available', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(mockTokens[0]);

      const result = await aggregator.getTokenByAddress('addr1');

      expect(result).toEqual(mockTokens[0]);
      expect(cacheService.get).toHaveBeenCalledWith('token:addr1');
    });

    it('should fetch from API if not in cache', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      const mockGetToken = jest.fn().mockResolvedValue(mockTokens[0]);
      DexScreenerClient.prototype.getTokenByAddress = mockGetToken;

      const result = await aggregator.getTokenByAddress('addr1');

      expect(result).toBeDefined();
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should return null if token not found', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      const mockGetToken = jest.fn().mockResolvedValue(null);
      DexScreenerClient.prototype.getTokenByAddress = mockGetToken;
      GeckoTerminalClient.prototype.getTokenInfo = mockGetToken;

      const result = await aggregator.getTokenByAddress('unknown');

      expect(result).toBeNull();
    });
  });
});

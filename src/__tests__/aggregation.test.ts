import { AggregationService } from '../services/aggregation.service';
import * as dexScreenerService from '../services/dexscreener.service';
import * as geckoTerminalService from '../services/geckoterminal.service';
import { TokenData } from '../types';

// Mock the services
jest.mock('../services/dexscreener.service');
jest.mock('../services/geckoterminal.service');
jest.mock('../services/cache.service');

const mockTokenData: TokenData = {
  token_address: '123abc',
  token_name: 'Test Token',
  token_ticker: 'TEST',
  price_sol: 0.5,
  market_cap_sol: 1000,
  volume_sol: 500,
  liquidity_sol: 200,
  transaction_count: 100,
  price_1hr_change: 5,
  price_24hr_change: 10,
  protocol: 'Raydium',
  source: 'DexScreener',
  last_updated: Date.now(),
};

describe('AggregationService', () => {
  let service: AggregationService;

  beforeEach(() => {
    service = new AggregationService();
    service.clearCache();
    jest.clearAllMocks();
    
    // Setup default mocks
    (dexScreenerService.dexScreenerService.getTrendingTokens as jest.Mock) = jest.fn().mockResolvedValue([mockTokenData]);
    (geckoTerminalService.geckoTerminalService.getTrendingTokens as jest.Mock) = jest.fn().mockResolvedValue([]);
    (dexScreenerService.dexScreenerService.searchTokens as jest.Mock) = jest.fn().mockResolvedValue([mockTokenData]);
    (dexScreenerService.dexScreenerService.getTokenByAddress as jest.Mock) = jest.fn().mockResolvedValue(mockTokenData);
    (geckoTerminalService.geckoTerminalService.getTokenByAddress as jest.Mock) = jest.fn().mockResolvedValue(null);
  });

  describe('getTokens', () => {
    it('should return paginated tokens', async () => {
      const result = await service.getTokens({ limit: 10 });
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('limit', 10);
      expect(result.pagination).toHaveProperty('hasMore');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should apply sorting by volume', async () => {
      const tokens = [
        { ...mockTokenData, token_address: '1', volume_sol: 100 },
        { ...mockTokenData, token_address: '2', volume_sol: 200 },
        { ...mockTokenData, token_address: '3', volume_sol: 150 },
      ];
      (dexScreenerService.dexScreenerService.getTrendingTokens as jest.Mock).mockResolvedValue(tokens);
      
      const result = await service.getTokens({
        sortBy: 'volume',
        sortOrder: 'desc',
        limit: 5,
      });

      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(result.data[i].volume_sol).toBeGreaterThanOrEqual(
            result.data[i + 1].volume_sol
          );
        }
      }
    });

    it('should handle cursor-based pagination', async () => {
      const tokens = Array.from({ length: 15 }, (_, i) => ({
        ...mockTokenData,
        token_address: `token${i}`,
      }));
      (dexScreenerService.dexScreenerService.getTrendingTokens as jest.Mock).mockResolvedValue(tokens);
      
      const firstPage = await service.getTokens({ limit: 5 });
      
      expect(firstPage.pagination.nextCursor).toBe('5');
      expect(firstPage.data.length).toBe(5);
      
      if (firstPage.pagination.nextCursor) {
        const secondPage = await service.getTokens({
          limit: 5,
          cursor: firstPage.pagination.nextCursor,
        });
        
        expect(secondPage.data).toBeDefined();
        expect(secondPage.data.length).toBe(5);
      }
    });
  });

  describe('searchTokens', () => {
    it('should search for tokens by query', async () => {
      const results = await service.searchTokens('bonk');
      
      expect(Array.isArray(results)).toBe(true);
      expect(dexScreenerService.dexScreenerService.searchTokens).toHaveBeenCalledWith('bonk');
    });

    it('should return empty array when no results', async () => {
      (dexScreenerService.dexScreenerService.searchTokens as jest.Mock).mockResolvedValue([]);
      
      const results = await service.searchTokens('nonexistent');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getTokenByAddress', () => {
    it('should fetch token by address', async () => {
      const token = await service.getTokenByAddress('123abc');
      
      expect(token).toBeDefined();
      expect(token?.token_address).toBe('123abc');
    });

    it('should return null for invalid address', async () => {
      (dexScreenerService.dexScreenerService.getTokenByAddress as jest.Mock).mockResolvedValue(null);
      (geckoTerminalService.geckoTerminalService.getTokenByAddress as jest.Mock).mockResolvedValue(null);
      
      const token = await service.getTokenByAddress('invalid');
      
      expect(token).toBeNull();
    });
  });
});

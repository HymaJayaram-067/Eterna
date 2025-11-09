import request from 'supertest';
import express, { Application } from 'express';
import apiRoutes from '../api/routes';
import { tokenAggregationService } from '../services/tokenAggregation.service';

// Mock the token aggregation service
jest.mock('../services/tokenAggregation.service', () => ({
  tokenAggregationService: {
    getFilteredTokens: jest.fn(),
    fetchAndAggregateTokens: jest.fn(),
    invalidateCache: jest.fn(),
  },
}));

describe('API Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /api/tokens', () => {
    it('should return paginated tokens', async () => {
      const mockData = {
        data: [
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
        ],
        nextCursor: '20',
        hasMore: true,
        total: 50,
      };

      (tokenAggregationService.getFilteredTokens as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData.data);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it('should apply filters from query parameters', async () => {
      const mockData = {
        data: [],
        nextCursor: undefined,
        hasMore: false,
        total: 0,
      };

      (tokenAggregationService.getFilteredTokens as jest.Mock).mockResolvedValue(mockData);

      await request(app)
        .get('/api/tokens')
        .query({
          sortBy: 'volume',
          sortOrder: 'desc',
          limit: 10,
          minVolume: 100,
        });

      expect(tokenAggregationService.getFilteredTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'volume',
          sortOrder: 'desc',
          limit: 10,
          minVolume: 100,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (tokenAggregationService.getFilteredTokens as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch tokens');
    });
  });

  describe('GET /api/tokens/:address', () => {
    it('should return token by address', async () => {
      const mockToken = {
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
      };

      (tokenAggregationService.fetchAndAggregateTokens as jest.Mock).mockResolvedValue([
        mockToken,
      ]);

      const response = await request(app).get('/api/tokens/addr1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockToken);
    });

    it('should return 404 for non-existent token', async () => {
      (tokenAggregationService.fetchAndAggregateTokens as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/tokens/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token not found');
    });
  });

  describe('POST /api/cache/invalidate', () => {
    it('should invalidate cache successfully', async () => {
      (tokenAggregationService.invalidateCache as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).post('/api/cache/invalidate');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(tokenAggregationService.invalidateCache).toHaveBeenCalled();
    });

    it('should handle cache invalidation errors', async () => {
      (tokenAggregationService.invalidateCache as jest.Mock).mockRejectedValue(
        new Error('Cache error')
      );

      const response = await request(app).post('/api/cache/invalidate');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});

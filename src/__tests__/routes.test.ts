import request from 'supertest';
import express, { Application } from 'express';
import routes from '../api/routes';
import { Token } from '../types';

// Mock the dependencies
jest.mock('../services/tokenAggregator');
jest.mock('../websocket/websocketService');

import { tokenAggregator } from '../services/tokenAggregator';
import { wsService } from '../websocket/websocketService';

describe('API Routes', () => {
  let app: Application;

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
  ];

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    jest.clearAllMocks();
  });

  describe('GET /api/tokens', () => {
    it('should return paginated tokens', async () => {
      (tokenAggregator.getFilteredTokens as jest.Mock).mockResolvedValue({
        data: mockTokens,
        nextCursor: null,
        hasMore: false,
        total: 1,
      });

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual(mockTokens);
    });

    it('should accept query parameters', async () => {
      (tokenAggregator.getFilteredTokens as jest.Mock).mockResolvedValue({
        data: mockTokens,
        nextCursor: '10',
        hasMore: true,
        total: 20,
      });

      const response = await request(app)
        .get('/api/tokens')
        .query({ limit: 10, sortBy: 'volume', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(tokenAggregator.getFilteredTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          sortBy: 'volume',
          sortOrder: 'desc',
        })
      );
    });

    it('should handle errors', async () => {
      (tokenAggregator.getFilteredTokens as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request(app).get('/api/tokens');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Test error');
    });
  });

  describe('GET /api/tokens/:address', () => {
    it('should return token by address', async () => {
      (tokenAggregator.getTokenByAddress as jest.Mock).mockResolvedValue(mockTokens[0]);

      const response = await request(app).get('/api/tokens/addr1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTokens[0]);
    });

    it('should return 404 if token not found', async () => {
      (tokenAggregator.getTokenByAddress as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/tokens/unknown');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token not found');
    });

    it('should handle errors', async () => {
      (tokenAggregator.getTokenByAddress as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request(app).get('/api/tokens/addr1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/refresh', () => {
    it('should trigger cache refresh', async () => {
      (tokenAggregator.refreshCache as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).post('/api/refresh');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(tokenAggregator.refreshCache).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      (tokenAggregator.refreshCache as jest.Mock).mockRejectedValue(
        new Error('Refresh failed')
      );

      const response = await request(app).post('/api/refresh');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      (wsService.getConnectedClientsCount as jest.Mock).mockReturnValue(5);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
      expect(response.body.data.wsConnections).toBe(5);
    });
  });
});

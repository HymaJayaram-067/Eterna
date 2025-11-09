import request from 'supertest';
import App from '../app';
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

describe('API Routes', () => {
  let app: App;
  let server: ReturnType<App['getApp']>;

  beforeAll(async () => {
    // Setup mocks before creating app
    (dexScreenerService.dexScreenerService.getTrendingTokens as jest.Mock) = jest.fn().mockResolvedValue([mockTokenData]);
    (geckoTerminalService.geckoTerminalService.getTrendingTokens as jest.Mock) = jest.fn().mockResolvedValue([]);
    (dexScreenerService.dexScreenerService.searchTokens as jest.Mock) = jest.fn().mockResolvedValue([mockTokenData]);
    (dexScreenerService.dexScreenerService.getTokenByAddress as jest.Mock) = jest.fn().mockResolvedValue(null);
    (geckoTerminalService.geckoTerminalService.getTokenByAddress as jest.Mock) = jest.fn().mockResolvedValue(null);
    
    app = new App();
    server = app.getApp();
  });

  afterAll(async () => {
    await app.stop();
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(server).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(server).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/tokens', () => {
    it('should return list of tokens', async () => {
      const response = await request(server).get('/api/tokens');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(server)
        .get('/api/tokens')
        .query({ limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should support sorting', async () => {
      const tokens = [
        { ...mockTokenData, token_address: '1', volume_sol: 300 },
        { ...mockTokenData, token_address: '2', volume_sol: 200 },
        { ...mockTokenData, token_address: '3', volume_sol: 100 },
      ];
      (dexScreenerService.dexScreenerService.getTrendingTokens as jest.Mock).mockResolvedValueOnce(tokens);
      
      const response = await request(server)
        .get('/api/tokens')
        .query({ sortBy: 'volume', sortOrder: 'desc', limit: 10 });
      
      expect(response.status).toBe(200);
      
      const returnedTokens = response.body.data;
      if (returnedTokens.length > 1) {
        for (let i = 0; i < returnedTokens.length - 1; i++) {
          expect(returnedTokens[i].volume_sol).toBeGreaterThanOrEqual(
            returnedTokens[i + 1].volume_sol
          );
        }
      }
    });
  });

  describe('GET /api/tokens/:address', () => {
    it('should return 404 for invalid address', async () => {
      const response = await request(server)
        .get('/api/tokens/invalid-address');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/search', () => {
    it('should search for tokens', async () => {
      const response = await request(server)
        .get('/api/search')
        .query({ q: 'bonk' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(server).get('/api/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /invalid-route', () => {
    it('should return 404 for invalid routes', async () => {
      const response = await request(server).get('/invalid-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });
});

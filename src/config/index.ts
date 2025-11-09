import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '30', 10), // seconds
  },
  api: {
    dexScreener: {
      baseUrl: 'https://api.dexscreener.com/latest/dex',
      rateLimit: 300, // requests per minute
    },
    jupiter: {
      baseUrl: 'https://price.jup.ag/v4',
    },
    geckoTerminal: {
      baseUrl: 'https://api.geckoterminal.com/api/v2',
    },
  },
  rateLimiting: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  websocket: {
    updateInterval: 5000, // 5 seconds
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL || '30', 10),
  },
  rateLimits: {
    dexScreener: parseInt(process.env.DEXSCREENER_RATE_LIMIT || '300', 10),
    jupiter: parseInt(process.env.JUPITER_RATE_LIMIT || '600', 10),
    geckoTerminal: parseInt(process.env.GECKOTERMINAL_RATE_LIMIT || '300', 10),
  },
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
  },
  dataRefresh: {
    interval: parseInt(process.env.REFRESH_INTERVAL || '30', 10),
  },
};

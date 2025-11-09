import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '30', 10), // seconds
  },
  
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
  
  websocket: {
    updateInterval: parseInt(process.env.WS_UPDATE_INTERVAL || '5000', 10),
  },
  
  apis: {
    dexScreener: {
      baseUrl: process.env.DEX_SCREENER_BASE_URL || 'https://api.dexscreener.com/latest/dex',
    },
    jupiter: {
      baseUrl: process.env.JUPITER_BASE_URL || 'https://price.jup.ag/v4',
    },
    geckoTerminal: {
      baseUrl: process.env.GECKO_TERMINAL_BASE_URL || 'https://api.geckoterminal.com/api/v2',
    },
  },
};

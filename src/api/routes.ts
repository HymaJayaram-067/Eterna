import { Router, Request, Response } from 'express';
import { tokenAggregator } from '../services/tokenAggregator';
import { TokenQueryParams, ApiResponse, Token, PaginatedResponse } from '../types';
import logger from '../utils/logger';
import { wsService } from '../websocket/websocketService';
import { config } from '../config';
import { cacheService } from '../services/cacheService';

const router = Router();

/**
 * GET /api/tokens
 * Get paginated list of tokens with filtering and sorting
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const params: TokenQueryParams = {
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 30,
      cursor: req.query.cursor as string,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      timePeriod: req.query.timePeriod as any,
      minVolume: req.query.minVolume ? parseFloat(req.query.minVolume as string) : undefined,
      minMarketCap: req.query.minMarketCap ? parseFloat(req.query.minMarketCap as string) : undefined,
    };

    const result = await tokenAggregator.getFilteredTokens(params);

    const response: ApiResponse<PaginatedResponse<Token>> = {
      success: true,
      data: result,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching tokens', error);
    const response: ApiResponse<PaginatedResponse<Token>> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tokens',
      errorCode: 'TOKEN_FETCH_ERROR',
      errorDetails: 'An error occurred while fetching token data. Please try again later or contact support if the issue persists.',
      timestamp: Date.now(),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/tokens/:address
 * Get specific token by address
 */
router.get('/tokens/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const token = await tokenAggregator.getTokenByAddress(address);

    if (!token) {
      const response: ApiResponse<Token> = {
        success: false,
        error: 'Token not found',
        timestamp: Date.now(),
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Token> = {
      success: true,
      data: token,
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    logger.error(`Error fetching token ${req.params.address}`, error);
    const response: ApiResponse<Token> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch token',
      errorCode: 'TOKEN_NOT_FOUND',
      errorDetails: `Could not retrieve token with address: ${req.params.address}. Please verify the address and try again.`,
      timestamp: Date.now(),
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/refresh
 * Manually trigger cache refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await tokenAggregator.refreshCache();
    
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Cache refreshed successfully' },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Error refreshing cache', error);
    const response: ApiResponse<{ message: string }> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh cache',
      errorCode: 'CACHE_REFRESH_ERROR',
      errorDetails: 'Unable to refresh the cache. This may be due to rate limiting or temporary service unavailability.',
      timestamp: Date.now(),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{
    status: string;
    uptime: number;
    wsConnections: number;
  }> = {
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      wsConnections: wsService.getConnectedClientsCount(),
    },
    timestamp: Date.now(),
  };

  res.json(response);
});

/**
 * GET /api/config
 * Get current configuration
 */
router.get('/config', (req: Request, res: Response) => {
  const response: ApiResponse<{
    cacheTTL: number;
    refreshInterval: number;
    rateLimits: {
      dexScreener: number;
      jupiter: number;
      geckoTerminal: number;
    };
  }> = {
    success: true,
    data: {
      cacheTTL: config.redis.ttl,
      refreshInterval: config.dataRefresh.interval,
      rateLimits: config.rateLimits,
    },
    timestamp: Date.now(),
  };

  res.json(response);
});

/**
 * PUT /api/config/cache-ttl
 * Update cache TTL (requires restart to take full effect)
 */
router.put('/config/cache-ttl', async (req: Request, res: Response) => {
  try {
    const { ttl } = req.body;
    
    if (!ttl || typeof ttl !== 'number' || ttl < 1 || ttl > 3600) {
      const response: ApiResponse<{ message: string }> = {
        success: false,
        error: 'Invalid TTL value. Must be a number between 1 and 3600 seconds',
        timestamp: Date.now(),
      };
      return res.status(400).json(response);
    }

    config.redis.ttl = ttl;
    
    const response: ApiResponse<{ message: string; newTTL: number }> = {
      success: true,
      data: {
        message: 'Cache TTL updated successfully',
        newTTL: ttl,
      },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Error updating cache TTL', error);
    const response: ApiResponse<{ message: string }> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cache TTL',
      timestamp: Date.now(),
    };
    res.status(500).json(response);
  }
});

export default router;

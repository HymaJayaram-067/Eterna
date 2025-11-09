import { Router, Request, Response } from 'express';
import { tokenAggregator } from '../services/tokenAggregator';
import { TokenQueryParams, ApiResponse, Token, PaginatedResponse } from '../types';
import logger from '../utils/logger';
import { wsService } from '../websocket/websocketService';

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

export default router;

import { Router, Request, Response } from 'express';
import { tokenAggregationService } from '../services/tokenAggregation.service';
import { TokenFilter } from '../types';

const router = Router();

/**
 * GET /api/tokens
 * Get filtered and paginated tokens
 * 
 * Query params:
 * - timePeriod: '1h' | '24h' | '7d'
 * - sortBy: 'volume' | 'price_change' | 'market_cap' | 'liquidity'
 * - sortOrder: 'asc' | 'desc'
 * - limit: number (max 100)
 * - cursor: string
 * - minVolume: number
 * - minMarketCap: number
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const filter: TokenFilter = {
      timePeriod: req.query.timePeriod as '1h' | '24h' | '7d',
      sortBy: req.query.sortBy as 'volume' | 'price_change' | 'market_cap' | 'liquidity',
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      cursor: req.query.cursor as string,
      minVolume: req.query.minVolume ? parseFloat(req.query.minVolume as string) : undefined,
      minMarketCap: req.query.minMarketCap
        ? parseFloat(req.query.minMarketCap as string)
        : undefined,
    };

    const result = await tokenAggregationService.getFilteredTokens(filter);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/tokens/:address
 * Get specific token by address
 */
router.get('/tokens/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const tokens = await tokenAggregationService.fetchAndAggregateTokens();
    const token = tokens.find((t) => t.token_address === address);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
      });
    }

    res.json({
      success: true,
      data: token,
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cache/invalidate
 * Invalidate cache to force fresh data
 */
router.post('/cache/invalidate', async (req: Request, res: Response) => {
  try {
    await tokenAggregationService.invalidateCache();
    res.json({
      success: true,
      message: 'Cache invalidated successfully',
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

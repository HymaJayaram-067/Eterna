import { Router, Request, Response } from 'express';
import { aggregationService } from '../services/aggregation.service';
import { TokenFilter } from '../types';

const router = Router();

/**
 * GET /api/tokens
 * Get list of tokens with filtering, sorting, and pagination
 */
router.get('/tokens', async (req: Request, res: Response) => {
  try {
    const filter: TokenFilter = {
      timePeriod: req.query.timePeriod as '1h' | '24h' | '7d' | undefined,
      sortBy: req.query.sortBy as 'volume' | 'price_change' | 'market_cap' | 'liquidity' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      cursor: req.query.cursor as string | undefined,
    };

    const result = await aggregationService.getTokens(filter);
    res.json(result);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
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
    const token = await aggregationService.getTokenByAddress(address);

    if (!token) {
      res.status(404).json({
        error: 'Token not found',
        address,
      });
      return;
    }

    res.json(token);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      error: 'Failed to fetch token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/search
 * Search for tokens
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      res.status(400).json({
        error: 'Missing query parameter',
        message: 'Please provide a search query using the "q" parameter',
      });
      return;
    }

    const tokens = await aggregationService.searchTokens(query);
    res.json({ data: tokens });
  } catch (error) {
    console.error('Error searching tokens:', error);
    res.status(500).json({
      error: 'Failed to search tokens',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;

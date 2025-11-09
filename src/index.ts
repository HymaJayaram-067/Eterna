import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config';
import logger from './utils/logger';
import routes from './api/routes';
import { cacheService } from './services/cacheService';
import { wsService } from './websocket/websocketService';
import { tokenAggregator } from './services/tokenAggregator';
import cron from 'node-cron';

class App {
  private app: Application;
  private server: http.Server | null = null;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Eterna Data Aggregator',
        version: '1.0.0',
        endpoints: {
          tokens: '/api/tokens',
          tokenByAddress: '/api/tokens/:address',
          refresh: '/api/refresh',
          health: '/api/health',
        },
        websocket: {
          url: `ws://localhost:${config.server.port}`,
          events: ['initial_data', 'update', 'error'],
        },
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not found',
        timestamp: Date.now(),
      });
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', err);
      res.status(500).json({
        success: false,
        error: err.message,
        timestamp: Date.now(),
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Connect to Redis
      await cacheService.connect();

      // Create HTTP server
      this.server = http.createServer(this.app);

      // Initialize WebSocket
      wsService.initialize(this.server);

      // Start periodic updates
      wsService.startPeriodicUpdates(config.dataRefresh.interval);

      // Initial data fetch
      logger.info('Fetching initial token data...');
      await tokenAggregator.aggregateTokens(false);

      // Setup cron job for periodic refresh (every 30 seconds)
      cron.schedule('*/30 * * * * *', async () => {
        logger.debug('Cron: Refreshing token data');
        await tokenAggregator.refreshCache();
      });

      // Start server
      this.server.listen(config.server.port, () => {
        logger.info(`Server running on port ${config.server.port}`);
        logger.info(`Environment: ${config.server.nodeEnv}`);
        logger.info(`WebSocket ready for connections`);
      });
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    logger.info('Shutting down server...');

    // Stop WebSocket updates
    wsService.stopPeriodicUpdates();
    wsService.close();

    // Disconnect from Redis
    await cacheService.disconnect();

    // Close HTTP server
    if (this.server) {
      this.server.close(() => {
        logger.info('Server stopped');
      });
    }
  }
}

// Initialize and start the app
const app = new App();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  await app.stop();
  process.exit(0);
});

// Start the application
app.start();

export default app;

import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { cacheService } from './services/cache.service';
import { webSocketService } from './services/websocket.service';
import apiRoutes from './api/routes';

class App {
  private app: Application;
  private httpServer: HttpServer;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.port = config.port;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(cors());

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    this.app.use(express.static('public'));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimiting.windowMs,
      max: config.rateLimiting.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Eterna - Real-time Data Aggregation Service',
        version: '1.0.0',
        endpoints: {
          tokens: '/api/tokens',
          health: '/api/health',
          websocket: 'Connect via Socket.IO',
        },
        documentation: 'See README.md for full API documentation',
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
      });
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Connect to Redis
      console.log('Connecting to Redis...');
      await cacheService.connect();

      // Initialize WebSocket
      console.log('Initializing WebSocket service...');
      webSocketService.initialize(this.httpServer);

      // Start HTTP server
      this.httpServer.listen(this.port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Eterna Server Started Successfully                   ║
║                                                           ║
║   HTTP Server: http://localhost:${this.port}                     ║
║   WebSocket:   ws://localhost:${this.port}                       ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   Cache TTL:   ${config.cache.ttl}s                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    console.log('Shutting down server...');
    webSocketService.stop();
    await cacheService.disconnect();
    this.httpServer.close();
    console.log('Server stopped');
  }
}

// Create and start the application
const app = new App();

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await app.stop();
  process.exit(0);
});

// Start the server
app.start();

export default app;

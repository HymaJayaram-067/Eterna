import express, { Application } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { cacheService } from './services/cache.service';
import { WebSocketService } from './websocket';
import apiRoutes from './routes/api.routes';

class App {
  private app: Application;
  private server: HTTPServer;
  private wsService: WebSocketService | null = null;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(cors());

    // JSON body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan('combined'));
    }
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'Eterna - Real-time Data Aggregation Service',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          tokens: '/api/tokens',
          tokenByAddress: '/api/tokens/:address',
          search: '/api/search?q=query',
        },
        websocket: {
          enabled: true,
          updateInterval: config.websocket.updateInterval,
        },
      });
    });

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found',
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Connect to Redis
      await cacheService.connect();

      // Initialize WebSocket
      this.wsService = new WebSocketService(this.server);
      this.wsService.startUpdates();

      // Start server
      this.server.listen(config.port, () => {
        console.log(`
🚀 Server is running!
📡 HTTP Server: http://localhost:${config.port}
🔌 WebSocket: ws://localhost:${config.port}
🌍 Environment: ${config.nodeEnv}
💾 Redis Cache: ${cacheService.isAvailable() ? 'Connected' : 'Not available (using in-memory cache)'}
        `);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    if (this.wsService) {
      this.wsService.close();
    }
    await cacheService.disconnect();
    this.server.close();
  }

  getApp(): Application {
    return this.app;
  }

  getServer(): HTTPServer {
    return this.server;
  }
}

export default App;

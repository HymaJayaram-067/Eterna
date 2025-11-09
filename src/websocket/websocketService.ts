import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Token, WebSocketMessage } from '../types';
import logger from '../utils/logger';
import { tokenAggregator } from '../services/tokenAggregator';

export class WebSocketService {
  private io: Server | null = null;
  private previousTokenPrices: Map<string, number> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  initialize(server: HttpServer): void {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      socket.on('subscribe', (data) => {
        logger.debug(`Client ${socket.id} subscribed to ${data.channel || 'default'}`);
        socket.join(data.channel || 'default');
      });

      socket.on('unsubscribe', (data) => {
        logger.debug(`Client ${socket.id} unsubscribed from ${data.channel || 'default'}`);
        socket.leave(data.channel || 'default');
      });

      // Send initial data
      this.sendInitialData(socket);
    });

    logger.info('WebSocket service initialized');
  }

  private async sendInitialData(socket: Socket): Promise<void> {
    try {
      const tokens = await tokenAggregator.aggregateTokens(true);
      const message: WebSocketMessage = {
        type: 'new_token',
        data: tokens.slice(0, 30), // Send first 30 tokens
        timestamp: Date.now(),
      };
      socket.emit('initial_data', message);
    } catch (error) {
      logger.error('Error sending initial data', error);
      const errorMessage: WebSocketMessage = {
        type: 'error',
        data: { message: 'Failed to fetch initial data' },
        timestamp: Date.now(),
      };
      socket.emit('error', errorMessage);
    }
  }

  startPeriodicUpdates(intervalSeconds: number = 30): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      await this.checkAndBroadcastUpdates();
    }, intervalSeconds * 1000);

    logger.info(`Periodic updates started (every ${intervalSeconds}s)`);
  }

  stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Periodic updates stopped');
    }
  }

  private async checkAndBroadcastUpdates(): Promise<void> {
    try {
      await tokenAggregator.refreshCache();
      const tokens = await tokenAggregator.aggregateTokens(true);

      const priceUpdates: Token[] = [];
      const volumeSpikes: Token[] = [];

      for (const token of tokens) {
        const previousPrice = this.previousTokenPrices.get(token.token_address);
        
        if (previousPrice !== undefined) {
          const priceChange = Math.abs((token.price_sol - previousPrice) / previousPrice) * 100;
          
          // Detect significant price changes (> 5%)
          if (priceChange > 5) {
            priceUpdates.push(token);
          }

          // Detect volume spikes (simple heuristic)
          if (token.volume_sol > 1000 && token.price_1hr_change > 50) {
            volumeSpikes.push(token);
          }
        }

        this.previousTokenPrices.set(token.token_address, token.price_sol);
      }

      // Broadcast price updates
      if (priceUpdates.length > 0) {
        this.broadcast({
          type: 'price_update',
          data: priceUpdates,
          timestamp: Date.now(),
        });
        logger.info(`Broadcasted ${priceUpdates.length} price updates`);
      }

      // Broadcast volume spikes
      if (volumeSpikes.length > 0) {
        this.broadcast({
          type: 'volume_spike',
          data: volumeSpikes,
          timestamp: Date.now(),
        });
        logger.info(`Broadcasted ${volumeSpikes.length} volume spikes`);
      }
    } catch (error) {
      logger.error('Error checking for updates', error);
    }
  }

  broadcast(message: WebSocketMessage, channel: string = 'default'): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(channel).emit('update', message);
  }

  broadcastToAll(message: WebSocketMessage): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.emit('update', message);
  }

  getConnectedClientsCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  close(): void {
    this.stopPeriodicUpdates();
    if (this.io) {
      this.io.close();
      this.io = null;
      logger.info('WebSocket service closed');
    }
  }
}

export const wsService = new WebSocketService();

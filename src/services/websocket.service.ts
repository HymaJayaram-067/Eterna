import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config';
import { tokenAggregationService } from './tokenAggregation.service';
import { TokenData } from '../types';
import * as cron from 'node-cron';

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private updateTask: cron.ScheduledTask | null = null;
  private previousTokenData: Map<string, TokenData> = new Map();

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: config.websocket.cors,
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe', async (data) => {
        console.log(`Client ${socket.id} subscribed with filters:`, data);
        // Send initial data
        await this.sendInitialData(socket.id);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Start periodic updates
    this.startPeriodicUpdates();

    console.log('WebSocket service initialized');
  }

  private async sendInitialData(socketId: string): Promise<void> {
    try {
      const tokens = await tokenAggregationService.fetchAndAggregateTokens();
      this.io?.to(socketId).emit('initial_data', {
        tokens,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private startPeriodicUpdates(): void {
    // Update every 5 seconds
    this.updateTask = cron.schedule('*/5 * * * * *', async () => {
      await this.checkAndBroadcastUpdates();
    });
  }

  private async checkAndBroadcastUpdates(): Promise<void> {
    try {
      // Invalidate cache to force fresh data
      await tokenAggregationService.invalidateCache();
      const currentTokens = await tokenAggregationService.fetchAndAggregateTokens();

      const updates: Array<{
        token: TokenData;
        priceChange: number;
        volumeChange: number;
        type: 'price_update' | 'volume_spike';
      }> = [];

      currentTokens.forEach((token) => {
        const previous = this.previousTokenData.get(token.token_address);

        if (previous) {
          const priceChange =
            ((token.price_sol - previous.price_sol) / previous.price_sol) * 100;
          const volumeChange =
            ((token.volume_sol - previous.volume_sol) / previous.volume_sol) * 100;

          // Price changed significantly (>1%)
          if (Math.abs(priceChange) > 1) {
            updates.push({
              token,
              priceChange,
              volumeChange,
              type: 'price_update',
            });
          }

          // Volume spike (>20% increase)
          if (volumeChange > 20) {
            updates.push({
              token,
              priceChange,
              volumeChange,
              type: 'volume_spike',
            });
          }
        }

        // Update cache
        this.previousTokenData.set(token.token_address, token);
      });

      // Broadcast updates
      if (updates.length > 0 && this.io) {
        console.log(`Broadcasting ${updates.length} updates`);
        this.io.emit('token_updates', {
          updates,
          timestamp: Date.now(),
        });
      }

      // Also broadcast full refresh periodically
      if (this.io) {
        this.io.emit('token_refresh', {
          tokens: currentTokens,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error in periodic update:', error);
    }
  }

  stop(): void {
    if (this.updateTask) {
      this.updateTask.stop();
    }
    if (this.io) {
      this.io.close();
    }
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const webSocketService = new WebSocketService();

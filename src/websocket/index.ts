import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { aggregationService } from '../services/aggregation.service';
import { config } from '../config';
import { WebSocketMessage, TokenData } from '../types';

export class WebSocketService {
  private io: SocketIOServer;
  private updateInterval: NodeJS.Timeout | null = null;
  private previousTokens: Map<string, TokenData> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial data
      this.sendInitialData(socket);

      // Handle custom events
      socket.on('subscribe', (data) => {
        console.log('Client subscribed to:', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async sendInitialData(socket: { emit: (event: string, data: WebSocketMessage) => void }): Promise<void> {
    try {
      const result = await aggregationService.getTokens({ limit: 30 });
      
      const message: WebSocketMessage = {
        type: 'initial_data',
        data: result.data,
        timestamp: Date.now(),
      };

      socket.emit('initial_data', message);
    } catch (error) {
      console.error('Error sending initial data:', error);
      
      const errorMessage: WebSocketMessage = {
        type: 'error',
        error: 'Failed to fetch initial data',
        timestamp: Date.now(),
      };
      
      socket.emit('error', errorMessage);
    }
  }

  startUpdates(): void {
    if (this.updateInterval) {
      return;
    }

    console.log('Starting WebSocket updates...');
    
    this.updateInterval = setInterval(async () => {
      await this.broadcastUpdates();
    }, config.websocket.updateInterval);
  }

  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('WebSocket updates stopped');
    }
  }

  private async broadcastUpdates(): Promise<void> {
    try {
      const result = await aggregationService.getTokens({ limit: 30 });
      const tokens = result.data;

      // Check for price changes
      for (const token of tokens) {
        const previous = this.previousTokens.get(token.token_address);

        if (previous) {
          const priceChange = ((token.price_sol - previous.price_sol) / previous.price_sol) * 100;
          const volumeChange = ((token.volume_sol - previous.volume_sol) / previous.volume_sol) * 100;

          // Price update notification (>1% change)
          if (Math.abs(priceChange) > 1) {
            const message: WebSocketMessage = {
              type: 'price_update',
              data: token,
              timestamp: Date.now(),
            };
            this.io.emit('price_update', message);
          }

          // Volume spike notification (>50% increase)
          if (volumeChange > 50) {
            const message: WebSocketMessage = {
              type: 'volume_spike',
              data: token,
              timestamp: Date.now(),
            };
            this.io.emit('volume_spike', message);
          }
        }

        // Update previous state
        this.previousTokens.set(token.token_address, token);
      }
    } catch (error) {
      console.error('Error broadcasting updates:', error);
    }
  }

  getConnectedClients(): number {
    return this.io.engine.clientsCount;
  }

  close(): void {
    this.stopUpdates();
    this.io.close();
  }
}

import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';

export class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): void {
    if (this.socket) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connect', null);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('disconnect', null);
    });

    this.socket.on('initial_data', (message: WebSocketMessage) => {
      console.log('Received initial data', message);
      this.emit('initial_data', message);
    });

    this.socket.on('update', (message: WebSocketMessage) => {
      console.log('Received update', message);
      this.emit('update', message);
    });

    this.socket.on('error', (message: WebSocketMessage) => {
      console.error('WebSocket error', message);
      this.emit('error', message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Manually disconnected');
    }
  }

  subscribe(channel: string): void {
    if (!this.socket) {
      console.error('Not connected');
      return;
    }
    this.socket.emit('subscribe', { channel });
    console.log(`Subscribed to channel: ${channel}`);
  }

  unsubscribe(channel: string): void {
    if (!this.socket) {
      console.error('Not connected');
      return;
    }
    this.socket.emit('unsubscribe', { channel });
    console.log(`Unsubscribed from channel: ${channel}`);
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();

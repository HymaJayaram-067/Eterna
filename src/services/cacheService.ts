import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import logger from '../utils/logger';
import { Token } from '../types';

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private readonly ttl: number;

  constructor(ttl?: number) {
    this.ttl = ttl || config.redis.ttl;
  }

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      // Continue without Redis (fallback to in-memory)
      this.client = null;
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, customTtl?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const ttl = customTtl || this.ttl;
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}`, error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Cache keys error for pattern ${pattern}`, error);
      return [];
    }
  }

  async flush(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.flushAll();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error', error);
    }
  }

  async getTokens(cacheKey: string): Promise<Token[] | null> {
    return this.get<Token[]>(cacheKey);
  }

  async setTokens(cacheKey: string, tokens: Token[], customTtl?: number): Promise<void> {
    await this.set(cacheKey, tokens, customTtl);
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const cacheService = new CacheService();

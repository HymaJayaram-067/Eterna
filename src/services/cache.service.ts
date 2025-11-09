import Redis from 'ioredis';
import { config } from '../config';

class CacheService {
  private client: Redis | null = null;
  private isRedisAvailable = false;

  async connect(): Promise<void> {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis connection failed after 3 retries, continuing without cache');
            this.isRedisAvailable = false;
            return null;
          }
          return Math.min(times * 50, 2000);
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.isRedisAvailable = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isRedisAvailable = true;
      });

      await this.client.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      console.warn('Redis not available, running without cache:', error);
      this.isRedisAvailable = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isRedisAvailable || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const cacheTtl = ttl || config.cache.ttl;
      await this.client.setex(key, cacheTtl, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isRedisAvailable || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.isRedisAvailable || !this.client) {
      return;
    }

    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isRedisAvailable = false;
    }
  }

  isAvailable(): boolean {
    return this.isRedisAvailable;
  }
}

export const cacheService = new CacheService();

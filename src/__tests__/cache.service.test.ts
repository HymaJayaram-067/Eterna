import { CacheService } from '../services/cache.service';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const data = new Map<string, { value: string; expiry: number }>();

    return {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockImplementation((key: string) => {
        const item = data.get(key);
        if (!item) return Promise.resolve(null);
        if (Date.now() > item.expiry) {
          data.delete(key);
          return Promise.resolve(null);
        }
        return Promise.resolve(item.value);
      }),
      setex: jest.fn().mockImplementation((key: string, ttl: number, value: string) => {
        data.set(key, { value, expiry: Date.now() + ttl * 1000 });
        return Promise.resolve('OK');
      }),
      del: jest.fn().mockImplementation((key: string) => {
        data.delete(key);
        return Promise.resolve(1);
      }),
      exists: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(data.has(key) ? 1 : 0);
      }),
      keys: jest.fn().mockImplementation((pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Promise.resolve(Array.from(data.keys()).filter((k) => regex.test(k)));
      }),
      flushall: jest.fn().mockImplementation(() => {
        data.clear();
        return Promise.resolve('OK');
      }),
      on: jest.fn(),
      status: 'ready',
    };
  });
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(async () => {
    cacheService = new CacheService();
    await cacheService.connect();
  });

  afterEach(async () => {
    await cacheService.flushAll();
    await cacheService.disconnect();
  });

  describe('set and get', () => {
    it('should store and retrieve data', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await cacheService.set(key, value);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const key = 'complex-key';
      const value = {
        nested: {
          array: [1, 2, 3],
          string: 'test',
          number: 42,
        },
      };

      await cacheService.set(key, value);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toEqual(value);
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'delete-key';
      await cacheService.set(key, 'value');

      expect(await cacheService.exists(key)).toBe(true);

      await cacheService.del(key);

      expect(await cacheService.exists(key)).toBe(false);
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      const key = 'exists-key';

      expect(await cacheService.exists(key)).toBe(false);

      await cacheService.set(key, 'value');

      expect(await cacheService.exists(key)).toBe(true);
    });
  });

  describe('keys', () => {
    it('should find keys by pattern', async () => {
      await cacheService.set('token:1', 'value1');
      await cacheService.set('token:2', 'value2');
      await cacheService.set('other:1', 'value3');

      const keys = await cacheService.keys('token:*');

      expect(keys).toHaveLength(2);
      expect(keys).toContain('token:1');
      expect(keys).toContain('token:2');
    });
  });

  describe('flushAll', () => {
    it('should clear all keys', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await cacheService.flushAll();

      expect(await cacheService.exists('key1')).toBe(false);
      expect(await cacheService.exists('key2')).toBe(false);
    });
  });
});

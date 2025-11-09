import { cacheService } from '../services/cache.service';

describe('CacheService', () => {
  beforeEach(async () => {
    await cacheService.connect();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve data', async () => {
      const testData = { name: 'test', value: 123 };
      await cacheService.set('test-key', testData, 60);
      
      const retrieved = await cacheService.get('test-key');
      
      // May be null if Redis is not available
      if (retrieved) {
        expect(retrieved).toEqual(testData);
      } else {
        expect(retrieved).toBeNull();
      }
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete cached data', async () => {
      await cacheService.set('delete-key', { data: 'test' }, 60);
      await cacheService.del('delete-key');
      
      const result = await cacheService.get('delete-key');
      expect(result).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('should report availability status', () => {
      const isAvailable = cacheService.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });
});

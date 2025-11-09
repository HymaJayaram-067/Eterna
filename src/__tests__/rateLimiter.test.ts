import { RateLimiter, withRetry } from '../utils/rateLimiter';

describe('RateLimiter', () => {
  jest.setTimeout(10000);

  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter(3, 1000);
    const start = Date.now();

    await limiter.acquirePermission();
    await limiter.acquirePermission();
    await limiter.acquirePermission();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100); // Should be instant
  });

  it('should delay requests exceeding rate limit', async () => {
    const limiter = new RateLimiter(2, 1000);
    const start = Date.now();

    await limiter.acquirePermission();
    await limiter.acquirePermission();
    await limiter.acquirePermission(); // This should wait

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(900); // Should wait ~1000ms
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelay: 10,
      backoffFactor: 1,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    const error = new Error('persistent failure');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, {
        maxRetries: 2,
        initialDelay: 10,
        backoffFactor: 1,
      })
    ).rejects.toThrow('persistent failure');

    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

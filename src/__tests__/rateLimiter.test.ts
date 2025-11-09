import { RateLimiter, ExponentialBackoff } from '../utils/rateLimiter';

describe('RateLimiter', () => {
  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter(5, 1);
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      await limiter.waitForSlot();
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete quickly
  });

  it.skip('should delay requests exceeding rate limit', async () => {
    const limiter = new RateLimiter(2, 1);
    const startTime = Date.now();

    // First 2 should be fast
    await limiter.waitForSlot();
    await limiter.waitForSlot();

    const firstTwo = Date.now() - startTime;
    expect(firstTwo).toBeLessThan(500);

    // Third request should wait
    await limiter.waitForSlot();
    const total = Date.now() - startTime;
    expect(total).toBeGreaterThan(900); // Should wait ~1 second
  }, 15000);

  it('should reset when reset() is called', async () => {
    const limiter = new RateLimiter(2, 1);

    await limiter.waitForSlot();
    await limiter.waitForSlot();

    limiter.reset();

    const startTime = Date.now();
    await limiter.waitForSlot();
    await limiter.waitForSlot();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500);
  });
});

describe('ExponentialBackoff', () => {
  it('should execute successfully without retry', async () => {
    const backoff = new ExponentialBackoff(3, 100);
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await backoff.execute(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const backoff = new ExponentialBackoff(3, 100);
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const result = await backoff.execute(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const backoff = new ExponentialBackoff(2, 50);
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fail'));

    await expect(backoff.execute(mockFn)).rejects.toThrow('Always fail');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should reset attempt counter after reset', async () => {
    const backoff = new ExponentialBackoff(2, 100);
    const mockFn = jest.fn().mockRejectedValue(new Error('Fail'));

    await expect(backoff.execute(mockFn)).rejects.toThrow();
    
    backoff.reset();
    const successFn = jest.fn().mockResolvedValue('success');
    const result = await backoff.execute(successFn);

    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });
});

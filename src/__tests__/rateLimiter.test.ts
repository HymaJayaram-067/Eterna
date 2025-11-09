import { RateLimiter, withRetry } from '../utils/rateLimiter';

describe('RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter(5, 1000);
    const start = Date.now();

    for (let i = 0; i < 5; i++) {
      await limiter.waitForSlot();
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('should throttle requests exceeding limit', async () => {
    const limiter = new RateLimiter(2, 1000);
    
    await limiter.waitForSlot();
    await limiter.waitForSlot();

    const start = Date.now();
    await limiter.waitForSlot();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(900);
  });
});

describe('withRetry', () => {
  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    const fn = jest.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    });

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn(async () => {
      throw new Error('Persistent failure');
    });

    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 }))
      .rejects.toThrow('Persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should not retry on client errors', async () => {
    const error = new Error('Client error') as Error & { 
      response?: { status: number }; 
      isAxiosError?: boolean;
    };
    error.response = { status: 400 };
    error.isAxiosError = true;

    const fn = jest.fn(async () => {
      throw error;
    });

    await expect(withRetry(fn, { maxRetries: 3 }))
      .rejects.toThrow('Client error');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

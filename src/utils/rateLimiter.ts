import logger from './logger';

export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, perMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = perMinutes * 60 * 1000;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
        return this.waitForSlot();
      }
    }

    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.requests = [];
  }
}

export class ExponentialBackoff {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(maxAttempts = 5, baseDelay = 1000, maxDelay = 30000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.attempt = 0; // Reset on success
      return result;
    } catch (error) {
      this.attempt++;
      
      if (this.attempt >= this.maxAttempts) {
        logger.error(`Max retry attempts (${this.maxAttempts}) reached`);
        throw error;
      }

      const delay = Math.min(
        this.baseDelay * Math.pow(2, this.attempt - 1),
        this.maxDelay
      );
      
      logger.warn(`Retry attempt ${this.attempt}/${this.maxAttempts} after ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      await this.sleep(delay);
      return this.execute(fn);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.attempt = 0;
  }
}

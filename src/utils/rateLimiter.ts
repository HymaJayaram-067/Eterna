import axios, { AxiosError, AxiosRequestConfig } from 'axios';

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquirePermission(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp);
      await this.sleep(waitTime);
      return this.acquirePermission();
    }

    this.requestTimestamps.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
  } = config;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Check if it's a rate limit error (429)
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          // Use Retry-After header if available
          const retryAfter = axiosError.response.headers['retry-after'];
          if (retryAfter) {
            delay = parseInt(retryAfter, 10) * 1000;
          }
        } else if (axiosError.response?.status && axiosError.response.status < 500) {
          // Don't retry 4xx errors (except 429)
          throw error;
        }
      }

      const actualDelay = Math.min(delay, maxDelay);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${actualDelay}ms`);
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}

export async function makeRequest<T>(
  config: AxiosRequestConfig,
  rateLimiter?: RateLimiter
): Promise<T> {
  if (rateLimiter) {
    await rateLimiter.acquirePermission();
  }

  return withRetry(async () => {
    const response = await axios(config);
    return response.data;
  });
}

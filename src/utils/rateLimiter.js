/**
 * Token-bucket rate limiter.
 * Shared by all external API services to stay within provider rate limits.
 *
 * Usage:
 *   const limiter = new TokenBucket(10, 20); // 10 req/s, burst cap 20
 *   await limiter.acquire();                 // waits if bucket is empty
 */
class TokenBucket {
  constructor(ratePerSecond, capacity) {
    this.ratePerMs  = ratePerSecond / 1000;
    this.capacity   = capacity;
    this.tokens     = capacity;
    this.lastRefill = Date.now();
  }

  async acquire() {
    const now     = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens     = Math.min(this.capacity, this.tokens + elapsed * this.ratePerMs);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitMs = Math.ceil((1 - this.tokens) / this.ratePerMs);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.tokens = 0;
  }
}

module.exports = { TokenBucket };

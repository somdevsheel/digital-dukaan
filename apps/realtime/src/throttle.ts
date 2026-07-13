/**
 * Fixed-window per-key rate limiter — enforces "location pings throttled, max 1 per 5s per
 * rider" (Architecture §14) server-side, independent of whatever the client does. A buggy
 * or malicious client cannot bypass this by simply not self-throttling, which is the whole
 * point of doing it here rather than trusting the delivery app.
 *
 * Keyed by the (client-declared) partnerId rather than socket.id — see rooms.ts's
 * authorizeJoin doc comment for why partnerId can't be cryptographically verified against
 * a DB here. Throttling by the claimed identity still delivers the product requirement
 * ("max 1/5s per rider"); a single authenticated user opening many sockets to claim many
 * fake partnerIds could evade it, but that's bounded by needing a valid JWT per socket and
 * isn't a cost/precision concern this throttle exists to solve.
 */
export class KeyedThrottle {
  private readonly lastAllowedAt = new Map<string, number>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(private readonly windowMs: number) {
    // Bound memory growth from partners who ping once and never reconnect — sweep stale
    // entries periodically rather than never evicting.
    const sweepIntervalMs = Math.max(windowMs * 20, 60_000);
    this.sweepTimer = setInterval(() => this.sweep(), sweepIntervalMs).unref();
  }

  /** Returns true if `key` may proceed now; false if it's still within the throttle window. */
  allow(key: string): boolean {
    const now = Date.now();
    const last = this.lastAllowedAt.get(key);
    if (last !== undefined && now - last < this.windowMs) {
      return false;
    }
    this.lastAllowedAt.set(key, now);
    return true;
  }

  private sweep(): void {
    const cutoff = Date.now() - this.windowMs * 10;
    for (const [key, ts] of this.lastAllowedAt) {
      if (ts < cutoff) this.lastAllowedAt.delete(key);
    }
  }

  dispose(): void {
    clearInterval(this.sweepTimer);
  }
}

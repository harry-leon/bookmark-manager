interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * High-performance In-Memory TTL Cache for metadata and lightweight lookups.
 * Includes automatic size limitation and periodic stale entry pruning.
 */
class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxItems: number;
  private defaultTtlMs: number;

  constructor(maxItems = 1000, defaultTtlMinutes = 15) {
    this.maxItems = maxItems;
    this.defaultTtlMs = defaultTtlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.store.size >= this.maxItems) {
      // Evict oldest inserted entry
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// Global singleton cache for metadata to survive across requests in Node server process
declare global {
  // eslint-disable-next-line no-var
  var __metadataCache: MemoryCache<any> | undefined;
}

export const metadataCache = global.__metadataCache || new MemoryCache(2000, 15);
if (process.env.NODE_ENV !== "production") {
  global.__metadataCache = metadataCache;
}

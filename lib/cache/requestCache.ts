interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresIn: number;
  }
  
  class RequestCache {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private cache = new Map<string, CacheEntry<any>>();
  
    set<T>(key: string, data: T, expiresInMs: number = 5 * 60 * 1000) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresIn: expiresInMs
      });
    }
  
    get<T>(key: string): T | null {
      const entry = this.cache.get(key);
      
      if (!entry) return null;
  
      const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
      
      if (isExpired) {
        this.cache.delete(key);
        return null;
      }
  
      return entry.data as T;
    }
  
    has(key: string): boolean {
      return this.get(key) !== null;
    }
  
    clear(key?: string) {
      if (key) {
        this.cache.delete(key);
      } else {
        this.cache.clear();
      }
    }
  
    clearExpired() {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.expiresIn) {
          this.cache.delete(key);
        }
      }
    }
  }
  
  export const requestCache = new RequestCache();
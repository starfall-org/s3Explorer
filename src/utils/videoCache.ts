interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

class MediaCacheManager {
  private cacheName = 's3explorer-video-cache';
  private maxCacheSize = 500 * 1024 * 1024; // 500MB limit
  private maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    if (typeof window !== 'undefined') {
      this.initCache();
    }
  }

  private async initCache() {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        // Clean old entries on init
        await this.cleanOldCache();
      } catch (error) {
        console.warn('Failed to initialize video cache:', error);
      }
    }
  }

  private async cleanOldCache() {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();
      const now = Date.now();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const timestamp = response.headers.get('x-cache-timestamp');
          if (timestamp && (now - parseInt(timestamp)) > this.maxCacheAge) {
            await cache.delete(request);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean old cache:', error);
    }
  }

  async isVideoCached(url: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('caches' in window)) return false;

    try {
      const cache = await caches.open(this.cacheName);
      const cached = await cache.match(url);
      return cached !== undefined;
    } catch (error) {
      console.warn('Failed to check cache:', error);
      return false;
    }
  }

  async getCachedVideo(url: string): Promise<string | null> {
    if (typeof window === 'undefined' || !('caches' in window)) return null;

    try {
      const cache = await caches.open(this.cacheName);
      const cached = await cache.match(url);
      
      if (cached) {
        const blob = await cached.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cached video:', error);
      return null;
    }
  }

  async cacheVideo(url: string, blob: Blob): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
      // Check cache size before adding
      await this.ensureCacheSize(blob.size);

      const cache = await caches.open(this.cacheName);
      const response = new Response(blob, {
        headers: {
          'Content-Type': blob.type,
          'x-cache-timestamp': Date.now().toString(),
          'x-cache-size': blob.size.toString()
        }
      });

      await cache.put(url, response);
      console.log(`Video cached: ${url}`);
    } catch (error) {
      console.warn('Failed to cache video:', error);
    }
  }

  private async ensureCacheSize(newVideoSize: number) {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();
      let totalSize = 0;
      const entries: Array<{ key: Request; size: number; timestamp: number }> = [];

      // Calculate total size and collect entries
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const size = parseInt(response.headers.get('x-cache-size') || '0');
          const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
          totalSize += size;
          entries.push({ key, size, timestamp });
        }
      }

      // If adding new video would exceed limit, remove oldest entries
      if (totalSize + newVideoSize > this.maxCacheSize) {
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        let removedSize = 0;
        for (const entry of entries) {
          if (totalSize + newVideoSize - removedSize <= this.maxCacheSize) {
            break;
          }
          await cache.delete(entry.key);
          removedSize += entry.size;
          console.log(`Removed old cache entry: ${entry.key.url}`);
        }
      }
    } catch (error) {
      console.warn('Failed to ensure cache size:', error);
    }
  }

  async getCacheStats(): Promise<{ count: number; size: string }> {
    if (typeof window === 'undefined' || !('caches' in window)) return { count: 0, size: '0 MB' };

    try {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();
      let totalSize = 0;

      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const size = parseInt(response.headers.get('x-cache-size') || '0');
          totalSize += size;
        }
      }

      return {
        count: keys.length,
        size: this.formatBytes(totalSize)
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { count: 0, size: '0 MB' };
    }
  }

  async clearCache(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
      await caches.delete(this.cacheName);
      console.log('Video cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const mediaCache = new MediaCacheManager();
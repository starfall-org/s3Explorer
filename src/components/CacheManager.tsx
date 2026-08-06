import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Database, RefreshCw } from 'lucide-react';
import { mediaCache } from '@/utils/videoCache';

const CacheManager = () => {
  const [cacheStats, setCacheStats] = useState({ count: 0, size: '0 MB' });
  const [isLoading, setIsLoading] = useState(false);

  const loadCacheStats = async () => {
    try {
      const stats = await mediaCache.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const clearCache = async () => {
    if (window.confirm('Are you sure you want to clear the media cache? This will remove all cached videos and audio from your browser storage.')) {
      setIsLoading(true);
      try {
        await mediaCache.clearCache();
        await loadCacheStats();
        alert('Cache cleared successfully!');
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Failed to clear cache. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadCacheStats();

    // Listen for storage events to update stats
    const handleStorageChange = () => {
      loadCacheStats();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Media Cache</p>
            <p className="text-xs text-muted-foreground">
              Videos and audio cached for faster playback &amp; offline viewing
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={loadCacheStats}
          aria-label="Refresh cache stats"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Cached Files</p>
          <p className="mt-1 text-2xl font-semibold">
            {cacheStats.count}
            <span className="ml-2 text-sm font-normal text-muted-foreground">files</span>
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Storage Used</p>
          <p className="mt-1 text-2xl font-semibold">{cacheStats.size}</p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={clearCache}
        disabled={isLoading || cacheStats.count === 0}
        className="w-full"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {isLoading ? 'Clearing...' : 'Clear Cache'}
      </Button>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Media is automatically cached when played</p>
        <p>• Cache is limited to 500MB and 7 days</p>
        <p>• Old files are removed automatically</p>
      </div>
    </div>
  );
};

export default CacheManager;
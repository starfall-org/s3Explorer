import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Database, Download, X } from 'lucide-react';
import { mediaCache } from '@/utils/videoCache';

const CacheManager = () => {
  const [cacheStats, setCacheStats] = useState({ count: 0, size: '0 MB' });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Media Cache"
        aria-label="Mở Media Cache"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Database className="h-6 w-6" />
        {cacheStats.count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {cacheStats.count}
          </span>
        )}
      </button>
    );
  }

  return (
    <Card className="w-80 max-w-[calc(100vw-2rem)] shadow-2xl border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              Media Cache
            </CardTitle>
            <CardDescription>
              Videos and audio are cached for faster playback and offline viewing
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Cached Files</span>
              <Badge variant="secondary">{cacheStats.count}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Storage Used</span>
              <Badge variant="outline">{cacheStats.size}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600">Active</span>
          </div>
        </div>
        
        <div className="pt-2 border-t">
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
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>• Videos and audio are automatically cached when played</p>
          <p>• Cache is limited to 500MB and 7 days</p>
          <p>• Old files are removed automatically</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheManager;
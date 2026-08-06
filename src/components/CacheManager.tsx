import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Database, Download } from 'lucide-react';
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
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="w-5 h-5" />
          Media Cache
        </CardTitle>
        <CardDescription>
          Videos and audio are cached for faster playback and offline viewing
        </CardDescription>
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
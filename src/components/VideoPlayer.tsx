import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  X,
  ChevronDown,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Share2,
  Download,
  Download as CacheIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediaCache } from '@/utils/videoCache';

interface VideoPlayerProps {
  url: string;
  onClose: () => void;
  fileName?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onMinimizeChange?: (minimized: boolean) => void;
  onPlayingChange?: (playing: boolean) => void;
}

const VideoPlayer = ({ url, onClose, fileName = 'Video', autoPlay = false, onEnded, onNext, onPrevious, onMinimizeChange, onPlayingChange }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef(autoPlay);
  const onEndedRef = useRef(onEnded);
  const onPlayingChangeRef = useRef(onPlayingChange);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onPlayingChangeRef.current = onPlayingChange;
  }, [onPlayingChange]);

  // Notify parent when minimized state changes (so the page can avoid overlap)
  useEffect(() => {
    onMinimizeChange?.(isMinimized);
  }, [isMinimized, onMinimizeChange]);

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check cache and load video
  useEffect(() => {
    const loadVideo = async () => {
      setIsLoading(true);
      try {
        const cached = await mediaCache.getCachedVideo(url);
        if (cached) {
          setVideoUrl(cached);
          setIsCached(true);
          console.log('Video loaded from cache:', fileName);
        } else {
          setVideoUrl(url);
          setIsCached(false);
          console.log('Video loaded from network:', fileName);
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setVideoUrl(url);
        setIsCached(false);
      }
    };

    loadVideo();
  }, [url, fileName]);

  // Cache video when it starts playing and not already cached
  useEffect(() => {
    const cacheVideoIfNeeded = async () => {
      if (isPlaying && !isCached && !isCaching && videoRef.current) {
        try {
          setIsCaching(true);
          const response = await fetch(url, { credentials: 'include' });
          if (!response.ok) {
            throw new Error(`Media request failed: ${response.status}`);
          }
          const blob = await response.blob();
          if (!blob.size) {
            throw new Error('Media response was empty');
          }
          await mediaCache.cacheVideo(url, blob);
          setIsCached(true);
          console.log('Video cached successfully:', fileName);
        } catch (error) {
          console.error('Error caching video:', error);
        } finally {
          setIsCaching(false);
        }
      }
    };

    if (isPlaying && !isCached) {
      cacheVideoIfNeeded();
    }
  }, [isPlaying, isCached, isCaching, url, fileName]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration);
      if (autoPlayRef.current) {
        video.play().catch(() => {});
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayingChangeRef.current?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayingChangeRef.current?.(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;

    const resetTimer = () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      
      if (isPlaying) {
        controlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    resetTimer();
    
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  const handleShareLink = () => {
    try {
      navigator.clipboard.writeText(url);
      alert('Video link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50 overflow-hidden transition-all duration-300",
        isMinimized
          ? "bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,640px)] rounded-xl border border-border bg-card/85 backdrop-blur-xl shadow-2xl ring-1 ring-white/10"
          : "inset-0 bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center"
      )}
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimerRef.current) {
          clearTimeout(controlsTimerRef.current);
        }
        if (isPlaying) {
          controlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative transition-all duration-300",
          isMinimized
            ? "flex items-center gap-3 p-2.5"
            : "w-full max-w-[min(90vw,1280px)] max-h-[90vh] aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black"
        )}
      >
        {/* Video element - always mounted so playback continues across minimize/expand */}
        <video
          ref={videoRef}
          className={cn(
            "bg-black transition-all duration-300 ring-1 ring-white/5",
            isMinimized
              ? "w-28 aspect-video rounded-md object-contain flex-shrink-0"
              : "w-full h-full rounded-lg object-contain"
          )}
          src={videoUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {/* Fullscreen overlays */}
        {!isMinimized && (
          <>
            {/* Top-right actions: minimize + close */}
            <div
              className={cn(
                "absolute top-4 right-4 flex items-center gap-2 transition-opacity z-10",
                showControls ? "opacity-100" : "opacity-0"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-black/40 text-white border border-white/20 hover:bg-white/20 hover:border-white/40"
                onClick={() => setIsMinimized(true)}
                aria-label="Minimize player"
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-black/40 text-white border border-white/20 hover:bg-white/20 hover:border-white/40"
                onClick={onClose}
                aria-label="Close player"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* File name */}
            <div
              className={cn(
                "absolute top-4 left-4 text-white bg-black/40 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-md max-w-[50%] truncate transition-opacity z-10 flex items-center gap-2",
                showControls ? "opacity-100" : "opacity-0"
              )}
            >
              <span>{fileName}</span>
              {isCached && (
                <div className="flex items-center gap-1 text-green-400">
                  <CacheIcon className="w-4 h-4" />
                  <span className="text-xs">Cached</span>
                </div>
              )}
              {isCaching && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Caching...</span>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/80 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Video controls */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 pt-6 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity",
                showControls ? "opacity-100" : "opacity-0"
              )}
            >
              {/* Progress bar */}
              <div className="mb-4 px-2">
                <Slider
                  min={0}
                  max={duration || 100}
                  step={0.01}
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-white text-xs mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={onPrevious}
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={onNext}
                    aria-label="Next track"
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    
                    <div className="w-24 hidden sm:block">
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 hidden sm:flex"
                    onClick={handleShareLink}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 hidden sm:flex"
                    onClick={handleDownload}
                  >
                    <Download className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleMinimize}
                  >
                    <Minimize2 className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-6 h-6" />
                    ) : (
                      <Maximize2 className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Minimized overlays */}
        {isMinimized && (
          <>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleMute}
                aria-label="Toggle mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleMinimize}
                aria-label="Expand player"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={onClose}
                aria-label="Close player"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;

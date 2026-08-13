import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  X,
  ChevronDown,
  Maximize2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Share2,
  Download,
  Music,
  Loader2,
  Database,
} from 'lucide-react';
import { mediaCache } from '@/utils/videoCache';

interface AudioPlayerProps {
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

const AudioPlayer = ({ url, onClose, fileName = 'Audio', autoPlay = false, onEnded, onNext, onPrevious, onMinimizeChange, onPlayingChange }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>(url);
  const [minimized, setMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
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
    onMinimizeChange?.(minimized);
  }, [minimized, onMinimizeChange]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load cached audio if available
  useEffect(() => {
    const loadAudio = async () => {
      setIsLoading(true);
      try {
        const cached = await mediaCache.getCachedVideo(url);
        if (cached) {
          setAudioUrl(cached);
          setIsCached(true);
          console.log('Audio loaded from cache:', fileName);
        } else {
          setAudioUrl(url);
          setIsCached(false);
          console.log('Audio loaded from network:', fileName);
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        setAudioUrl(url);
        setIsCached(false);
      }
    };

    loadAudio();
  }, [url, fileName]);

  // Cache audio when it starts playing and not already cached
  useEffect(() => {
    const cacheAudioIfNeeded = async () => {
      if (isPlaying && !isCached && !isCaching) {
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
          console.log('Audio cached successfully:', fileName);
        } catch (error) {
          console.error('Error caching audio:', error);
        } finally {
          setIsCaching(false);
        }
      }
    };

    if (isPlaying && !isCached) {
      cacheAudioIfNeeded();
    }
  }, [isPlaying, isCached, isCaching, url, fileName]);

  // Media element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      if (autoPlayRef.current) {
        audio.play().catch(() => {});
      }
    };
    const handleDurationChange = () => setDuration(audio.duration);
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
    const handleError = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
  };

  const handleShareLink = () => {
    try {
      navigator.clipboard.writeText(url);
      alert('Audio link copied to clipboard!');
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
      console.error('Error downloading audio:', error);
    }
  };

  return (
    <>
      {!minimized && (
      <div className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
      <div className="w-full max-w-md mx-4 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="w-4 h-4" />
            {isCached ? (
              <span className="text-green-600">Cached</span>
            ) : isCaching ? (
              <span className="text-yellow-600">Caching…</span>
            ) : (
              <span>Streaming</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setMinimized(true)}
              aria-label="Minimize player"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onClose}
              aria-label="Close player"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Artwork / icon */}
        <div className="flex flex-col items-center px-6 py-8">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-primary/20 flex items-center justify-center shadow-inner">
            <Music className="w-16 h-16 text-primary" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-foreground text-center truncate max-w-full">
            {fileName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Audio file</p>
        </div>

        {/* Progress */}
        <div className="px-6">
          <Slider
            min={0}
            max={duration || 100}
            step={0.01}
            value={[Math.min(currentTime, duration || 0)]}
            onValueChange={handleSeek}
            disabled={isLoading}
            aria-label="Seek"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-6 py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full"
            onClick={togglePlay}
            disabled={isLoading}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume + actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center gap-2 w-1/3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={toggleMute}
              aria-label="Toggle mute"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <div className="flex-1 hidden sm:block">
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                aria-label="Volume"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={handleShareLink}
              aria-label="Copy link"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={handleDownload}
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
      )}

      {minimized && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,640px)] rounded-xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-3 p-2.5">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onPrevious} aria-label="Previous track">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={togglePlay}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onNext} aria-label="Next track">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleMute} aria-label="Toggle mute">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMinimized(false)} aria-label="Expand player">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Close player">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element - always mounted to continue playback */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </>
  );
};

export default AudioPlayer;

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  X,
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
}

const AudioPlayer = ({ url, onClose, fileName = 'Audio' }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>(url);
  const audioRef = useRef<HTMLAudioElement>(null);

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
          const response = await fetch(url);
          const blob = await response.blob();
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
    };
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('durationchange', handleDurationChange);
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

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
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
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Database className="w-4 h-4" />
            {isCached ? (
              <span className="text-green-600">Cached</span>
            ) : isCaching ? (
              <span className="text-yellow-600">Caching…</span>
            ) : (
              <span>Streaming</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close player"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Artwork / icon */}
        <div className="flex flex-col items-center px-6 py-8">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-inner">
            <Music className="w-16 h-16 text-primary" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-neutral-900 text-center truncate max-w-full">
            {fileName}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Audio file</p>
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
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-6 py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(-10)}
            aria-label="Back 10 seconds"
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
            onClick={() => skipTime(10)}
            aria-label="Forward 10 seconds"
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
              className="h-8 w-8"
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
              className="h-8 w-8"
              onClick={handleShareLink}
              aria-label="Copy link"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDownload}
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;

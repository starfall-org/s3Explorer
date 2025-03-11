
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  onClose: () => void;
}

const VideoPlayer = ({ url, onClose }: VideoPlayerProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="relative w-full max-w-4xl mx-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
        <video
          className="w-full rounded-lg shadow-xl"
          controls
          autoPlay
          src={url}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;

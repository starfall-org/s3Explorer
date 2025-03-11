
import React, { useState } from 'react';
import FileList from '@/components/FileList';
import VideoPlayer from '@/components/VideoPlayer';
import { Folder, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Mock data - sẽ được thay thế bằng dữ liệu thật từ S3
  const mockFiles = [
    { name: 'Documents', type: 'folder' },
    { name: 'sample-video.mp4', type: 'video', size: '24.5 MB' },
    { name: 'presentation.jpg', type: 'image', size: '2.1 MB' },
    { name: 'report.pdf', type: 'file', size: '1.8 MB' },
  ];

  const handleFileSelect = (item: any) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item.name]);
    } else if (item.type === 'video') {
      setSelectedVideo('https://example.com/sample-video.mp4'); // Sẽ được thay thế bằng URL thật từ S3
    }
  };

  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          {currentPath.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateBack}
              className="hover:bg-neutral-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Folder className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-neutral-900">
              {currentPath.length === 0 ? 'My Files' : currentPath.join(' / ')}
            </h1>
          </div>
        </div>

        {/* File List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <FileList items={mockFiles} onSelect={handleFileSelect} />
        </div>
      </div>

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          url={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};

export default Index;

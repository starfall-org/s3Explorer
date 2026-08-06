"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import FileList from '@/components/FileList';
import VideoPlayer from '@/components/VideoPlayer';
import AudioPlayer from '@/components/AudioPlayer';
import TextViewer from '@/components/TextViewer';
import SettingsDialog from '@/components/SettingsDialog';
import { Folder, ArrowLeft, X, Upload, RefreshCw, Settings, FolderOpen } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listS3Objects, getS3FileUrl, deleteS3Object, S3Item } from '@/utils/s3Client';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [selectedAudioName, setSelectedAudioName] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedTextName, setSelectedTextName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<S3Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(-1);
  const [videoAutoPlay, setVideoAutoPlay] = useState(false);
  const [audioAutoPlay, setAudioAutoPlay] = useState(false);
  const { toast } = useToast();

  // Redirect to login if S3 credentials are not set
  useEffect(() => {
    const isAuthed =
      !!Cookies.get('s3Endpoint') &&
      !!Cookies.get('s3Apikey') &&
      !!Cookies.get('s3SecretKey') &&
      !!Cookies.get('s3Bucket');
    if (!isAuthed) {
      router.replace('/login');
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const path = currentPath.join('/');
      const pathWithSlash = path ? `${path}/` : '';
      const result = await listS3Objects(pathWithSlash);
      setItems(result);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Could not connect to S3. Please check your credentials or network.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      fetchItems();
    }
  }, [currentPath, isAuthed]);

  const openMedia = async (item: S3Item, autoPlay = false) => {
    let url = item.url;
    if (!url) {
      try {
        url = await getS3FileUrl(item.key);
      } catch (err) {
        console.error('Error getting file URL:', err);
        toast({
          title: "Error",
          description: "Failed to open file.",
          variant: "destructive",
        });
        return;
      }
    }

    if (item.type === 'video') {
      setSelectedVideoName(item.name);
      setSelectedVideo(url);
      setVideoAutoPlay(autoPlay);
    } else if (item.type === 'image') {
      setSelectedImage(url);
    } else if (item.type === 'audio') {
      setSelectedAudioName(item.name);
      setSelectedAudio(url);
      setAudioAutoPlay(autoPlay);
    } else if (item.type === 'text') {
      setSelectedTextName(item.name);
      setSelectedText(url);
    }
  };

  const handleFileSelect = (item: S3Item) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item.name]);
      return;
    }
    const idx = items.findIndex((i) => i.key === item.key);
    if (idx >= 0) setCurrentMediaIndex(idx);
    openMedia(item, false);
  };

  // Auto-play the next media item (video/audio) in the current folder when the current one ends
  const playNext = () => {
    if (currentMediaIndex < 0) return;
    for (let i = currentMediaIndex + 1; i < items.length; i++) {
      const it = items[i];
      if (it.type === 'video' || it.type === 'audio') {
        setCurrentMediaIndex(i);
        openMedia(it, true);
        return;
      }
    }
  };

  const handleDeleteItem = async (item: S3Item) => {
    try {
      const result = await deleteS3Object(item.key);
      if (result) {
        toast({
          title: "Success",
          description: `"${item.name}" has been deleted.`,
        });
        fetchItems(); // Refresh the file list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete file.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      toast({
        title: "Error",
        description: "An error occurred while deleting the file.",
        variant: "destructive",
      });
    }
  };

  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const refreshList = () => {
    fetchItems();
  };

  const getCurrentPathDisplay = () => {
    if (currentPath.length === 0) return 'My Files';
    return currentPath.join(' / ');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("max-w-6xl mx-auto px-4 py-8", isPlayerMinimized && "pb-28")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {currentPath.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateBack}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Folder className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground truncate">
                {getCurrentPathDisplay()}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshList}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="gap-1"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-200 p-4 rounded-lg mb-4 flex items-center justify-between gap-4 flex-wrap">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="bg-background"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Connection settings
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : (
          /* File List */
          <div className="bg-card rounded-xl shadow-sm border border-border">
            {items.length > 0 ? (
              <FileList 
                items={items} 
                onSelect={handleFileSelect} 
                onDelete={handleDeleteItem}
              />
            ) : (
              <div className="p-10 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">
                  No files found in this folder.
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  The bucket may be empty, or the current connection details may be
                  incorrect. Please check your connection settings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Open Connection Settings
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaved={() => {
          setSettingsOpen(false);
          fetchItems();
        }}
      />

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          url={selectedVideo}
          fileName={selectedVideoName}
          autoPlay={videoAutoPlay}
          onEnded={playNext}
          onMinimizeChange={setIsPlayerMinimized}
          onClose={() => {
            setSelectedVideo(null);
            setIsPlayerMinimized(false);
          }}
        />
      )}

      {/* Audio Player */}
      {selectedAudio && (
        <AudioPlayer
          url={selectedAudio}
          fileName={selectedAudioName}
          autoPlay={audioAutoPlay}
          onEnded={playNext}
          onMinimizeChange={setIsPlayerMinimized}
          onClose={() => {
            setSelectedAudio(null);
            setIsPlayerMinimized(false);
          }}
        />
      )}

      {/* Text Viewer */}
      {selectedText && (
        <TextViewer
          url={selectedText}
          fileName={selectedTextName}
          onClose={() => setSelectedText(null)}
        />
      )}

      {/* Image Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
          <div className="relative w-full max-w-4xl mx-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

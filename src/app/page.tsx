"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import FileList from '@/components/FileList';
import VideoPlayer from '@/components/VideoPlayer';
import AudioPlayer from '@/components/AudioPlayer';
import TextViewer from '@/components/TextViewer';
import CacheManager from '@/components/CacheManager';
import SettingsDialog from '@/components/SettingsDialog';
import { Folder, ArrowLeft, X, Upload, RefreshCw, Settings, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      setError('Không thể kết nối tới S3. Vui lòng kiểm tra thông tin xác thực hoặc mạng của bạn.');
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

  const handleFileSelect = async (item: S3Item) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item.name]);
    } else if (item.type === 'video') {
      try {
        setSelectedVideoName(item.name);
        if (item.url) {
          setSelectedVideo(item.url);
        } else {
          const url = await getS3FileUrl(item.key);
          setSelectedVideo(url);
        }
      } catch (err) {
        console.error('Error getting video URL:', err);
        toast({
          title: "Error",
          description: "Failed to open video file.",
          variant: "destructive",
        });
      }
    } else if (item.type === 'image') {
      try {
        if (item.url) {
          setSelectedImage(item.url);
        } else {
          const url = await getS3FileUrl(item.key);
          setSelectedImage(url);
        }
      } catch (err) {
        console.error('Error getting image URL:', err);
        toast({
          title: "Error",
          description: "Failed to open image file.",
          variant: "destructive",
        });
      }
    } else if (item.type === 'audio') {
      try {
        setSelectedAudioName(item.name);
        if (item.url) {
          setSelectedAudio(item.url);
        } else {
          const url = await getS3FileUrl(item.key);
          setSelectedAudio(url);
        }
      } catch (err) {
        console.error('Error getting audio URL:', err);
        toast({
          title: "Error",
          description: "Failed to open audio file.",
          variant: "destructive",
        });
      }
    } else if (item.type === 'text') {
      try {
        setSelectedTextName(item.name);
        if (item.url) {
          setSelectedText(item.url);
        } else {
          const url = await getS3FileUrl(item.key);
          setSelectedText(url);
        }
      } catch (err) {
        console.error('Error getting text URL:', err);
        toast({
          title: "Error",
          description: "Failed to open text file.",
          variant: "destructive",
        });
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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
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
              <h1 className="text-2xl font-semibold text-neutral-900 truncate">
                {getCurrentPathDisplay()}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
              <span className="hidden sm:inline">Cài đặt</span>
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-center justify-between gap-4 flex-wrap">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt kết nối
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-neutral-500">Loading files...</p>
          </div>
        ) : (
          /* File List */
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            {items.length > 0 ? (
              <FileList 
                items={items} 
                onSelect={handleFileSelect} 
                onDelete={handleDeleteItem}
              />
            ) : (
              <div className="p-10 text-center">
                <FolderOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600 font-medium">
                  Không tìm thấy tệp nào trong thư mục này.
                </p>
                <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                  Bucket có thể trống, hoặc thông tin kết nối hiện tại không chính
                  xác. Hãy kiểm tra lại trong Cài đặt kết nối.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Mở Cài đặt kết nối
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cache Manager - positioned at bottom right */}
      <div className="fixed bottom-4 right-4 z-40">
        <CacheManager />
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
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Audio Player */}
      {selectedAudio && (
        <AudioPlayer
          url={selectedAudio}
          fileName={selectedAudioName}
          onClose={() => setSelectedAudio(null)}
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

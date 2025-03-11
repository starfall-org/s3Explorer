
import React from 'react';
import { File, Folder, FileVideo, FileImage, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { S3Item } from '@/utils/s3Client';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileListProps {
  items: S3Item[];
  onSelect: (item: S3Item) => void;
}

const FileList = ({ items, onSelect }: FileListProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder className="w-5 h-5 text-primary" />;
      case 'video':
        return <FileVideo className="w-5 h-5 text-primary" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-primary" />;
      default:
        return <File className="w-5 h-5 text-primary" />;
    }
  };

  const handleDownload = async (e: React.MouseEvent, item: S3Item) => {
    e.stopPropagation();
    try {
      const response = await fetch(item.url || '');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="w-full divide-y divide-neutral-100">
      {items.map((item, index) => (
        <div
          key={item.key}
          onClick={() => onSelect(item)}
          className={cn(
            "flex items-center px-4 py-3 hover:bg-neutral-100 cursor-pointer transition-colors",
            "animate-slide-in group"
          )}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="flex-shrink-0">
            {getIcon(item.type)}
          </div>
          
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {item.name}
            </p>
            {item.size && (
              <p className="text-xs text-neutral-500">
                {item.size}
                {item.lastModified && ` · ${new Date(item.lastModified).toLocaleDateString()}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.type !== 'folder' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDownload(e, item)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open in new tab</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;

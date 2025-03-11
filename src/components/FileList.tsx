
import React from 'react';
import { File, Folder, FileVideo, FileImage, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileListProps {
  items: {
    name: string;
    type: 'folder' | 'file' | 'video' | 'image';
    size?: string;
    lastModified?: string;
  }[];
  onSelect: (item: any) => void;
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

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div
          key={item.name}
          onClick={() => onSelect(item)}
          className={cn(
            "flex items-center px-4 py-3 hover:bg-neutral-100 cursor-pointer rounded-lg transition-colors",
            "animate-slide-in",
            "group"
          )}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {getIcon(item.type)}
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-neutral-900">{item.name}</p>
            {item.size && (
              <p className="text-xs text-neutral-500">{item.size}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
};

export default FileList;

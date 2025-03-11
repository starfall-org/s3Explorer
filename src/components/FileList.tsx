
import React, { useState } from 'react';
import { File, Folder, FileVideo, FileImage, ChevronRight, Download, ExternalLink, Trash2, Info, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { S3Item } from '@/utils/s3Client';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FileListProps {
  items: S3Item[];
  onSelect: (item: S3Item) => void;
  onDelete?: (item: S3Item) => Promise<void>;
}

const FileList = ({ items, onSelect, onDelete }: FileListProps) => {
  const [infoItem, setInfoItem] = useState<S3Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<S3Item | null>(null);
  
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

  const copyShareLink = async (e: React.MouseEvent, item: S3Item) => {
    e.stopPropagation();
    if (item.url) {
      try {
        await navigator.clipboard.writeText(item.url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteItem && onDelete) {
      await onDelete(deleteItem);
      setDeleteItem(null);
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
            {item.type !== 'folder' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleDownload(e, item)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.url, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in new tab
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={(e) => copyShareLink(e, item)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoItem(item);
                    }}
                  >
                    <Info className="w-4 h-4 mr-2" />
                    File info
                  </DropdownMenuItem>
                  
                  {onDelete && (
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItem(item);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* File Info Dialog */}
      <Dialog open={!!infoItem} onOpenChange={(open) => !open && setInfoItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Information</DialogTitle>
            <DialogDescription>Details about {infoItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="flex items-center">
              <span className="font-medium min-w-24">Name:</span>
              <span className="text-neutral-700">{infoItem?.name}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium min-w-24">Type:</span>
              <span className="text-neutral-700">{infoItem?.type}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium min-w-24">Size:</span>
              <span className="text-neutral-700">{infoItem?.size}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium min-w-24">Modified:</span>
              <span className="text-neutral-700">
                {infoItem?.lastModified ? new Date(infoItem.lastModified).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium min-w-24">Path:</span>
              <span className="text-neutral-700 truncate">{infoItem?.key}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteItem?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileList;

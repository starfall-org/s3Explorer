import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X, Download, Copy, Check, FileText } from 'lucide-react';

interface TextViewerProps {
  url: string;
  onClose: () => void;
  fileName?: string;
}

const MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5MB

const TextViewer = ({ url, onClose, fileName = 'file.txt' }: TextViewerProps) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      setTruncated(false);
      setContent('');
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const blob = await response.blob();
        let text = await blob.text();
        if (blob.size > MAX_PREVIEW_SIZE) {
          setTruncated(true);
          text = text.slice(0, MAX_PREVIEW_SIZE);
        }
        setContent(text);
      } catch (err) {
        console.error('Error loading text file:', err);
        setError('Failed to load file content.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
      console.error('Error downloading file:', error);
    }
  };

  const lineCount = content ? content.split('\n').length : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="w-full max-w-4xl bg-card rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{fileName}</h2>
              <p className="text-xs text-muted-foreground">
                {lineCount.toLocaleString()} lines
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              aria-label="Copy content"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
            <pre className="p-5 text-sm font-mono text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </pre>
          )}
        </div>

        {truncated && (
          <div className="px-5 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-700">
            This file is larger than 5MB. Showing only the beginning. Download the
            file to view the full content.
          </div>
        )}
      </div>
    </div>
  );
};

export default TextViewer;

// Shared S3 types and helpers used by both the browser client and the server.
// This module must NOT import browser-only or server-only APIs.

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

export type ConnectionMode = 'browser' | 'server';

export interface S3Item {
  name: string;
  type: 'folder' | 'file' | 'video' | 'image' | 'audio' | 'text';
  size?: string;
  lastModified?: string;
  key: string;
  url?: string; // URL used to access the object content
}

export const CONNECTION_MODE_COOKIE = 's3ConnectionMode';

export const S3_COOKIE_KEYS = [
  's3Endpoint',
  's3Apikey',
  's3SecretKey',
  's3Bucket',
] as const;

// Function to format bytes to human-readable format
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function to determine file type
export function getFileType(
  fileName: string
): 'folder' | 'file' | 'video' | 'image' | 'audio' | 'text' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (!ext) return 'folder';

  if (
    ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'wmv', 'flv', '3gp', 'ts'].includes(ext)
  ) {
    return 'video';
  } else if (
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif', 'tiff'].includes(ext)
  ) {
    return 'image';
  } else if (
    ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'wma', 'mid', 'midi', 'weba'].includes(ext)
  ) {
    return 'audio';
  } else if (
    [
      'txt', 'md', 'markdown', 'json', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx',
      'css', 'scss', 'less', 'html', 'htm', 'xml', 'csv', 'log', 'py', 'java',
      'c', 'h', 'cpp', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'sh', 'bash',
      'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'env', 'sql', 'vue',
      'svelte', 'astro',
    ].includes(ext)
  ) {
    return 'text';
  } else {
    return 'file';
  }
}

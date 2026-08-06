// Server-side S3 helpers shared by the /api/s3 route handlers.
// This module runs only on the Node.js server.

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { S3Config, S3Item, getFileType, formatBytes } from '@/utils/s3Types';

export function createS3Client(config: S3Config) {
  return new S3Client({
    endpoint: config.endpoint,
    region: 'us-east-1', // This can be any value for custom S3 endpoints
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for some S3-compatible services
  });
}

export function getS3ConfigFromCookies(cookies: {
  s3Endpoint?: string;
  s3Apikey?: string;
  s3SecretKey?: string;
  s3Bucket?: string;
}): S3Config {
  return {
    endpoint: cookies.s3Endpoint || '',
    accessKey: cookies.s3Apikey || '',
    secretKey: cookies.s3SecretKey || '',
    bucketName: cookies.s3Bucket || '',
  };
}

export function isS3ConfigValid(config: S3Config): boolean {
  return !!(
    config.endpoint &&
    config.accessKey &&
    config.secretKey &&
    config.bucketName
  );
}

// Build a same-origin proxy URL used in server connection mode
export const buildProxyUrl = (key: string): string =>
  `/api/s3/proxy?key=${encodeURIComponent(key)}`;

export async function listS3Objects(config: S3Config, path: string): Promise<S3Item[]> {
  const s3Client = createS3Client(config);
  const command = new ListObjectsV2Command({
    Bucket: config.bucketName,
    Delimiter: '/',
    Prefix: path,
  });

  const response = await s3Client.send(command);
  const items: S3Item[] = [];

  // Add folders
  if (response.CommonPrefixes) {
    for (const prefix of response.CommonPrefixes) {
      if (prefix.Prefix) {
        const folderName = prefix.Prefix.replace(path, '').replace('/', '');
        items.push({
          name: folderName,
          type: 'folder',
          key: prefix.Prefix,
        });
      }
    }
  }

  // Add files
  if (response.Contents) {
    for (const content of response.Contents) {
      if (content.Key === path) continue;

      const fileName = content.Key?.replace(path, '') || '';
      if (!fileName || fileName.endsWith('/')) continue;

      const fileItem: S3Item = {
        name: fileName,
        type: getFileType(fileName),
        size: formatBytes(content.Size || 0),
        lastModified: content.LastModified?.toISOString(),
        key: content.Key || '',
      };

      // In server mode, files are served through the same-origin proxy (no CORS needed)
      if (fileItem.type !== 'folder') {
        fileItem.url = buildProxyUrl(fileItem.key);
      }

      items.push(fileItem);
    }
  }

  return items;
}

export async function deleteS3Object(config: S3Config, key: string): Promise<void> {
  const s3Client = createS3Client(config);
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });
  await s3Client.send(command);
}

export async function getS3Object(config: S3Config, key: string, range?: string) {
  const s3Client = createS3Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ...(range ? { Range: range } : {}),
  });
  return s3Client.send(command);
}

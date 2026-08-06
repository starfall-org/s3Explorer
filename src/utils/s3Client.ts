import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Cookies from 'js-cookie';
import {
  S3Config,
  S3Item,
  ConnectionMode,
  CONNECTION_MODE_COOKIE,
  formatBytes,
  getFileType,
} from './s3Types';

// Re-export shared types for compatibility with existing imports
// (e.g. `import { S3Item } from '@/utils/s3Client'`)
export type { S3Config, S3Item, ConnectionMode } from './s3Types';

// Get the selected connection mode from cookies (default: browser)
export const getConnectionMode = (): ConnectionMode => {
  return Cookies.get(CONNECTION_MODE_COOKIE) === 'server' ? 'server' : 'browser';
};

// Function to get S3 client configuration from cookies
const getS3Config = (): S3Config => {
  return {
    endpoint: Cookies.get('s3Endpoint') || '',
    accessKey: Cookies.get('s3Apikey') || '',
    secretKey: Cookies.get('s3SecretKey') || '',
    bucketName: Cookies.get('s3Bucket') || '',
  };
};

// Function to create S3 client
const createS3Client = (config: S3Config) => {
  return new S3Client({
    endpoint: config.endpoint,
    region: "us-east-1", // This can be any value for custom S3 endpoints
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true, // Required for some S3-compatible services
  });
};

// Build a same-origin proxy URL for a file (server connection mode)
const buildProxyUrl = (key: string): string => {
  return `/api/s3/proxy?key=${encodeURIComponent(key)}`;
};

// Generate a pre-signed URL using the browser SDK (browser connection mode)
const getPresignedUrl = async (
  config: S3Config,
  key: string
): Promise<string> => {
  const s3Client = createS3Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
};

// Server mode: list objects through the Next.js API route
const listViaServer = async (
  path: string,
  configOverride?: S3Config
): Promise<S3Item[]> => {
  const response = await fetch('/api/s3/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      config: configOverride ?? null,
    }),
  });
  if (!response.ok) {
    throw new Error(`Server list failed with status ${response.status}`);
  }
  const data = await response.json();
  return (data.items as S3Item[]) ?? [];
};

// Server mode: delete an object through the Next.js API route
const deleteViaServer = async (key: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/s3/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error deleting S3 object (server):', error);
    return false;
  }
};

// List objects in a specified path
// Pass an optional configOverride to list using credentials other than the saved cookies (e.g. connection test)
export const listS3Objects = async (
  path: string = "",
  configOverride?: S3Config,
  modeOverride?: ConnectionMode
): Promise<S3Item[]> => {
  const mode = modeOverride ?? getConnectionMode();

  // Server mode: delegate to the Next.js API route (avoids CORS)
  if (mode === 'server') {
    try {
      return await listViaServer(path, configOverride);
    } catch (error) {
      console.error("Error listing S3 objects (server):", error);
      throw error; // Let the caller know the listing/connection failed
    }
  }

  // Browser mode: use the AWS SDK directly (requires CORS on the endpoint)
  try {
    const config = configOverride ?? getS3Config();
    const s3Client = createS3Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Delimiter: "/",
      Prefix: path,
    });

    const response = await s3Client.send(command);
    const items: S3Item[] = [];

    // Add folders
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          const folderName = prefix.Prefix.replace(path, "").replace("/", "");
          items.push({
            name: folderName,
            type: "folder",
            key: prefix.Prefix,
          });
        }
      }
    }

    // Add files
    if (response.Contents) {
      for (const content of response.Contents) {
        if (content.Key === path) continue;

        const fileName = content.Key?.replace(path, "") || "";
        if (!fileName || fileName.endsWith("/")) continue;

        const fileItem: S3Item = {
          name: fileName,
          type: getFileType(fileName),
          size: formatBytes(content.Size || 0),
          lastModified: content.LastModified?.toISOString(),
          key: content.Key || "",
        };

        // Generate pre-signed URL for the file
        if (fileItem.type !== "folder") {
          fileItem.url = await getPresignedUrl(config, fileItem.key);
        }

        items.push(fileItem);
      }
    }

    return items;
  } catch (error) {
    console.error("Error listing S3 objects:", error);
    throw error; // Let the caller know the listing/connection failed
  }
};

// Get a URL to access a file's content
// - Server mode: returns a same-origin proxy URL (no CORS required)
// - Browser mode: returns a pre-signed URL
// Pass an optional modeOverride so callers (e.g. connection test) can
// resolve URLs with a specific mode regardless of the saved cookie.
export const getS3FileUrl = async (
  key: string,
  modeOverride?: ConnectionMode
): Promise<string> => {
  const mode = modeOverride ?? getConnectionMode();

  if (mode === 'server') {
    return buildProxyUrl(key);
  }

  try {
    const config = getS3Config();
    return await getPresignedUrl(config, key);
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    return "";
  }
};

// Delete an object from S3
// Pass an optional modeOverride to delete with a specific mode regardless
// of the saved cookie (used by the connection test in Settings).
export const deleteS3Object = async (
  key: string,
  modeOverride?: ConnectionMode
): Promise<boolean> => {
  const mode = modeOverride ?? getConnectionMode();

  if (mode === 'server') {
    return deleteViaServer(key);
  }

  try {
    const config = getS3Config();
    const s3Client = createS3Client(config);
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting S3 object:", error);
    return false;
  }
};

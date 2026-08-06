import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Cookies from 'js-cookie';

// S3 connection configuration
// Can come from cookies (saved credentials) or be passed explicitly (e.g. from Settings)
export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

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

// Interface for file/folder items
export interface S3Item {
  name: string;
  type: "folder" | "file" | "video" | "image" | "audio" | "text";
  size?: string;
  lastModified?: string;
  key: string;
  url?: string; // Add URL for direct access
}

// Function to format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Function to determine file type
const getFileType = (
  fileName: string
): "folder" | "file" | "video" | "image" | "audio" | "text" => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (!ext) return "folder";

  if (["mp4", "webm", "mov", "avi", "mkv", "m4v", "wmv", "flv", "3gp", "ts"].includes(ext)) {
    return "video";
  } else if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico", "avif", "tiff"].includes(ext)) {
    return "image";
  } else if (["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "opus", "wma", "mid", "midi", "weba"].includes(ext)) {
    return "audio";
  } else if (["txt", "md", "markdown", "json", "js", "mjs", "cjs", "ts", "tsx", "jsx", "css", "scss", "less", "html", "htm", "xml", "csv", "log", "py", "java", "c", "h", "cpp", "hpp", "cs", "go", "rs", "rb", "php", "sh", "bash", "yml", "yaml", "toml", "ini", "cfg", "conf", "env", "sql", "vue", "svelte", "astro"].includes(ext)) {
    return "text";
  } else {
    return "file";
  }
};

// List objects in a specified path
// Pass an optional configOverride to list using credentials other than the saved cookies (e.g. connection test)
export const listS3Objects = async (
  path: string = "",
  configOverride?: S3Config
): Promise<S3Item[]> => {
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
          fileItem.url = await getS3FileUrl(fileItem.key);
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

// Get a presigned URL for a file
export const getS3FileUrl = async (key: string): Promise<string> => {
  try {
    const config = getS3Config();
    const s3Client = createS3Client(config);
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    return "";
  }
};

// Delete an object from S3
export const deleteS3Object = async (key: string): Promise<boolean> => {
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

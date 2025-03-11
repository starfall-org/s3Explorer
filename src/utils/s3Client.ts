
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 Configuration
const S3_ENDPOINT = "https://q0w7.sg.idrivee2-43.com";
const S3_ACCESS_KEY = "8OBl9ve6KBiLAdnIReel";
const S3_SECRET_KEY = "RwoILuzZVKcRhtFfvXFSZqf6vHkPeF5eeWYvviy5";
const BUCKET_NAME = "bosuutap"; // Updated to the correct bucket name

// Create S3 client
export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: "us-east-1", // This can be any value for custom S3 endpoints
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for some S3-compatible services
});

// Interface for file/folder items
export interface S3Item {
  name: string;
  type: "folder" | "file" | "video" | "image";
  size?: string;
  lastModified?: string;
  key: string; // Full S3 key
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
const getFileType = (fileName: string): "folder" | "file" | "video" | "image" => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (!ext) return "folder";
  
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return "video";
  } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return "image";
  } else {
    return "file";
  }
};

// List objects in a specified path
export const listS3Objects = async (path: string = ""): Promise<S3Item[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Delimiter: "/",
      Prefix: path,
    });
    
    const response = await s3Client.send(command);
    const items: S3Item[] = [];
    
    // Add folders (common prefixes)
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
        // Skip the current directory
        if (content.Key === path) continue;
        
        const fileName = content.Key?.replace(path, "") || "";
        // Skip empty files or folders already added
        if (!fileName || fileName.endsWith("/")) continue;
        
        items.push({
          name: fileName,
          type: getFileType(fileName),
          size: formatBytes(content.Size || 0),
          lastModified: content.LastModified?.toISOString(),
          key: content.Key || "",
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error("Error listing S3 objects:", error);
    return [];
  }
};

// Get a presigned URL for a file
export const getS3FileUrl = async (key: string): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    return "";
  }
};

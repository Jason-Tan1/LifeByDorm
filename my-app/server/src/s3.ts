import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

let s3Client: S3Client | null = null;

// Lazy initialization of S3 Client to prevent startup crashes if env vars are missing
function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;

  if (bucketName && region) {
    const S3Config: any = { region };

    if (accessKeyId && secretAccessKey) {
      S3Config.credentials = {
        accessKeyId,
        secretAccessKey
      };
    }
    
    try {
      s3Client = new S3Client(S3Config);
      return s3Client;
    } catch (error) {
       console.error("Failed to initialize S3 Client:", error);
       return null;
    }
  } else {
    console.warn('⚠️ AWS S3 configuration missing (Bucket Name: ' + bucketName + ', Region: ' + region + '). File uploads will be skipped.');
    return null;
  }
}

/**
 * Security: Allowed and dangerous MIME types for uploads
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DANGEROUS_MIME_TYPES = ['image/svg+xml', 'text/html', 'application/javascript', 'text/javascript', 'application/xml'];

/**
 * Validates that the MIME type is allowed for upload
 */
function validateMimeType(mimeType: string): void {
  const normalizedMime = mimeType.toLowerCase();

  if (DANGEROUS_MIME_TYPES.includes(normalizedMime)) {
    throw new Error(`File type '${mimeType}' is not allowed for security reasons`);
  }

  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    throw new Error(`File type '${mimeType}' is not supported. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
}

/**
 * Uploads a base64 image string to S3 and returns the public URL.
 * Expected format: "data:image/png;base64,iVBORw0KGgo..."
 * Security: Validates MIME type before upload to prevent XSS via SVG, etc.
 */
export async function uploadToS3(base64Data: string, folder: string = 'uploads'): Promise<string> {
  const client = getS3Client();
  if (!client || !bucketName) {
    if (base64Data.length < 200) return base64Data; // Likely already a URL or short string
    console.warn('AWS S3 not configured, storing base64 string directly (not recommended for production)');
    return base64Data;
  }

  // 1. Parse Base64 Data
  // Format is usually: "data:<mime-type>;base64,<data>"
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    // If it doesn't match the pattern, it might be a normal URL or invalid
    return base64Data;
  }

  const contentType = matches[1];

  // Security: Validate MIME type before processing
  validateMimeType(contentType);

  const buffer = Buffer.from(matches[2], 'base64');

  // Security: Validate file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of 10MB`);
  }

  // 2. Generate Unique Filename
  const extension = contentType.split('/')[1] || 'jpg';
  const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;

  // 3. Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
    // ensure the bucket/object can be read publicly if that's the intention
    ACL: 'public-read' // Note: Many new buckets block ACLs by default. Use Bucket Policy instead.
  });

  try {
    await client.send(command);
    // Return the URL
    // Format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}
/**
 * Generates a presigned URL for a given S3 file key.
 * Used for admin dashboard to view private/blocked-public-access images.
 */
export async function getSignedFileUrl(fileUrl: string): Promise<string> {
  const client = getS3Client();
  if (!client || !bucketName || !fileUrl) {
    return fileUrl;
  }

  try {
    // Extract key from full URL if present
    // URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    let key = fileUrl;
    if (fileUrl.startsWith('http')) {
        const urlObj = new URL(fileUrl);
        // Pathname includes leading slash, remove it. 
        // Also need to decodeURI in case key has spaces etc.
        key = decodeURIComponent(urlObj.pathname.substring(1));
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    // URL expires in 1 hour (3600 seconds)
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error signing URL:', error);
    return fileUrl; // Fallback to original URL
  }
}

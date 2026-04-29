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

const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png':  [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif':  [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [Buffer.from('RIFF')],
};

function validateMagicBytes(buffer: Buffer, claimedMime: string): void {
  const signatures = MAGIC_BYTES[claimedMime];
  if (!signatures) {
    throw new Error(`No signature validation available for ${claimedMime}`);
  }
  const matches = signatures.some(sig => buffer.subarray(0, sig.length).equals(sig));
  if (!matches) {
    throw new Error('File content does not match claimed image type');
  }
  if (claimedMime === 'image/webp' && buffer.length >= 12 && buffer.subarray(8, 12).toString() !== 'WEBP') {
    throw new Error('File content does not match claimed image type');
  }
}

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Uploads a raw image buffer to S3 after running the full security validation
 * chain (MIME type allowlist, magic-byte signature, size cap). Returns the
 * public S3 URL.
 *
 * Prefer this when bytes come from somewhere other than a base64 data URI —
 * e.g. a server-side download during a migration.
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  contentType: string,
  folder: string = 'uploads'
): Promise<string> {
  const client = getS3Client();
  if (!client || !bucketName) {
    throw new Error('AWS S3 is not configured — cannot upload image');
  }

  validateMimeType(contentType);
  validateMagicBytes(buffer, contentType);

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum allowed size of 10MB');
  }

  const extension = contentType.split('/')[1] || 'jpg';
  const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  });

  try {
    await client.send(command);
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

/**
 * Uploads a base64 image string to S3 and returns the public URL.
 * Expected format: "data:image/png;base64,iVBORw0KGgo..."
 * Security: Validates MIME type before upload to prevent XSS via SVG, etc.
 *
 * If the input is already an own-S3 URL (e.g. an unchanged image on a review
 * edit), it is returned as-is. Anything else throws — callers must not store
 * arbitrary strings as image references.
 */
const OWN_S3_URL_RE = (() => {
  const bucket = (process.env.AWS_BUCKET_NAME || '').trim();
  const region = (process.env.AWS_REGION || '').trim();
  if (!bucket || !region) return null;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https:\\/\\/${escape(bucket)}\\.s3\\.${escape(region)}\\.amazonaws\\.com\\/`);
})();

export async function uploadToS3(base64Data: string, folder: string = 'uploads'): Promise<string> {
  const client = getS3Client();
  if (!client || !bucketName) {
    if (base64Data.length < 200) return base64Data; // Likely already a URL or short string
    console.warn('AWS S3 not configured, storing base64 string directly (not recommended for production)');
    return base64Data;
  }

  if (OWN_S3_URL_RE && OWN_S3_URL_RE.test(base64Data)) {
    return base64Data;
  }

  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Image input must be a base64 data URI or a URL on our own S3 bucket');
  }

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');

  return uploadBufferToS3(buffer, contentType, folder);
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

    // Defense-in-depth: only sign keys under known image prefixes so a future bug
    // that lets user input reach this function can't mint URLs for arbitrary objects.
    const ALLOWED_PREFIXES = ['dorms/', 'reviews/main/', 'reviews/gallery/', 'uploads/'];
    if (!ALLOWED_PREFIXES.some(p => key.startsWith(p))) {
      return fileUrl;
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

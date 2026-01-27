import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

let s3Client: S3Client | null = null;

if (bucketName && region) {
  const S3Config: any = { region };
  
  // Use explicit credentials if available (e.g. local development)
  // Otherwise, if running on AWS Lambda, it will automatically use the IAM Role attached to the function
  if (accessKeyId && secretAccessKey) {
    S3Config.credentials = {
      accessKeyId,
      secretAccessKey
    };
  }

  s3Client = new S3Client(S3Config);
} else {
  console.warn('⚠️ AWS S3 configuration missing (Bucket Name or Region). File uploads will be skipped.');
}

/**
 * Uploads a base64 image string to S3 and returns the public URL.
 * Expected format: "data:image/png;base64,iVBORw0KGgo..."
 */
export async function uploadToS3(base64Data: string, folder: string = 'uploads'): Promise<string> {
  if (!s3Client || !bucketName) {
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
  const buffer = Buffer.from(matches[2], 'base64');
  
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
    // ACL: 'public-read' // Note: Many new buckets block ACLs by default. Use Bucket Policy instead.
  });

  try {
    await s3Client.send(command);
    // Return the URL
    // Format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

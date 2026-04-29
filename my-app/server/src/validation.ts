import { Request, Response, NextFunction } from 'express';
import { z, ZodIssue } from 'zod'; // Note: RequestTimeout is likely not what we want, just z

// --- Validation Middleware ---
export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<any>;
      return res.status(400).json({
        message: 'Validation failed',
        errors: zodError.issues.map((e: ZodIssue) => ({ path: e.path, message: e.message }))
      });
    }
    next(error);
  }
};

// --- Schemas ---

// OWASP: Input Validation - Validate all data against a rigorous specification (schema)

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim().toLowerCase().max(100),
  // OWASP: Password Strength Controls
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password is too long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirm: z.string()
}).strict().refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase().max(100),
  password: z.string().max(128) // Don't leak exact password limits on login for security, but prevent DoS
}).strict();

export const sendCodeSchema = z.object({
  email: z.string().email().trim().toLowerCase().max(100)
}).strict();

export const verifyCodeSchema = z.object({
  email: z.string().email().trim().toLowerCase().max(100),
  code: z.string().length(6).regex(/^\d+$/, { message: "Code must be 6 digits" })
}).strict();

export const googleAuthSchema = z.object({
  credential: z.string().optional(),
  access_token: z.string().optional()
}).strict().refine(data => data.credential || data.access_token, {
  message: "Either credential (ID token) or access_token is required"
});

// Accept an empty value (no image), a base64 data URI for a supported image type
// (which the server will upload to S3), or a URL already on our own S3 bucket.
// External/hotlinked URLs are rejected — we serve images from our own infrastructure.
export const DATA_URI_IMAGE_RE = /^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/;
export const OWN_S3_HOST_RE = (() => {
  const bucket = (process.env.AWS_BUCKET_NAME || '').trim();
  const region = (process.env.AWS_REGION || '').trim();
  if (!bucket || !region) return null;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https:\\/\\/${escape(bucket)}\\.s3\\.${escape(region)}\\.amazonaws\\.com\\/`);
})();

const isAllowedImageString = (val: string): boolean => {
  if (val === '') return true;
  if (DATA_URI_IMAGE_RE.test(val)) return true;
  if (OWN_S3_HOST_RE && OWN_S3_HOST_RE.test(val)) return true;
  return false;
};

const allowedImageStringSchema = z.string().refine(isAllowedImageString, {
  message: 'image must be empty, a base64 image data URI, or a URL on our own S3 bucket'
});

const dormImageUrlSchema = allowedImageStringSchema.optional().or(z.literal("")).nullable();

export const dormSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  universitySlug: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional(),
  imageUrl: dormImageUrlSchema,
  amenities: z.array(z.string().max(50)).optional(),
  roomTypes: z.array(z.string().max(50)).optional()
}).strict();

export const reviewSchema = z.object({
  university: z.string().min(1).max(100).trim(),
  dorm: z.string().min(1).max(100).trim(),
  room: z.number().int().min(1).max(5),
  bathroom: z.number().int().min(1).max(5),
  building: z.number().int().min(1).max(5),
  amenities: z.number().int().min(1).max(5),
  location: z.number().int().min(1).max(5),
  description: z.string().max(1500).trim(),
  // Handle all possible year formats: number, string, array of numbers/strings
  year: z.union([
    z.number(),
    z.string(),
    z.array(z.union([z.number(), z.string()]))
  ]),
  // Handle all possible roomType formats: string or array of strings
  roomType: z.union([
    z.string(),
    z.array(z.string())
  ]),
  wouldDormAgain: z.boolean().nullable().optional(),
  // fileImage must be empty, a base64 image data URI, or a URL on our own S3 bucket
  fileImage: z.union([allowedImageStringSchema, z.null()]).optional(),
  // images must each be a base64 image data URI or a URL on our own S3 bucket (max 10 per review)
  images: z.union([z.array(allowedImageStringSchema).max(10), z.null()]).optional()
}).strict();

export const editReviewSchema = z.object({
  room: z.number().int().min(1).max(5),
  bathroom: z.number().int().min(1).max(5),
  building: z.number().int().min(1).max(5),
  amenities: z.number().int().min(1).max(5),
  location: z.number().int().min(1).max(5),
  description: z.string().max(1500).trim(),
  year: z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))]),
  roomType: z.union([z.string(), z.array(z.string())]),
  wouldDormAgain: z.boolean().nullable().optional(),
  images: z.union([z.array(allowedImageStringSchema).max(10), z.null()]).optional()
}).strict();

const slugField = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, { message: 'Must be a valid URL slug (lowercase letters, numbers, hyphens)' });

export const compareQuerySchema = z.object({
  dorm1: slugField,
  uni1: slugField,
  dorm2: slugField,
  uni2: slugField,
});

export const contactSchema = z.object({
  fullName: z.string().min(1).max(100).trim(),
  email: z.string().email().max(100).trim(),
  message: z.string().min(1).max(5000).trim()
}).strict();

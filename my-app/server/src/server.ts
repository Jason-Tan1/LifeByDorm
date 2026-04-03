import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt, { Secret, JwtPayload, Algorithm } from 'jsonwebtoken';
import mongoose from 'mongoose'; // MongoDB Connections from Node.js
import bcrypt from 'bcryptjs'; //Hide Passwords
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import sanitizeHtml from 'sanitize-html';
import { User, IUser } from './models/user';
import { UserReview } from './models/userreview';
import { University } from './models/universities';
import { Dorm } from './models/dorm';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import { uploadToS3, getSignedFileUrl } from './s3';
import Groq from 'groq-sdk';
import { Verifier } from 'academic-email-verifier';

// Security: Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Security: JWT Configuration
const JWT_ALGORITHM: Algorithm = 'HS256';
const JWT_EXPIRY = '24h';

// Security: Generate cryptographically secure verification code
function generateSecureCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Security: Sanitize user input to prevent XSS
function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
}


// Note: express-mongo-sanitize is incompatible with Express 5 (req.query is read-only)
// MongoDB injection protection is handled by Mongoose's strict schema validation
import {
  validate,
  registerSchema,
  loginSchema,
  sendCodeSchema,
  verifyCodeSchema,
  googleAuthSchema,
  dormSchema,
  reviewSchema,
  editReviewSchema,
  contactSchema,
  compareQuerySchema
} from './validation';

dotenv.config();
if (!isProduction) console.log('Loaded secret:', process.env.ACCESS_TOKEN_SECRET ? '✅ Loaded' : '❌ Missing');

// Validate required environment variables
if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error('❌ CRITICAL: ACCESS_TOKEN_SECRET is not defined in .env file');
  // Do not exit process in Vercel environment, as it causes "Internal Server Error" without CORS headers
  // process.exit(1); 
  console.warn('⚠️ Process continuing without ACCESS_TOKEN_SECRET - Auth will fail');
}

// Admin emails (comma-separated) read from env, e.g. ADMIN_EMAILS=admin@example.com,alice@org.com
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
if (!isProduction) console.log('Admin emails:', ADMIN_EMAILS.length ? ADMIN_EMAILS : 'none');

const app = express()

// Security: Enable trust proxy for AWS Lambda / API Gateway
// Required for express-rate-limit to work correctly behind a proxy
app.set('trust proxy', 1);

// CORS configuration - restrict to trusted origins
// Allowed origins: include FRONTEND_URL when set, and always include common localhost dev origins
// Include common Vite dev ports (5173 and 4173) and localhost variants
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://lifebydorm.ca',
  'https://www.lifebydorm.ca',
  'https://life-by-dorm.vercel.app',
  'https://lifebydorm.vercel.app',
  'https://life-by-dorm-git-main-jason-tans-projects-d9f50bb0.vercel.app', // Explicit fix for current preview
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://10.24.18.88:5173',
  'http://10.24.18.88:3000'
].filter(Boolean);

// Vercel preview deployment pattern for your project
// Allow any subdomain starting with life-by-dorm
const VERCEL_PREVIEW_PATTERN = /^https:\/\/life-by-dorm.*\.vercel\.app$/; // Matches life-by-dorm-git-main...

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Check allowed origins list
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Check Vercel pattern
    if (VERCEL_PREVIEW_PATTERN.test(origin)) {
      console.log(`✅ Allowed Vercel Preview Origin via Regex: ${origin}`);
      return callback(null, true);
    }

    // Allow Localhost in non-prod
    if ((process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') || !process.env.NODE_ENV) {
      try {
        const parsed = new URL(origin);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) { }
    }

    console.warn(`🚫 Blocked CORS request from unauthorized origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 600, // Reduced maxAge to 10 mins to help with debugging/clearing bad cache
};

app.use(cors(corsOptions));
// Explicitly handle OPTIONS preflight to ensure headers are sent
// Note: In Express 5, '*' is not valid. Use RegEx /.*/ to match all routes.
app.options(/.*/, cors(corsOptions));

// Security Middleware - Enhanced with Content-Security-Policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Allow Google Login popups
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || '', "https://accounts.google.com", "https://www.googleapis.com"].filter(Boolean),
      frameSrc: ["https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  } : false, // Disable CSP in development for easier debugging
})); // Set secure HTTP headers

// Enable gzip/deflate compression for all responses (70-90% size reduction)
app.use(compression());

// Debug route (development only) - removed from production for security

// Increase JSON body size limit to allow base64 image uploads from the client.
// The frontend encodes images as data URLs; increase the limit to 10mb.
app.use(express.json({ limit: '10mb' }))
// Also parse URL-encoded bodies (forms) with the same limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Note: express-mongo-sanitize removed - incompatible with Express 5
// MongoDB injection protection is provided by:
// 1. Mongoose schema validation (strict mode)
// 2. Zod input validation schemas
// 3. Parameterized queries (Mongoose uses them by default)

// Rate limiting configuration
// OWASP: Rate Limiting to prevent brute-force and DoS attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict limit for auth endpoints (login/register) - 20 per 15 mins
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 mins
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for review/dorm submissions (allows anonymous but prevents spam)
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 submissions per 15 mins per IP
  message: { message: 'Too many submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Higher limit for read-only GET requests (public data)
const readOnlyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // More generous limit for read-only endpoints
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple in-memory cache for expensive aggregations
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache: Map<string, CacheEntry<any>> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

app.get('/', (req: Request, res: Response) => {
  // In production, only return a minimal response to avoid leaking server info
  if (isProduction) {
    return res.json({ message: "LifeByDorm Backend is Running" });
  }

  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({
    message: "LifeByDorm Backend is Running",
    environment: process.env.NODE_ENV,
    database: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    lastError: connectionError ? (connectionError.message || String(connectionError)) : null
  });
});

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Groq AI client (lazy-initialized)
let groqClient: Groq | null = null;
function getGroq(): Groq | null {
  if (groqClient) return groqClient;
  if (!process.env.GROQ_API_KEY) {
    if (!isProduction) console.warn('⚠️ GROQ_API_KEY not configured, AI summaries disabled');
    return null;
  }
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

// AI Summary prompt — change this text and all cached summaries auto-invalidate
const DORM_SUMMARY_SYSTEM_PROMPT = `Write a short summary of a university dorm based on student reviews. Keep it between 80 and 100 words. Use simple, everyday words that are easy to read. Do NOT use fancy or complex vocabulary. Write in third person. Be balanced and mention both the good and the bad. NEVER use em dashes (—). Use commas, periods, or the word "but" instead. Do not make up details that are not in the reviews.

Here is an example of a good summary style:
"Warren Towers is a popular freshman dorm at BU, offering a social atmosphere with plenty of chances to make friends. The location is very convenient, right in the heart of campus, making it a short walk to most classes. The building has a dining hall, laundry, and study spaces all within reach. While the rooms can be small and outdated, the sense of community and being close to everything on campus makes up for it. The shared bathrooms and occasional maintenance issues are downsides, but the lively feel and central location make it a top choice for freshmen."

Follow this style. Keep words simple and clear.

After the summary, on a new line, write exactly 3 short keyword tags that describe this dorm. Format them on a single line like this:
TAGS: Social, Great Location, Small Rooms

The tags should be 1-3 words each and capture the most common themes from the reviews.`;

const SUMMARY_PROMPT_HASH = crypto.createHash('sha256').update(DORM_SUMMARY_SYSTEM_PROMPT).digest('hex').slice(0, 16);

async function generateDormSummary(
  dormId: string,
  dormName: string,
  universitySlug: string,
  dormSlug: string
): Promise<string | null> {
  try {
    const groq = getGroq();
    if (!groq) return null;

    const reviews = await UserReview.find({
      university: universitySlug,
      dorm: dormName,
      $or: [{ status: 'approved' }, { status: { $exists: false } }]
    }).lean();

    if (reviews.length < 5) return null;

    // Calculate average ratings per category
    const totals = { room: 0, bathroom: 0, building: 0, amenities: 0, location: 0 };
    let wouldDormAgainCount = 0;
    for (const r of reviews as any[]) {
      totals.room += r.room || 0;
      totals.bathroom += r.bathroom || 0;
      totals.building += r.building || 0;
      totals.amenities += r.amenities || 0;
      totals.location += r.location || 0;
      if (r.wouldDormAgain === true) wouldDormAgainCount++;
    }
    const count = reviews.length;
    const avgRoom = (totals.room / count).toFixed(1);
    const avgBathroom = (totals.bathroom / count).toFixed(1);
    const avgBuilding = (totals.building / count).toFixed(1);
    const avgAmenities = (totals.amenities / count).toFixed(1);
    const avgLocation = (totals.location / count).toFixed(1);
    const wouldDormAgainPct = Math.round((wouldDormAgainCount / count) * 100);

    // Select a representative sample if there are many reviews
    const withText = (reviews as any[]).filter(r => r.description && r.description.trim());
    let sampled: any[];
    const MAX_REVIEWS = 30;

    if (withText.length <= MAX_REVIEWS) {
      sampled = withText;
    } else {
      // Sort by overall rating to pick from the full spectrum
      const sorted = [...withText].sort((a, b) => {
        const avgA = (a.room + a.bathroom + a.building + a.amenities + a.location) / 5;
        const avgB = (b.room + b.bathroom + b.building + b.amenities + b.location) / 5;
        return avgA - avgB;
      });

      // 10 lowest-rated, 10 highest-rated, 10 most recent
      const lowest = sorted.slice(0, 10);
      const highest = sorted.slice(-10);
      const usedIds = new Set([...lowest, ...highest].map(r => String(r._id)));
      const recent = [...withText]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter(r => !usedIds.has(String(r._id)))
        .slice(0, 10);

      sampled = [...lowest, ...highest, ...recent];
    }

    const reviewTexts = sampled
      .map((r, i) => `${i + 1}. "${r.description}"`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content: DORM_SUMMARY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Summarize student reviews for "${dormName}" at ${universitySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}.

Total reviews: ${count}
${sampled.length < withText.length ? `Showing ${sampled.length} representative reviews (mix of highest-rated, lowest-rated, and most recent).` : ''}
Average ratings (out of 5):
- Room: ${avgRoom}
- Bathroom: ${avgBathroom}
- Building: ${avgBuilding}
- Amenities: ${avgAmenities}
- Location: ${avgLocation}
- Would Dorm Again: ${wouldDormAgainPct}%

Student comments:
${reviewTexts}

Write a summary between 80 and 100 words. Use simple, clear words. Do NOT use em dashes. Do NOT use big or fancy words.
Then on a new line write: TAGS: tag1, tag2, tag3`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    // Parse tags from the response
    let summary = raw;
    let aiTags: string[] = [];
    const tagsMatch = raw.match(/^TAGS:\s*(.+)$/im);
    if (tagsMatch) {
      aiTags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
      summary = raw.replace(/\n*TAGS:\s*.+$/im, '').trim();
    }

    await Dorm.findByIdAndUpdate(dormId, {
      aiSummary: summary,
      aiTags,
      summaryGeneratedAt: new Date(),
      summaryPromptHash: SUMMARY_PROMPT_HASH
    });

    // Invalidate in-memory cache for this dorm
    cache.delete(`dorm-${universitySlug}-${dormSlug}`);

    if (!isProduction) console.log(`✅ AI summary generated for ${dormName}`, aiTags);
    return summary;
  } catch (err) {
    console.error(`Failed to generate AI summary for ${dormName}:`, err);
    return null;
  }
}

// Academic email verification (subdomain-aware)
function normalizeEmailForVerification(email: string): string {
  const [user, domain] = email.split('@');
  const parts = domain.split('.');
  if (parts.length >= 3) {
    return user + '@' + parts.slice(-2).join('.');
  }
  return email;
}

async function isAcademicEmail(email: string): Promise<boolean> {
  try {
    const normalized = normalizeEmailForVerification(email);
    return await Verifier.isAcademic(normalized);
  } catch {
    return false;
  }
}

// CORS configuration - Moved to top of file
// const ALLOWED_ORIGINS = ...
// (Commented out legacy block removed to avoid confusion)

// MongoDB Connection optimized for Serverless with Global Caching
let cached = (global as any).mongoose;
let connectionError: any = null; // Store last connection error for diagnostics

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 30000,
      family: 4,
      maxPoolSize: 1,        // Lambda handles 1 request at a time
      minPoolSize: 1,        // Keep 1 connection ready
      maxIdleTimeMS: 270000, // Close idle connections after ~4.5 min (Lambda freezes at ~5 min)
    };

    if (!isProduction) console.log('🔌 Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebydorm';
    if (!isProduction) console.log(`Target URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      if (!isProduction) console.log('✅ MongoDB connected successfully');
      connectionError = null;
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    connectionError = e;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }
};

// Create a middleware to ensure DB connection is established for every request
const dbMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed in middleware');
    next();
  }
};

// Fix 404 for favicon to reduce log noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Apply DB Middleware to API routes and Root
app.use(dbMiddleware);


// Apply general API rate limiting to all /api routes
app.use('/api/', apiLimiter);

// ========================================
// BATCH STATS ENDPOINT - Optimized for homepage
// Returns all university and dorm statistics in a single request
// ========================================
app.get('/api/stats/homepage', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = 'homepage-stats';
    const cachedResult = getCached<any>(cacheKey);
    if (cachedResult) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
      return res.json(cachedResult);
    }

    // Use aggregation pipeline to compute stats on the database server
    // instead of fetching entire collections into memory
    const [universities, dorms, reviewStats, recentVerifiedReviewsRaw] = await Promise.all([
      University.find({}).lean(),
      Dorm.find({
        $or: [{ status: 'approved' }, { status: { $exists: false } }]
      }).lean(),
      UserReview.aggregate([
        { $match: { $or: [{ status: 'approved' }, { status: { $exists: false } }] } },
        {
          $group: {
            _id: { university: '$university', dorm: '$dorm' },
            avgRoom: { $avg: '$room' },
            avgBathroom: { $avg: '$bathroom' },
            avgBuilding: { $avg: '$building' },
            avgAmenities: { $avg: '$amenities' },
            avgLocation: { $avg: '$location' },
            reviewCount: { $sum: 1 }
          }
        }
      ]),
      UserReview.find({
        verified: true,
        description: { $regex: /\S/ },
        $or: [
          { status: 'approved' },
          { status: { $exists: false } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ]);

    // Build lookup maps from aggregation results
    const universityStats: { [slug: string]: { reviewCount: number } } = {};
    const dormStats: { [key: string]: { avgRating: number; reviewCount: number; totalRating: number } } = {};
    let totalReviewsCount = 0;

    const universityNameMap = new Map<string, string>();
    universities.forEach((uni: any) => {
      universityStats[uni.slug] = { reviewCount: 0 };
      if (uni.slug && uni.name) {
        universityNameMap.set(uni.slug, uni.name);
      }
    });

    reviewStats.forEach((stat: any) => {
      const uni = stat._id.university;
      const dorm = stat._id.dorm;
      const overallAvg = (stat.avgRoom + stat.avgBathroom + stat.avgBuilding + stat.avgAmenities + stat.avgLocation) / 5;

      // Count for university
      if (uni && universityStats[uni]) {
        universityStats[uni].reviewCount += stat.reviewCount;
      }

      // Stats for dorm
      const dormKey = `${uni}:${dorm}`;
      dormStats[dormKey] = {
        avgRating: overallAvg,
        reviewCount: stat.reviewCount,
        totalRating: overallAvg * stat.reviewCount
      };

      totalReviewsCount += stat.reviewCount;
    });

    // Prepare response with enriched data
    const enrichedUniversities = universities.map((uni: any) => ({
      ...uni,
      reviewCount: universityStats[uni.slug]?.reviewCount || 0
    }));

    const enrichedDorms = dorms.map((dorm: any) => {
      const dormKey = `${dorm.universitySlug}:${dorm.name}`;
      const stats = dormStats[dormKey] || { avgRating: 0, reviewCount: 0 };
      return {
        ...dorm,
        avgRating: stats.avgRating,
        reviewCount: stats.reviewCount,
        universityName: universityNameMap.get(dorm.universitySlug) || dorm.universitySlug
      };
    });

    // Sort and get top universities by review count
    const topUniversities = [...enrichedUniversities]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 10);

    // Sort and get top dorms by rating
    // Only include dorms with at least 3 reviews to prevent outliers from topping the list
    const topRatedDorms = [...enrichedDorms]
      .filter(dorm => dorm.reviewCount >= 3)
      .sort((a, b) => {
        if (b.avgRating === a.avgRating) return b.reviewCount - a.reviewCount;
        return b.avgRating - a.avgRating;
      })
      .slice(0, 10);

    // Sort and get most reviewed dorms
    const mostReviewedDorms = [...enrichedDorms]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 10);

    const dormLookupByName = new Map<string, any>();
    enrichedDorms.forEach((dorm: any) => {
      const dormNameKey = `${dorm.universitySlug}:${String(dorm.name || '').trim().toLowerCase()}`;
      dormLookupByName.set(dormNameKey, dorm);
    });

    // Fetch user details for recent reviews (supports reviews storing either user id or email)
    const userIdentifiers = [...new Set(recentVerifiedReviewsRaw.map((r: any) => String(r.user || '').trim()).filter(Boolean))];
    const objectIdRegex = /^[a-f\d]{24}$/i;
    const objectUserIds = userIdentifiers.filter((id) => objectIdRegex.test(id));
    const emailUserIds = userIdentifiers.filter((id) => id.includes('@'));

    let users: any[] = [];
    if (objectUserIds.length > 0 || emailUserIds.length > 0) {
      users = await User.find({
        $or: [
          ...(objectUserIds.length > 0 ? [{ _id: { $in: objectUserIds } }] : []),
          ...(emailUserIds.length > 0 ? [{ email: { $in: emailUserIds } }] : [])
        ]
      }).select('email').lean();
    }

    const userMap = new Map<string, string>();
    users.forEach((u: any) => {
      const email = String(u.email || '').trim();
      if (!email) return;
      userMap.set(String(u._id), email);
      userMap.set(email, email);
    });

    const recentVerifiedReviews = recentVerifiedReviewsRaw
      .filter((review: any) => /\S/.test(String(review.description || '')))
      .map((review: any) => {
        const uni = String(review.university || '').trim();
        const dorm = String(review.dorm || '').trim();
        const dormKey = `${uni}:${dorm.toLowerCase()}`;
        const dormData = dormLookupByName.get(dormKey);

        const uniSlug = dormData?.universitySlug || uni;
        const rawUser = String(review.user || '').trim();
        const userEmail = userMap.get(rawUser) || (rawUser.includes('@') ? rawUser : '');
        const firstVisibleChar = userEmail.match(/[A-Za-z0-9]/)?.[0] || 'A';

        return {
          ...review,
          dormSlug: dormData?.slug || dorm.toLowerCase().replace(/\s+/g, '-'),
          universitySlug: uniSlug,
          universityName: universityNameMap.get(uniSlug) || uniSlug,
          dormImageUrl: dormData?.imageUrl || null,
          userInitial: firstVisibleChar.toUpperCase()
        };
      })
      .filter((review: any) => !!review.universitySlug && !!review.dormSlug)
      .slice(0, 30);

    const result = {
      topUniversities,
      topRatedDorms,
      mostReviewedDorms,
      recentVerifiedReviews,
      universityStats,
      dormStats,
      totalReviewsCount
    };

    // Cache the result
    setCache(cacheKey, result);

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
    res.json(result);
  } catch (err) {
    console.error('Error fetching homepage stats', err);
    res.status(500).json({ message: 'Error fetching homepage stats' });
  }
});

// Test route to check MongoDB connection (Admin Only)
app.get('/api/test', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Check if database connection exists
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Get database name safely
    const dbName = mongoose.connection.db.databaseName;

    res.json({
      status: 'Connected to MongoDB',
      database: dbName,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({
      status: 'Error',
      message: errorMessage
    });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
//USER AUTHENTICATION ROUTES AND SET UP
////////////////////////////////////////////////////////////////////////////////////////////////////////

// Register new user
app.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    // OWASP: Logging - Do not log sensitive information like passwords
    if (!isProduction) console.log('Received registration request for:', req.body.email);
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!isProduction) console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword
    });

    if (!isProduction) console.log('Saving new user:', email);
    const savedUser = await user.save();
    if (!isProduction) console.log('User saved successfully:', savedUser._id);

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    // Create token - Security: Explicitly specify algorithm to prevent algorithm substitution attacks
    const token = jwt.sign(
      { userId: savedUser._id, name: savedUser.email },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login user
app.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    // OWASP: Account Enumeration Prevention - Use generic error messages
    const genericErrorMessage = 'Invalid email or password';

    if (!user) {
      return res.status(400).json({ message: genericErrorMessage });
    }

    // Check password
    if (!user.password) {
      return res.status(400).json({ message: 'User does not have a password. Please use email verification.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: genericErrorMessage });
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    // Determine role from DB if present, otherwise fall back to ADMIN_EMAILS env
    const dbRole = (user as any).role as string | undefined;
    const isAdmin = (dbRole === 'admin') || ADMIN_EMAILS.includes(user.email);
    const token = jwt.sign(
      { userId: user._id, name: user.email, role: isAdmin ? 'admin' : 'user' },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Email Transporter Configuration (Lazy Load)
let transporter: any = null;
const getTransporter = () => {
  if (!transporter) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error);
    }
  }
  return transporter;
};

// Send Verification Code
app.post('/auth/send-code', authLimiter, validate(sendCodeSchema), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Security: Generate cryptographically secure 6-digit code
    const rawCode = generateSecureCode();
    const hashedCode = await bcrypt.hash(rawCode, 10);
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if not exists
      user = new User({
        email,
        password: await bcrypt.hash(Math.random().toString(36), 12), // Random dummy password
        verificationCode: hashedCode,
        verificationCodeExpires
      });
    } else {
      // Update existing user
      user.verificationCode = hashedCode;
      user.verificationCodeExpires = verificationCodeExpires;
    }
    await user.save();

    // Security: Only log debug info in development
    if (!isProduction) {
      const pass = process.env.EMAIL_PASS || '';
      console.log('[DEBUG] Email Auth Check:');
      console.log(`- EMAIL_USER: '${process.env.EMAIL_USER}'`);
      console.log(`- EMAIL_PASS Length: ${pass.length}`);
      console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    }

    if (!isProduction) {
      console.log(`[Auth] Verification code generated for ${email}`);
      console.log(`[Auth] Attempting to send email from: ${process.env.EMAIL_USER ? 'Set' : 'Missing'} to: ${email}`);
    }

    // Send email if credentials are present, otherwise just log (for dev)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const info = await getTransporter().sendMail({
          from: '"LifeByDorm" <support@lifebydorm.ca>',
          to: email,
          subject: 'Your Verification Code',
          text: `Your verification code is: ${rawCode}. It expires in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #1e3a5f;">Verify your LifeByDorm Login</h2>
              <p>Your verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">${rawCode}</h1>
              <p>This code expires in 10 minutes.</p>
              <p>If you didn't request this code, you can safely ignore this email.</p>
            </div>
          `
        });
        if (!isProduction) {
          console.log(`[Auth] Email sent successfully using ${process.env.EMAIL_USER}`);
          console.log(`[Auth] Message ID: ${info.messageId}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
        // Fallback to console log in dev if email fails
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Auth] FALLBACK: Code for ${email} is: ${rawCode}`);
        }
        throw emailError; // Re-throw to handle in main catch
      }
    } else {
      console.warn('[Auth] No EMAIL_USER or EMAIL_PASS defined in environment variables');
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Auth] No email credentials found. Code for ${email} is: ${rawCode}`);
      }
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error in send-code endpoint:', error);
    res.status(500).json({ message: 'Error sending verification code' });
  }
});

// Verify Code and Login
app.post('/auth/verify-code', authLimiter, validate(verifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    // Security: Only log debug info in development
    if (!isProduction) {
      console.log(`[Auth] Verifying code for ${email}`);
    }

    // First find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[Auth] Verification failed: User not found for email ${email}`);
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Security: Compare verification code using bcrypt (codes are hashed in DB)
    if (!user.verificationCode) {
      if (!isProduction) {
        console.log(`[Auth] Verification failed: No code stored`);
      }
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    const codeMatch = await bcrypt.compare(code, user.verificationCode);
    if (!codeMatch) {
      if (!isProduction) {
        console.log(`[Auth] Verification failed: Code mismatch`);
      }
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Check expiration
    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      if (!isProduction) {
        console.log(`[Auth] Verification failed: Code expired`);
      }
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    if (!isProduction) {
      console.log(`[Auth] Verification successful for ${email}`);
    }

    // Clear code after successful use
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    // Determine role and generate token
    const dbRole = (user as any).role as string | undefined;
    const isAdmin = (dbRole === 'admin') || ADMIN_EMAILS.includes(user.email);
    const token = jwt.sign(
      { userId: user._id, name: user.email, role: isAdmin ? 'admin' : 'user' },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Error verifying code' });
  }
});

// Google OAuth login - simplified with ID token verification
// Performance: Lazy-initialize to avoid cold-start penalty when not used
let _googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (!_googleClient) {
    _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return _googleClient;
}

app.post('/auth/google', authLimiter, validate(googleAuthSchema), async (req, res) => {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ message: 'Google credential or access_token is required' });
    }

    let googleId, email, name, picture;

    if (credential) {
      // Verify the ID token
      const ticket = await getGoogleClient().verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ message: 'Invalid Google token' });
      }

      email = payload.email;
      googleId = payload.sub;
      name = payload.name;
      picture = payload.picture;
    } else if (access_token) {
      // Verify using Access Token via Google UserInfo API
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const data = await response.json() as any;
        email = data.email;
        googleId = data.sub;
        name = data.name;
        picture = data.picture;
      } catch (err) {
        console.error('Google UserInfo fetch error:', err);
        return res.status(400).json({ message: 'Invalid Google access token' });
      }
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        password: await bcrypt.hash(Math.random().toString(36), 12), // Random password for OAuth users
        googleId,
        name,
        picture,
      });
      await user.save();
      if (!isProduction) console.log('New Google user created:', email);
    } else if (!(user as any).googleId) {
      (user as any).googleId = googleId;
      (user as any).name = name;
      (user as any).picture = picture;
      await user.save();
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    const dbRole = (user as any).role as string | undefined;
    const isAdmin = (dbRole === 'admin') || ADMIN_EMAILS.includes(user.email);

    const token = jwt.sign(
      { userId: user._id, name: user.email, role: isAdmin ? 'admin' : 'user' },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY }
    );

    res.json({ token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Error authenticating with Google' });
  }
});


interface AuthRequest extends Request {
  user?: JwtPayload;
}

function authenticationToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    // Security: Explicitly specify allowed algorithms to prevent algorithm substitution attacks
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret, { algorithms: [JWT_ALGORITHM] }) as JwtPayload;
    req.user = verified;
    next();
  } catch (error) {
    // Security: Do not leak JWT error details (e.g. "jwt expired", "invalid signature")
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Middleware to check if user is admin
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////
//END OF USER AUTHENTICATION ROUTES AND SET UP
////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////
//UNIVERSITY ROUTES AND SET UP
////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get all universities
app.get('/api/universities', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const cacheKey = 'all-universities';
    const cached = getCached<any>(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
      return res.json(cached);
    }

    const universities = await University.find({}).sort({ name: 1 }).lean();

    setCache(cacheKey, universities);
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
    res.json(universities);
  } catch (err) {
    console.error('Error fetching universities', err);
    res.status(500).json({ message: 'Error fetching universities' });
  }
});

// Get dorms for a university by university slug (must come before /:slug route)
app.get('/api/universities/:slug/dorms', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    // Only return approved dorms OR dorms without a status field (legacy dorms)
    const dorms = await Dorm.find({
      universitySlug: slug,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    }).sort({ name: 1 }).lean();
    res.set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=60');
    res.json(dorms);
  } catch (err) {
    console.error('Error fetching dorms for university', err);
    res.status(500).json({ message: 'Error fetching dorms' });
  }
});

// ========================================
// BATCH DORM STATS ENDPOINT - Optimized for university dashboard
// Returns dorms with ratings and review counts in a single request
// ========================================
app.get('/api/universities/:slug/dorms-stats', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Check cache first
    const cacheKey = `dorms-stats-${slug}`;
    const cachedData = getCached<any>(cacheKey);
    if (cachedData) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
      return res.json(cachedData);
    }

    // Fetch dorms and reviews in parallel (independent queries on different collections)
    const [dorms, reviews] = await Promise.all([
      Dorm.find({
        universitySlug: slug,
        $or: [
          { status: 'approved' },
          { status: { $exists: false } }
        ]
      }).sort({ name: 1 }).lean(),
      UserReview.find({
        university: slug,
        $or: [
          { status: 'approved' },
          { status: { $exists: false } }
        ]
      }).lean()
    ]);

    // Calculate stats per dorm
    const dormStats: { [dormName: string]: { totalRating: number; reviewCount: number } } = {};

    reviews.forEach((review: any) => {
      if (!review.dorm) return;

      if (!dormStats[review.dorm]) {
        dormStats[review.dorm] = { totalRating: 0, reviewCount: 0 };
      }

      const overallRating = (review.room + review.bathroom + review.building + review.amenities + review.location) / 5;
      dormStats[review.dorm].reviewCount++;
      dormStats[review.dorm].totalRating += overallRating;
    });

    // Enrich dorms with stats
    const enrichedDorms = dorms.map((dorm: any) => {
      const stats = dormStats[dorm.name] || { totalRating: 0, reviewCount: 0 };
      return {
        ...dorm,
        avgRating: stats.reviewCount > 0 ? stats.totalRating / stats.reviewCount : 0,
        reviewCount: stats.reviewCount
      };
    });

    // Cache the result
    setCache(cacheKey, enrichedDorms);

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
    res.json(enrichedDorms);
  } catch (err) {
    console.error('Error fetching dorm stats for university', err);
    res.status(500).json({ message: 'Error fetching dorm stats' });
  }
});

// ========================================
// SINGLE DORM ENDPOINT - Optimized for dorm detail page
// Returns a single dorm with its ratings and review count
// ========================================
app.get('/api/universities/:slug/dorms/:dormSlug', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const { slug, dormSlug } = req.params;

    // Check cache first
    const cacheKey = `dorm-${slug}-${dormSlug}`;
    const cachedData = getCached<any>(cacheKey);
    if (cachedData) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
      return res.json(cachedData);
    }

    // Find the specific dorm
    const dorm = await Dorm.findOne({
      universitySlug: slug,
      slug: dormSlug,
      $or: [{ status: 'approved' }, { status: { $exists: false } }]
    }).lean();

    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }

    // Calculate stats from reviews
    const reviews = await UserReview.find({
      university: slug,
      dorm: (dorm as any).name,
      $or: [{ status: 'approved' }, { status: { $exists: false } }]
    }).lean();

    let avgRating = 0;
    if (reviews.length > 0) {
      const total = reviews.reduce((sum: number, r: any) => {
        return sum + (r.room + r.bathroom + r.building + r.amenities + r.location) / 5;
      }, 0);
      avgRating = total / reviews.length;
    }

    const result: any = {
      ...dorm,
      avgRating,
      reviewCount: reviews.length
    };

    // AI summary: lazy weekly refresh
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const dormObj = dorm as any;
    if (reviews.length >= 5) {
      const summaryAge = dormObj.summaryGeneratedAt
        ? Date.now() - new Date(dormObj.summaryGeneratedAt).getTime()
        : Infinity;

      const promptChanged = dormObj.summaryPromptHash !== SUMMARY_PROMPT_HASH;

      if (summaryAge > SEVEN_DAYS_MS || promptChanged) {
        const newSummary = await generateDormSummary(
          dormObj._id.toString(), dormObj.name, slug, dormSlug
        );
        if (newSummary) {
          result.aiSummary = newSummary;
          result.summaryGeneratedAt = new Date();
          // Re-fetch to get the aiTags that were saved during generation
          const updatedDorm = await Dorm.findById(dormObj._id).lean() as any;
          if (updatedDorm?.aiTags) {
            result.aiTags = updatedDorm.aiTags;
          }
        }
      }
    }

    // Cache the result
    setCache(cacheKey, result);

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
    res.json(result);
  } catch (err) {
    console.error('Error fetching dorm', err);
    res.status(500).json({ message: 'Error fetching dorm' });
  }
});

// Compare two dorms with AI analysis
app.get('/api/compare', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    let dorm1: string, uni1: string, dorm2: string, uni2: string;
    try {
      ({ dorm1, uni1, dorm2, uni2 } = compareQuerySchema.parse(req.query));
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or missing query params: dorm1, uni1, dorm2, uni2' });
    }

    // Fetch both dorms and their reviews in parallel
    const reviewQuery = (uniSlug: string, dormName: string) => ({
      university: uniSlug,
      dorm: dormName,
      $or: [{ status: 'approved' }, { status: { $exists: false } }]
    });

    const [dormDoc1, dormDoc2] = await Promise.all([
      Dorm.findOne({ universitySlug: uni1, slug: dorm1, $or: [{ status: 'approved' }, { status: { $exists: false } }] }).lean(),
      Dorm.findOne({ universitySlug: uni2, slug: dorm2, $or: [{ status: 'approved' }, { status: { $exists: false } }] }).lean(),
    ]);

    if (!dormDoc1 || !dormDoc2) {
      return res.status(404).json({ message: 'One or both dorms not found' });
    }

    const d1 = dormDoc1 as any;
    const d2 = dormDoc2 as any;

    const [reviews1, reviews2] = await Promise.all([
      UserReview.find(reviewQuery(uni1, d1.name)).lean(),
      UserReview.find(reviewQuery(uni2, d2.name)).lean(),
    ]);

    if (reviews1.length < 5 || reviews2.length < 5) {
      return res.status(400).json({
        message: 'Both dorms must have at least 5 approved reviews to compare',
        dorm1ReviewCount: reviews1.length,
        dorm2ReviewCount: reviews2.length,
      });
    }

    // Calculate stats for each dorm
    function calcStats(reviews: any[]) {
      const totals = { room: 0, bathroom: 0, building: 0, amenities: 0, location: 0 };
      let wouldDormAgainCount = 0;
      for (const r of reviews) {
        totals.room += r.room || 0;
        totals.bathroom += r.bathroom || 0;
        totals.building += r.building || 0;
        totals.amenities += r.amenities || 0;
        totals.location += r.location || 0;
        if (r.wouldDormAgain === true) wouldDormAgainCount++;
      }
      const n = reviews.length;
      return {
        reviewCount: n,
        avgRoom: +(totals.room / n).toFixed(1),
        avgBathroom: +(totals.bathroom / n).toFixed(1),
        avgBuilding: +(totals.building / n).toFixed(1),
        avgAmenities: +(totals.amenities / n).toFixed(1),
        avgLocation: +(totals.location / n).toFixed(1),
        avgOverall: +((totals.room + totals.bathroom + totals.building + totals.amenities + totals.location) / (n * 5)).toFixed(1),
        wouldDormAgainPct: Math.round((wouldDormAgainCount / n) * 100),
      };
    }

    const stats1 = calcStats(reviews1 as any[]);
    const stats2 = calcStats(reviews2 as any[]);

    // Build AI comparison
    const groq = getGroq();
    let comparison: string | null = null;

    if (groq) {
      try {
        // Use existing AI summaries if available, otherwise sample reviews
        const uniName = (slug: string) => slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        const dorm1Context = d1.aiSummary
          ? `AI Summary: ${d1.aiSummary}`
          : (reviews1 as any[]).filter(r => r.description?.trim()).slice(0, 15).map((r, i) => `${i + 1}. "${r.description}"`).join('\n');

        const dorm2Context = d2.aiSummary
          ? `AI Summary: ${d2.aiSummary}`
          : (reviews2 as any[]).filter(r => r.description?.trim()).slice(0, 15).map((r, i) => `${i + 1}. "${r.description}"`).join('\n');

        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 800,
          messages: [
            {
              role: 'system',
              content: `You are a university housing advisor writing a dorm comparison. The user can already see the numerical ratings — do NOT repeat or reference any numbers or scores. Focus on what students actually said in their reviews: the lived experience, specific details, and qualitative differences.

Structure your response with these three sections:

**Overview** — One sentence per dorm capturing its personality (e.g., "social and central but showing its age" vs "sleek and quiet but feels isolated").

**Key Differences** — Compare the 3-4 areas where the dorms differ most based on what students described. Use specific details from reviews (e.g., "thin walls", "long winter walk", "floor kitchens") rather than ratings.

**Verdict** — 2-3 sentences on which dorm suits which type of student. Be specific and opinionated.

Be balanced, concise, and grounded in the reviews. Do not fabricate details. Use markdown formatting.`
            },
            {
              role: 'user',
              content: `Compare these two dorms:

DORM 1: "${d1.name}" at ${uniName(uni1)}
- Ratings: Room ${stats1.avgRoom}, Bathroom ${stats1.avgBathroom}, Building ${stats1.avgBuilding}, Amenities ${stats1.avgAmenities}, Location ${stats1.avgLocation}
- Overall: ${stats1.avgOverall}/5 | Would Dorm Again: ${stats1.wouldDormAgainPct}% | ${stats1.reviewCount} reviews
${dorm1Context}

DORM 2: "${d2.name}" at ${uniName(uni2)}
- Ratings: Room ${stats2.avgRoom}, Bathroom ${stats2.avgBathroom}, Building ${stats2.avgBuilding}, Amenities ${stats2.avgAmenities}, Location ${stats2.avgLocation}
- Overall: ${stats2.avgOverall}/5 | Would Dorm Again: ${stats2.wouldDormAgainPct}% | ${stats2.reviewCount} reviews
${dorm2Context}

Compare these two dorms using the exact format specified.`
            }
          ]
        });

        comparison = completion.choices[0]?.message?.content?.trim() || null;
      } catch (err) {
        console.error('Failed to generate AI comparison:', err);
      }
    }

    res.json({
      dorm1: {
        name: d1.name, slug: d1.slug, universitySlug: d1.universitySlug,
        imageUrl: d1.imageUrl, amenities: d1.amenities || [], roomTypes: d1.roomTypes || [],
        ...stats1,
      },
      dorm2: {
        name: d2.name, slug: d2.slug, universitySlug: d2.universitySlug,
        imageUrl: d2.imageUrl, amenities: d2.amenities || [], roomTypes: d2.roomTypes || [],
        ...stats2,
      },
      comparison,
    });
  } catch (err) {
    console.error('Error comparing dorms:', err);
    res.status(500).json({ message: 'Error comparing dorms' });
  }
});

// Get a single university by slug
app.get('/api/universities/:slug', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const cacheKey = `university-${slug}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
      return res.json(cached);
    }

    const university = await University.findOne({ slug }).lean();
    if (!university) return res.status(404).json({ message: 'University not found' });

    setCache(cacheKey, university);
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
    res.json(university);
  } catch (err) {
    console.error('Error fetching university', err);
    res.status(500).json({ message: 'Error fetching university' });
  }
});

// Public endpoint: search approved dorms (lightweight, no auth required)
app.get('/api/dorms/search', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const cacheKey = 'dorms-search';
    const cached = getCached<any>(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
      return res.json(cached);
    }

    const dorms = await Dorm.find(
      { $or: [{ status: 'approved' }, { status: { $exists: false } }] },
      { name: 1, slug: 1, universitySlug: 1, _id: 0 }
    ).sort({ name: 1 }).lean();

    setCache(cacheKey, dorms);
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60');
    res.json(dorms);
  } catch (err) {
    console.error('Error fetching dorms for search', err);
    res.status(500).json({ message: 'Error fetching dorms' });
  }
});

// List all dorms (admin only - includes all statuses)
app.get('/api/dorms', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const dorms = await Dorm.find({}).sort({ universitySlug: 1, name: 1 }).lean();
    res.json(dorms);
  } catch (err) {
    console.error('Error fetching all dorms', err);
    res.status(500).json({ message: 'Error fetching dorms' });
  }
});

// Submit a new dorm (requires authentication, pending approval)
app.post('/api/dorms', authenticationToken, validate(dormSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, universitySlug, description, imageUrl, amenities, roomTypes } = req.body;
    const userEmail = req.user?.name || '';

    // Validate required fields
    if (!name || !universitySlug) {
      return res.status(400).json({ message: 'Name and university are required' });
    }

    // Create slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if dorm with same slug already exists for this university
    const existingDorm = await Dorm.findOne({ universitySlug, slug });
    if (existingDorm) {
      return res.status(400).json({ message: 'A dorm with this name already exists for this university' });
    }

    // Create new dorm with pending status
    const dorm = new Dorm({
      name,
      slug,
      universitySlug,
      description: description || '',
      imageUrl: imageUrl || null,
      amenities: amenities || [],
      roomTypes: roomTypes || [],
      status: 'pending',
      submittedBy: userEmail,
      createdAt: new Date()
    });

    const savedDorm = await dorm.save();
    console.log('✅ New dorm submitted for approval:', {
      name: savedDorm.name,
      university: savedDorm.universitySlug,
      submittedBy: savedDorm.submittedBy
    });

    res.status(201).json({
      message: 'Dorm submitted for approval',
      dorm: savedDorm
    });
  } catch (err) {
    console.error('Error submitting dorm', err);
    res.status(500).json({ message: 'Error submitting dorm' });
  }
});

// Reviews API: create and fetch reviews
app.post('/api/reviews', submitLimiter, validate(reviewSchema), async (req: Request, res: Response) => {
  try {
    const {
      university,
      dorm,
      room,
      bathroom,
      building,
      amenities,
      location,
      description,
      year,
      roomType,
      wouldDormAgain,
      fileImage,
      images
    } = req.body;

    // Check if user is logged in and has an academic email for verified badge
    let isVerified = false;
    let userEmail = '';
    const authHeader = req.headers.authorization;
    if (!isProduction) {
      console.log('🔑 Auth header present:', !!authHeader);
      console.log('🔑 Auth header value:', authHeader ? authHeader.substring(0, 50) + '...' : '(none)');
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as JwtPayload;
        userEmail = decoded.name || '';
        // Verified badge requires a recognized university email
        isVerified = userEmail ? await isAcademicEmail(userEmail) : false;
        if (!isProduction) console.log('🎓 Academic email check:', userEmail, '→', isVerified);
      } catch (err) {
        if (!isProduction) console.log('🔑 Token verification failed:', err instanceof Error ? err.message : 'Unknown error');
        isVerified = false;
      }
    }

    if (!isProduction) {
      console.log('📥 Received review data:');
      console.log('  - fileImage:', fileImage ? 'EXISTS' : 'NONE');
      console.log('  - images:', images);
      console.log('  - images length:', images ? images.length : 0);
      console.log('  - verified:', isVerified);
      console.log('  - user email:', userEmail || '(none)');
    }

    // Process images: upload base64 strings to S3
    let processedFileImage = fileImage;
    if (fileImage && typeof fileImage === 'string' && fileImage.startsWith('data:')) {
      try {
        if (!isProduction) console.log('📤 Uploading fileImage to S3...');
        processedFileImage = await uploadToS3(fileImage, 'reviews/main');
      } catch (err) {
        console.error('❌ Failed to upload fileImage:', err);
      }
    }

    let processedImages = images || [];
    if (processedImages.length > 0) {
      if (!isProduction) console.log(`📤 Uploading ${processedImages.length} additional images to S3...`);
      processedImages = await Promise.all(processedImages.map(async (img: string) => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          try {
            return await uploadToS3(img, 'reviews/gallery');
          } catch (err) {
            console.error('❌ Failed to upload gallery image:', err);
            return img;
          }
        }
        return img;
      }));
    }

    const review = new UserReview({
      university,
      dorm,
      room,
      bathroom,
      building,
      amenities,
      location,
      // Security: Sanitize description to prevent stored XSS attacks
      description: sanitizeInput(description),
      year,
      roomType,
      wouldDormAgain,
      fileImage: processedFileImage,
      images: processedImages,
      verified: isVerified,
      user: userEmail
    });

    const saved = await review.save();
    if (!isProduction) {
      console.log('✅ Saved review to DB:', {
        id: saved._id,
        university: saved.university,
        dorm: saved.dorm,
        imagesLength: saved.images ? saved.images.length : 0,
        verified: saved.verified,
        user: saved.user || '(none)'
      });
    }
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving review', err);
    // If this is a Mongoose validation error, return 400 with details
    // err may be any type, so guard properties
    // @ts-ignore
    if (err && err.name === 'ValidationError') {
      // @ts-ignore
      const details = Object.keys(err.errors || {}).reduce((acc: any, key) => {
        // @ts-ignore
        acc[key] = err.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: 'Validation error', errors: details });
    }

    res.status(500).json({ message: 'Error saving review' });
  }
});

app.get('/api/reviews', readOnlyLimiter, async (req: Request, res: Response) => {
  try {
    const { university, dorm, limit: limitParam, skip: skipParam } = req.query;

    // Security: Pagination with sensible limits to prevent DoS
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 50;
    const limit = Math.min(parseInt(limitParam as string) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = Math.max(parseInt(skipParam as string) || 0, 0);

    // Check cache (shorter TTL for reviews since they change more frequently)
    const cacheKey = `reviews-${university || ''}-${dorm || ''}-${limit}-${skip}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=30');
      return res.json(cached);
    }

    // Show approved reviews OR reviews without a status field (legacy reviews)
    const filter: any = {
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    };
    if (university) filter.university = university;
    if (dorm) filter.dorm = dorm;

    const reviews = await UserReview.aggregate([
      { $match: filter },
      {
        $addFields: {
          hasWrittenDescription: {
            $gt: [
              {
                $strLenCP: {
                  $trim: {
                    input: { $ifNull: ['$description', ''] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      { $sort: { hasWrittenDescription: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { hasWrittenDescription: 0 } }
    ]);

    setCache(cacheKey, reviews);
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=30');
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews', err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get reviews for the logged-in user
app.get('/api/reviews/user', authenticationToken, async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.name;
    if (!isProduction) console.log('📋 Fetching reviews for user:', userEmail);

    if (!userEmail) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find reviews by user email
    const reviews = await UserReview.aggregate([
      { $match: { user: userEmail } },
      {
        $addFields: {
          hasWrittenDescription: {
            $gt: [
              {
                $strLenCP: {
                  $trim: {
                    input: { $ifNull: ['$description', ''] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      { $sort: { hasWrittenDescription: -1, createdAt: -1 } },
      { $project: { hasWrittenDescription: 0 } }
    ]);
    if (!isProduction) console.log('📋 Found', reviews.length, 'reviews for user:', userEmail);
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching user reviews', err);
    res.status(500).json({ message: 'Error fetching user reviews' });
  }
});

// Edit a review (authenticated user, ownership check)
// Stores the edit as a pendingEdit draft — the original stays live until admin approves
app.put('/api/reviews/:id', authenticationToken, validate(editReviewSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.name;

    if (!userEmail) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    const review = await UserReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ownership check: only the review author can edit
    if (review.user !== userEmail) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Don't allow editing if there's already a pending edit
    if (review.pendingEdit) {
      return res.status(409).json({ message: 'You already have a pending edit for this review. Please wait for admin approval.' });
    }

    const {
      room, bathroom, building, amenities, location,
      description, year, roomType, wouldDormAgain, images
    } = req.body;

    // Process new images: upload base64 strings to S3
    let processedImages = images || [];
    if (processedImages.length > 0) {
      if (!isProduction) console.log(`📤 Uploading ${processedImages.length} edit images to S3...`);
      processedImages = await Promise.all(processedImages.map(async (img: string) => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          try {
            return await uploadToS3(img, 'reviews/gallery');
          } catch (err) {
            console.error('❌ Failed to upload edit image:', err);
            return img;
          }
        }
        return img;
      }));
    }

    // Store the edit as a pending draft
    review.pendingEdit = {
      room,
      bathroom,
      building,
      amenities,
      location,
      description: sanitizeInput(description),
      year: Array.isArray(year) ? year : [year],
      roomType: Array.isArray(roomType) ? roomType : [roomType],
      wouldDormAgain: wouldDormAgain ?? false,
      images: processedImages,
      submittedAt: new Date()
    };

    await review.save();

    if (!isProduction) {
      console.log('✅ Pending edit saved for review:', id);
    }

    res.json({ message: 'Edit submitted for review', review });
  } catch (err) {
    console.error('Error editing review', err);
    res.status(500).json({ message: 'Error editing review' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// ADMIN ROUTES - Analytics
////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get dashboard analytics stats (admin only)
app.get('/api/admin/stats', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Timezone Bug Fix: Use EST instead of standard server time
    const nowLocal = new Date();
    // 1. Get current time in EST as a local Date object.
    const estDateStr = nowLocal.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDateLocal = new Date(estDateStr);

    // 2. We want midnight of estDateLocal
    const estMidnightLocal = new Date(estDateLocal.getFullYear(), estDateLocal.getMonth(), estDateLocal.getDate());

    // 3. What is the difference between UTC now and EST now?
    const offset = nowLocal.getTime() - estDateLocal.getTime();

    // 4. Actual UTC time of EST midnight:
    const startOfToday = new Date(estMidnightLocal.getTime() + offset);

    const startOfWeekEST = new Date(estMidnightLocal);
    startOfWeekEST.setDate(startOfWeekEST.getDate() - 7);
    const startOfWeek = new Date(startOfWeekEST.getTime() + offset);

    // Run all queries in parallel for performance
    const [
      totalUsers,
      newUsersThisWeek,
      totalReviews,
      reviewsToday,
      reviewsThisWeek,
      pendingReviews,
      approvedReviews,
      totalDorms,
      topDorms,
      topUniversities,
      totalUniversities
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      // New users this week
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      // Total reviews (approved + legacy only — matches what users see)
      UserReview.countDocuments({ $or: [{ status: 'approved' }, { status: { $exists: false } }] }),
      // Reviews submitted today
      UserReview.countDocuments({ createdAt: { $gte: startOfToday } }),
      // Reviews submitted this week
      UserReview.countDocuments({ createdAt: { $gte: startOfWeek } }),
      // Pending reviews
      UserReview.countDocuments({ status: 'pending' }),
      // Approved reviews
      UserReview.countDocuments({ status: 'approved' }),
      // Total dorms
      Dorm.countDocuments({ status: 'approved' }),
      // Top 10 most reviewed dorms
      UserReview.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: { dorm: '$dorm', university: '$university' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, dorm: '$_id.dorm', university: '$_id.university', reviewCount: '$count' } }
      ]),
      // Top 10 most active universities
      UserReview.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$university', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, university: '$_id', reviewCount: '$count' } }
      ]),
      // Total Supported Universities
      University.countDocuments()
    ]);

    res.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek
      },
      reviews: {
        total: totalReviews,
        approved: approvedReviews,
        pending: pendingReviews,
        today: reviewsToday,
        thisWeek: reviewsThisWeek
      },
      dorms: {
        total: totalDorms
      },
      universities: {
        total: totalUniversities
      },
      topDorms,
      topUniversities
    });
  } catch (err) {
    console.error('Error fetching admin stats', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// ADMIN ROUTES - Review Management
////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get all pending reviews (admin only)
// Includes brand-new pending reviews AND approved reviews with a pending edit
app.get('/api/admin/reviews/pending', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pendingReviews = await UserReview.find({
      $or: [
        { status: 'pending' },
        { pendingEdit: { $exists: true, $ne: null } }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Images are publicly accessible on S3, so we return them directly
    // (presigning was converting working public URLs into broken ones in production)
    res.json(pendingReviews);
  } catch (err) {
    console.error('Error fetching pending reviews', err);
    res.status(500).json({ message: 'Error fetching pending reviews' });
  }
});

// Get all reviews with any status (admin only)
app.get('/api/admin/reviews/all', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allReviews = await UserReview.find({}).sort({ createdAt: -1 }).lean();
    res.json(allReviews);
  } catch (err) {
    console.error('Error fetching all reviews', err);
    res.status(500).json({ message: 'Error fetching all reviews' });
  }
});

// Approve a review (admin only)
// If the review has a pendingEdit, apply the edit fields to the main document
app.patch('/api/admin/reviews/:id/approve', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });

    const review = await UserReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // If there's a pending edit, apply the edit fields to the main review
    // Note: Do NOT change the status — it's already 'approved'
    if (review.pendingEdit) {
      review.room = review.pendingEdit.room;
      review.bathroom = review.pendingEdit.bathroom;
      review.building = review.pendingEdit.building;
      review.amenities = review.pendingEdit.amenities;
      review.location = review.pendingEdit.location;
      review.description = review.pendingEdit.description;
      review.year = review.pendingEdit.year;
      review.roomType = review.pendingEdit.roomType;
      review.wouldDormAgain = review.pendingEdit.wouldDormAgain;
      review.images = review.pendingEdit.images || [];
      review.pendingEdit = undefined;
      if (!isProduction) console.log('✅ Applied pending edit for review:', id);
    } else {
      // Only set status to approved for brand-new pending reviews
      review.status = 'approved';
    }

    await review.save();

    // AI summary: check if this approval crosses the 5-review threshold
    if (!review.pendingEdit) {
      const approvedCount = await UserReview.countDocuments({
        university: review.university,
        dorm: review.dorm,
        $or: [{ status: 'approved' }, { status: { $exists: false } }]
      });

      if (approvedCount >= 5) {
        const dormDoc = await Dorm.findOne({
          universitySlug: review.university,
          name: review.dorm
        });
        if (dormDoc && !dormDoc.aiSummary) {
          await generateDormSummary(
            (dormDoc._id as any).toString(), dormDoc.name, dormDoc.universitySlug, dormDoc.slug
          );
        }
      }
    }

    res.json({ message: 'Review approved', review });
  } catch (err) {
    console.error('Error approving review', err);
    res.status(500).json({ message: 'Error approving review' });
  }
});

// Decline a review (admin only)
// If the review has a pendingEdit, just clear the edit (keep original).
// If it's a brand-new pending review, delete it permanently.
app.patch('/api/admin/reviews/:id/decline', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });

    const review = await UserReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // If this review has a pending edit, just clear the edit and keep the original
    if (review.pendingEdit) {
      review.pendingEdit = undefined;
      await review.save();
      if (!isProduction) console.log('🚫 Declined pending edit for review:', id, '— original preserved');
      return res.json({ message: 'Edit declined, original review preserved', review });
    }

    // Otherwise it's a brand-new pending review — delete it
    await UserReview.findByIdAndDelete(id);
    res.json({ message: 'Review declined and removed' });
  } catch (err) {
    console.error('Error declining review', err);
    res.status(500).json({ message: 'Error declining review' });
  }
});

// Delete a review permanently (admin only)
app.delete('/api/admin/reviews/:id', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    const review = await UserReview.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted permanently' });
  } catch (err) {
    console.error('Error deleting review', err);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Toggle upvote or downvote on a review
app.post('/api/reviews/:id/vote', authenticationToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'upvote' or 'downvote'
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }

    if (type !== 'upvote' && type !== 'downvote') {
      return res.status(400).json({ message: 'Invalid vote type. Must be upvote or downvote' });
    }

    const review = await UserReview.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const upvotes = review.upvotes || [];
    const downvotes = review.downvotes || [];

    const hasUpvoted = upvotes.includes(userId);
    const hasDownvoted = downvotes.includes(userId);

    if (type === 'upvote') {
      if (hasUpvoted) {
        // Toggle off upvote
        review.upvotes = upvotes.filter(idStr => idStr !== userId);
      } else {
        // Add upvote, remove downvote if exists
        review.upvotes = [...upvotes, userId];
        review.downvotes = downvotes.filter(idStr => idStr !== userId);
      }
    } else if (type === 'downvote') {
      if (hasDownvoted) {
        // Toggle off downvote
        review.downvotes = downvotes.filter(idStr => idStr !== userId);
      } else {
        // Add downvote, remove upvote if exists
        review.downvotes = [...downvotes, userId];
        review.upvotes = upvotes.filter(idStr => idStr !== userId);
      }
    }

    const updatedReview = await review.save();

    // Return the updated upvotes and downvotes to the client
    res.json({
      message: 'Vote updated successfully',
      upvotes: updatedReview.upvotes,
      downvotes: updatedReview.downvotes
    });
  } catch (err) {
    console.error('Error toggling vote', err);
    res.status(500).json({ message: 'Error toggling vote' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// ADMIN ROUTES - Dorm Management
////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get all pending dorms (admin only)
app.get('/api/admin/dorms/pending', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pendingDorms = await Dorm.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();

    // Sign image URLs
    const dormsWithSignedUrls = await Promise.all(pendingDorms.map(async (dorm: any) => {
      if (dorm.imageUrl) {
        dorm.imageUrl = await getSignedFileUrl(dorm.imageUrl);
      }
      return dorm;
    }));

    res.json(dormsWithSignedUrls);
  } catch (err) {
    console.error('Error fetching pending dorms', err);
    res.status(500).json({ message: 'Error fetching pending dorms' });
  }
});

// Get all dorms with any status (admin only)
app.get('/api/admin/dorms/all', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allDorms = await Dorm.find({}).sort({ createdAt: -1 }).lean();
    res.json(allDorms);
  } catch (err) {
    console.error('Error fetching all dorms', err);
    res.status(500).json({ message: 'Error fetching all dorms' });
  }
});

// Approve a dorm (admin only)
app.patch('/api/admin/dorms/:id/approve', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    const dorm = await Dorm.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }
    console.log('✅ Dorm approved:', dorm.name);
    res.json({ message: 'Dorm approved', dorm });
  } catch (err) {
    console.error('Error approving dorm', err);
    res.status(500).json({ message: 'Error approving dorm' });
  }
});

// Decline a dorm (admin only)
app.patch('/api/admin/dorms/:id/decline', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    const dorm = await Dorm.findByIdAndUpdate(
      id,
      { status: 'declined' },
      { new: true }
    );
    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }
    console.log('❌ Dorm declined:', dorm.name);
    res.json({ message: 'Dorm declined', dorm });
  } catch (err) {
    console.error('Error declining dorm', err);
    res.status(500).json({ message: 'Error declining dorm' });
  }
});

// Delete a dorm permanently (admin only)
app.delete('/api/admin/dorms/:id', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID format' });
    const dorm = await Dorm.findByIdAndDelete(id);
    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }
    console.log('🗑️ Dorm deleted:', dorm.name);
    res.json({ message: 'Dorm deleted permanently' });
  } catch (err) {
    console.error('Error deleting dorm', err);
    res.status(500).json({ message: 'Error deleting dorm' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// END ADMIN ROUTES - Dorm Management
////////////////////////////////////////////////////////////////////////////////////////////////////////
// CONTACT FORM ENDPOINT
////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post('/api/contact', submitLimiter, validate(contactSchema), async (req: Request, res: Response) => {
  try {
    const { fullName, email, message } = req.body;

    // Sanitize all user inputs to prevent email header injection and XSS
    const safeName = sanitizeInput(fullName);
    const safeMessage = sanitizeInput(message);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await getTransporter().sendMail({
        from: '"LifeByDorm Contact" <support@lifebydorm.ca>',
        to: process.env.EMAIL_USER, // Send to your own support email
        replyTo: email,
        subject: `New Contact Message from ${safeName}`,
        text: `Name: ${safeName}\nEmail: ${email}\n\nMessage:\n${safeMessage}`,
      });
      res.status(200).json({ message: 'Message sent successfully' });
    } else {
      console.warn('⚠️ Contact form submitted but email credentials are missing.');
      res.status(500).json({ message: 'Email service unavailable' });
    }
  } catch (err) {
    console.error('Error sending contact email:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// HEALTH CHECK ENDPOINT (for Docker/Kubernetes health probes)
////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// STATIC FILE SERVING (Production - serve built React app)
////////////////////////////////////////////////////////////////////////////////////////////////////////
if (process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
  // Serve static files from the React build directory
  // Note: specific to CommonJS/ESM
  const staticPath = path.join(process.cwd(), 'dist');
  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all non-API routes
  // Use a RegExp route to avoid path-to-regexp errors with a bare '*'
  app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  console.log(`📁 Serving static files from: ${staticPath}`);
}

// Note: Duplicate global error handler removed — single handler at bottom of file

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Optional: Perform cleanup or exit
  // process.exit(1); // Usually recommended to exit, but user wants to prevent crash "at anytime"
  console.log('⚠️ Process kept alive after uncaught exception.');
});

// ========================================
// GLOBAL ERROR HANDLER - Must be last middleware
// Prevents stack trace leakage in production
// ========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error details for debugging (visible in AWS CloudWatch / server logs)
  console.error('❌ Unhandled Error:', err.stack || err.message || err);

  // In production, return a generic message to avoid leaking implementation details
  if (isProduction) {
    return res.status(500).json({
      message: 'Something went wrong. Please try again later.',
      requestId: req.headers['x-amzn-requestid'] || undefined // AWS request ID for tracing
    });
  }

  // In development, return detailed error for debugging
  return res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: err.stack
  });
});

// Handle Unhandled Rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: Perform cleanup or exit
  console.log('⚠️ Process kept alive after unhandled rejection.');
});

// Start server if not running in Vercel or AWS Lambda


// Start server if not running in Vercel or AWS Lambda
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}



export default app;

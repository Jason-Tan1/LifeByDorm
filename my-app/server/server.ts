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

// Security: Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Security: JWT Configuration
const JWT_ALGORITHM: Algorithm = 'HS256';
const JWT_EXPIRY = '24h';

// Security: Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

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
  reviewSchema
} from './validation';

dotenv.config();
console.log('Loaded secret:', process.env.ACCESS_TOKEN_SECRET ? '✅ Loaded' : '❌ Missing');

// Validate required environment variables
if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error('❌ CRITICAL: ACCESS_TOKEN_SECRET is not defined in .env file');
  // Do not exit process in Vercel environment, as it causes "Internal Server Error" without CORS headers
  // process.exit(1); 
  console.warn('⚠️ Process continuing without ACCESS_TOKEN_SECRET - Auth will fail');
}

// Admin emails (comma-separated) read from env, e.g. ADMIN_EMAILS=admin@example.com,alice@org.com
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
console.log('Admin emails:', ADMIN_EMAILS.length ? ADMIN_EMAILS : 'none');

const app = express()

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
  'http://localhost:3000'
].filter(Boolean);

// Vercel preview deployment pattern for your project
// Allow any subdomain starting with life-by-dorm
const VERCEL_PREVIEW_PATTERN = /^https:\/\/life-by-dorm.*\.vercel\.app$/; // Matches life-by-dorm-git-main...

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // If FRONTEND_URL is set to '*', allow all origins
    if (process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

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

// Debug route needs to be before DB middleware to work even if DB fails
app.get('/api/debug/config', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
    // Safely check if MONGO_URI is set without revealing it
    hasMongoUri: !!process.env.MONGODB_URI, 
    mongoUriStartsWith: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : 'undefined',
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
    nodeEnv: process.env.NODE_ENV
  });
});

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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    console.log('🔌 Connecting to MongoDB...');
    // Log the URI (masked) to debugging
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebydorm';
    console.log(`Target URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
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
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch all universities
    const universities = await University.find({}).lean();

    // Fetch all approved dorms
    const dorms = await Dorm.find({
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    }).lean();

    // Fetch all approved reviews
    const reviews = await UserReview.find({
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    }).lean();

    // Calculate university stats (review count per university)
    const universityStats: { [slug: string]: { reviewCount: number } } = {};
    universities.forEach((uni: any) => {
      universityStats[uni.slug] = { reviewCount: 0 };
    });

    // Calculate dorm stats (avg rating and review count per dorm)
    const dormStats: { [key: string]: { avgRating: number; reviewCount: number; totalRating: number } } = {};

    reviews.forEach((review: any) => {
      // Count for university
      if (review.university && universityStats[review.university]) {
        universityStats[review.university].reviewCount++;
      }

      // Calculate overall rating for dorm
      const dormKey = `${review.university}:${review.dorm}`;
      const overallRating = (review.room + review.bathroom + review.building + review.amenities + review.location) / 5;

      if (!dormStats[dormKey]) {
        dormStats[dormKey] = { avgRating: 0, reviewCount: 0, totalRating: 0 };
      }
      dormStats[dormKey].reviewCount++;
      dormStats[dormKey].totalRating += overallRating;
    });

    // Calculate averages for dorms
    Object.keys(dormStats).forEach(key => {
      const stat = dormStats[key];
      stat.avgRating = stat.reviewCount > 0 ? stat.totalRating / stat.reviewCount : 0;
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
        reviewCount: stats.reviewCount
      };
    });

    // Sort and get top universities by review count
    const topUniversities = [...enrichedUniversities]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 7);

    // Sort and get top dorms by rating
    const topRatedDorms = [...enrichedDorms]
      .sort((a, b) => {
        if (b.avgRating === a.avgRating) return b.reviewCount - a.reviewCount;
        return b.avgRating - a.avgRating;
      })
      .slice(0, 7);

    // Sort and get most reviewed dorms
    const mostReviewedDorms = [...enrichedDorms]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 7);

    const result = {
      topUniversities,
      topRatedDorms,
      mostReviewedDorms,
      universityStats,
      dormStats
    };

    // Cache the result
    setCache(cacheKey, result);

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

interface Post {
  username: string;
  title: string;
}

const posts: Post[] = [
  { username: 'Jason', title: 'Post 1' },
  { username: 'Joey', title: 'Post 2' }
];

///////////////////////////////////////////////////////////////////////////////////////////////////////
//USER AUTHENTICATION ROUTES AND SET UP
////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/posts', authenticationToken, (req: AuthRequest, res: Response) => {
  res.json(posts.filter(post => post.username === req.user?.name))
})

// Register new user
app.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  try {
    // OWASP: Logging - Do not log sensitive information like passwords
    console.log('Received registration request for:', req.body.email);
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword
    });

    console.log('Saving new user:', email);
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

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
    const verificationCode = generateSecureCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user if not exists
      user = new User({
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random dummy password
        verificationCode,
        verificationCodeExpires
      });
    } else {
      // Update existing user
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
    }
    await user.save();

    // Security: Only log debug info in development
    // Debug: Log email config in all environments to debug production issue
    const pass = process.env.EMAIL_PASS || '';
    console.log('[DEBUG] Email Auth Check:');
    console.log(`- EMAIL_USER: '${process.env.EMAIL_USER}'`);
    console.log(`- EMAIL_PASS Length: ${pass.length}`);
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

    // Verify transporter connection on startup
    getTransporter().verify(function (error: Error | null, success: any) {
      if (error) {
        console.log('❌ Email Server Connect Failed immediately:', error.message);
        console.log('   Host:', getTransporter().options.host);
      } else {
        console.log('✅ Email Server login succeeded! Ready to send.');
        console.log('   Host:', getTransporter().options.host);
        console.log('   User:', process.env.EMAIL_USER);
      }
    });
    
    // DEBUG ENDPOINT: Remove after fixing production issue
    app.get('/api/test-email-config', async (req, res) => {
      try {
        const pass = process.env.EMAIL_PASS || '';
        const user = process.env.EMAIL_USER;
        
        let verifyResult = 'Not Attempted';
        try {
           await getTransporter().verify();
           verifyResult = 'Success';
        } catch (err: any) {
           verifyResult = `Failed: ${err.message}`;
        }

        res.json({
          status: 'debug',
          env: {
            NODE_ENV: process.env.NODE_ENV,
            EMAIL_USER: user ? user : 'MISSING/UNDEFINED',
            EMAIL_PASS_LENGTH: pass.length,
            EMAIL_PASS_STARTS_WITH: pass.substring(0, 2) + '***' // Safe mask
          },
          smtp_verify: verifyResult
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log(`[Auth] Verification code generated for ${email}`);
    console.log(`[Auth] Attempting to send email from: ${process.env.EMAIL_USER ? 'Set' : 'Missing'} to: ${email}`);

    // Send email if credentials are present, otherwise just log (for dev)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const info = await getTransporter().sendMail({
          from: '"LifeByDorm" <support@lifebydorm.ca>',
          to: email,
          subject: 'Your Verification Code',
          text: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #1e3a5f;">Verify your LifeByDorm Login</h2>
              <p>Your verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">${verificationCode}</h1>
              <p>This code expires in 10 minutes.</p>
              <p>If you didn't request this code, you can safely ignore this email.</p>
            </div>
          `
        });
        console.log(`[Auth] Email sent successfully using ${process.env.EMAIL_USER}`);
        console.log(`[Auth] Message ID: ${info.messageId}`);
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
        // Fallback to console log in dev if email fails
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Auth] FALLBACK: Code for ${email} is: ${verificationCode}`);
        }
        throw emailError; // Re-throw to handle in main catch
      }
    } else {
      console.warn('[Auth] No EMAIL_USER or EMAIL_PASS defined in environment variables');
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Auth] No email credentials found. Code for ${email} is: ${verificationCode}`);
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

    // Security: Use timing-safe comparison to prevent timing attacks
    if (!user.verificationCode || !safeCompare(user.verificationCode, code)) {
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
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/auth/google', authLimiter, validate(googleAuthSchema), async (req, res) => {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ message: 'Google credential or access_token is required' });
    }

    let googleId, email, name, picture;

    if (credential) {
      // Verify the ID token
      const ticket = await googleClient.verifyIdToken({
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
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        googleId,
        name,
        picture,
      });
      await user.save();
      console.log('New Google user created:', email);
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
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'Invalid token' });
    }
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
app.get('/api/universities', async (req: Request, res: Response) => {
  try {
    const universities = await University.find({}).sort({ name: 1 }).lean();
    res.json(universities);
  } catch (err) {
    console.error('Error fetching universities', err);
    res.status(500).json({ message: 'Error fetching universities' });
  }
});

// Get dorms for a university by university slug (must come before /:slug route)
app.get('/api/universities/:slug/dorms', async (req: Request, res: Response) => {
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
      return res.json(cachedData);
    }

    // Fetch dorms for this university
    const dorms = await Dorm.find({
      universitySlug: slug,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    }).sort({ name: 1 }).lean();

    // Fetch all reviews for this university in one query
    const reviews = await UserReview.find({
      university: slug,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    }).lean();

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

    const result = {
      ...dorm,
      avgRating,
      reviewCount: reviews.length
    };

    // Cache the result
    setCache(cacheKey, result);

    res.json(result);
  } catch (err) {
    console.error('Error fetching dorm', err);
    res.status(500).json({ message: 'Error fetching dorm' });
  }
});

// Get a single university by slug
app.get('/api/universities/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const university = await University.findOne({ slug }).lean();
    if (!university) return res.status(404).json({ message: 'University not found' });
    res.json(university);
  } catch (err) {
    console.error('Error fetching university', err);
    res.status(500).json({ message: 'Error fetching university' });
  }
});

// Debug: list all dorms
app.get('/api/dorms', async (req: Request, res: Response) => {
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
app.post('/api/reviews', validate(reviewSchema), async (req: Request, res: Response) => {
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

    // Check if user is logged in (verified) via Authorization header
    let isVerified = false;
    let userEmail = '';
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth header present:', !!authHeader);
    console.log('🔑 Auth header value:', authHeader ? authHeader.substring(0, 50) + '...' : '(none)');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as JwtPayload;
        isVerified = true;
        userEmail = decoded.name || '';
      } catch (err) {
        console.log('🔑 Token verification failed:', err instanceof Error ? err.message : 'Unknown error');
        isVerified = false;
      }
    }

    console.log('📥 Received review data:');
    console.log('  - fileImage:', fileImage ? 'EXISTS' : 'NONE');
    console.log('  - images:', images);
    console.log('  - images length:', images ? images.length : 0);
    console.log('  - verified:', isVerified);
    console.log('  - user email:', userEmail || '(none)');

    // Process images: upload base64 strings to S3
    let processedFileImage = fileImage;
    if (fileImage && typeof fileImage === 'string' && fileImage.startsWith('data:')) {
      try {
        console.log('📤 Uploading fileImage to S3...');
        processedFileImage = await uploadToS3(fileImage, 'reviews/main');
      } catch (err) {
        console.error('❌ Failed to upload fileImage:', err);
      }
    }

    let processedImages = images || [];
    if (processedImages.length > 0) {
      console.log(`📤 Uploading ${processedImages.length} additional images to S3...`);
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
    console.log('✅ Saved review to DB:', {
      id: saved._id,
      university: saved.university,
      dorm: saved.dorm,
      imagesLength: saved.images ? saved.images.length : 0,
      verified: saved.verified,
      user: saved.user || '(none)'
    });
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

app.get('/api/reviews', async (req: Request, res: Response) => {
  try {
    const { university, dorm, limit: limitParam, skip: skipParam } = req.query;

    // Security: Pagination with sensible limits to prevent DoS
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 50;
    const limit = Math.min(parseInt(limitParam as string) || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = Math.max(parseInt(skipParam as string) || 0, 0);

    // Show approved reviews OR reviews without a status field (legacy reviews)
    const filter: any = {
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    };
    if (university) filter.university = university;
    if (dorm) filter.dorm = dorm;

    const reviews = await UserReview.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

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
    console.log('📋 Fetching reviews for user:', userEmail);

    if (!userEmail) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find reviews by user email
    const reviews = await UserReview.find({ user: userEmail }).sort({ createdAt: -1 }).lean();
    console.log('📋 Found', reviews.length, 'reviews for user:', userEmail);
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching user reviews', err);
    res.status(500).json({ message: 'Error fetching user reviews' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
// ADMIN ROUTES - Review Management
////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get all pending reviews (admin only)
app.get('/api/admin/reviews/pending', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pendingReviews = await UserReview.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    
    // Sign image URLs so they can be viewed even if S3 block public access is on
    const reviewsWithSignedUrls = await Promise.all(pendingReviews.map(async (review: any) => {
      if (review.fileImage) {
        review.fileImage = await getSignedFileUrl(review.fileImage);
      }
      if (review.images && review.images.length > 0) {
        review.images = await Promise.all(review.images.map((img: string) => getSignedFileUrl(img)));
      }
      return review;
    }));

    res.json(reviewsWithSignedUrls);
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
app.patch('/api/admin/reviews/:id/approve', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = await UserReview.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review approved', review });
  } catch (err) {
    console.error('Error approving review', err);
    res.status(500).json({ message: 'Error approving review' });
  }
});

// Decline a review (admin only)
app.patch('/api/admin/reviews/:id/decline', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const review = await UserReview.findByIdAndUpdate(
      id,
      { status: 'declined' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review declined', review });
  } catch (err) {
    console.error('Error declining review', err);
    res.status(500).json({ message: 'Error declining review' });
  }
});

// Delete a review permanently (admin only)
app.delete('/api/admin/reviews/:id', authenticationToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
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

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

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

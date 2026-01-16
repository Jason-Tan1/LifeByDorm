import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose'; // MongoDB Connections from Node.js
import bcrypt from 'bcryptjs'; //Hide Passwords
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import { User, IUser } from './models/user';
import { UserReview } from './models/userreview';
import { University } from './models/universities';
import { Dorm } from './models/dorm';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import { uploadToS3 } from './s3';

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
  process.exit(1);
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
  'https://life-by-dorm.vercel.app', // Production frontend
  'https://lifebydorm.vercel.app', // Alternative production alias
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000'
].filter(Boolean);

// Vercel preview deployment pattern for your project
// Allow any subdomain starting with life-by-dorm owned by specific accounts/structures
// Simplified regex to avoid greedy matching issues
const VERCEL_PREVIEW_PATTERN = /^https:\/\/life-by-dorm.*\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // If FRONTEND_URL is set to '*', allow all origins
    if (process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

    // Exact match allowed origins
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments for your project
    if (VERCEL_PREVIEW_PATTERN.test(origin)) {
      console.log(`✅ Allowed Vercel Preview Origin: ${origin}`);
      return callback(null, true);
    }

    // Allow common localhost/127.0.0.1 origins in non-production (dev) environments
    // AND explicitly allow them if NODE_ENV is not set (which sometimes happens)
    if ((process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') || !process.env.NODE_ENV) {
      try {
        const parsed = new URL(origin);
        const host = parsed.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) {
        // ignore parse errors and fall through to block
      }
    }

    console.warn(`🚫 Blocked CORS request from unauthorized origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // Cache preflight requests for 24 hours
}));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" } // Allow Google Login popups
})); // Set secure HTTP headers

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
    const states: {[key: number]: string} = {
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
/* 
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] // Production: only your domain
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']; // Development: local URLs

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // Cache preflight requests for 24 hours
}));
*/

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

    // Create token
    const token = jwt.sign(
      { userId: savedUser._id, name: savedUser.email },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { expiresIn: '24h' }
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
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send Verification Code
app.post('/auth/send-code', authLimiter, validate(sendCodeSchema), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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

    console.log(`[Auth] Verification code generated for ${email}`);

    // Send email if credentials are present, otherwise just log (for dev)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your LifeByDorm Verification Code',
            text: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`
        });
        console.log(`[Auth] Email sent to ${email}`);
    } else {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Auth] No email credentials found. Code for ${email} is: ${verificationCode}`);
        } else {
            console.log(`[Auth] No email credentials found. Suppressed code logging in production.`);
        }
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending code:', error);
    res.status(500).json({ message: 'Error sending verification code' });
  }
});

// Verify Code and Login
app.post('/auth/verify-code', authLimiter, validate(verifyCodeSchema), async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

        const user = await User.findOne({ 
            email, 
            verificationCode: code,
            verificationCodeExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
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
            { expiresIn: '24h' }
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
      { expiresIn: '24h' }
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

    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as JwtPayload;
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
      description,
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
    const { university, dorm } = req.query;
    // Show approved reviews OR reviews without a status field (legacy reviews)
    const filter: any = { 
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    };
    if (university) filter.university = university;
    if (dorm) filter.dorm = dorm;
    const reviews = await UserReview.find(filter).sort({ createdAt: -1 }).lean();
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
    res.json(pendingDorms);
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

// Handle Unhandled Rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: Perform cleanup or exit
   console.log('⚠️ Process kept alive after unhandled rejection.');
});

// Start server if not running in Vercel (Vercel exports the app instead)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;


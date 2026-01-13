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

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 auth requests per windowMs
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (generous for development)
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration - restrict to trusted origins
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

// Increase JSON body size limit to allow base64 image uploads from the client.
// The frontend encodes images as data URLs; increase the limit to 10mb.
app.use(express.json({ limit: '10mb' }))
// Also parse URL-encoded bodies (forms) with the same limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebydorm');
    
    // Check if connection is successful and database is accessible
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready');
    }
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ MongoDB connection error:', error.message);
    } else {
      console.error('❌ MongoDB connection error: Unknown error');
    }
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Apply general API rate limiting to all /api routes
app.use('/api/', apiLimiter);

// Test route to check MongoDB connection
app.get('/api/test', async (req: Request, res: Response) => {
  try {
    // Check if database connection exists
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get users without passwords
    const users = await User.find({}, { password: 0 }).lean();

    // Get database name safely
    const dbName = mongoose.connection.db.databaseName;

    res.json({ 
      status: 'Connected to MongoDB',
      database: dbName,
      collections: collections.map(c => c.name),
      users: users
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
app.post('/register', authLimiter, async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
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
app.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    if (!user.password) {
      return res.status(400).json({ message: 'User does not have a password. Please use email verification.' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
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
app.post('/auth/send-code', authLimiter, async (req, res) => {
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
        console.log(`[Auth] No email credentials found. Code for ${email} is: ${verificationCode}`);
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending code:', error);
    res.status(500).json({ message: 'Error sending verification code' });
  }
});

// Verify Code and Login
app.post('/auth/verify-code', authLimiter, async (req, res) => {
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

app.post('/auth/google', authLimiter, async (req, res) => {
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
app.post('/api/dorms', authenticationToken, async (req: AuthRequest, res: Response) => {
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
app.post('/api/reviews', async (req: Request, res: Response) => {
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
      console.log('🔑 Token extracted, length:', token?.length);
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as JwtPayload;
        console.log('🔑 Decoded token payload:', JSON.stringify(decoded, null, 2));
        isVerified = true;
        userEmail = decoded.name || '';
        console.log('🔑 User email from token:', userEmail);
      } catch (err) {
        console.log('🔑 Token verification failed:', err);
        isVerified = false;
      }
    }

    console.log('📥 Received review data:');
    console.log('  - fileImage:', fileImage ? 'EXISTS' : 'NONE');
    console.log('  - images:', images);
    console.log('  - images length:', images ? images.length : 0);
    console.log('  - verified:', isVerified);
    console.log('  - user email:', userEmail || '(none)');

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
      fileImage,
      images,
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
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build directory
  const staticPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(staticPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  
  console.log(`📁 Serving static files from: ${staticPath}`);
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});


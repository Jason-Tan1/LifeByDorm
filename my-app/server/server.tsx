import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose'; // MongoDB Connections from Node.js
import bcrypt from 'bcryptjs'; //Hide Passwords
import { User, IUser } from './models/User';
import { UserReview } from './models/UserReview';

dotenv.config();
console.log('Loaded secret:', process.env.ACCESS_TOKEN_SECRET ? '✅ Loaded' : '❌ Missing');

const app = express()

app.use(cors())
app.use(express.json())

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
app.post('/register', async (req, res) => {
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
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, name: user.email },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
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
////////////////////////////////////////////////////////////////////////////////////////////////////////
//END OF USER AUTHENTICATION ROUTES AND SET UP
////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////
//UNIVERSITY ROUTES AND SET UP
////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      fileImage
    } = req.body;

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
      fileImage
    });

    const saved = await review.save();
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
    const filter: any = {};
    if (university) filter.university = university;
    if (dorm) filter.dorm = dorm;
    const reviews = await UserReview.find(filter).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews', err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


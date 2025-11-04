require('dotenv').config()
console.log('Loaded secret:', process.env.ACCESS_TOKEN_SECRET ? '✅ Loaded' : '❌ Missing')

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')   
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')

const app = express()

app.use(cors())
app.use(express.json())

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebydorm');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Test route to check MongoDB connection
app.get('/api/test', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const users = await User.find({}, { password: 0 }); // Exclude passwords from the response
    res.json({ 
      status: 'Connected to MongoDB',
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      users: users
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error',
      message: error.message
    });
  }
});

const posts = [
  { username: 'Jason', title: 'Post 1' },
  { username: 'Joey', title: 'Post 2' }
]

app.get('/posts', authenticationToken, (req, res) => {
  res.json(posts.filter(post => post.username === req.user.name))
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
    
    // Create token
    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.ACCESS_TOKEN_SECRET,
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

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

function authenticationToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
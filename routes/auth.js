const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Check if MongoDB is connected
const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Mock user storage for development when DB is not available
let mockUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    username: 'TestUser',
    email: 'test@canble.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPeGvGzjYwSgjkMIniVuy9wvJ9Apu', // testpassword123
    avatar: null,
    status: 'online',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 2, max: 32 })
    .withMessage('Username must be between 2 and 32 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    if (!isDBConnected()) {
      // Mock database behavior for development
      console.log('Using mock database for registration');
      
      // Check if user already exists in mock storage
      const existingUser = mockUsers.find(u => u.email === email || u.username === username);
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new mock user
      const newUser = {
        _id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        avatar: null,
        status: 'online',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUsers.push(newUser);

      // Generate JWT token
      const payload = {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email
        }
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d'
      });

      return res.json({
        success: true,
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          status: newUser.status
        }
      });
    }

    // Normal database operation
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .exists()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    if (!isDBConnected()) {
      // Mock database behavior for development
      console.log('Using mock database for login');
      
      // Find user in mock storage
      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update user status
      user.status = 'online';
      user.lastSeen = new Date();

      // Generate JWT token
      const payload = {
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d'
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          servers: [] // Empty servers array for mock
        }
      });
    }

    // Normal database operation
    // Find user by email
    const user = await User.findOne({ email }).populate('servers');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update user status and last seen
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        discriminator: user.discriminator,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        servers: user.servers,
        friends: user.friends,
        customStatus: user.customStatus,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('servers')
      .populate('friends.user', 'username discriminator avatar status')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update user status to offline
    await User.findByIdAndUpdate(req.user.id, {
      status: 'offline',
      lastSeen: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   PUT /api/auth/status
// @desc    Update user status
// @access  Private
router.put('/status', auth, [
  body('status')
    .isIn(['online', 'away', 'busy', 'invisible'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, customStatus } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        status,
        customStatus: customStatus || '',
        lastSeen: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Status updated successfully',
      user
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('username')
    .optional()
    .isLength({ min: 2, max: 32 })
    .withMessage('Username must be between 2 and 32 characters'),
  body('bio')
    .optional()
    .isLength({ max: 190 })
    .withMessage('Bio must be less than 190 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, bio, avatar, banner, accentColor } = req.body;
    const updateData = {};

    if (username) {
      // Check if username is already taken
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      
      updateData.username = username;
    }

    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (banner !== undefined) updateData.banner = banner;
    if (accentColor !== undefined) updateData.accentColor = accentColor;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
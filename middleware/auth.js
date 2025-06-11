const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Check if MongoDB is connected
const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Mock user storage (should match the one in auth routes)
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

module.exports = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied'
    });
  }

  try {
    // Handle mock development tokens
    if (token.startsWith('dev-token-')) {
      console.log('Processing mock development token');
      const mockUser = {
        _id: '507f1f77bcf86cd799439012',
        username: 'DEV',
        discriminator: '0001',
        email: 'dev@canble.com',
        status: 'online',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      req.user = { id: mockUser._id };
      req.userDoc = mockUser;
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    let user;
    if (!isDBConnected()) {
      // Use mock user storage
      console.log('Using mock database for auth middleware');
      user = mockUsers.find(u => u._id === decoded.user.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid - user not found'
        });
      }
      // Remove password from mock user
      const { password, ...userWithoutPassword } = user;
      user = userWithoutPassword;
    } else {
      // Check if user still exists in database
      user = await User.findById(decoded.user.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid - user not found'
        });
      }
    }

    // Add user to request object
    req.user = decoded.user;
    req.userDoc = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};
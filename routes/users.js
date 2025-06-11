const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user.id } // Exclude current user
    })
      .select('username discriminator avatar status bio')
      .limit(parseInt(limit));

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('servers', 'name icon')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if users are friends
    const currentUser = await User.findById(req.user.id);
    const friendship = currentUser.friends.find(
      friend => friend.user.toString() === req.params.id
    );

    const userProfile = {
      ...user,
      friendshipStatus: friendship ? friendship.status : null,
      mutualServers: [] // You can implement mutual servers logic here
    };

    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/:id/friend-request
// @desc    Send friend request
// @access  Private
router.post('/:id/friend-request', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a friend request to yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if friendship already exists
    const existingFriendship = currentUser.friends.find(
      friend => friend.user.toString() === targetUserId
    );

    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        message: `Friend request already ${existingFriendship.status}`
      });
    }

    // Add friend request to both users
    currentUser.friends.push({
      user: targetUserId,
      status: 'pending'
    });

    targetUser.friends.push({
      user: currentUserId,
      status: 'pending'
    });

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id/friend-request
// @desc    Accept or decline friend request
// @access  Private
router.put('/:id/friend-request', auth, [
  body('action')
    .isIn(['accept', 'decline'])
    .withMessage('Action must be either accept or decline')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { action } = req.body;
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find friendship in both users
    const currentUserFriendship = currentUser.friends.find(
      friend => friend.user.toString() === targetUserId
    );
    const targetUserFriendship = targetUser.friends.find(
      friend => friend.user.toString() === currentUserId
    );

    if (!currentUserFriendship || !targetUserFriendship) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (action === 'accept') {
      currentUserFriendship.status = 'accepted';
      targetUserFriendship.status = 'accepted';
      
      await currentUser.save();
      await targetUser.save();

      res.json({
        success: true,
        message: 'Friend request accepted'
      });
    } else {
      // Remove friendship from both users
      currentUser.friends = currentUser.friends.filter(
        friend => friend.user.toString() !== targetUserId
      );
      targetUser.friends = targetUser.friends.filter(
        friend => friend.user.toString() !== currentUserId
      );

      await currentUser.save();
      await targetUser.save();

      res.json({
        success: true,
        message: 'Friend request declined'
      });
    }
  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id/friend
// @desc    Remove friend
// @access  Private
router.delete('/:id/friend', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove friendship from both users
    currentUser.friends = currentUser.friends.filter(
      friend => friend.user.toString() !== targetUserId
    );
    targetUser.friends = targetUser.friends.filter(
      friend => friend.user.toString() !== currentUserId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/me/friends
// @desc    Get user's friends list
// @access  Private
router.get('/me/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends.user', 'username discriminator avatar status customStatus')
      .select('friends');

    const friends = user.friends.filter(friend => friend.status === 'accepted');
    const pendingRequests = user.friends.filter(friend => friend.status === 'pending');

    res.json({
      success: true,
      friends,
      pendingRequests
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/:id/dm
// @desc    Create or get DM channel with user
// @access  Private
router.post('/:id/dm', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot create a DM with yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if DM channel already exists
    const existingChannel = await Channel.findOne({
      type: 1, // DM
      recipients: { $all: [currentUserId, targetUserId], $size: 2 }
    });

    if (existingChannel) {
      return res.json({
        success: true,
        channel: existingChannel
      });
    }

    // Create new DM channel
    const dmChannel = new Channel({
      type: 1, // DM
      recipients: [currentUserId, targetUserId]
    });

    await dmChannel.save();

    // Add DM to both users
    await User.findByIdAndUpdate(currentUserId, {
      $push: { directMessages: dmChannel._id }
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { directMessages: dmChannel._id }
    });

    const populatedChannel = await Channel.findById(dmChannel._id)
      .populate('recipients', 'username discriminator avatar status');

    res.status(201).json({
      success: true,
      message: 'DM channel created successfully',
      channel: populatedChannel
    });
  } catch (error) {
    console.error('Create DM error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/me/dms
// @desc    Get user's DM channels
// @access  Private
router.get('/me/dms', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'directMessages',
        populate: {
          path: 'recipients',
          select: 'username discriminator avatar status'
        }
      });

    res.json({
      success: true,
      channels: user.directMessages
    });
  } catch (error) {
    console.error('Get DMs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/me/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'canble/avatars',
          public_id: `avatar_${req.user.id}_${Date.now()}`,
          transformation: [
            { width: 256, height: 256, crop: 'fill' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      user
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/me/banner
// @desc    Upload user banner
// @access  Private
router.post('/me/banner', auth, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'canble/banners',
          public_id: `banner_${req.user.id}_${Date.now()}`,
          transformation: [
            { width: 600, height: 240, crop: 'fill' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user banner
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { banner: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Banner updated successfully',
      user
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/me/settings
// @desc    Update user settings
// @access  Private
router.put('/me/settings', auth, [
  body('locale')
    .optional()
    .isIn(['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN'])
    .withMessage('Invalid locale'),
  body('accentColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Invalid accent color format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { locale, accentColor } = req.body;
    const updateData = {};

    if (locale) updateData.locale = locale;
    if (accentColor) updateData.accentColor = accentColor;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Settings updated successfully',
      user
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
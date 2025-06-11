const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications with pagination and filtering
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn([
    'message', 'mention', 'reply', 'reaction',
    'friend_request', 'friend_accept',
    'server_invite', 'role_update',
    'voice_call', 'video_call', 'call_missed',
    'server_event', 'premium_expire',
    'moderation_action', 'system_update'
  ]).withMessage('Invalid notification type'),
  query('read').optional().isBoolean().withMessage('Read must be a boolean'),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 50,
      type,
      read,
      priority,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { recipient: req.user.id };
    
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';
    if (priority) query.priority = priority;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const notifications = await Notification.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('data.userId', 'username avatar')
      .populate('data.serverId', 'name icon')
      .populate('data.channelId', 'name type')
      .exec();

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification (admin/system use)
// @access  Private
router.post('/', [
  auth,
  body('recipient').isMongoId().withMessage('Valid recipient ID required'),
  body('type').isIn([
    'message', 'mention', 'reply', 'reaction',
    'friend_request', 'friend_accept',
    'server_invite', 'role_update',
    'voice_call', 'video_call', 'call_missed',
    'server_event', 'premium_expire',
    'moderation_action', 'system_update'
  ]).withMessage('Invalid notification type'),
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('content').isLength({ min: 1, max: 500 }).withMessage('Content must be between 1 and 500 characters'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      recipient,
      type,
      title,
      content,
      data = {},
      priority = 'normal',
      channels = { desktop: true, mobile: true, email: false, push: true }
    } = req.body;

    const notification = await Notification.createAndSend({
      recipient,
      type,
      title,
      content,
      data,
      priority,
      channels
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/read-multiple
// @desc    Mark multiple notifications as read
// @access  Private
router.put('/read-multiple', [
  auth,
  body('notificationIds').isArray({ min: 1 }).withMessage('Notification IDs array required'),
  body('notificationIds.*').isMongoId().withMessage('Valid notification IDs required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { notificationIds } = req.body;

    const result = await Notification.markMultipleAsRead(req.user.id, notificationIds);
    
    res.json({ 
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark multiple notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notifications/clear-read
// @desc    Clear all read notifications
// @access  Private
router.delete('/clear-read', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      read: true
    });

    res.json({ 
      message: 'Read notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/settings
// @desc    Get notification settings for user
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('notificationPreferences');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.notificationPreferences);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/settings
// @desc    Update notification settings for user
// @access  Private
router.put('/settings', [
  auth,
  body('desktop').optional().isObject().withMessage('Desktop settings must be an object'),
  body('mobile').optional().isObject().withMessage('Mobile settings must be an object'),
  body('email').optional().isObject().withMessage('Email settings must be an object'),
  body('sounds').optional().isObject().withMessage('Sound settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification preferences
    const { desktop, mobile, email, sounds } = req.body;
    
    if (desktop) {
      user.notificationPreferences.desktop = { ...user.notificationPreferences.desktop, ...desktop };
    }
    if (mobile) {
      user.notificationPreferences.mobile = { ...user.notificationPreferences.mobile, ...mobile };
    }
    if (email) {
      user.notificationPreferences.email = { ...user.notificationPreferences.email, ...email };
    }
    if (sounds) {
      user.notificationPreferences.sounds = { ...user.notificationPreferences.sounds, ...sounds };
    }

    await user.save();

    res.json({
      message: 'Notification settings updated',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/summary
// @desc    Get notification summary by type and priority
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await Notification.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            priority: '$priority',
            read: '$read'
          },
          count: { $sum: 1 },
          latest: { $max: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          total: { $sum: '$count' },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$_id.read', false] }, '$count', 0]
            }
          },
          priorities: {
            $push: {
              priority: '$_id.priority',
              count: '$count',
              read: '$_id.read'
            }
          },
          latest: { $max: '$latest' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Get notification summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
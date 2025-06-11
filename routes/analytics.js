const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Server = require('../models/Server');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   POST /api/analytics/track
// @desc    Track user event
// @access  Private
router.post('/track', [
  auth,
  body('eventType').isIn([
    'message_sent', 'message_edited', 'message_deleted', 'message_reaction',
    'voice_join', 'voice_leave', 'voice_mute', 'voice_unmute',
    'file_upload', 'file_download', 'search_query', 'search_result_click',
    'call_start', 'call_join', 'call_leave', 'call_end',
    'server_join', 'server_leave', 'channel_create', 'channel_delete',
    'user_login', 'user_logout', 'user_register', 'profile_update',
    'premium_subscribe', 'premium_cancel', 'boost_server',
    'event_create', 'event_join', 'event_leave'
  ]).withMessage('Invalid event type'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  body('eventData').optional().isObject().withMessage('Event data must be an object'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      eventType,
      context = {},
      eventData = {},
      metadata = {},
      customData = {}
    } = req.body;

    // Extract client information from request headers
    const clientInfo = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      platform: req.get('X-Platform') || 'web'
    };

    // Create analytics entry
    const analyticsEntry = new Analytics({
      eventType,
      user: req.user.id,
      server: context.server,
      channel: context.channel,
      eventData,
      metadata: {
        ...metadata,
        ...clientInfo
      },
      customData,
      sessionId: req.get('X-Session-ID') || req.sessionID
    });

    await analyticsEntry.save();

    res.status(201).json({ message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/analytics/batch
// @desc    Track multiple events in batch
// @access  Private
router.post('/batch', [
  auth,
  body('events').isArray({ min: 1, max: 100 }).withMessage('Events must be an array with 1-100 items'),
  body('events.*.eventType').isIn([
    'message_sent', 'message_edited', 'message_deleted', 'message_reaction',
    'voice_join', 'voice_leave', 'voice_mute', 'voice_unmute',
    'file_upload', 'file_download', 'search_query', 'search_result_click',
    'call_start', 'call_join', 'call_leave', 'call_end',
    'server_join', 'server_leave', 'channel_create', 'channel_delete',
    'user_login', 'user_logout', 'user_register', 'profile_update',
    'premium_subscribe', 'premium_cancel', 'boost_server',
    'event_create', 'event_join', 'event_leave'
  ]).withMessage('Invalid event type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { events } = req.body;
    
    // Extract client information
    const clientInfo = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      platform: req.get('X-Platform') || 'web'
    };

    const sessionId = req.get('X-Session-ID') || req.sessionID;

    // Prepare batch insert
    const analyticsEntries = events.map(event => ({
      eventType: event.eventType,
      user: req.user.id,
      server: event.context?.server,
      channel: event.context?.channel,
      eventData: event.eventData || {},
      metadata: {
        ...event.metadata,
        ...clientInfo
      },
      customData: event.customData || {},
      sessionId,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
    }));

    await Analytics.insertMany(analyticsEntries);

    res.status(201).json({ 
      message: 'Events tracked successfully',
      count: analyticsEntries.length
    });
  } catch (error) {
    console.error('Batch track error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get analytics dashboard data
// @access  Private (Admin only)
router.get('/dashboard', [
  auth,
  query('timeframe').optional().isIn(['hour', 'day', 'week', 'month', 'year']).withMessage('Invalid timeframe'),
  query('granularity').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid granularity')
], async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timeframe = 'week', granularity = 'day' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            date: {
              $dateToString: {
                format: granularity === 'hour' ? '%Y-%m-%d %H:00:00' :
                        granularity === 'day' ? '%Y-%m-%d' :
                        granularity === 'week' ? '%Y-%U' : '%Y-%m',
                date: '$timestamp'
              }
            }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $group: {
          _id: '$_id.eventType',
          data: {
            $push: {
              date: '$_id.date',
              count: '$count',
              uniqueUsers: { $size: '$uniqueUsers' }
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      {
        $sort: { totalCount: -1 }
      }
    ];

    const [eventStats, userStats, serverStats] = await Promise.all([
      Analytics.aggregate(pipeline),
      Analytics.aggregate([
        { $match: { timestamp: { $gte: startDate, $lte: now } } },
        {
          $group: {
            _id: '$user',
            eventCount: { $sum: 1 },
            lastActivity: { $max: '$timestamp' },
            eventTypes: { $addToSet: '$eventType' }
          }
        },
        { $sort: { eventCount: -1 } },
        { $limit: 100 }
      ]),
      Analytics.aggregate([
        { 
          $match: { 
            timestamp: { $gte: startDate, $lte: now },
            server: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$server',
            eventCount: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        { $sort: { eventCount: -1 } },
        { $limit: 50 }
      ])
    ]);

    // Populate user and server data
    const userIds = userStats.map(stat => stat._id);
    const serverIds = serverStats.map(stat => stat._id);

    const [users, servers] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('username avatar'),
      Server.find({ _id: { $in: serverIds } }).select('name icon memberCount')
    ]);

    // Map user and server data
    const userMap = users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    const serverMap = servers.reduce((acc, server) => {
      acc[server._id] = server;
      return acc;
    }, {});

    // Format response
    const dashboard = {
      timeframe,
      granularity,
      eventStats: eventStats.map(stat => ({
        eventType: stat._id,
        totalCount: stat.totalCount,
        timeline: stat.data
      })),
      topUsers: userStats.map(stat => ({
        user: userMap[stat._id] || { _id: stat._id, username: 'Unknown' },
        eventCount: stat.eventCount,
        lastActivity: stat.lastActivity,
        eventTypes: stat.eventTypes
      })),
      topServers: serverStats.map(stat => ({
        server: serverMap[stat._id] || { _id: stat._id, name: 'Unknown' },
        eventCount: stat.eventCount,
        uniqueUsers: stat.uniqueUsers.length
      }))
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/user/:userId
// @desc    Get user analytics
// @access  Private
router.get('/user/:userId', [
  auth,
  query('timeframe').optional().isIn(['day', 'week', 'month', 'year', 'all']).withMessage('Invalid timeframe'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { timeframe = 'month', limit = 500 } = req.query;

    // Check if user can view this analytics (self or admin)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }

    const matchStage = {
      user: userId
    };

    if (startDate) {
      matchStage.timestamp = { $gte: startDate, $lte: now };
    }

    const [eventBreakdown, activityTimeline, serverActivity] = await Promise.all([
      Analytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            lastEvent: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Analytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            count: { $sum: 1 },
            eventTypes: { $addToSet: '$eventType' }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: parseInt(limit) }
      ]),
      Analytics.aggregate([
        { 
          $match: {
            ...matchStage,
            server: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$server',
            count: { $sum: 1 },
            eventTypes: { $addToSet: '$eventType' },
            lastActivity: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    // Populate server data
    const serverIds = serverActivity.map(activity => activity._id);
    const servers = await Server.find({ _id: { $in: serverIds } })
      .select('name icon');
    
    const serverMap = servers.reduce((acc, server) => {
      acc[server._id] = server;
      return acc;
    }, {});

    const analytics = {
      userId,
      timeframe,
      eventBreakdown,
      activityTimeline,
      serverActivity: serverActivity.map(activity => ({
        server: serverMap[activity._id] || { _id: activity._id, name: 'Unknown' },
        count: activity.count,
        eventTypes: activity.eventTypes,
        lastActivity: activity.lastActivity
      })),
      summary: {
        totalEvents: eventBreakdown.reduce((sum, event) => sum + event.count, 0),
        uniqueEventTypes: eventBreakdown.length,
        activeDays: activityTimeline.length,
        serversActive: serverActivity.length
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/server/:serverId
// @desc    Get server analytics
// @access  Private
router.get('/server/:serverId', [
  auth,
  query('timeframe').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid timeframe'),
  query('eventType').optional().isString().withMessage('Event type must be string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serverId } = req.params;
    const { timeframe = 'week', eventType } = req.query;

    // Check if user is a member of the server or admin
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const matchStage = {
      server: serverId,
      timestamp: { $gte: startDate, $lte: now }
    };

    if (eventType) {
      matchStage.eventType = eventType;
    }

    const [eventStats, userActivity, channelActivity, timeline] = await Promise.all([
      Analytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Analytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
            eventTypes: { $addToSet: '$eventType' },
            lastActivity: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ]),
      Analytics.aggregate([
        { 
          $match: {
            ...matchStage,
            channel: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$channel',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      Analytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const analytics = {
      serverId,
      serverName: server.name,
      timeframe,
      eventStats: eventStats.map(stat => ({
        eventType: stat._id,
        count: stat.count,
        uniqueUsers: stat.uniqueUsers.length
      })),
      userActivity: userActivity.map(activity => ({
        userId: activity._id,
        count: activity.count,
        eventTypes: activity.eventTypes,
        lastActivity: activity.lastActivity
      })),
      channelActivity: channelActivity.map(activity => ({
        channelId: activity._id,
        count: activity.count,
        uniqueUsers: activity.uniqueUsers.length
      })),
      timeline: timeline.map(point => ({
        date: point._id,
        count: point.count,
        uniqueUsers: point.uniqueUsers.length
      })),
      summary: {
        totalEvents: eventStats.reduce((sum, event) => sum + event.count, 0),
        uniqueUsers: new Set(userActivity.map(u => u._id)).size,
        activeChannels: channelActivity.length,
        activeDays: timeline.length
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get server analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/analytics/cleanup
// @desc    Clean up old analytics data
// @access  Private (Admin only)
router.delete('/cleanup', [
  auth,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { days = 90 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await Analytics.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      message: 'Analytics cleanup completed',
      deletedCount: result.deletedCount,
      cutoffDate
    });
  } catch (error) {
    console.error('Analytics cleanup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private (Admin only)
router.get('/export', [
  auth,
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  query('eventType').optional().isString().withMessage('Event type must be string')
], async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      format = 'json',
      startDate,
      endDate,
      eventType
    } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }
    
    if (eventType) {
      matchStage.eventType = eventType;
    }

    const analytics = await Analytics.find(matchStage)
      .populate('user', 'username email')
      .populate('server', 'name')
      .populate('channel', 'name type')
      .sort({ timestamp: -1 })
      .limit(10000); // Limit for performance

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Timestamp,Event Type,User,Server,Channel,Event Data,Metadata\n';
      const csvRows = analytics.map(entry => {
        const row = [
          entry.timestamp.toISOString(),
          entry.eventType,
          entry.user?.username || 'Unknown',
          entry.server?.name || 'N/A',
          entry.channel?.name || 'N/A',
          JSON.stringify(entry.eventData).replace(/"/g, '""'),
          JSON.stringify(entry.metadata).replace(/"/g, '""')
        ];
        return row.map(field => `"${field}"`).join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csvHeader + csvRows);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
      res.json({
        exportDate: new Date(),
        filters: { startDate, endDate, eventType },
        count: analytics.length,
        data: analytics
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
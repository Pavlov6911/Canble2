const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Event tracking
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_action', 'message_sent', 'voice_join', 'voice_leave',
      'server_join', 'server_leave', 'channel_create', 'channel_delete',
      'role_assign', 'role_remove', 'reaction_add', 'reaction_remove',
      'file_upload', 'emoji_use', 'command_use', 'search_query',
      'call_start', 'call_end', 'screen_share', 'premium_purchase',
      'login', 'logout', 'profile_update', 'settings_change'
    ]
  },
  // Context information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  // Event data
  data: {
    // Message analytics
    messageLength: {
      type: Number,
      default: null
    },
    hasAttachments: {
      type: Boolean,
      default: null
    },
    hasEmbeds: {
      type: Boolean,
      default: null
    },
    mentionCount: {
      type: Number,
      default: null
    },
    
    // Voice analytics
    voiceDuration: {
      type: Number,
      default: null // in seconds
    },
    voiceQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: null
    },
    
    // File analytics
    fileSize: {
      type: Number,
      default: null // in bytes
    },
    fileType: {
      type: String,
      default: null
    },
    
    // Search analytics
    searchQuery: {
      type: String,
      default: null
    },
    searchResults: {
      type: Number,
      default: null
    },
    
    // Call analytics
    callDuration: {
      type: Number,
      default: null // in seconds
    },
    participantCount: {
      type: Number,
      default: null
    },
    
    // General metadata
    platform: {
      type: String,
      enum: ['web', 'desktop', 'mobile', 'api'],
      default: 'web'
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    location: {
      country: {
        type: String,
        default: null
      },
      region: {
        type: String,
        default: null
      },
      city: {
        type: String,
        default: null
      },
      timezone: {
        type: String,
        default: null
      }
    },
    
    // Performance metrics
    responseTime: {
      type: Number,
      default: null // in milliseconds
    },
    errorCode: {
      type: String,
      default: null
    },
    
    // Custom data
    customData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  // Session information
  sessionId: {
    type: String,
    default: null
  },
  sessionDuration: {
    type: Number,
    default: null // in seconds
  },
  // Aggregation helpers
  date: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6 // 0 = Sunday
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // We handle timestamps manually
});

// Indexes for efficient querying
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ user: 1, timestamp: -1 });
analyticsSchema.index({ server: 1, timestamp: -1 });
analyticsSchema.index({ channel: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ 'date.year': 1, 'date.month': 1, 'date.day': 1 });
analyticsSchema.index({ 'data.platform': 1, timestamp: -1 });
analyticsSchema.index({ 'data.location.country': 1 });

// Compound indexes for complex queries
analyticsSchema.index({ eventType: 1, server: 1, timestamp: -1 });
analyticsSchema.index({ user: 1, eventType: 1, timestamp: -1 });
analyticsSchema.index({ 'date.year': 1, 'date.month': 1, eventType: 1 });

// Pre-save middleware to set date fields
analyticsSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = this.timestamp || new Date();
    this.date = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      dayOfWeek: date.getDay()
    };
  }
  next();
});

// Static method to track event
analyticsSchema.statics.trackEvent = function(eventType, data = {}) {
  const event = new this({
    eventType,
    user: data.user,
    server: data.server,
    channel: data.channel,
    sessionId: data.sessionId,
    data: {
      platform: data.platform,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      location: data.location,
      responseTime: data.responseTime,
      errorCode: data.errorCode,
      customData: data.customData,
      ...data.eventData
    },
    timestamp: data.timestamp || new Date()
  });
  
  return event.save();
};

// Static method to get user activity summary
analyticsSchema.statics.getUserActivitySummary = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        totalDuration: {
          $sum: {
            $cond: [
              { $in: ['$eventType', ['voice_join', 'call_start']] },
              { $ifNull: ['$data.voiceDuration', '$data.callDuration', 0] },
              0
            ]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get server statistics
analyticsSchema.statics.getServerStatistics = function(serverId, timeframe = 'week') {
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
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        server: new mongoose.Types.ObjectId(serverId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
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
        totalEvents: { $sum: '$count' },
        dailyBreakdown: {
          $push: {
            date: '$_id.date',
            count: '$count',
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        totalUniqueUsers: { $addToSet: '$uniqueUsers' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        totalEvents: 1,
        dailyBreakdown: 1,
        totalUniqueUsers: {
          $size: {
            $reduce: {
              input: '$totalUniqueUsers',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        }
      }
    }
  ]);
};

// Static method to get platform usage statistics
analyticsSchema.statics.getPlatformUsage = function(timeframe = 'week') {
  const now = new Date();
  const startDate = new Date(now.getTime() - (timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        'data.platform': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$data.platform',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        avgSessionDuration: { $avg: '$sessionDuration' }
      }
    },
    {
      $project: {
        platform: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgSessionDuration: { $round: ['$avgSessionDuration', 2] }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get geographic distribution
analyticsSchema.statics.getGeographicDistribution = function(timeframe = 'month') {
  const now = new Date();
  const startDate = new Date(now.getTime() - (timeframe === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        'data.location.country': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: {
          country: '$data.location.country',
          region: '$data.location.region'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $group: {
        _id: '$_id.country',
        totalEvents: { $sum: '$count' },
        uniqueUsers: { $addToSet: '$uniqueUsers' },
        regions: {
          $push: {
            region: '$_id.region',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        country: '$_id',
        totalEvents: 1,
        uniqueUsers: {
          $size: {
            $reduce: {
              input: '$uniqueUsers',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        },
        regions: 1
      }
    },
    {
      $sort: { totalEvents: -1 }
    }
  ]);
};

// Static method to get peak usage times
analyticsSchema.statics.getPeakUsageTimes = function(timeframe = 'week') {
  const now = new Date();
  const startDate = new Date(now.getTime() - (timeframe === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          hour: '$date.hour',
          dayOfWeek: '$date.dayOfWeek'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        hour: '$_id.hour',
        dayOfWeek: '$_id.dayOfWeek',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get error analytics
analyticsSchema.statics.getErrorAnalytics = function(timeframe = 'week') {
  const now = new Date();
  const startDate = new Date(now.getTime() - (timeframe === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        'data.errorCode': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: {
          errorCode: '$data.errorCode',
          eventType: '$eventType'
        },
        count: { $sum: 1 },
        affectedUsers: { $addToSet: '$user' },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        errorCode: '$_id.errorCode',
        eventType: '$_id.eventType',
        count: 1,
        affectedUsers: { $size: '$affectedUsers' },
        lastOccurrence: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get performance metrics
analyticsSchema.statics.getPerformanceMetrics = function(timeframe = 'week') {
  const now = new Date();
  const startDate = new Date(now.getTime() - (timeframe === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        'data.responseTime': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$eventType',
        avgResponseTime: { $avg: '$data.responseTime' },
        minResponseTime: { $min: '$data.responseTime' },
        maxResponseTime: { $max: '$data.responseTime' },
        count: { $sum: 1 },
        p95ResponseTime: {
          $percentile: {
            input: '$data.responseTime',
            p: [0.95],
            method: 'approximate'
          }
        }
      }
    },
    {
      $project: {
        eventType: '$_id',
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        minResponseTime: 1,
        maxResponseTime: 1,
        p95ResponseTime: { $arrayElemAt: ['$p95ResponseTime', 0] },
        count: 1
      }
    },
    {
      $sort: { avgResponseTime: -1 }
    }
  ]);
};

// Static method to clean up old analytics data
analyticsSchema.statics.cleanupOldData = function(retentionDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Analytics', analyticsSchema);
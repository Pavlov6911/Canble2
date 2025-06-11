const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'message', 'mention', 'reply', 'reaction',
      'friend_request', 'friend_accept',
      'server_invite', 'role_update',
      'voice_call', 'video_call', 'call_missed',
      'server_event', 'premium_expire',
      'moderation_action', 'system_update'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    // Flexible data field for notification-specific information
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call'
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    actionType: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  channels: {
    desktop: {
      type: Boolean,
      default: true
    },
    mobile: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Mark notification as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.delivered = true;
  this.deliveredAt = new Date();
  return this.save();
};

// Check if notification should be sent via specific channel
notificationSchema.methods.shouldSendVia = function(channel) {
  return this.channels[channel] === true;
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // Here you would integrate with your notification service
  // to actually send the notification via various channels
  
  return notification;
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = function(recipientId, notificationIds) {
  return this.updateMany(
    {
      recipient: recipientId,
      _id: { $in: notificationIds }
    },
    {
      read: true,
      readAt: new Date()
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientId) {
  return this.countDocuments({
    recipient: recipientId,
    read: false
  });
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
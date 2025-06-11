const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null // null for external events
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['voice', 'stage', 'external'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date,
    default: null
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  location: {
    type: String,
    maxlength: 100,
    default: null // for external events
  },
  coverImage: {
    type: String,
    default: null
  },
  maxParticipants: {
    type: Number,
    default: null // null for unlimited
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['interested', 'going', 'not_going', 'maybe'],
      default: 'interested'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    joinedAt: {
      type: Date,
      default: null
    },
    leftAt: {
      type: Date,
      default: null
    },
    role: {
      type: String,
      enum: ['participant', 'speaker', 'moderator'],
      default: 'participant'
    }
  }],
  recurrence: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1 // every X days/weeks/months
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    }],
    endDate: {
      type: Date,
      default: null
    },
    maxOccurrences: {
      type: Number,
      default: null
    }
  },
  reminders: [{
    time: {
      type: Number,
      required: true // minutes before event
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: null
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  permissions: {
    viewEvent: {
      type: String,
      enum: ['everyone', 'members', 'roles', 'specific_users'],
      default: 'members'
    },
    joinEvent: {
      type: String,
      enum: ['everyone', 'members', 'roles', 'specific_users'],
      default: 'members'
    },
    allowedRoles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  settings: {
    allowGuests: {
      type: Boolean,
      default: false
    },
    guestLimit: {
      type: Number,
      default: 0
    },
    autoStartRecording: {
      type: Boolean,
      default: false
    },
    muteParticipantsOnJoin: {
      type: Boolean,
      default: false
    },
    requireStageRequest: {
      type: Boolean,
      default: true // for stage events
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    chatEnabled: {
      type: Boolean,
      default: true
    }
  },
  statistics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    peakParticipants: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in minutes
    },
    messagesCount: {
      type: Number,
      default: 0
    },
    reactionsCount: {
      type: Number,
      default: 0
    },
    averageParticipationTime: {
      type: Number,
      default: 0 // in minutes
    }
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  metadata: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    ageRating: {
      type: String,
      enum: ['all_ages', '13+', '16+', '18+'],
      default: 'all_ages'
    },
    category: {
      type: String,
      enum: ['gaming', 'music', 'education', 'technology', 'art', 'social', 'other'],
      default: 'other'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
eventSchema.index({ server: 1, scheduledStartTime: 1 });
eventSchema.index({ creator: 1, createdAt: -1 });
eventSchema.index({ status: 1, scheduledStartTime: 1 });
eventSchema.index({ 'participants.user': 1 });
eventSchema.index({ channel: 1, status: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ 'metadata.category': 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.floor((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  if (this.scheduledStartTime && this.scheduledEndTime) {
    return Math.floor((this.scheduledEndTime - this.scheduledStartTime) / (1000 * 60));
  }
  return 0;
});

// Virtual for participant counts by status
eventSchema.virtual('participantCounts').get(function() {
  const counts = {
    interested: 0,
    going: 0,
    not_going: 0,
    maybe: 0,
    total: this.participants.length
  };
  
  this.participants.forEach(participant => {
    counts[participant.status] = (counts[participant.status] || 0) + 1;
  });
  
  return counts;
});

// Virtual for active participants
eventSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => 
    p.joinedAt && !p.leftAt && 
    (p.status === 'going' || p.status === 'interested')
  );
});

// Add participant to event
eventSchema.methods.addParticipant = function(userId, status = 'interested', role = 'participant') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (existingParticipant) {
    existingParticipant.status = status;
    existingParticipant.role = role;
    existingParticipant.respondedAt = new Date();
  } else {
    // Check if event is full
    if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
      throw new Error('Event is full');
    }
    
    this.participants.push({
      user: userId,
      status,
      role,
      respondedAt: new Date()
    });
  }
  
  this.statistics.totalParticipants = Math.max(this.statistics.totalParticipants, this.participants.length);
  return this.save();
};

// Remove participant from event
eventSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => p.user.toString() === userId.toString());
  
  if (participantIndex !== -1) {
    this.participants.splice(participantIndex, 1);
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Update participant status
eventSchema.methods.updateParticipantStatus = function(userId, status, role) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.status = status;
    if (role) participant.role = role;
    participant.respondedAt = new Date();
    
    if (status === 'going' && !participant.joinedAt) {
      participant.joinedAt = new Date();
    }
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Start event
eventSchema.methods.startEvent = function() {
  this.status = 'active';
  this.actualStartTime = new Date();
  
  // Mark going participants as joined
  this.participants.forEach(participant => {
    if (participant.status === 'going' && !participant.joinedAt) {
      participant.joinedAt = new Date();
    }
  });
  
  return this.save();
};

// End event
eventSchema.methods.endEvent = function() {
  this.status = 'completed';
  this.actualEndTime = new Date();
  
  if (this.actualStartTime) {
    this.statistics.totalDuration = Math.floor((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
  
  // Mark active participants as left
  this.participants.forEach(participant => {
    if (participant.joinedAt && !participant.leftAt) {
      participant.leftAt = new Date();
    }
  });
  
  // Calculate average participation time
  const totalParticipationTime = this.participants.reduce((total, p) => {
    if (p.joinedAt && p.leftAt) {
      return total + (p.leftAt - p.joinedAt);
    }
    return total;
  }, 0);
  
  if (this.participants.length > 0) {
    this.statistics.averageParticipationTime = Math.floor(
      totalParticipationTime / this.participants.length / (1000 * 60)
    );
  }
  
  return this.save();
};

// Cancel event
eventSchema.methods.cancelEvent = function() {
  this.status = 'cancelled';
  return this.save();
};

// Check if user can join event
eventSchema.methods.canUserJoin = function(userId, userRoles = []) {
  // Check if event is full
  if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
    return { canJoin: false, reason: 'Event is full' };
  }
  
  // Check permissions
  const permissions = this.permissions;
  
  if (permissions.joinEvent === 'everyone') {
    return { canJoin: true };
  }
  
  if (permissions.joinEvent === 'specific_users') {
    const isAllowed = permissions.allowedUsers.some(allowedUserId => 
      allowedUserId.toString() === userId.toString()
    );
    return { canJoin: isAllowed, reason: isAllowed ? null : 'Not in allowed users list' };
  }
  
  if (permissions.joinEvent === 'roles') {
    const hasAllowedRole = userRoles.some(roleId => 
      permissions.allowedRoles.some(allowedRoleId => 
        allowedRoleId.toString() === roleId.toString()
      )
    );
    return { canJoin: hasAllowedRole, reason: hasAllowedRole ? null : 'Missing required role' };
  }
  
  // Default to members only
  return { canJoin: true };
};

// Get upcoming reminders
eventSchema.methods.getUpcomingReminders = function() {
  const now = new Date();
  const eventTime = this.scheduledStartTime;
  
  return this.reminders.filter(reminder => {
    if (reminder.sent) return false;
    
    const reminderTime = new Date(eventTime.getTime() - reminder.time * 60 * 1000);
    return reminderTime <= now;
  });
};

// Mark reminder as sent
eventSchema.methods.markReminderSent = function(reminderTime) {
  const reminder = this.reminders.find(r => r.time === reminderTime);
  if (reminder) {
    reminder.sent = true;
    reminder.sentAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find events by server
eventSchema.statics.findByServer = function(serverId, options = {}) {
  const query = { server: serverId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.upcoming) {
    query.scheduledStartTime = { $gte: new Date() };
  }
  
  if (options.category) {
    query['metadata.category'] = options.category;
  }
  
  return this.find(query)
    .sort({ scheduledStartTime: 1 })
    .limit(options.limit || 50)
    .populate('creator', 'username avatar')
    .populate('channel', 'name type');
};

// Static method to find events needing reminders
eventSchema.statics.findEventsNeedingReminders = function() {
  const now = new Date();
  
  return this.find({
    status: 'scheduled',
    scheduledStartTime: { $gte: now },
    'reminders.sent': false
  });
};

// Static method to find events by participant
eventSchema.statics.findByParticipant = function(userId, options = {}) {
  const query = {
    'participants.user': userId
  };
  
  if (options.status) {
    query['participants.status'] = options.status;
  }
  
  if (options.upcoming) {
    query.scheduledStartTime = { $gte: new Date() };
  }
  
  return this.find(query)
    .sort({ scheduledStartTime: 1 })
    .limit(options.limit || 50);
};

module.exports = mongoose.model('Event', eventSchema);
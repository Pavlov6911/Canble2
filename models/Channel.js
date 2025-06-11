const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  type: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 15],
    // 0: GUILD_TEXT, 1: DM, 2: GUILD_VOICE, 3: GROUP_DM, 4: GUILD_CATEGORY
    // 5: GUILD_NEWS, 10: GUILD_NEWS_THREAD, 11: GUILD_PUBLIC_THREAD
    // 12: GUILD_PRIVATE_THREAD, 13: GUILD_STAGE_VOICE, 15: GUILD_FORUM
  },
  topic: {
    type: String,
    maxlength: 1024,
    default: ''
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: function() {
      return !this.group;
    }
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function() {
      return !this.server;
    }
  },
  position: {
    type: Number,
    default: 0
  },
  permissionOverwrites: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: Number,
      enum: [0, 1], // 0: role, 1: member
      required: true
    },
    allow: {
      type: String,
      default: '0'
    },
    deny: {
      type: String,
      default: '0'
    }
  }],
  nsfw: {
    type: Boolean,
    default: false
  },
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  bitrate: {
    type: Number,
    default: 64000,
    min: 8000,
    max: 384000
  },
  userLimit: {
    type: Number,
    default: 0,
    min: 0,
    max: 99
  },
  rateLimitPerUser: {
    type: Number,
    default: 0,
    min: 0,
    max: 21600
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  icon: {
    type: String,
    default: null
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  lastPinTimestamp: {
    type: Date,
    default: null
  },
  rtcRegion: {
    type: String,
    default: null
  },
  videoQualityMode: {
    type: Number,
    enum: [1, 2], // 1: AUTO, 2: FULL
    default: 1
  },
  messageCount: {
    type: Number,
    default: 0
  },
  memberCount: {
    type: Number,
    default: 0
  },
  threadMetadata: {
    archived: {
      type: Boolean,
      default: false
    },
    autoArchiveDuration: {
      type: Number,
      enum: [60, 1440, 4320, 10080],
      default: 1440
    },
    archiveTimestamp: {
      type: Date,
      default: null
    },
    locked: {
      type: Boolean,
      default: false
    },
    invitable: {
      type: Boolean,
      default: true
    },
    createTimestamp: {
      type: Date,
      default: null
    }
  },
  member: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinTimestamp: {
      type: Date,
      default: null
    },
    flags: {
      type: Number,
      default: 0
    }
  },
  defaultAutoArchiveDuration: {
    type: Number,
    enum: [60, 1440, 4320, 10080],
    default: 1440
  },
  permissions: {
    type: String,
    default: null
  },
  flags: {
    type: Number,
    default: 0
  },
  totalMessageSent: {
    type: Number,
    default: 0
  },
  availableTags: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    name: {
      type: String,
      required: true,
      maxlength: 20
    },
    moderated: {
      type: Boolean,
      default: false
    },
    emojiId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    emojiName: {
      type: String,
      default: null
    }
  }],
  defaultReactionEmoji: {
    emojiId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    emojiName: {
      type: String,
      default: null
    }
  },
  defaultThreadRateLimitPerUser: {
    type: Number,
    default: 0,
    min: 0,
    max: 21600
  },
  defaultSortOrder: {
    type: Number,
    enum: [0, 1], // 0: LATEST_ACTIVITY, 1: CREATION_DATE
    default: 0
  },
  defaultForumLayout: {
    type: Number,
    enum: [0, 1, 2], // 0: NOT_SET, 1: LIST_VIEW, 2: GALLERY_VIEW
    default: 0
  },
  // Voice channel members tracking
  voiceMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    muted: {
      type: Boolean,
      default: false
    },
    deafened: {
      type: Boolean,
      default: false
    },
    selfMuted: {
      type: Boolean,
      default: false
    },
    selfDeafened: {
      type: Boolean,
      default: false
    },
    suppress: {
      type: Boolean,
      default: false
    },
    requestToSpeakTimestamp: {
      type: Date,
      default: null
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    sessionId: {
      type: String,
      default: null
    }
  }],
  // Stage channel specific features
  stageInstance: {
    topic: {
      type: String,
      maxlength: 120,
      default: ''
    },
    privacyLevel: {
      type: Number,
      enum: [1, 2], // 1: PUBLIC, 2: GUILD_ONLY
      default: 2
    },
    discoverableDisabled: {
      type: Boolean,
      default: false
    },
    guildScheduledEventId: {
      type: String,
      default: null
    },
    speakers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      requestToSpeakTimestamp: {
        type: Date,
        default: null
      }
    }],
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  // Channel statistics and analytics
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    peakMembers: {
      count: {
        type: Number,
        default: 0
      },
      date: {
        type: Date,
        default: Date.now
      }
    },
    dailyStats: [{
      date: {
        type: Date,
        required: true
      },
      messages: {
        type: Number,
        default: 0
      },
      uniqueUsers: {
        type: Number,
        default: 0
      },
      voiceMinutes: {
        type: Number,
        default: 0
      }
    }]
  },
  // Webhooks for this channel
  webhooks: [{
    id: String,
    type: {
      type: Number,
      enum: [1, 2, 3], // 1: Incoming, 2: Channel Follower, 3: Application
      default: 1
    },
    name: {
      type: String,
      maxlength: 80
    },
    avatar: String,
    token: String,
    guildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    applicationId: String,
    sourceGuild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    sourceChannel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Auto-moderation settings for this channel
  autoMod: {
    enabled: {
      type: Boolean,
      default: false
    },
    rules: [{
      id: String,
      name: {
        type: String,
        required: true
      },
      eventType: {
        type: Number,
        enum: [1], // MESSAGE_SEND
        default: 1
      },
      triggerType: {
        type: Number,
        enum: [1, 2, 3, 4, 5], // KEYWORD, SPAM, KEYWORD_PRESET, HARMFUL_LINK, MENTION_SPAM
        required: true
      },
      triggerMetadata: {
        keywordFilter: [String],
        regexPatterns: [String],
        presets: [Number],
        allowList: [String],
        mentionTotalLimit: Number,
        mentionRaidProtectionEnabled: Boolean
      },
      actions: [{
        type: {
          type: Number,
          enum: [1, 2, 3], // BLOCK_MESSAGE, SEND_ALERT_MESSAGE, TIMEOUT
          required: true
        },
        metadata: {
          channelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel'
          },
          durationSeconds: Number,
          customMessage: String
        }
      }],
      enabled: {
        type: Boolean,
        default: true
      },
      exemptRoles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
      }],
      exemptChannels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
      }]
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for getting channel type name
channelSchema.virtual('typeName').get(function() {
  const types = {
    0: 'GUILD_TEXT',
    1: 'DM',
    2: 'GUILD_VOICE',
    3: 'GROUP_DM',
    4: 'GUILD_CATEGORY',
    5: 'GUILD_NEWS',
    10: 'GUILD_NEWS_THREAD',
    11: 'GUILD_PUBLIC_THREAD',
    12: 'GUILD_PRIVATE_THREAD',
    13: 'GUILD_STAGE_VOICE',
    15: 'GUILD_FORUM'
  };
  return types[this.type] || 'UNKNOWN';
});

// Check if channel is text-based
channelSchema.virtual('isTextBased').get(function() {
  return [0, 1, 3, 5, 10, 11, 12, 15].includes(this.type);
});

// Check if channel is voice-based
channelSchema.virtual('isVoiceBased').get(function() {
  return [2, 13].includes(this.type);
});

// Check if channel is thread
channelSchema.virtual('isThread').get(function() {
  return [10, 11, 12].includes(this.type);
});

// Methods for voice channel management
channelSchema.methods.addVoiceMember = function(userId, sessionId = null) {
  if (!this.voiceMembers.find(m => m.user.toString() === userId.toString())) {
    this.voiceMembers.push({ 
      user: userId, 
      sessionId: sessionId,
      joinedAt: new Date()
    });
    this.statistics.totalMembers = this.voiceMembers.length;
    this.statistics.activeMembers = this.voiceMembers.length;
    
    // Update peak members if necessary
    if (this.voiceMembers.length > this.statistics.peakMembers.count) {
      this.statistics.peakMembers.count = this.voiceMembers.length;
      this.statistics.peakMembers.date = new Date();
    }
    
    this.statistics.lastActivity = new Date();
    return true;
  }
  return false;
};

channelSchema.methods.removeVoiceMember = function(userId) {
  const initialLength = this.voiceMembers.length;
  this.voiceMembers = this.voiceMembers.filter(m => m.user.toString() !== userId.toString());
  
  if (this.voiceMembers.length !== initialLength) {
    this.statistics.totalMembers = this.voiceMembers.length;
    this.statistics.activeMembers = this.voiceMembers.length;
    this.statistics.lastActivity = new Date();
    return true;
  }
  return false;
};

channelSchema.methods.updateVoiceMemberState = function(userId, state) {
  const member = this.voiceMembers.find(m => m.user.toString() === userId.toString());
  if (member) {
    Object.assign(member, state);
    this.statistics.lastActivity = new Date();
    return true;
  }
  return false;
};

// Permission checking methods
channelSchema.methods.canUserView = function(userId, userRoles = []) {
  // Check user-specific overwrites first
  const userOverwrite = this.permissionOverwrites.find(p => 
    p.id.toString() === userId.toString() && p.type === 1
  );
  
  if (userOverwrite) {
    const viewChannel = BigInt(userOverwrite.allow) & BigInt('0x400'); // VIEW_CHANNEL
    const denyViewChannel = BigInt(userOverwrite.deny) & BigInt('0x400');
    
    if (denyViewChannel) return false;
    if (viewChannel) return true;
  }
  
  // Check role overwrites
  const roleOverwrites = this.permissionOverwrites.filter(p => 
    userRoles.includes(p.id.toString()) && p.type === 0
  );
  
  let allowFromRoles = false;
  for (const roleOverwrite of roleOverwrites) {
    const denyViewChannel = BigInt(roleOverwrite.deny) & BigInt('0x400');
    const allowViewChannel = BigInt(roleOverwrite.allow) & BigInt('0x400');
    
    if (denyViewChannel) return false;
    if (allowViewChannel) allowFromRoles = true;
  }
  
  return allowFromRoles || true; // Default behavior
};

channelSchema.methods.canUserSendMessages = function(userId, userRoles = []) {
  if (!this.isTextBased) return false;
  
  // Check user-specific overwrites
  const userOverwrite = this.permissionOverwrites.find(p => 
    p.id.toString() === userId.toString() && p.type === 1
  );
  
  if (userOverwrite) {
    const sendMessages = BigInt(userOverwrite.allow) & BigInt('0x800'); // SEND_MESSAGES
    const denySendMessages = BigInt(userOverwrite.deny) & BigInt('0x800');
    
    if (denySendMessages) return false;
    if (sendMessages) return true;
  }
  
  // Check role overwrites
  const roleOverwrites = this.permissionOverwrites.filter(p => 
    userRoles.includes(p.id.toString()) && p.type === 0
  );
  
  for (const roleOverwrite of roleOverwrites) {
    const denySendMessages = BigInt(roleOverwrite.deny) & BigInt('0x800');
    if (denySendMessages) return false;
  }
  
  return true; // Default allow
};

// Stage channel methods
channelSchema.methods.addSpeaker = function(userId) {
  if (this.type !== 13) return false; // Not a stage channel
  
  if (!this.stageInstance.speakers.find(s => s.user.toString() === userId.toString())) {
    this.stageInstance.speakers.push({ user: userId });
    return true;
  }
  return false;
};

channelSchema.methods.removeSpeaker = function(userId) {
  if (this.type !== 13) return false;
  
  const initialLength = this.stageInstance.speakers.length;
  this.stageInstance.speakers = this.stageInstance.speakers.filter(
    s => s.user.toString() !== userId.toString()
  );
  
  return this.stageInstance.speakers.length !== initialLength;
};

channelSchema.methods.requestToSpeak = function(userId) {
  if (this.type !== 13) return false;
  
  const speaker = this.stageInstance.speakers.find(s => s.user.toString() === userId.toString());
  if (speaker) {
    speaker.requestToSpeakTimestamp = new Date();
    return true;
  }
  
  this.stageInstance.speakers.push({
    user: userId,
    requestToSpeakTimestamp: new Date()
  });
  return true;
};

// Statistics methods
channelSchema.methods.incrementMessageCount = function() {
  this.statistics.totalMessages += 1;
  this.statistics.lastActivity = new Date();
  
  // Update daily stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todayStats = this.statistics.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!todayStats) {
    todayStats = {
      date: today,
      messages: 0,
      uniqueUsers: 0,
      voiceMinutes: 0
    };
    this.statistics.dailyStats.push(todayStats);
  }
  
  todayStats.messages += 1;
};

// Indexes
channelSchema.index({ server: 1, name: 1 });
channelSchema.index({ server: 1, type: 1 });
channelSchema.index({ server: 1, position: 1 });
channelSchema.index({ group: 1, name: 1 });
channelSchema.index({ group: 1, type: 1 });
channelSchema.index({ group: 1, position: 1 });
channelSchema.index({ parentChannel: 1 });
channelSchema.index({ creator: 1 });
channelSchema.index({ createdAt: -1 });
channelSchema.index({ lastActivity: -1 });
channelSchema.index({ 'permissions.everyone.VIEW_CHANNELS': 1 });

module.exports = mongoose.model('Channel', channelSchema);
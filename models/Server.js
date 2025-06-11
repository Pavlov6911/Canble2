const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 120,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  splash: {
    type: String,
    default: ''
  },
  discoverySplash: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    type: String,
    default: '0'
  },
  region: {
    type: String,
    default: 'us-west'
  },
  afkChannelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  afkTimeout: {
    type: Number,
    default: 300
  },
  widgetEnabled: {
    type: Boolean,
    default: false
  },
  widgetChannelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  verificationLevel: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
    default: 0
  },
  defaultMessageNotifications: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  explicitContentFilter: {
    type: Number,
    enum: [0, 1, 2],
    default: 0
  },
  mfaLevel: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  systemChannelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  systemChannelFlags: {
    type: Number,
    default: 0
  },
  rulesChannelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  publicUpdatesChannelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  maxPresences: {
    type: Number,
    default: null
  },
  maxMembers: {
    type: Number,
    default: 250000
  },
  vanityUrlCode: {
    type: String,
    default: null
  },
  premiumTier: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 0
  },
  premiumSubscriptionCount: {
    type: Number,
    default: 0
  },
  preferredLocale: {
    type: String,
    default: 'en-US'
  },
  features: [{
    type: String
    // Examples: 'ANIMATED_ICON', 'BANNER', 'COMMERCE', 'COMMUNITY', 'DISCOVERABLE',
    // 'FEATURABLE', 'INVITE_SPLASH', 'MEMBER_VERIFICATION_GATE_ENABLED', 'NEWS',
    // 'PARTNERED', 'PREVIEW_ENABLED', 'VANITY_URL', 'VERIFIED', 'VIP_REGIONS',
    // 'WELCOME_SCREEN_ENABLED', 'TICKETED_EVENTS_ENABLED', 'MONETIZATION_ENABLED',
    // 'MORE_STICKERS', 'THREE_DAY_THREAD_ARCHIVE', 'SEVEN_DAY_THREAD_ARCHIVE',
    // 'PRIVATE_THREADS', 'ROLE_ICONS'
  }],
  // Server folders and organization
  folder: {
    id: {
      type: String,
      default: null
    },
    name: {
      type: String,
      maxlength: 50,
      default: ''
    },
    color: {
      type: String,
      default: null
    }
  },
  // Enhanced moderation
  moderationSettings: {
    autoModEnabled: {
      type: Boolean,
      default: false
    },
    spamFilter: {
      type: Boolean,
      default: true
    },
    linkFilter: {
      type: Boolean,
      default: false
    },
    profanityFilter: {
      type: Boolean,
      default: false
    },
    mentionSpamLimit: {
      type: Number,
      default: 5
    },
    raidProtection: {
      type: Boolean,
      default: false
    },
    verificationGate: {
      type: Boolean,
      default: false
    },
    welcomeScreen: {
      enabled: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        maxlength: 140,
        default: ''
      },
      welcomeChannels: [{
        channelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Channel'
        },
        description: {
          type: String,
          maxlength: 50
        },
        emoji: {
          name: String,
          id: String,
          animated: Boolean
        }
      }]
    }
  },
  // Custom emojis and stickers
  emojis: [{
    id: String,
    name: {
      type: String,
      required: true
    },
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requireColons: {
      type: Boolean,
      default: true
    },
    managed: {
      type: Boolean,
      default: false
    },
    animated: {
      type: Boolean,
      default: false
    },
    available: {
      type: Boolean,
      default: true
    },
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stickers: [{
    id: String,
    name: {
      type: String,
      required: true
    },
    description: String,
    tags: String,
    type: {
      type: Number,
      enum: [1, 2], // 1: STANDARD, 2: GUILD
      default: 2
    },
    formatType: {
      type: Number,
      enum: [1, 2, 3], // 1: PNG, 2: APNG, 3: LOTTIE
      default: 1
    },
    available: {
      type: Boolean,
      default: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sortValue: Number,
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  // Channel categories for organization
  categories: [{
    id: String,
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    position: {
      type: Number,
      default: 0
    },
    permissions: [{
      id: String, // role or user ID
      type: {
        type: String,
        enum: ['role', 'member']
      },
      allow: String,
      deny: String
    }],
    channels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    }]
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    nick: {
      type: String,
      maxlength: 32,
      default: null
    },
    roles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }],
    joinedAt: {
      type: Date,
      default: Date.now
    },
    premiumSince: {
      type: Date,
      default: null
    },
    deaf: {
      type: Boolean,
      default: false
    },
    mute: {
      type: Boolean,
      default: false
    },
    pending: {
      type: Boolean,
      default: false
    },
    permissions: {
      type: String,
      default: null
    }
  }],
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  emojis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emoji'
  }],
  invites: [{
    code: {
      type: String,
      required: true,
      unique: true
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    uses: {
      type: Number,
      default: 0
    },
    maxUses: {
      type: Number,
      default: 0
    },
    maxAge: {
      type: Number,
      default: 86400
    },
    temporary: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    }
  }],
  bans: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      maxlength: 512,
      default: null
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Audit logs for moderation tracking
  auditLogs: [{
    id: String,
    actionType: {
      type: String,
      enum: [
        'GUILD_UPDATE', 'CHANNEL_CREATE', 'CHANNEL_UPDATE', 'CHANNEL_DELETE',
        'CHANNEL_OVERWRITE_CREATE', 'CHANNEL_OVERWRITE_UPDATE', 'CHANNEL_OVERWRITE_DELETE',
        'MEMBER_KICK', 'MEMBER_PRUNE', 'MEMBER_BAN_ADD', 'MEMBER_BAN_REMOVE',
        'MEMBER_UPDATE', 'MEMBER_ROLE_UPDATE', 'MEMBER_MOVE', 'MEMBER_DISCONNECT',
        'BOT_ADD', 'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE',
        'INVITE_CREATE', 'INVITE_UPDATE', 'INVITE_DELETE',
        'WEBHOOK_CREATE', 'WEBHOOK_UPDATE', 'WEBHOOK_DELETE',
        'EMOJI_CREATE', 'EMOJI_UPDATE', 'EMOJI_DELETE',
        'MESSAGE_DELETE', 'MESSAGE_BULK_DELETE', 'MESSAGE_PIN', 'MESSAGE_UNPIN',
        'INTEGRATION_CREATE', 'INTEGRATION_UPDATE', 'INTEGRATION_DELETE',
        'STAGE_INSTANCE_CREATE', 'STAGE_INSTANCE_UPDATE', 'STAGE_INSTANCE_DELETE',
        'STICKER_CREATE', 'STICKER_UPDATE', 'STICKER_DELETE',
        'GUILD_SCHEDULED_EVENT_CREATE', 'GUILD_SCHEDULED_EVENT_UPDATE', 'GUILD_SCHEDULED_EVENT_DELETE',
        'THREAD_CREATE', 'THREAD_UPDATE', 'THREAD_DELETE',
        'APPLICATION_COMMAND_PERMISSION_UPDATE', 'AUTO_MODERATION_RULE_CREATE',
        'AUTO_MODERATION_RULE_UPDATE', 'AUTO_MODERATION_RULE_DELETE',
        'AUTO_MODERATION_BLOCK_MESSAGE', 'AUTO_MODERATION_FLAG_TO_CHANNEL',
        'AUTO_MODERATION_USER_COMMUNICATION_DISABLED'
      ],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetId: String, // ID of affected user/channel/role/etc
    targetType: {
      type: String,
      enum: ['USER', 'CHANNEL', 'ROLE', 'INVITE', 'WEBHOOK', 'EMOJI', 'MESSAGE', 'INTEGRATION', 'STAGE_INSTANCE', 'STICKER', 'GUILD_SCHEDULED_EVENT', 'THREAD']
    },
    reason: {
      type: String,
      maxlength: 512
    },
    changes: [{
      key: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    options: {
      deleteMemberDays: String,
      membersRemoved: String,
      channelId: String,
      messageId: String,
      count: String,
      id: String,
      type: String,
      roleName: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Server statistics and analytics
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    onlineMembers: {
      type: Number,
      default: 0
    },
    voiceConnections: {
      type: Number,
      default: 0
    },
    boostCount: {
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
      joins: {
        type: Number,
        default: 0
      },
      leaves: {
        type: Number,
        default: 0
      },
      voiceMinutes: {
        type: Number,
        default: 0
      }
    }]
  },
  // Server events and scheduled events
  scheduledEvents: [{
    id: String,
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 1000
    },
    scheduledStartTime: {
      type: Date,
      required: true
    },
    scheduledEndTime: Date,
    privacyLevel: {
      type: Number,
      enum: [2], // GUILD_ONLY
      default: 2
    },
    status: {
      type: Number,
      enum: [1, 2, 3, 4], // SCHEDULED, ACTIVE, COMPLETED, CANCELED
      default: 1
    },
    entityType: {
      type: Number,
      enum: [1, 2, 3], // STAGE_INSTANCE, VOICE, EXTERNAL
      required: true
    },
    entityId: String,
    entityMetadata: {
      location: String // for EXTERNAL events
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userCount: {
      type: Number,
      default: 0
    },
    image: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate invite code
serverSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if user is member
serverSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Get member
serverSchema.methods.getMember = function(userId) {
  return this.members.find(member => member.user.toString() === userId.toString());
};

module.exports = mongoose.model('Server', serverSchema);
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  color: {
    type: Number,
    default: 0,
    min: 0,
    max: 16777215 // Max RGB value
  },
  hoist: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: null
  },
  unicodeEmoji: {
    type: String,
    default: null
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  permissions: {
    type: String,
    required: true,
    default: '0'
  },
  managed: {
    type: Boolean,
    default: false
  },
  mentionable: {
    type: Boolean,
    default: false
  },
  tags: {
    botId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    premiumSubscriber: {
      type: Boolean,
      default: null
    },
    subscriptionListingId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    availableForPurchase: {
      type: Boolean,
      default: null
    },
    guildConnections: {
      type: Boolean,
      default: null
    }
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  flags: {
    type: Number,
    default: 0
  },
  // Enhanced role features
  hierarchy: {
    level: {
      type: Number,
      default: 0,
      min: 0
    },
    canManageBelow: {
      type: Boolean,
      default: true
    }
  },
  autoAssignment: {
    enabled: {
      type: Boolean,
      default: false
    },
    conditions: {
      onJoin: {
        type: Boolean,
        default: false
      },
      afterVerification: {
        type: Boolean,
        default: false
      },
      afterTime: {
        duration: {
          type: Number,
          default: 0 // in milliseconds
        },
        enabled: {
          type: Boolean,
          default: false
        }
      },
      basedOnActivity: {
        messageCount: {
          type: Number,
          default: 0
        },
        voiceTime: {
          type: Number,
          default: 0 // in minutes
        },
        enabled: {
          type: Boolean,
          default: false
        }
      }
    }
  },
  channelOverrides: [{
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
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
  temporaryRole: {
    enabled: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 0 // in milliseconds
    },
    autoRemove: {
      type: Boolean,
      default: true
    }
  },
  roleRewards: {
    xpBonus: {
      type: Number,
      default: 0,
      min: 0,
      max: 500 // percentage bonus
    },
    currencyBonus: {
      type: Number,
      default: 0,
      min: 0,
      max: 500
    },
    specialPerks: [{
      type: String,
      enum: ['custom_emoji', 'custom_status', 'priority_queue', 'exclusive_channels', 'voice_priority']
    }]
  },
  statistics: {
    memberCount: {
      type: Number,
      default: 0
    },
    assignedCount: {
      type: Number,
      default: 0
    },
    lastAssigned: {
      type: Date,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Permission constants
roleSchema.statics.PERMISSIONS = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
  MODERATE_MEMBERS: 1n << 40n,
  VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
  USE_SOUNDBOARD: 1n << 42n,
  CREATE_GUILD_EXPRESSIONS: 1n << 43n,
  CREATE_EVENTS: 1n << 44n,
  USE_EXTERNAL_SOUNDS: 1n << 45n,
  SEND_VOICE_MESSAGES: 1n << 46n
};

// Check if role has specific permission
roleSchema.methods.hasPermission = function(permission) {
  const rolePermissions = BigInt(this.permissions);
  const permissionBit = BigInt(permission);
  
  // Administrator has all permissions
  if (rolePermissions & this.constructor.PERMISSIONS.ADMINISTRATOR) {
    return true;
  }
  
  return (rolePermissions & permissionBit) === permissionBit;
};

// Add permission to role
roleSchema.methods.addPermission = function(permission) {
  const rolePermissions = BigInt(this.permissions);
  const permissionBit = BigInt(permission);
  this.permissions = (rolePermissions | permissionBit).toString();
};

// Remove permission from role
roleSchema.methods.removePermission = function(permission) {
  const rolePermissions = BigInt(this.permissions);
  const permissionBit = BigInt(permission);
  this.permissions = (rolePermissions & ~permissionBit).toString();
};

// Get role color as hex
roleSchema.virtual('hexColor').get(function() {
  return '#' + this.color.toString(16).padStart(6, '0');
});

// Check if role is default (@everyone)
roleSchema.virtual('isDefault').get(function() {
  return this.name === '@everyone';
});

// Check if role is hoisted (displayed separately)
roleSchema.virtual('isHoisted').get(function() {
  return this.hoist;
});

// Check if role is managed by integration
roleSchema.virtual('isManaged').get(function() {
  return this.managed;
});

// Check if role can be mentioned
roleSchema.virtual('isMentionable').get(function() {
  return this.mentionable;
});

// Enhanced role management methods
roleSchema.methods.canManageRole = function(targetRole) {
  if (this.hasPermission(this.constructor.PERMISSIONS.ADMINISTRATOR)) {
    return true;
  }
  
  if (!this.hierarchy.canManageBelow) {
    return false;
  }
  
  return this.hierarchy.level > targetRole.hierarchy.level;
};

// Check if role should be auto-assigned to user
roleSchema.methods.shouldAutoAssign = function(user, context = {}) {
  if (!this.autoAssignment.enabled) {
    return false;
  }
  
  const conditions = this.autoAssignment.conditions;
  
  if (context.onJoin && conditions.onJoin) {
    return true;
  }
  
  if (context.afterVerification && conditions.afterVerification) {
    return true;
  }
  
  if (conditions.afterTime.enabled && context.memberDuration >= conditions.afterTime.duration) {
    return true;
  }
  
  if (conditions.basedOnActivity.enabled) {
    const userStats = context.userStats || {};
    return (userStats.messageCount >= conditions.basedOnActivity.messageCount) &&
           (userStats.voiceTime >= conditions.basedOnActivity.voiceTime);
  }
  
  return false;
};

// Get effective permissions for a channel
roleSchema.methods.getChannelPermissions = function(channelId) {
  const basePermissions = BigInt(this.permissions);
  const override = this.channelOverrides.find(o => o.channelId.toString() === channelId.toString());
  
  if (!override) {
    return basePermissions;
  }
  
  const allow = BigInt(override.allow);
  const deny = BigInt(override.deny);
  
  // Apply deny first, then allow
  return (basePermissions & ~deny) | allow;
};

// Update role statistics
roleSchema.methods.updateStatistics = function(memberCount) {
  this.statistics.memberCount = memberCount;
  this.statistics.lastAssigned = new Date();
  this.statistics.assignedCount += 1;
};

// Static method to find roles by hierarchy level
roleSchema.statics.findByHierarchyLevel = function(serverId, minLevel, maxLevel) {
  const query = {
    server: serverId,
    'hierarchy.level': {
      $gte: minLevel || 0
    }
  };
  
  if (maxLevel !== undefined) {
    query['hierarchy.level'].$lte = maxLevel;
  }
  
  return this.find(query).sort({ 'hierarchy.level': -1, position: -1 });
};

// Static method to find auto-assignable roles
roleSchema.statics.findAutoAssignable = function(serverId, context) {
  const query = {
    server: serverId,
    'autoAssignment.enabled': true
  };
  
  if (context.onJoin) {
    query['autoAssignment.conditions.onJoin'] = true;
  }
  
  if (context.afterVerification) {
    query['autoAssignment.conditions.afterVerification'] = true;
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Role', roleSchema);
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null
  },
  type: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 18, 19, 20, 21, 22, 23, 24],
    default: 0
    // 0: DEFAULT, 1: RECIPIENT_ADD, 2: RECIPIENT_REMOVE, 3: CALL, 4: CHANNEL_NAME_CHANGE
    // 5: CHANNEL_ICON_CHANGE, 6: CHANNEL_PINNED_MESSAGE, 7: GUILD_MEMBER_JOIN
    // 8: USER_PREMIUM_GUILD_SUBSCRIPTION, 9: USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1
    // 10: USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2, 11: USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3
    // 12: CHANNEL_FOLLOW_ADD, 14: GUILD_DISCOVERY_DISQUALIFIED, 15: GUILD_DISCOVERY_REQUALIFIED
    // 18: THREAD_CREATED, 19: REPLY, 20: CHAT_INPUT_COMMAND, 21: THREAD_STARTER_MESSAGE
    // 22: GUILD_INVITE_REMINDER, 23: CONTEXT_MENU_COMMAND, 24: AUTO_MODERATION_ACTION
  },
  tts: {
    type: Boolean,
    default: false
  },
  mentionEveryone: {
    type: Boolean,
    default: false
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentionRoles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  mentionChannels: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    guildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    },
    type: {
      type: Number
    },
    name: {
      type: String
    }
  }],
  attachments: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    filename: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: 1024,
      default: null
    },
    contentType: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    proxyUrl: {
      type: String,
      default: null
    },
    height: {
      type: Number,
      default: null
    },
    width: {
      type: Number,
      default: null
    },
    ephemeral: {
      type: Boolean,
      default: false
    }
  }],
  embeds: [{
    title: {
      type: String,
      maxlength: 256,
      default: null
    },
    type: {
      type: String,
      enum: ['rich', 'image', 'video', 'gifv', 'article', 'link'],
      default: 'rich'
    },
    description: {
      type: String,
      maxlength: 4096,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: null
    },
    color: {
      type: Number,
      default: null
    },
    footer: {
      text: {
        type: String,
        maxlength: 2048,
        default: null
      },
      iconUrl: {
        type: String,
        default: null
      },
      proxyIconUrl: {
        type: String,
        default: null
      }
    },
    image: {
      url: {
        type: String,
        default: null
      },
      proxyUrl: {
        type: String,
        default: null
      },
      height: {
        type: Number,
        default: null
      },
      width: {
        type: Number,
        default: null
      }
    },
    thumbnail: {
      url: {
        type: String,
        default: null
      },
      proxyUrl: {
        type: String,
        default: null
      },
      height: {
        type: Number,
        default: null
      },
      width: {
        type: Number,
        default: null
      }
    },
    video: {
      url: {
        type: String,
        default: null
      },
      proxyUrl: {
        type: String,
        default: null
      },
      height: {
        type: Number,
        default: null
      },
      width: {
        type: Number,
        default: null
      }
    },
    provider: {
      name: {
        type: String,
        default: null
      },
      url: {
        type: String,
        default: null
      }
    },
    author: {
      name: {
        type: String,
        maxlength: 256,
        default: null
      },
      url: {
        type: String,
        default: null
      },
      iconUrl: {
        type: String,
        default: null
      },
      proxyIconUrl: {
        type: String,
        default: null
      }
    },
    fields: [{
      name: {
        type: String,
        maxlength: 256,
        required: true
      },
      value: {
        type: String,
        maxlength: 1024,
        required: true
      },
      inline: {
        type: Boolean,
        default: false
      }
    }]
  }],
  reactions: [{
    emoji: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      name: {
        type: String,
        required: true
      },
      animated: {
        type: Boolean,
        default: false
      }
    },
    count: {
      type: Number,
      default: 1
    },
    me: {
      type: Boolean,
      default: false
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  nonce: {
    type: String,
    default: null
  },
  pinned: {
    type: Boolean,
    default: false
  },
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  activity: {
    type: {
      type: Number,
      enum: [1, 2, 3, 5],
      default: null
    },
    partyId: {
      type: String,
      default: null
    }
  },
  application: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    name: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: null
    },
    icon: {
      type: String,
      default: null
    },
    coverImage: {
      type: String,
      default: null
    }
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  messageReference: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      default: null
    },
    guildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      default: null
    },
    failIfNotExists: {
      type: Boolean,
      default: true
    }
  },
  flags: {
    type: Number,
    default: 0
  },
  referencedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  interaction: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    type: {
      type: Number,
      default: null
    },
    name: {
      type: String,
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  components: [{
    type: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true
    },
    components: [{
      type: {
        type: Number,
        enum: [2, 3, 4, 5, 6, 7, 8],
        required: true
      },
      customId: {
        type: String,
        maxlength: 100,
        default: null
      },
      disabled: {
        type: Boolean,
        default: false
      },
      style: {
        type: Number,
        default: null
      },
      label: {
        type: String,
        maxlength: 80,
        default: null
      },
      emoji: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: null
        },
        name: {
          type: String,
          default: null
        },
        animated: {
          type: Boolean,
          default: false
        }
      },
      url: {
        type: String,
        default: null
      }
    }]
  }],
  stickerItems: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    formatType: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true
    }
  }],
  position: {
    type: Number,
    default: null
  },
  editedTimestamp: {
    type: Date,
    default: null
  },
  // Message moderation and safety
  moderation: {
    flagged: {
      type: Boolean,
      default: false
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    flaggedAt: {
      type: Date,
      default: null
    },
    flagReason: {
      type: String,
      enum: ['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'NSFW', 'VIOLENCE', 'SELF_HARM', 'OTHER'],
      default: null
    },
    autoModTriggered: {
      type: Boolean,
      default: false
    },
    autoModAction: {
      type: String,
      enum: ['BLOCK', 'FLAG', 'TIMEOUT'],
      default: null
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deleteReason: {
      type: String,
      maxlength: 512,
      default: null
    }
  },
  // Message analytics and engagement
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reactionCount: {
      type: Number,
      default: 0
    },
    replyCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    lastInteraction: {
      type: Date,
      default: Date.now
    }
  },
  // Message search and indexing
  searchableContent: {
    type: String,
    default: ''
  },
  contentHash: {
    type: String,
    default: null
  },
  // Voice message specific
  voiceMessage: {
    duration: {
      type: Number,
      default: null // in seconds
    },
    waveform: {
      type: String,
      default: null // base64 encoded waveform data
    },
    transcription: {
      type: String,
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

// Index for efficient querying
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ author: 1, createdAt: -1 });
messageSchema.index({ server: 1, createdAt: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Check if message is edited
messageSchema.virtual('isEdited').get(function() {
  return this.editedTimestamp !== null;
});

// Check if message is deleted
messageSchema.virtual('isDeleted').get(function() {
  return this.moderation.deleted;
});

// Get total reaction count
messageSchema.virtual('totalReactions').get(function() {
  return this.reactions.reduce((total, reaction) => total + reaction.count, 0);
});

// Methods for reaction management
messageSchema.methods.addReaction = function(emoji, userId) {
  const existingReaction = this.reactions.find(r => 
    r.emoji.name === emoji.name && 
    (!emoji.id || r.emoji.id?.toString() === emoji.id?.toString())
  );
  
  if (existingReaction) {
    if (!existingReaction.users.includes(userId)) {
      existingReaction.users.push(userId);
      existingReaction.count = existingReaction.users.length;
      this.analytics.reactionCount += 1;
      this.analytics.lastInteraction = new Date();
      return true;
    }
    return false;
  } else {
    this.reactions.push({
      emoji: {
        id: emoji.id || null,
        name: emoji.name,
        animated: emoji.animated || false
      },
      count: 1,
      users: [userId]
    });
    this.analytics.reactionCount += 1;
    this.analytics.lastInteraction = new Date();
    return true;
  }
};

messageSchema.methods.removeReaction = function(emoji, userId) {
  const reactionIndex = this.reactions.findIndex(r => 
    r.emoji.name === emoji.name && 
    (!emoji.id || r.emoji.id?.toString() === emoji.id?.toString())
  );
  
  if (reactionIndex !== -1) {
    const reaction = this.reactions[reactionIndex];
    const userIndex = reaction.users.indexOf(userId);
    
    if (userIndex !== -1) {
      reaction.users.splice(userIndex, 1);
      reaction.count = reaction.users.length;
      this.analytics.reactionCount = Math.max(0, this.analytics.reactionCount - 1);
      
      if (reaction.count === 0) {
        this.reactions.splice(reactionIndex, 1);
      }
      
      this.analytics.lastInteraction = new Date();
      return true;
    }
  }
  return false;
};

// Moderation methods
messageSchema.methods.flagMessage = function(userId, reason) {
  this.moderation.flagged = true;
  this.moderation.flaggedBy = userId;
  this.moderation.flaggedAt = new Date();
  this.moderation.flagReason = reason;
};

messageSchema.methods.deleteMessage = function(userId, reason = null) {
  this.moderation.deleted = true;
  this.moderation.deletedBy = userId;
  this.moderation.deletedAt = new Date();
  this.moderation.deleteReason = reason;
};

messageSchema.methods.triggerAutoMod = function(action) {
  this.moderation.autoModTriggered = true;
  this.moderation.autoModAction = action;
  
  if (action === 'BLOCK') {
    this.moderation.deleted = true;
    this.moderation.deletedAt = new Date();
    this.moderation.deleteReason = 'Auto-moderation: Message blocked';
  }
};

// Analytics methods
messageSchema.methods.recordView = function(userId) {
  this.analytics.views += 1;
  
  // Track unique views
  const existingView = this.analytics.uniqueViews.find(v => 
    v.user.toString() === userId.toString()
  );
  
  if (!existingView) {
    this.analytics.uniqueViews.push({
      user: userId,
      viewedAt: new Date()
    });
  }
  
  this.analytics.lastInteraction = new Date();
};

messageSchema.methods.incrementReplyCount = function() {
  this.analytics.replyCount += 1;
  this.analytics.lastInteraction = new Date();
};

messageSchema.methods.incrementShareCount = function() {
  this.analytics.shareCount += 1;
  this.analytics.lastInteraction = new Date();
};

// Search and content methods
messageSchema.methods.updateSearchableContent = function() {
  let searchContent = this.content || '';
  
  // Add embed content to searchable content
  if (this.embeds && this.embeds.length > 0) {
    this.embeds.forEach(embed => {
      if (embed.title) searchContent += ' ' + embed.title;
      if (embed.description) searchContent += ' ' + embed.description;
      if (embed.fields) {
        embed.fields.forEach(field => {
          searchContent += ' ' + field.name + ' ' + field.value;
        });
      }
    });
  }
  
  // Add attachment filenames
  if (this.attachments && this.attachments.length > 0) {
    this.attachments.forEach(attachment => {
      searchContent += ' ' + attachment.filename;
      if (attachment.description) searchContent += ' ' + attachment.description;
    });
  }
  
  this.searchableContent = searchContent.toLowerCase().trim();
};

// Pre-save middleware to update searchable content
messageSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('embeds') || this.isModified('attachments')) {
    this.updateSearchableContent();
  }
  next();
});

// Static methods for querying
messageSchema.statics.findByContent = function(searchTerm, channelId = null, limit = 50) {
  const query = {
    searchableContent: { $regex: searchTerm.toLowerCase(), $options: 'i' },
    'moderation.deleted': { $ne: true }
  };
  
  if (channelId) {
    query.channel = channelId;
  }
  
  return this.find(query)
    .populate('author', 'username avatar discriminator')
    .populate('channel', 'name type')
    .sort({ createdAt: -1 })
    .limit(limit);
};

messageSchema.statics.findPinned = function(channelId) {
  return this.find({
    channel: channelId,
    pinned: true,
    'moderation.deleted': { $ne: true }
  })
  .populate('author', 'username avatar discriminator')
  .sort({ createdAt: -1 });
};

messageSchema.statics.findWithReactions = function(channelId, limit = 50) {
  return this.find({
    channel: channelId,
    'reactions.0': { $exists: true },
    'moderation.deleted': { $ne: true }
  })
  .populate('author', 'username avatar discriminator')
  .sort({ 'analytics.reactionCount': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Message', messageSchema);
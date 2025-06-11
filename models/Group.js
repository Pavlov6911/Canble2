const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  type: {
    type: String,
    enum: ['community', 'private'],
    required: true
  },
  icon: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin', 'owner'],
      default: 'member'
    },
    nickname: {
      type: String,
      maxlength: 32
    },
    muted: {
      type: Boolean,
      default: false
    },
    mutedUntil: {
      type: Date,
      default: null
    }
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: true // For community groups
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 1000,
      max: 10000
    },
    defaultChannelPermissions: {
      type: Map,
      of: Boolean,
      default: new Map([
        ['VIEW_CHANNELS', true],
        ['SEND_MESSAGES', true],
        ['READ_MESSAGE_HISTORY', true],
        ['USE_VOICE_ACTIVITY', true],
        ['CONNECT', true],
        ['SPEAK', true]
      ])
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none'
    },
    contentFilter: {
      type: String,
      enum: ['disabled', 'members_without_roles', 'all_members'],
      default: 'disabled'
    },
    slowModeDelay: {
      type: Number,
      default: 0,
      min: 0,
      max: 21600 // 6 hours in seconds
    }
  },
  invites: [{
    code: {
      type: String,
      required: true,
      unique: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uses: {
      type: Number,
      default: 0
    },
    maxUses: {
      type: Number,
      default: 0 // 0 = unlimited
    },
    expiresAt: {
      type: Date,
      default: null
    },
    temporary: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      maxlength: 200
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    }
  }],
  tags: [{
    type: String,
    maxlength: 20
  }],
  category: {
    type: String,
    enum: [
      'gaming', 'music', 'education', 'science', 'technology',
      'entertainment', 'art', 'sports', 'lifestyle', 'business',
      'community', 'other'
    ],
    default: 'other'
  },
  language: {
    type: String,
    default: 'en'
  },
  region: {
    type: String,
    default: 'us-east'
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    peakMembers: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  features: [{
    type: String,
    enum: [
      'COMMUNITY', 'NEWS', 'PARTNERED', 'VERIFIED',
      'DISCOVERABLE', 'FEATURABLE', 'INVITE_SPLASH',
      'VIP_REGIONS', 'VANITY_URL', 'ANIMATED_ICON',
      'BANNER', 'COMMERCE', 'WELCOME_SCREEN_ENABLED'
    ]
  }],
  vanityUrl: {
    type: String,
    unique: true,
    sparse: true,
    match: /^[a-zA-Z0-9-_]{2,32}$/
  },
  welcomeScreen: {
    enabled: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      maxlength: 140
    },
    welcomeChannels: [{
      channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
      },
      description: {
        type: String,
        maxlength: 42
      },
      emoji: {
        type: String
      }
    }]
  },
  rules: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    }
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Indexes
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ type: 1, isActive: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ owner: 1 });
groupSchema.index({ category: 1, type: 1 });
groupSchema.index({ 'settings.isPublic': 1, type: 1 });
groupSchema.index({ vanityUrl: 1 }, { sparse: true });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ 'statistics.activeMembers': -1 });

// Virtual properties
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

groupSchema.virtual('onlineMembers').get(function() {
  // This would need to be populated with actual online status
  return this.members.filter(member => member.user.status === 'online').length;
});

groupSchema.virtual('isPrivate').get(function() {
  return this.type === 'private';
});

groupSchema.virtual('isCommunity').get(function() {
  return this.type === 'community';
});

// Instance methods
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

groupSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

groupSchema.methods.isAdmin = function(userId) {
  return this.admins.includes(userId) || this.isOwner(userId);
};

groupSchema.methods.isModerator = function(userId) {
  return this.moderators.includes(userId) || this.isAdmin(userId);
};

groupSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

groupSchema.methods.canManageGroup = function(userId) {
  return this.isOwner(userId) || this.isAdmin(userId);
};

groupSchema.methods.canModerate = function(userId) {
  return this.isModerator(userId);
};

groupSchema.methods.canInvite = function(userId) {
  if (!this.settings.allowInvites) return false;
  return this.isMember(userId);
};

groupSchema.methods.addMember = async function(userId, role = 'member') {
  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }

  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Group has reached maximum member limit');
  }

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });

  // Update statistics
  this.statistics.activeMembers = this.members.length;
  if (this.members.length > this.statistics.peakMembers) {
    this.statistics.peakMembers = this.members.length;
  }

  return this.save();
};

groupSchema.methods.removeMember = async function(userId) {
  if (!this.isMember(userId)) {
    throw new Error('User is not a member');
  }

  if (this.isOwner(userId)) {
    throw new Error('Cannot remove group owner');
  }

  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  this.admins = this.admins.filter(admin => admin.toString() !== userId.toString());
  this.moderators = this.moderators.filter(mod => mod.toString() !== userId.toString());

  this.statistics.activeMembers = this.members.length;

  return this.save();
};

groupSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('User is not a member');
  }

  if (this.isOwner(userId) && newRole !== 'owner') {
    throw new Error('Cannot change owner role');
  }

  member.role = newRole;

  // Update admin/moderator arrays
  const userIdStr = userId.toString();
  this.admins = this.admins.filter(admin => admin.toString() !== userIdStr);
  this.moderators = this.moderators.filter(mod => mod.toString() !== userIdStr);

  if (newRole === 'admin') {
    this.admins.push(userId);
  } else if (newRole === 'moderator') {
    this.moderators.push(userId);
  }

  return this.save();
};

groupSchema.methods.createInvite = function(creatorId, options = {}) {
  const {
    maxUses = 0,
    expiresIn = null,
    temporary = false
  } = options;

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

  const invite = {
    code,
    creator: creatorId,
    maxUses,
    expiresAt,
    temporary,
    uses: 0,
    createdAt: new Date()
  };

  this.invites.push(invite);
  return invite;
};

groupSchema.methods.useInvite = async function(inviteCode, userId) {
  const invite = this.invites.find(inv => inv.code === inviteCode);
  if (!invite) {
    throw new Error('Invalid invite code');
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new Error('Invite has expired');
  }

  if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
    throw new Error('Invite has reached maximum uses');
  }

  if (this.isMember(userId)) {
    throw new Error('User is already a member');
  }

  await this.addMember(userId);
  invite.uses += 1;

  return this.save();
};

groupSchema.methods.updateStatistics = async function() {
  this.statistics.lastActivity = new Date();
  return this.save();
};

// Static methods
groupSchema.statics.findPublicGroups = function(options = {}) {
  const {
    category,
    search,
    limit = 20,
    skip = 0,
    sortBy = 'members'
  } = options;

  const query = {
    type: 'community',
    'settings.isPublic': true,
    isActive: true
  };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    query.$text = { $search: search };
  }

  let sort = {};
  switch (sortBy) {
    case 'members':
      sort = { 'statistics.activeMembers': -1 };
      break;
    case 'activity':
      sort = { 'statistics.lastActivity': -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    default:
      sort = { 'statistics.activeMembers': -1 };
  }

  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('owner', 'username avatar')
    .select('-invites -joinRequests');
};

groupSchema.statics.findUserGroups = function(userId, type = null) {
  const query = {
    'members.user': userId,
    isActive: true
  };

  if (type) {
    query.type = type;
  }

  return this.find(query)
    .populate('owner', 'username avatar')
    .populate('channels', 'name type')
    .sort({ 'statistics.lastActivity': -1 });
};

groupSchema.statics.findByVanityUrl = function(vanityUrl) {
  return this.findOne({ vanityUrl, isActive: true })
    .populate('owner', 'username avatar')
    .populate('channels');
};

groupSchema.statics.searchGroups = function(searchTerm, options = {}) {
  const {
    type,
    category,
    limit = 20,
    skip = 0
  } = options;

  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .skip(skip)
    .populate('owner', 'username avatar');
};

module.exports = mongoose.model('Group', groupSchema);
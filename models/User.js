const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 32
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  discriminator: {
    type: String,
    required: true,
    length: 4
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'invisible', 'offline'],
    default: 'offline'
  },
  customStatus: {
    text: {
      type: String,
      maxlength: 128,
      default: ''
    },
    emoji: {
      name: String,
      id: String,
      animated: Boolean
    },
    expiresAt: Date
  },
  bio: {
    type: String,
    maxlength: 190,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  accentColor: {
    type: String,
    default: '#5865F2'
  },
  verified: {
    type: Boolean,
    default: false
  },
  bot: {
    type: Boolean,
    default: false
  },
  system: {
    type: Boolean,
    default: false
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  locale: {
    type: String,
    default: 'en-US'
  },
  flags: {
    type: Number,
    default: 0
  },
  premiumType: {
    type: Number,
    default: 0
    // 0: None, 1: Drift, 2: Drift King
  },
  premiumSince: {
    type: Date,
    default: null
  },
  premiumGuildSince: {
    type: Date,
    default: null
  },
  publicFlags: {
    type: Number,
    default: 0
  },
  // Enhanced profile features
  pronouns: {
    type: String,
    maxlength: 40,
    default: ''
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'auto'],
    default: 'dark'
  },
  // Notification preferences
  notificationSettings: {
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
    sounds: {
      type: Boolean,
      default: true
    },
    dmSounds: {
      type: Boolean,
      default: true
    },
    mentionSounds: {
      type: Boolean,
      default: true
    }
  },
  // Privacy settings
  privacySettings: {
    allowDirectMessages: {
      type: String,
      enum: ['everyone', 'friends', 'none'],
      default: 'friends'
    },
    allowFriendRequests: {
      type: Boolean,
      default: true
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    showCurrentActivity: {
      type: Boolean,
      default: true
    }
  },
  // Voice & Video settings
  voiceSettings: {
    inputDevice: String,
    outputDevice: String,
    inputVolume: {
      type: Number,
      default: 100
    },
    outputVolume: {
      type: Number,
      default: 100
    },
    pushToTalk: {
      type: Boolean,
      default: false
    },
    pushToTalkKey: String,
    voiceActivity: {
      type: Boolean,
      default: true
    },
    echoCancellation: {
      type: Boolean,
      default: true
    },
    noiseSuppression: {
      type: Boolean,
      default: true
    }
  },
  // Activity status
  activities: [{
    name: String,
    type: {
      type: Number,
      default: 0
      // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 5: Competing
    },
    url: String,
    details: String,
    state: String,
    timestamps: {
      start: Date,
      end: Date
    },
    assets: {
      largeImage: String,
      largeText: String,
      smallImage: String,
      smallText: String
    }
  }],
  servers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  }],
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  directMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectMessage'
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate discriminator
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.discriminator) {
    let discriminator;
    let isUnique = false;
    
    while (!isUnique) {
      discriminator = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const existingUser = await mongoose.model('User').findOne({
        username: this.username,
        discriminator: discriminator
      });
      
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.discriminator = discriminator;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full username with discriminator
userSchema.virtual('fullUsername').get(function() {
  return `${this.username}#${this.discriminator}`;
});

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.mfaEnabled;
  return user;
};

module.exports = mongoose.model('User', userSchema);
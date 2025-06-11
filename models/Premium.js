const mongoose = require('mongoose');

const premiumSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  subscription: {
    type: {
      type: String,
      enum: ['drift_classic', 'drift', 'drift_basic', 'server_boost'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending', 'suspended'],
      default: 'pending'
    },
    tier: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    renewalDate: {
      type: Date,
      default: null
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    price: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD',
        maxlength: 3
      }
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'gift_card'],
      default: 'credit_card'
    },
    transactionId: {
      type: String,
      default: null
    }
  },
  features: {
    // File upload limits
    fileUploadLimit: {
      type: Number,
      default: 8 * 1024 * 1024 // 8MB in bytes
    },
    // Custom emoji limits
    customEmojiSlots: {
      type: Number,
      default: 50
    },
    // Server boost features
    serverBoosts: {
      available: {
        type: Number,
        default: 0
      },
      used: {
        type: Number,
        default: 0
      },
      servers: [{
        serverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Server'
        },
        boostedAt: {
          type: Date,
          default: Date.now
        },
        boostLevel: {
          type: Number,
          min: 1,
          max: 3,
          default: 1
        }
      }]
    },
    // Profile customization
    profileCustomization: {
      animatedAvatar: {
        type: Boolean,
        default: false
      },
      customBanner: {
        type: Boolean,
        default: false
      },
      customTag: {
        type: Boolean,
        default: false
      },
      profileBadges: [{
        type: String,
        enum: ['drift', 'early_supporter', 'hypesquad', 'bug_hunter', 'verified_developer']
      }]
    },
    // Communication features
    communication: {
      higherQualityStreaming: {
        type: Boolean,
        default: false
      },
      customStatus: {
        type: Boolean,
        default: false
      },
      globalEmojis: {
        type: Boolean,
        default: false
      },
      prioritySupport: {
        type: Boolean,
        default: false
      }
    },
    // Advanced features
    advanced: {
      messageHistory: {
        unlimited: {
          type: Boolean,
          default: false
        },
        searchLimit: {
          type: Number,
          default: 25 // messages
        }
      },
      voiceChannels: {
        higherBitrate: {
          type: Boolean,
          default: false
        },
        maxBitrate: {
          type: Number,
          default: 96000 // 96kbps
        }
      },
      screenShare: {
        higherResolution: {
          type: Boolean,
          default: false
        },
        maxResolution: {
          type: String,
          default: '720p'
        }
      }
    }
  },
  usage: {
    // Track feature usage for analytics
    fileUploads: {
      count: {
        type: Number,
        default: 0
      },
      totalSize: {
        type: Number,
        default: 0
      },
      lastUpload: {
        type: Date,
        default: null
      }
    },
    customEmojis: {
      created: {
        type: Number,
        default: 0
      },
      used: {
        type: Number,
        default: 0
      }
    },
    voiceTime: {
      total: {
        type: Number,
        default: 0 // in minutes
      },
      thisMonth: {
        type: Number,
        default: 0
      }
    },
    screenShareTime: {
      total: {
        type: Number,
        default: 0 // in minutes
      },
      thisMonth: {
        type: Number,
        default: 0
      }
    }
  },
  billing: {
    history: [{
      date: {
        type: Date,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['paid', 'pending', 'failed', 'refunded'],
        required: true
      },
      transactionId: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    nextBilling: {
      type: Date,
      default: null
    },
    lastBilling: {
      type: Date,
      default: null
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  notifications: {
    renewalReminder: {
      type: Boolean,
      default: true
    },
    paymentFailed: {
      type: Boolean,
      default: true
    },
    featureUpdates: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: false
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
premiumSchema.index({ user: 1 });
premiumSchema.index({ 'subscription.status': 1, 'subscription.endDate': 1 });
premiumSchema.index({ 'subscription.type': 1 });
premiumSchema.index({ 'subscription.renewalDate': 1 });

// Virtual for subscription active status
premiumSchema.virtual('isActive').get(function() {
  return this.subscription.status === 'active' && this.subscription.endDate > new Date();
});

// Virtual for days remaining
premiumSchema.virtual('daysRemaining').get(function() {
  if (!this.isActive) return 0;
  const now = new Date();
  const endDate = new Date(this.subscription.endDate);
  return Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
});

// Virtual for subscription value
premiumSchema.virtual('subscriptionValue').get(function() {
  const monthlyValue = this.subscription.price.amount;
  const totalMonths = this.subscription.billingCycle === 'yearly' ? 12 : 1;
  return monthlyValue * totalMonths;
});

// Check if user has specific feature
premiumSchema.methods.hasFeature = function(featurePath) {
  const keys = featurePath.split('.');
  let current = this.features;
  
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  
  return current === true;
};

// Get feature limit
premiumSchema.methods.getFeatureLimit = function(featurePath) {
  const keys = featurePath.split('.');
  let current = this.features;
  
  for (const key of keys) {
    if (current[key] === undefined) return 0;
    current = current[key];
  }
  
  return typeof current === 'number' ? current : 0;
};

// Add server boost
premiumSchema.methods.addServerBoost = function(serverId, boostLevel = 1) {
  if (this.features.serverBoosts.used >= this.features.serverBoosts.available) {
    throw new Error('No server boosts available');
  }
  
  const existingBoost = this.features.serverBoosts.servers.find(
    boost => boost.serverId.toString() === serverId.toString()
  );
  
  if (existingBoost) {
    existingBoost.boostLevel = Math.max(existingBoost.boostLevel, boostLevel);
    existingBoost.boostedAt = new Date();
  } else {
    this.features.serverBoosts.servers.push({
      serverId,
      boostLevel,
      boostedAt: new Date()
    });
    this.features.serverBoosts.used += 1;
  }
  
  return this.save();
};

// Remove server boost
premiumSchema.methods.removeServerBoost = function(serverId) {
  const boostIndex = this.features.serverBoosts.servers.findIndex(
    boost => boost.serverId.toString() === serverId.toString()
  );
  
  if (boostIndex !== -1) {
    this.features.serverBoosts.servers.splice(boostIndex, 1);
    this.features.serverBoosts.used = Math.max(0, this.features.serverBoosts.used - 1);
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Renew subscription
premiumSchema.methods.renewSubscription = function(transactionId) {
  const now = new Date();
  const billingCycle = this.subscription.billingCycle;
  const duration = billingCycle === 'yearly' ? 365 : 30;
  
  this.subscription.startDate = now;
  this.subscription.endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
  this.subscription.renewalDate = new Date(this.subscription.endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
  this.subscription.status = 'active';
  this.subscription.transactionId = transactionId;
  
  // Add to billing history
  this.billing.history.push({
    date: now,
    amount: this.subscription.price.amount,
    currency: this.subscription.price.currency,
    status: 'paid',
    transactionId,
    description: `${this.subscription.type} subscription renewal`
  });
  
  this.billing.lastBilling = now;
  this.billing.nextBilling = this.subscription.endDate;
  this.billing.totalSpent += this.subscription.price.amount;
  
  return this.save();
};

// Cancel subscription
premiumSchema.methods.cancelSubscription = function() {
  this.subscription.status = 'cancelled';
  this.subscription.autoRenew = false;
  this.subscription.renewalDate = null;
  return this.save();
};

// Update usage statistics
premiumSchema.methods.updateUsage = function(type, data) {
  switch (type) {
    case 'fileUpload':
      this.usage.fileUploads.count += 1;
      this.usage.fileUploads.totalSize += data.size;
      this.usage.fileUploads.lastUpload = new Date();
      break;
    case 'customEmoji':
      if (data.action === 'create') {
        this.usage.customEmojis.created += 1;
      } else if (data.action === 'use') {
        this.usage.customEmojis.used += 1;
      }
      break;
    case 'voiceTime':
      this.usage.voiceTime.total += data.minutes;
      this.usage.voiceTime.thisMonth += data.minutes;
      break;
    case 'screenShare':
      this.usage.screenShareTime.total += data.minutes;
      this.usage.screenShareTime.thisMonth += data.minutes;
      break;
  }
  
  return this.save();
};

// Static method to find expiring subscriptions
premiumSchema.statics.findExpiringSubscriptions = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    'subscription.status': 'active',
    'subscription.endDate': { $lte: futureDate },
    'subscription.autoRenew': true
  });
};

// Static method to find expired subscriptions
premiumSchema.statics.findExpiredSubscriptions = function() {
  return this.find({
    'subscription.status': 'active',
    'subscription.endDate': { $lt: new Date() }
  });
};

// Static method to get subscription statistics
premiumSchema.statics.getSubscriptionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$subscription.type',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$billing.totalSpent' },
        activeSubscriptions: {
          $sum: {
            $cond: [
              { $eq: ['$subscription.status', 'active'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Premium', premiumSchema);
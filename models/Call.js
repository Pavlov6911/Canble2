const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['voice', 'video', 'screen_share', 'group_voice', 'group_video']
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['invited', 'ringing', 'connected', 'disconnected', 'declined', 'missed'],
      default: 'invited'
    },
    audioEnabled: {
      type: Boolean,
      default: true
    },
    videoEnabled: {
      type: Boolean,
      default: false
    },
    screenSharing: {
      type: Boolean,
      default: false
    },
    muted: {
      type: Boolean,
      default: false
    },
    deafened: {
      type: Boolean,
      default: false
    },
    speaking: {
      type: Boolean,
      default: false
    },
    volume: {
      type: Number,
      default: 100,
      min: 0,
      max: 200
    }
  }],
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null // null for direct calls
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null // null for direct calls
  },
  status: {
    type: String,
    enum: ['initiating', 'ringing', 'active', 'ended', 'failed'],
    default: 'initiating'
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  quality: {
    audio: {
      bitrate: {
        type: Number,
        default: 64000 // 64kbps
      },
      codec: {
        type: String,
        default: 'opus'
      },
      sampleRate: {
        type: Number,
        default: 48000
      }
    },
    video: {
      resolution: {
        width: {
          type: Number,
          default: 1280
        },
        height: {
          type: Number,
          default: 720
        }
      },
      framerate: {
        type: Number,
        default: 30
      },
      bitrate: {
        type: Number,
        default: 2500000 // 2.5Mbps
      },
      codec: {
        type: String,
        default: 'VP8'
      }
    }
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 25
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    },
    recordingUrl: {
      type: String,
      default: null
    },
    noiseSuppression: {
      type: Boolean,
      default: true
    },
    echoCancellation: {
      type: Boolean,
      default: true
    },
    autoGainControl: {
      type: Boolean,
      default: true
    },
    pushToTalk: {
      enabled: {
        type: Boolean,
        default: false
      },
      key: {
        type: String,
        default: null
      }
    },
    voiceActivation: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: -40 // dB
      }
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
      default: 0
    },
    dataTransferred: {
      type: Number,
      default: 0 // in bytes
    },
    qualityIssues: {
      audioDropouts: {
        type: Number,
        default: 0
      },
      videoFreeze: {
        type: Number,
        default: 0
      },
      connectionIssues: {
        type: Number,
        default: 0
      }
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
callSchema.index({ initiator: 1, createdAt: -1 });
callSchema.index({ 'participants.user': 1, createdAt: -1 });
callSchema.index({ channel: 1, status: 1 });
callSchema.index({ server: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

// Virtual for call duration in human readable format
callSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for active participants
callSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => p.status === 'connected');
});

// Add participant to call
callSchema.methods.addParticipant = function(userId, options = {}) {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (existingParticipant) {
    existingParticipant.status = 'invited';
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = null;
  } else {
    this.participants.push({
      user: userId,
      audioEnabled: options.audioEnabled !== undefined ? options.audioEnabled : true,
      videoEnabled: options.videoEnabled !== undefined ? options.videoEnabled : false,
      ...options
    });
  }
  
  this.statistics.totalParticipants = Math.max(this.statistics.totalParticipants, this.participants.length);
  this.statistics.peakParticipants = Math.max(this.statistics.peakParticipants, this.activeParticipants.length);
  
  return this.save();
};

// Remove participant from call
callSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.status = 'disconnected';
    participant.leftAt = new Date();
    
    // If no active participants left, end the call
    if (this.activeParticipants.length === 0) {
      this.endCall();
    }
  }
  
  return this.save();
};

// Update participant status
callSchema.methods.updateParticipantStatus = function(userId, status, options = {}) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.status = status;
    
    if (status === 'connected' && !participant.joinedAt) {
      participant.joinedAt = new Date();
    }
    
    if (status === 'disconnected' && !participant.leftAt) {
      participant.leftAt = new Date();
    }
    
    // Update other options
    Object.assign(participant, options);
  }
  
  return this.save();
};

// Start the call
callSchema.methods.startCall = function() {
  this.status = 'active';
  this.startedAt = new Date();
  return this.save();
};

// End the call
callSchema.methods.endCall = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  
  if (this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
    this.statistics.totalDuration = this.duration;
  }
  
  // Mark all connected participants as disconnected
  this.participants.forEach(participant => {
    if (participant.status === 'connected') {
      participant.status = 'disconnected';
      participant.leftAt = new Date();
    }
  });
  
  return this.save();
};

// Get call statistics
callSchema.methods.getStatistics = function() {
  const connectedParticipants = this.participants.filter(p => p.status === 'connected');
  const totalConnectedTime = this.participants.reduce((total, p) => {
    if (p.joinedAt && p.leftAt) {
      return total + (p.leftAt - p.joinedAt);
    } else if (p.joinedAt && p.status === 'connected') {
      return total + (Date.now() - p.joinedAt);
    }
    return total;
  }, 0);
  
  return {
    ...this.statistics.toObject(),
    currentParticipants: connectedParticipants.length,
    totalConnectedTime: Math.floor(totalConnectedTime / 1000),
    averageCallDuration: this.statistics.totalParticipants > 0 ? 
      Math.floor(totalConnectedTime / this.statistics.totalParticipants / 1000) : 0
  };
};

// Static method to find active calls for user
callSchema.statics.findActiveCallsForUser = function(userId) {
  return this.find({
    'participants.user': userId,
    'participants.status': 'connected',
    status: 'active'
  });
};

// Static method to find calls in channel
callSchema.statics.findCallsInChannel = function(channelId, limit = 50) {
  return this.find({ channel: channelId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('initiator', 'username avatar')
    .populate('participants.user', 'username avatar');
};

module.exports = mongoose.model('Call', callSchema);
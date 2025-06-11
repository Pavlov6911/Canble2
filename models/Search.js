const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  // Content being indexed
  contentType: {
    type: String,
    required: true,
    enum: ['message', 'user', 'server', 'channel', 'role', 'event']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  // Search content
  searchableText: {
    type: String,
    required: true,
    text: true // Enable text search
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  // Context information
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    default: null
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Metadata for filtering
  metadata: {
    hasAttachments: {
      type: Boolean,
      default: false
    },
    hasEmbeds: {
      type: Boolean,
      default: false
    },
    hasReactions: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    messageType: {
      type: String,
      default: null
    },
    language: {
      type: String,
      default: 'en'
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    category: {
      type: String,
      default: null
    }
  },
  // Search statistics
  statistics: {
    searchCount: {
      type: Number,
      default: 0
    },
    lastSearched: {
      type: Date,
      default: null
    },
    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Permissions and visibility
  visibility: {
    public: {
      type: Boolean,
      default: true
    },
    searchableByRoles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }],
    searchableByUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    excludedFromSearch: {
      type: Boolean,
      default: false
    }
  },
  // Indexing information
  indexing: {
    indexed: {
      type: Boolean,
      default: false
    },
    indexedAt: {
      type: Date,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
searchSchema.index({ searchableText: 'text' });
searchSchema.index({ contentType: 1, contentId: 1 }, { unique: true });
searchSchema.index({ server: 1, channel: 1 });
searchSchema.index({ author: 1, createdAt: -1 });
searchSchema.index({ keywords: 1 });
searchSchema.index({ tags: 1 });
searchSchema.index({ 'statistics.relevanceScore': -1 });
searchSchema.index({ 'statistics.popularityScore': -1 });
searchSchema.index({ 'metadata.hasAttachments': 1 });
searchSchema.index({ 'metadata.isPinned': 1 });
searchSchema.index({ 'visibility.public': 1, 'visibility.excludedFromSearch': 1 });

// Compound indexes for complex queries
searchSchema.index({ server: 1, contentType: 1, createdAt: -1 });
searchSchema.index({ channel: 1, contentType: 1, createdAt: -1 });
searchSchema.index({ author: 1, contentType: 1, createdAt: -1 });

// Virtual for search relevance
searchSchema.virtual('relevance').get(function() {
  return (this.statistics.relevanceScore + this.statistics.popularityScore) / 2;
});

// Update search statistics
searchSchema.methods.recordSearch = function() {
  this.statistics.searchCount += 1;
  this.statistics.lastSearched = new Date();
  
  // Update relevance score based on search frequency
  const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const searchFrequency = this.statistics.searchCount / Math.max(daysSinceCreation, 1);
  this.statistics.relevanceScore = Math.min(100, searchFrequency * 10);
  
  return this.save();
};

// Update content and reindex
searchSchema.methods.updateContent = function(newContent, metadata = {}) {
  this.searchableText = newContent;
  this.keywords = this.extractKeywords(newContent);
  this.metadata = { ...this.metadata.toObject(), ...metadata };
  this.indexing.lastUpdated = new Date();
  this.indexing.version += 1;
  this.indexing.indexed = false; // Mark for reindexing
  
  return this.save();
};

// Extract keywords from text
searchSchema.methods.extractKeywords = function(text) {
  if (!text) return [];
  
  // Simple keyword extraction (in production, use more sophisticated NLP)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && word.length < 20)
    .filter(word => !this.constructor.STOP_WORDS.includes(word));
  
  // Remove duplicates and return top keywords
  const uniqueWords = [...new Set(words)];
  return uniqueWords.slice(0, 20); // Limit to 20 keywords
};

// Check if user can search this content
searchSchema.methods.canUserSearch = function(userId, userRoles = []) {
  if (this.visibility.excludedFromSearch) {
    return false;
  }
  
  if (this.visibility.public) {
    return true;
  }
  
  // Check if user is specifically allowed
  if (this.visibility.searchableByUsers.includes(userId)) {
    return true;
  }
  
  // Check if user has required role
  const hasRequiredRole = userRoles.some(roleId => 
    this.visibility.searchableByRoles.includes(roleId)
  );
  
  return hasRequiredRole;
};

// Mark as indexed
searchSchema.methods.markAsIndexed = function() {
  this.indexing.indexed = true;
  this.indexing.indexedAt = new Date();
  return this.save();
};

// Static method for advanced search
searchSchema.statics.advancedSearch = function(query, options = {}) {
  const searchQuery = {};
  const sortOptions = {};
  
  // Text search
  if (query.text) {
    searchQuery.$text = { $search: query.text };
    sortOptions.score = { $meta: 'textScore' };
  }
  
  // Content type filter
  if (query.contentType) {
    searchQuery.contentType = query.contentType;
  }
  
  // Server filter
  if (query.server) {
    searchQuery.server = query.server;
  }
  
  // Channel filter
  if (query.channel) {
    searchQuery.channel = query.channel;
  }
  
  // Author filter
  if (query.author) {
    searchQuery.author = query.author;
  }
  
  // Date range filter
  if (query.dateFrom || query.dateTo) {
    searchQuery.createdAt = {};
    if (query.dateFrom) searchQuery.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) searchQuery.createdAt.$lte = new Date(query.dateTo);
  }
  
  // Metadata filters
  if (query.hasAttachments !== undefined) {
    searchQuery['metadata.hasAttachments'] = query.hasAttachments;
  }
  
  if (query.hasEmbeds !== undefined) {
    searchQuery['metadata.hasEmbeds'] = query.hasEmbeds;
  }
  
  if (query.isPinned !== undefined) {
    searchQuery['metadata.isPinned'] = query.isPinned;
  }
  
  if (query.isEdited !== undefined) {
    searchQuery['metadata.isEdited'] = query.isEdited;
  }
  
  // Keywords filter
  if (query.keywords && query.keywords.length > 0) {
    searchQuery.keywords = { $in: query.keywords };
  }
  
  // Tags filter
  if (query.tags && query.tags.length > 0) {
    searchQuery.tags = { $in: query.tags };
  }
  
  // Visibility filter
  if (!options.includePrivate) {
    searchQuery['visibility.excludedFromSearch'] = { $ne: true };
  }
  
  // User permission filter
  if (options.userId && options.userRoles) {
    searchQuery.$or = [
      { 'visibility.public': true },
      { 'visibility.searchableByUsers': options.userId },
      { 'visibility.searchableByRoles': { $in: options.userRoles } }
    ];
  }
  
  // Build sort options
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'relevance':
        sortOptions['statistics.relevanceScore'] = -1;
        break;
      case 'popularity':
        sortOptions['statistics.popularityScore'] = -1;
        break;
      case 'date':
        sortOptions.createdAt = options.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'searchCount':
        sortOptions['statistics.searchCount'] = -1;
        break;
    }
  } else if (!query.text) {
    // Default sort by date if no text search
    sortOptions.createdAt = -1;
  }
  
  const aggregationPipeline = [
    { $match: searchQuery },
    { $sort: sortOptions },
    { $skip: options.skip || 0 },
    { $limit: options.limit || 50 }
  ];
  
  // Add population if needed
  if (options.populate) {
    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo'
      }
    });
  }
  
  return this.aggregate(aggregationPipeline);
};

// Static method to get search suggestions
searchSchema.statics.getSearchSuggestions = function(query, options = {}) {
  const pipeline = [
    {
      $match: {
        $or: [
          { keywords: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } },
          { searchableText: { $regex: query, $options: 'i' } }
        ],
        'visibility.excludedFromSearch': { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        keywords: { $addToSet: '$keywords' },
        tags: { $addToSet: '$tags' }
      }
    },
    {
      $project: {
        suggestions: {
          $concatArrays: [
            { $slice: ['$keywords', 10] },
            { $slice: ['$tags', 5] }
          ]
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get popular searches
searchSchema.statics.getPopularSearches = function(options = {}) {
  const timeframe = options.timeframe || 7; // days
  const since = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        'statistics.lastSearched': { $gte: since },
        'visibility.excludedFromSearch': { $ne: true }
      }
    },
    {
      $group: {
        _id: '$keywords',
        searchCount: { $sum: '$statistics.searchCount' },
        lastSearched: { $max: '$statistics.lastSearched' }
      }
    },
    {
      $sort: { searchCount: -1 }
    },
    {
      $limit: options.limit || 20
    }
  ]);
};

// Static method to reindex content
searchSchema.statics.reindexContent = function(contentType, contentId, content, metadata = {}) {
  return this.findOneAndUpdate(
    { contentType, contentId },
    {
      $set: {
        searchableText: content,
        keywords: this.prototype.extractKeywords(content),
        metadata,
        'indexing.lastUpdated': new Date(),
        'indexing.indexed': true,
        'indexing.indexedAt': new Date()
      },
      $inc: {
        'indexing.version': 1
      }
    },
    { upsert: true, new: true }
  );
};

// Static method to clean up old search entries
searchSchema.statics.cleanupOldEntries = function(days = 365) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'statistics.searchCount': { $lt: 5 } // Keep frequently searched items
  });
};

// Common stop words to exclude from keywords
searchSchema.statics.STOP_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
  'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
];

module.exports = mongoose.model('Search', searchSchema);
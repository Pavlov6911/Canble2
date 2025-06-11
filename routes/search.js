const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Search = require('../models/Search');
const Message = require('../models/Message');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/search
// @desc    Advanced search across content
// @access  Private
router.get('/', [
  auth,
  query('q').trim().isLength({ min: 1, max: 500 }).withMessage('Search query must be between 1 and 500 characters'),
  query('type').optional().isIn(['message', 'user', 'server', 'channel', 'all']).withMessage('Invalid search type'),
  query('server').optional().isMongoId().withMessage('Valid server ID required'),
  query('channel').optional().isMongoId().withMessage('Valid channel ID required'),
  query('author').optional().isMongoId().withMessage('Valid author ID required'),
  query('before').optional().isISO8601().withMessage('Valid before date required'),
  query('after').optional().isISO8601().withMessage('Valid after date required'),
  query('hasAttachments').optional().isBoolean().withMessage('Has attachments must be boolean'),
  query('hasEmbeds').optional().isBoolean().withMessage('Has embeds must be boolean'),
  query('isPinned').optional().isBoolean().withMessage('Is pinned must be boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q: searchQuery,
      type = 'all',
      server: serverId,
      channel: channelId,
      author: authorId,
      before,
      after,
      hasAttachments,
      hasEmbeds,
      isPinned,
      limit = 25,
      offset = 0
    } = req.query;

    // Build search filters
    const filters = {
      searchableText: { $regex: searchQuery, $options: 'i' }
    };

    if (type !== 'all') {
      filters.contentType = type;
    }

    if (serverId) {
      // Check if user has access to this server
      const server = await Server.findById(serverId);
      if (!server || !server.isMember(req.user.id)) {
        return res.status(403).json({ message: 'No access to this server' });
      }
      filters['context.server'] = serverId;
    }

    if (channelId) {
      // Check if user has access to this channel
      const channel = await Channel.findById(channelId);
      if (!channel || !channel.canUserViewChannel(req.user.id)) {
        return res.status(403).json({ message: 'No access to this channel' });
      }
      filters['context.channel'] = channelId;
    }

    if (authorId) {
      filters['context.author'] = authorId;
    }

    if (before || after) {
      filters.createdAt = {};
      if (before) filters.createdAt.$lt = new Date(before);
      if (after) filters.createdAt.$gt = new Date(after);
    }

    if (hasAttachments !== undefined) {
      filters['metadata.hasAttachments'] = hasAttachments === 'true';
    }

    if (hasEmbeds !== undefined) {
      filters['metadata.hasEmbeds'] = hasEmbeds === 'true';
    }

    if (isPinned !== undefined) {
      filters['metadata.isPinned'] = isPinned === 'true';
    }

    // Perform search
    const searchResults = await Search.advancedSearch(
      searchQuery,
      filters,
      {
        limit: parseInt(limit),
        offset: parseInt(offset),
        userId: req.user.id
      }
    );

    // Record search for analytics
    await Search.recordSearch(req.user.id, searchQuery, searchResults.length);

    res.json({
      query: searchQuery,
      results: searchResults,
      total: searchResults.length,
      hasMore: searchResults.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Private
router.get('/suggestions', [
  auth,
  query('q').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Query must be between 1 and 100 characters'),
  query('type').optional().isIn(['query', 'user', 'channel', 'server']).withMessage('Invalid suggestion type'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q: query,
      type = 'query',
      limit = 10
    } = req.query;

    let suggestions = [];

    if (type === 'query') {
      suggestions = await Search.getSearchSuggestions(query, parseInt(limit));
    } else if (type === 'user') {
      // Get user suggestions
      const users = await User.find({
        username: { $regex: query || '', $options: 'i' }
      })
      .select('username avatar')
      .limit(parseInt(limit));
      
      suggestions = users.map(user => ({
        type: 'user',
        id: user._id,
        text: user.username,
        avatar: user.avatar
      }));
    } else if (type === 'channel') {
      // Get channel suggestions (only from servers user is in)
      const userServers = await Server.find({ 'members.user': req.user.id });
      const serverIds = userServers.map(s => s._id);
      
      const channels = await Channel.find({
        server: { $in: serverIds },
        name: { $regex: query || '', $options: 'i' }
      })
      .populate('server', 'name')
      .select('name type server')
      .limit(parseInt(limit));
      
      suggestions = channels.map(channel => ({
        type: 'channel',
        id: channel._id,
        text: `#${channel.name}`,
        server: channel.server.name,
        channelType: channel.type
      }));
    } else if (type === 'server') {
      // Get server suggestions (only servers user is in)
      const servers = await Server.find({
        'members.user': req.user.id,
        name: { $regex: query || '', $options: 'i' }
      })
      .select('name icon')
      .limit(parseInt(limit));
      
      suggestions = servers.map(server => ({
        type: 'server',
        id: server._id,
        text: server.name,
        icon: server.icon
      }));
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/popular
// @desc    Get popular searches
// @access  Private
router.get('/popular', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('timeframe').optional().isIn(['day', 'week', 'month', 'all']).withMessage('Invalid timeframe')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      limit = 20,
      timeframe = 'week'
    } = req.query;

    const popularSearches = await Search.getPopularSearches(
      parseInt(limit),
      timeframe
    );

    res.json(popularSearches);
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/search/index
// @desc    Index content for search
// @access  Private
router.post('/index', [
  auth,
  body('contentType').isIn(['message', 'user', 'server', 'channel']).withMessage('Invalid content type'),
  body('contentId').isMongoId().withMessage('Valid content ID required'),
  body('force').optional().isBoolean().withMessage('Force must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { contentType, contentId, force = false } = req.body;

    // Check if content exists and user has permission
    let content;
    switch (contentType) {
      case 'message':
        content = await Message.findById(contentId);
        break;
      case 'user':
        content = await User.findById(contentId);
        break;
      case 'server':
        content = await Server.findById(contentId);
        break;
      case 'channel':
        content = await Channel.findById(contentId);
        break;
    }

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if already indexed
    const existingIndex = await Search.findOne({
      contentType,
      contentId
    });

    if (existingIndex && !force) {
      return res.status(400).json({ message: 'Content already indexed. Use force=true to reindex.' });
    }

    // Index the content
    await Search.indexContent(contentType, contentId, content);

    res.json({ message: 'Content indexed successfully' });
  } catch (error) {
    console.error('Index content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/search/reindex
// @desc    Reindex all content
// @access  Private
router.post('/reindex', [
  auth,
  body('contentType').optional().isIn(['message', 'user', 'server', 'channel', 'all']).withMessage('Invalid content type'),
  body('batchSize').optional().isInt({ min: 1, max: 1000 }).withMessage('Batch size must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      contentType = 'all',
      batchSize = 100
    } = req.body;

    // Start reindexing process
    const result = await Search.reindexContent(contentType, parseInt(batchSize));

    res.json({
      message: 'Reindexing completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/search/cleanup
// @desc    Clean up old search entries
// @access  Private
router.delete('/cleanup', [
  auth,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { days = 30 } = req.query;

    const result = await Search.cleanupOldEntries(parseInt(days));

    res.json({
      message: 'Cleanup completed successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/statistics
// @desc    Get search statistics
// @access  Private
router.get('/statistics', [
  auth,
  query('timeframe').optional().isIn(['day', 'week', 'month', 'year', 'all']).withMessage('Invalid timeframe')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has admin permissions for detailed stats
    const isAdmin = req.user.isAdmin;
    const { timeframe = 'week' } = req.query;

    let stats = {};

    if (isAdmin) {
      // Get comprehensive statistics for admins
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      const matchStage = startDate ? { lastSearched: { $gte: startDate } } : {};

      const [searchStats, contentStats] = await Promise.all([
        Search.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalSearches: { $sum: '$searchCount' },
              uniqueQueries: { $addToSet: '$searchableText' },
              avgRelevance: { $avg: '$relevanceScore' }
            }
          }
        ]),
        Search.aggregate([
          {
            $group: {
              _id: '$contentType',
              count: { $sum: 1 },
              avgRelevance: { $avg: '$relevanceScore' }
            }
          }
        ])
      ]);

      stats = {
        timeframe,
        totalSearches: searchStats[0]?.totalSearches || 0,
        uniqueQueries: searchStats[0]?.uniqueQueries?.length || 0,
        averageRelevance: searchStats[0]?.avgRelevance || 0,
        contentBreakdown: contentStats.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            averageRelevance: item.avgRelevance
          };
          return acc;
        }, {})
      };
    } else {
      // Get limited statistics for regular users
      const userSearches = await Search.find({
        'context.author': req.user.id
      }).countDocuments();

      stats = {
        userSearches,
        message: 'Limited statistics available. Admin access required for detailed analytics.'
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Get search statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/history
// @desc    Get user's search history
// @access  Private
router.get('/history', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 50 } = req.query;

    // Get user's recent searches
    const searchHistory = await Search.find({
      'context.author': req.user.id
    })
    .select('searchableText lastSearched searchCount')
    .sort({ lastSearched: -1 })
    .limit(parseInt(limit));

    res.json(searchHistory);
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/search/history
// @desc    Clear user's search history
// @access  Private
router.delete('/history', auth, async (req, res) => {
  try {
    await Search.deleteMany({
      'context.author': req.user.id
    });

    res.json({ message: 'Search history cleared successfully' });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
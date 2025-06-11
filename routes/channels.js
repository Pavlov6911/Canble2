const express = require('express');
const { body, validationResult } = require('express-validator');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/channels
// @desc    Create a new channel
// @access  Private
router.post('/', auth, [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Channel name must be between 1 and 100 characters')
    .matches(/^[a-z0-9\-_]+$/)
    .withMessage('Channel name can only contain lowercase letters, numbers, hyphens, and underscores'),
  body('type')
    .isIn([0, 2, 4, 5, 13, 15])
    .withMessage('Invalid channel type'),
  body('serverId')
    .isMongoId()
    .withMessage('Invalid server ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, type, serverId, topic, parentId, nsfw = false } = req.body;

    // Check if server exists and user is a member
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    // Get the highest position for new channel
    const highestPosition = await Channel.findOne(
      { server: serverId },
      {},
      { sort: { position: -1 } }
    );
    const position = highestPosition ? highestPosition.position + 1 : 0;

    // Create channel
    const channel = new Channel({
      name,
      type,
      server: serverId,
      topic: topic || '',
      parentId: parentId || null,
      nsfw,
      position
    });

    await channel.save();

    // Add channel to server
    server.channels.push(channel._id);
    await server.save();

    const populatedChannel = await Channel.findById(channel._id)
      .populate('server', 'name icon')
      .populate('parentId', 'name');

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      channel: populatedChannel
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/channels/:id
// @desc    Get channel by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('server', 'name icon members')
      .populate('parentId', 'name');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user has access to this channel
    if (channel.server && !channel.server.members.some(member => 
      member.user.toString() === req.user.id
    )) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    res.json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/channels/:id
// @desc    Update channel
// @access  Private
router.put('/:id', auth, [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Channel name must be between 1 and 100 characters'),
  body('topic')
    .optional()
    .isLength({ max: 1024 })
    .withMessage('Topic must be less than 1024 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const channel = await Channel.findById(req.params.id).populate('server');
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user has permission to edit channel
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    const { name, topic, nsfw, position, parentId } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (topic !== undefined) updateData.topic = topic;
    if (nsfw !== undefined) updateData.nsfw = nsfw;
    if (position !== undefined) updateData.position = position;
    if (parentId !== undefined) updateData.parentId = parentId;

    const updatedChannel = await Channel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('server', 'name icon')
      .populate('parentId', 'name');

    res.json({
      success: true,
      message: 'Channel updated successfully',
      channel: updatedChannel
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/channels/:id
// @desc    Delete channel
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('server');
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check if user has permission to delete channel
    if (channel.server) {
      if (channel.server.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - only server owner can delete channels'
        });
      }

      // Remove channel from server
      await Server.findByIdAndUpdate(channel.server._id, {
        $pull: { channels: channel._id }
      });
    }

    // Delete all messages in the channel
    await Message.deleteMany({ channel: channel._id });

    // Delete the channel
    await Channel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/channels/:id/messages
// @desc    Get messages from a channel
// @access  Private
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const { limit = 50, before, after } = req.query;
    const channelId = req.params.id;

    // Check if channel exists and user has access
    const channel = await Channel.findById(channelId).populate('server');
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check access permissions
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    // Build query
    const query = { channel: channelId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    } else if (after) {
      query.createdAt = { $gt: new Date(after) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate('author', 'username discriminator avatar status')
      .populate('mentions', 'username discriminator avatar')
      .populate('referencedMessage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/channels/:id/typing
// @desc    Send typing indicator
// @access  Private
router.post('/:id/typing', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('server');
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check access permissions
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    // Typing indicator is handled by Socket.io in real-time
    // This endpoint just validates the request
    res.json({
      success: true,
      message: 'Typing indicator sent'
    });
  } catch (error) {
    console.error('Typing indicator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/channels/:id/pins
// @desc    Get pinned messages in a channel
// @access  Private
router.get('/:id/pins', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('server');
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check access permissions
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    const pinnedMessages = await Message.find({
      channel: req.params.id,
      pinned: true
    })
      .populate('author', 'username discriminator avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      messages: pinnedMessages
    });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/channels/:channelId/messages/:messageId/pin
// @desc    Pin/unpin a message
// @access  Private
router.put('/:channelId/messages/:messageId/pin', auth, async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const { pinned } = req.body;

    const channel = await Channel.findById(channelId).populate('server');
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Check access permissions
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.channel.toString() !== channelId) {
      return res.status(400).json({
        success: false,
        message: 'Message does not belong to this channel'
      });
    }

    // Update message pin status
    message.pinned = pinned;
    await message.save();

    // Update channel's last pin timestamp if pinning
    if (pinned) {
      channel.lastPinTimestamp = new Date();
      await channel.save();
    }

    res.json({
      success: true,
      message: pinned ? 'Message pinned successfully' : 'Message unpinned successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
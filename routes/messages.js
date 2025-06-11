const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, audio, and documents
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mp3|wav|pdf|txt|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', auth, upload.array('attachments', 10), [
  body('content')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Message content must be less than 2000 characters'),
  body('channelId')
    .isMongoId()
    .withMessage('Invalid channel ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, channelId, replyTo, tts = false } = req.body;
    const files = req.files || [];

    // Validate that message has content or attachments
    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message must have content or attachments'
      });
    }

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

    // Process file attachments
    const attachments = [];
    for (const file of files) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'canble/attachments',
              public_id: `${Date.now()}_${file.originalname}`
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        attachments.push({
          filename: file.originalname,
          contentType: file.mimetype,
          size: file.size,
          url: result.secure_url,
          proxyUrl: result.secure_url,
          width: result.width || null,
          height: result.height || null
        });
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload attachment'
        });
      }
    }

    // Extract mentions from content
    const mentions = [];
    const mentionRoles = [];
    let mentionEveryone = false;

    if (content) {
      // User mentions: <@userId>
      const userMentions = content.match(/<@!?(\w+)>/g);
      if (userMentions) {
        for (const mention of userMentions) {
          const userId = mention.match(/<@!?(\w+)>/)[1];
          const user = await User.findById(userId);
          if (user && !mentions.includes(userId)) {
            mentions.push(userId);
          }
        }
      }

      // Role mentions: <@&roleId>
      const roleMentions = content.match(/<@&(\w+)>/g);
      if (roleMentions) {
        for (const mention of roleMentions) {
          const roleId = mention.match(/<@&(\w+)>/)[1];
          if (!mentionRoles.includes(roleId)) {
            mentionRoles.push(roleId);
          }
        }
      }

      // Everyone mention: @everyone or @here
      if (content.includes('@everyone') || content.includes('@here')) {
        mentionEveryone = true;
      }
    }

    // Create message
    const messageData = {
      content: content || '',
      author: req.user.id,
      channel: channelId,
      server: channel.server ? channel.server._id : null,
      tts,
      mentionEveryone,
      mentions,
      mentionRoles,
      attachments
    };

    // Handle reply
    if (replyTo) {
      const referencedMessage = await Message.findById(replyTo);
      if (referencedMessage && referencedMessage.channel.toString() === channelId) {
        messageData.messageReference = {
          messageId: replyTo,
          channelId: channelId,
          guildId: channel.server ? channel.server._id : null
        };
        messageData.referencedMessage = replyTo;
      }
    }

    const message = new Message(messageData);
    await message.save();

    // Update channel's last message
    channel.lastMessageId = message._id;
    await channel.save();

    // Populate message data
    const populatedMessage = await Message.findById(message._id)
      .populate('author', 'username discriminator avatar status')
      .populate('mentions', 'username discriminator avatar')
      .populate('referencedMessage', 'content author createdAt')
      .populate({
        path: 'referencedMessage',
        populate: {
          path: 'author',
          select: 'username discriminator avatar'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/messages/:id
// @desc    Get message by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('author', 'username discriminator avatar status')
      .populate('channel', 'name type server')
      .populate('mentions', 'username discriminator avatar')
      .populate('referencedMessage');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to the channel
    const channel = await Channel.findById(message.channel._id).populate('server');
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', auth, [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content } = req.body;

    const message = await Message.findById(req.params.id).populate('channel');
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the author
    if (message.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only edit your own messages'
      });
    }

    // Check if message is too old (15 minutes)
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit messages older than 15 minutes'
      });
    }

    // Update message
    message.content = content;
    message.editedTimestamp = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('author', 'username discriminator avatar status')
      .populate('mentions', 'username discriminator avatar');

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).populate('channel');
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the author or has manage messages permission
    const isAuthor = message.author.toString() === req.user.id;
    let hasPermission = isAuthor;

    if (!isAuthor && message.server) {
      const server = await Server.findById(message.server);
      const member = server.getMember(req.user.id);
      // Add permission check logic here if needed
      hasPermission = server.owner.toString() === req.user.id;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }

    // Delete attachments from Cloudinary
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        try {
          const publicId = attachment.url.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`canble/attachments/${publicId}`);
        } catch (deleteError) {
          console.error('Failed to delete attachment:', deleteError);
        }
      }
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/messages/:id/reactions
// @desc    Add reaction to message
// @access  Private
router.post('/:id/reactions', auth, [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to the channel
    const channel = await Channel.findById(message.channel).populate('server');
    if (channel.server && !channel.server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find existing reaction
    let reaction = message.reactions.find(r => r.emoji.name === emoji);

    if (reaction) {
      // Check if user already reacted
      if (reaction.users.includes(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: 'You have already reacted with this emoji'
        });
      }
      
      // Add user to reaction
      reaction.users.push(req.user.id);
      reaction.count += 1;
    } else {
      // Create new reaction
      reaction = {
        emoji: {
          name: emoji,
          animated: false
        },
        count: 1,
        users: [req.user.id]
      };
      message.reactions.push(reaction);
    }

    await message.save();

    res.json({
      success: true,
      message: 'Reaction added successfully',
      reaction
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/messages/:id/reactions/:emoji
// @desc    Remove reaction from message
// @access  Private
router.delete('/:id/reactions/:emoji', auth, async (req, res) => {
  try {
    const { emoji } = req.params;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find reaction
    const reactionIndex = message.reactions.findIndex(r => r.emoji.name === emoji);
    if (reactionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      });
    }

    const reaction = message.reactions[reactionIndex];
    
    // Check if user has reacted
    const userIndex = reaction.users.indexOf(req.user.id);
    if (userIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You have not reacted with this emoji'
      });
    }

    // Remove user from reaction
    reaction.users.splice(userIndex, 1);
    reaction.count -= 1;

    // Remove reaction if no users left
    if (reaction.count === 0) {
      message.reactions.splice(reactionIndex, 1);
    }

    await message.save();

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
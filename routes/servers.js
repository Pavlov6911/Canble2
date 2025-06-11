const express = require('express');
const { body, validationResult } = require('express-validator');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const Role = require('../models/Role');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/servers
// @desc    Create a new server
// @access  Private
router.post('/', auth, [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Server name must be between 2 and 100 characters')
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, icon } = req.body;

    // Create server
    const server = new Server({
      name,
      description: description || '',
      icon: icon || '',
      owner: req.user.id,
      members: [{
        user: req.user.id,
        joinedAt: new Date()
      }]
    });

    await server.save();

    // Create default @everyone role
    const everyoneRole = new Role({
      name: '@everyone',
      color: 0,
      hoist: false,
      position: 0,
      permissions: '104324673', // Basic permissions
      server: server._id
    });
    await everyoneRole.save();

    // Create default channels
    const generalChannel = new Channel({
      name: 'general',
      type: 0, // GUILD_TEXT
      server: server._id,
      position: 0
    });
    await generalChannel.save();

    const voiceChannel = new Channel({
      name: 'General',
      type: 2, // GUILD_VOICE
      server: server._id,
      position: 1
    });
    await voiceChannel.save();

    // Update server with channels and roles
    server.channels = [generalChannel._id, voiceChannel._id];
    server.roles = [everyoneRole._id];
    server.systemChannelId = generalChannel._id;
    await server.save();

    // Add server to user's servers list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { servers: server._id }
    });

    // Populate server data
    const populatedServer = await Server.findById(server._id)
      .populate('channels')
      .populate('roles')
      .populate('members.user', 'username discriminator avatar status');

    res.status(201).json({
      success: true,
      message: 'Server created successfully',
      server: populatedServer
    });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/servers
// @desc    Get user's servers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'servers',
      populate: [
        {
          path: 'channels',
          select: 'name type position parentId nsfw'
        },
        {
          path: 'members.user',
          select: 'username discriminator avatar status'
        }
      ]
    });

    res.json({
      success: true,
      servers: user.servers
    });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/servers/:id
// @desc    Get server by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id)
      .populate('channels')
      .populate('roles')
      .populate('members.user', 'username discriminator avatar status')
      .populate('owner', 'username discriminator avatar');

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Check if user is a member
    const isMember = server.isMember(req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    res.json({
      success: true,
      server
    });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/servers/:id
// @desc    Update server
// @access  Private
router.put('/:id', auth, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Server name must be between 2 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Check if user is the owner
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - only server owner can update server'
      });
    }

    const { name, description, icon, banner } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (banner !== undefined) updateData.banner = banner;

    const updatedServer = await Server.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('channels')
      .populate('roles')
      .populate('members.user', 'username discriminator avatar status');

    res.json({
      success: true,
      message: 'Server updated successfully',
      server: updatedServer
    });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/servers/:id
// @desc    Delete server
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Check if user is the owner
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - only server owner can delete server'
      });
    }

    // Delete all channels
    await Channel.deleteMany({ server: server._id });

    // Delete all roles
    await Role.deleteMany({ server: server._id });

    // Remove server from all users' servers list
    await User.updateMany(
      { servers: server._id },
      { $pull: { servers: server._id } }
    );

    // Delete server
    await Server.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Server deleted successfully'
    });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/servers/:id/join
// @desc    Join server via invite
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const server = await Server.findOne({
      'invites.code': inviteCode
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if user is already a member
    if (server.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this server'
      });
    }

    // Add user to server
    server.members.push({
      user: req.user.id,
      joinedAt: new Date()
    });

    // Update invite usage
    const invite = server.invites.find(inv => inv.code === inviteCode);
    if (invite) {
      invite.uses += 1;
      
      // Check if invite should be deleted (max uses reached)
      if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
        server.invites = server.invites.filter(inv => inv.code !== inviteCode);
      }
    }

    await server.save();

    // Add server to user's servers list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { servers: server._id }
    });

    const populatedServer = await Server.findById(server._id)
      .populate('channels')
      .populate('roles')
      .populate('members.user', 'username discriminator avatar status');

    res.json({
      success: true,
      message: 'Successfully joined server',
      server: populatedServer
    });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/servers/:id/leave
// @desc    Leave server
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Check if user is the owner
    if (server.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Server owner cannot leave the server. Transfer ownership or delete the server.'
      });
    }

    // Check if user is a member
    if (!server.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this server'
      });
    }

    // Remove user from server
    server.members = server.members.filter(
      member => member.user.toString() !== req.user.id
    );
    await server.save();

    // Remove server from user's servers list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { servers: server._id }
    });

    res.json({
      success: true,
      message: 'Successfully left server'
    });
  } catch (error) {
    console.error('Leave server error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/servers/:id/invites
// @desc    Create server invite
// @access  Private
router.post('/:id/invites', auth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Check if user is a member
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a member of this server'
      });
    }

    const { maxAge = 86400, maxUses = 0, temporary = false, channelId } = req.body;

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = server.generateInviteCode();
      const existingInvite = await Server.findOne({
        'invites.code': inviteCode
      });
      if (!existingInvite) {
        isUnique = true;
      }
    }

    const invite = {
      code: inviteCode,
      inviter: req.user.id,
      channel: channelId || server.systemChannelId,
      maxAge,
      maxUses,
      temporary,
      expiresAt: maxAge > 0 ? new Date(Date.now() + maxAge * 1000) : null
    };

    server.invites.push(invite);
    await server.save();

    res.status(201).json({
      success: true,
      message: 'Invite created successfully',
      invite
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
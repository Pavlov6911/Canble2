const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Role = require('../models/Role');
const Server = require('../models/Server');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   POST /api/roles
// @desc    Create a new role
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Role name must be between 1 and 100 characters'),
  body('server').isMongoId().withMessage('Valid server ID required'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  body('hoist').optional().isBoolean().withMessage('Hoist must be boolean'),
  body('mentionable').optional().isBoolean().withMessage('Mentionable must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      server: serverId,
      color = '#99AAB5',
      permissions = [],
      position,
      hoist = false,
      mentionable = true,
      icon,
      unicodeEmoji,
      hierarchy = {},
      autoAssignment = {},
      channelOverrides = [],
      temporaryRole = {},
      roleRewards = {}
    } = req.body;

    // Check if user has permission to manage roles in this server
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage roles' });
    }

    // Check if role name already exists in server
    const existingRole = await Role.findOne({ name, server: serverId });
    if (existingRole) {
      return res.status(400).json({ message: 'Role name already exists in this server' });
    }

    // Validate permissions
    const validPermissions = Object.keys(Role.PERMISSIONS);
    const invalidPermissions = permissions.filter(perm => !validPermissions.includes(perm));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid permissions',
        invalidPermissions
      });
    }

    // Calculate position if not provided
    let rolePosition = position;
    if (rolePosition === undefined) {
      const highestRole = await Role.findOne({ server: serverId })
        .sort({ position: -1 })
        .select('position');
      rolePosition = (highestRole?.position || 0) + 1;
    }

    // Create role
    const role = new Role({
      name,
      server: serverId,
      color,
      permissions,
      position: rolePosition,
      hoist,
      mentionable,
      icon,
      unicodeEmoji,
      hierarchy: {
        level: hierarchy.level || 0,
        canManageBelow: hierarchy.canManageBelow !== false
      },
      autoAssignment: {
        onJoin: autoAssignment.onJoin || false,
        afterVerification: autoAssignment.afterVerification || false,
        afterTime: autoAssignment.afterTime,
        basedOnActivity: autoAssignment.basedOnActivity || false
      },
      channelOverrides,
      temporaryRole: {
        duration: temporaryRole.duration,
        autoRemove: temporaryRole.autoRemove || false
      },
      roleRewards: {
        xpBonus: roleRewards.xpBonus || 0,
        currencyBonus: roleRewards.currencyBonus || 0,
        specialPerks: roleRewards.specialPerks || []
      }
    });

    await role.save();

    // Update server's role list
    await Server.findByIdAndUpdate(serverId, {
      $push: { roles: role._id }
    });

    await role.populate('server', 'name icon');

    res.status(201).json(role);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/:id
// @desc    Get role details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('server', 'name icon');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if user has access to this role's server
    const server = await Server.findById(role.server._id);
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'No access to this server' });
    }

    res.json(role);
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Role name must be between 1 and 100 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer'),
  body('hoist').optional().isBoolean().withMessage('Hoist must be boolean'),
  body('mentionable').optional().isBoolean().withMessage('Mentionable must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if user has permission to manage this role
    const server = await Server.findById(role.server);
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage roles' });
    }

    // Check if user can manage this specific role (hierarchy)
    if (!role.canManageRole(userRole._id)) {
      return res.status(403).json({ message: 'Cannot manage roles at or above your hierarchy level' });
    }

    // Don't allow editing the @everyone role's core properties
    if (role.isDefault && ['name', 'position', 'hoist'].some(field => req.body[field] !== undefined)) {
      return res.status(400).json({ message: 'Cannot modify core properties of @everyone role' });
    }

    const updateData = {};
    const allowedFields = [
      'name', 'color', 'permissions', 'position', 'hoist', 'mentionable',
      'icon', 'unicodeEmoji', 'hierarchy', 'autoAssignment', 'channelOverrides',
      'temporaryRole', 'roleRewards'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Validate permissions if provided
    if (updateData.permissions) {
      const validPermissions = Object.keys(Role.PERMISSIONS);
      const invalidPermissions = updateData.permissions.filter(perm => !validPermissions.includes(perm));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid permissions',
          invalidPermissions
        });
      }
    }

    // Check for name conflicts if name is being changed
    if (updateData.name && updateData.name !== role.name) {
      const existingRole = await Role.findOne({ 
        name: updateData.name, 
        server: role.server,
        _id: { $ne: role._id }
      });
      if (existingRole) {
        return res.status(400).json({ message: 'Role name already exists in this server' });
      }
    }

    Object.assign(role, updateData);
    await role.save();

    await role.populate('server', 'name icon');

    res.json(role);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Don't allow deletion of @everyone role
    if (role.isDefault) {
      return res.status(400).json({ message: 'Cannot delete @everyone role' });
    }

    // Check if user has permission to manage this role
    const server = await Server.findById(role.server);
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage roles' });
    }

    // Check hierarchy
    if (!role.canManageRole(userRole._id)) {
      return res.status(403).json({ message: 'Cannot delete roles at or above your hierarchy level' });
    }

    // Remove role from all users
    await User.updateMany(
      { 'serverRoles.server': role.server },
      { $pull: { 'serverRoles.$.roles': role._id } }
    );

    // Remove role from server
    await Server.findByIdAndUpdate(role.server, {
      $pull: { roles: role._id }
    });

    await Role.findByIdAndDelete(req.params.id);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/server/:serverId
// @desc    Get all roles for a server
// @access  Private
router.get('/server/:serverId', auth, async (req, res) => {
  try {
    const { serverId } = req.params;

    // Check if user has access to this server
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const roles = await Role.find({ server: serverId })
      .sort({ position: -1 })
      .populate('server', 'name icon');

    res.json(roles);
  } catch (error) {
    console.error('Get server roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles/:id/assign/:userId
// @desc    Assign role to user
// @access  Private
router.post('/:id/assign/:userId', auth, async (req, res) => {
  try {
    const { id: roleId, userId } = req.params;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if user has permission to assign this role
    const server = await Server.findById(role.server);
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage roles' });
    }

    // Check hierarchy
    if (!role.canManageRole(userRole._id)) {
      return res.status(403).json({ message: 'Cannot assign roles at or above your hierarchy level' });
    }

    // Check if target user is a member of the server
    if (!server.isMember(userId)) {
      return res.status(400).json({ message: 'User is not a member of this server' });
    }

    // Check if user already has this role
    const user = await User.findById(userId);
    const serverRoles = user.serverRoles.find(sr => sr.server.toString() === role.server.toString());
    
    if (serverRoles && serverRoles.roles.includes(roleId)) {
      return res.status(400).json({ message: 'User already has this role' });
    }

    // Assign role
    await User.findOneAndUpdate(
      { _id: userId, 'serverRoles.server': role.server },
      { $addToSet: { 'serverRoles.$.roles': roleId } },
      { upsert: false }
    );

    // If no server roles entry exists, create one
    const updateResult = await User.findById(userId);
    const hasServerRoles = updateResult.serverRoles.some(sr => sr.server.toString() === role.server.toString());
    
    if (!hasServerRoles) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          serverRoles: {
            server: role.server,
            roles: [roleId]
          }
        }
      });
    }

    // Update role statistics
    await role.updateStatistics();

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/roles/:id/assign/:userId
// @desc    Remove role from user
// @access  Private
router.delete('/:id/assign/:userId', auth, async (req, res) => {
  try {
    const { id: roleId, userId } = req.params;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Don't allow removal of @everyone role
    if (role.isDefault) {
      return res.status(400).json({ message: 'Cannot remove @everyone role' });
    }

    // Check if user has permission to manage this role
    const server = await Server.findById(role.server);
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage roles' });
    }

    // Check hierarchy
    if (!role.canManageRole(userRole._id)) {
      return res.status(403).json({ message: 'Cannot remove roles at or above your hierarchy level' });
    }

    // Remove role
    await User.findOneAndUpdate(
      { _id: userId, 'serverRoles.server': role.server },
      { $pull: { 'serverRoles.$.roles': roleId } }
    );

    // Update role statistics
    await role.updateStatistics();

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/:id/members
// @desc    Get members with a specific role
// @access  Private
router.get('/:id/members', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: roleId } = req.params;
    const { limit = 50 } = req.query;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if user has access to this server
    const server = await Server.findById(role.server);
    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    // Get users with this role
    const users = await User.find({
      'serverRoles': {
        $elemMatch: {
          server: role.server,
          roles: roleId
        }
      }
    })
    .select('username avatar status lastSeen')
    .limit(parseInt(limit))
    .sort({ lastSeen: -1 });

    res.json({
      role: {
        _id: role._id,
        name: role.name,
        color: role.color
      },
      members: users,
      totalCount: users.length
    });
  } catch (error) {
    console.error('Get role members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/hierarchy/:serverId
// @desc    Get role hierarchy for a server
// @access  Private
router.get('/hierarchy/:serverId', auth, async (req, res) => {
  try {
    const { serverId } = req.params;

    // Check if user has access to this server
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const roles = await Role.findByHierarchyLevel(serverId);

    res.json(roles);
  } catch (error) {
    console.error('Get role hierarchy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/roles/auto-assignable/:serverId
// @desc    Get auto-assignable roles for a server
// @access  Private
router.get('/auto-assignable/:serverId', auth, async (req, res) => {
  try {
    const { serverId } = req.params;

    // Check if user has admin permission
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to view auto-assignable roles' });
    }

    const autoAssignableRoles = await Role.findAutoAssignable(serverId);

    res.json(autoAssignableRoles);
  } catch (error) {
    console.error('Get auto-assignable roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/roles/:id/channel-override
// @desc    Add channel permission override
// @access  Private
router.post('/:id/channel-override', [
  auth,
  body('channel').isMongoId().withMessage('Valid channel ID required'),
  body('permissions').isObject().withMessage('Permissions must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: roleId } = req.params;
    const { channel: channelId, permissions } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check permissions
    const server = await Server.findById(role.server);
    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage role permissions' });
    }

    // Validate channel belongs to the same server
    const Channel = require('../models/Channel');
    const channel = await Channel.findById(channelId);
    if (!channel || channel.server.toString() !== role.server.toString()) {
      return res.status(400).json({ message: 'Channel not found or not in the same server' });
    }

    // Add or update channel override
    const existingOverrideIndex = role.channelOverrides.findIndex(
      override => override.channel.toString() === channelId
    );

    if (existingOverrideIndex >= 0) {
      role.channelOverrides[existingOverrideIndex].permissions = permissions;
    } else {
      role.channelOverrides.push({
        channel: channelId,
        permissions
      });
    }

    await role.save();

    res.json({ message: 'Channel override added successfully' });
  } catch (error) {
    console.error('Add channel override error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/roles/:id/channel-override/:channelId
// @desc    Remove channel permission override
// @access  Private
router.delete('/:id/channel-override/:channelId', auth, async (req, res) => {
  try {
    const { id: roleId, channelId } = req.params;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check permissions
    const server = await Server.findById(role.server);
    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_ROLES')) {
      return res.status(403).json({ message: 'No permission to manage role permissions' });
    }

    // Remove channel override
    role.channelOverrides = role.channelOverrides.filter(
      override => override.channel.toString() !== channelId
    );

    await role.save();

    res.json({ message: 'Channel override removed successfully' });
  } catch (error) {
    console.error('Remove channel override error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
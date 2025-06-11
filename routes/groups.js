const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { serviceFactory } = require('../services/ServiceFactory');

const router = express.Router();

// @route   POST /api/groups
// @desc    Create a new group (community or private)
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name must be between 1 and 100 characters'),
  body('type').isIn(['community', 'private']).withMessage('Type must be either community or private'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('category').optional().isIn([
    'gaming', 'music', 'education', 'science', 'technology',
    'entertainment', 'art', 'sports', 'lifestyle', 'business',
    'community', 'other'
  ]).withMessage('Invalid category'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('maxMembers').optional().isInt({ min: 2, max: 10000 }).withMessage('Max members must be between 2 and 10000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      type,
      description = '',
      category = 'other',
      isPublic = true,
      maxMembers = 1000,
      icon,
      banner,
      tags = [],
      language = 'en',
      region = 'us-east'
    } = req.body;

    // For private groups, default to not public
    const groupIsPublic = type === 'private' ? false : isPublic;

    // Get the appropriate service
    const groupService = serviceFactory.getGroupService();
    
    if (serviceFactory.isSupabase()) {
      // Use Supabase service
      const groupData = {
        name,
        type,
        description,
        category,
        icon,
        banner,
        owner: req.user.id,
        tags: tags.slice(0, 10), // Limit to 10 tags
        language,
        region,
        isPublic: groupIsPublic,
        maxMembers,
        requireApproval: type === 'private',
        allowInvites: true
      };
      
      const group = await groupService.createGroup(groupData);
      res.status(201).json(group);
    } else {
      // Use MongoDB (existing logic)
      const group = new Group({
        name,
        type,
        description,
        category,
        icon,
        banner,
        owner: req.user.id,
        tags: tags.slice(0, 10), // Limit to 10 tags
        language,
        region,
        settings: {
          isPublic: groupIsPublic,
          maxMembers,
          requireApproval: type === 'private',
          allowInvites: true
        },
        members: [{
          user: req.user.id,
          role: 'owner',
          joinedAt: new Date()
        }],
        admins: [],
        moderators: []
      });

      await group.save();

      // Create default general channel
      const generalChannel = new Channel({
        name: 'general',
        type: 'text',
        server: group._id, // Using server field for compatibility
        group: group._id,
        creator: req.user.id,
        isDefault: true,
        permissions: {
          everyone: group.settings.defaultChannelPermissions
        }
      });

      await generalChannel.save();

      // Add channel to group
      group.channels.push(generalChannel._id);
      await group.save();

      // Populate response
      await group.populate([
        { path: 'owner', select: 'username avatar' },
        { path: 'channels', select: 'name type' }
      ]);

      res.status(201).json(group);
    }
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/discover
// @desc    Discover public community groups
// @access  Public
router.get('/discover', [
  query('category').optional().isIn([
    'all', 'gaming', 'music', 'education', 'science', 'technology',
    'entertainment', 'art', 'sports', 'lifestyle', 'business',
    'community', 'other'
  ]).withMessage('Invalid category'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('sortBy').optional().isIn(['members', 'activity', 'newest', 'oldest']).withMessage('Invalid sort option'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      category = 'all',
      search,
      sortBy = 'members',
      limit = 20,
      page = 1
    } = req.query;

    const skip = (page - 1) * limit;

    const groups = await Group.findPublicGroups({
      category,
      search,
      limit: parseInt(limit),
      skip,
      sortBy
    });

    const total = await Group.countDocuments({
      type: 'community',
      'settings.isPublic': true,
      isActive: true,
      ...(category !== 'all' && { category }),
      ...(search && { $text: { $search: search } })
    });

    res.json({
      groups,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + groups.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Discover groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/my
// @desc    Get user's groups
// @access  Private
router.get('/my', [
  auth,
  query('type').optional().isIn(['community', 'private']).withMessage('Invalid type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type } = req.query;

    const groups = await Group.findUserGroups(req.user.id, type);

    res.json(groups);
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get group details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('owner', 'username avatar status')
      .populate('admins', 'username avatar status')
      .populate('moderators', 'username avatar status')
      .populate('members.user', 'username avatar status lastSeen')
      .populate('channels', 'name type position permissions')
      .select('-invites');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user has access to this group
    if (group.type === 'private' && !group.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied to private group' });
    }

    // For public community groups, allow viewing even if not a member
    if (group.type === 'community' && !group.settings.isPublic && !group.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied to private community group' });
    }

    // Add user's role in the group
    const userRole = group.getMemberRole(req.user.id);
    const responseGroup = group.toObject();
    responseGroup.userRole = userRole;
    responseGroup.isMember = group.isMember(req.user.id);

    res.json(responseGroup);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Group name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('category').optional().isIn([
    'gaming', 'music', 'education', 'science', 'technology',
    'entertainment', 'art', 'sports', 'lifestyle', 'business',
    'community', 'other'
  ]).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can manage this group
    if (!group.canManageGroup(req.user.id)) {
      return res.status(403).json({ message: 'No permission to manage this group' });
    }

    const allowedFields = [
      'name', 'description', 'category', 'icon', 'banner', 'tags',
      'language', 'region', 'vanityUrl'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle settings updates
    if (req.body.settings) {
      const allowedSettings = [
        'isPublic', 'requireApproval', 'allowInvites', 'maxMembers',
        'verificationLevel', 'contentFilter', 'slowModeDelay'
      ];
      
      allowedSettings.forEach(setting => {
        if (req.body.settings[setting] !== undefined) {
          updateData[`settings.${setting}`] = req.body.settings[setting];
        }
      });
    }

    // Validate vanity URL if provided
    if (updateData.vanityUrl) {
      const existingGroup = await Group.findOne({ 
        vanityUrl: updateData.vanityUrl,
        _id: { $ne: group._id }
      });
      if (existingGroup) {
        return res.status(400).json({ message: 'Vanity URL already taken' });
      }
    }

    Object.assign(group, updateData);
    await group.save();

    await group.populate([
      { path: 'owner', select: 'username avatar' },
      { path: 'channels', select: 'name type' }
    ]);

    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only owner can delete the group
    if (!group.isOwner(req.user.id)) {
      return res.status(403).json({ message: 'Only group owner can delete the group' });
    }

    // Delete all channels in the group
    await Channel.deleteMany({ group: group._id });

    // Mark group as inactive instead of deleting
    group.isActive = false;
    await group.save();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', [
  auth,
  body('message').optional().isLength({ max: 200 }).withMessage('Message must be less than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.isMember(req.user.id)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    // Check if group is private and requires approval
    if (group.type === 'private' || group.settings.requireApproval) {
      // Create join request
      const existingRequest = group.joinRequests.find(
        req => req.user.toString() === req.user.id && req.status === 'pending'
      );

      if (existingRequest) {
        return res.status(400).json({ message: 'Join request already pending' });
      }

      group.joinRequests.push({
        user: req.user.id,
        message: req.body.message || '',
        status: 'pending',
        requestedAt: new Date()
      });

      await group.save();

      res.json({ message: 'Join request submitted successfully' });
    } else {
      // Join directly for public community groups
      await group.addMember(req.user.id);
      res.json({ message: 'Joined group successfully' });
    }
  } catch (error) {
    console.error('Join group error:', error);
    if (error.message === 'Group has reached maximum member limit') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.isMember(req.user.id)) {
      return res.status(400).json({ message: 'Not a member of this group' });
    }

    if (group.isOwner(req.user.id)) {
      return res.status(400).json({ message: 'Group owner cannot leave. Transfer ownership or delete the group.' });
    }

    await group.removeMember(req.user.id);
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups/:id/invite
// @desc    Create group invite
// @access  Private
router.post('/:id/invite', [
  auth,
  body('maxUses').optional().isInt({ min: 0, max: 100 }).withMessage('Max uses must be between 0 and 100'),
  body('expiresIn').optional().isInt({ min: 300000, max: 604800000 }).withMessage('Expires in must be between 5 minutes and 7 days')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.canInvite(req.user.id)) {
      return res.status(403).json({ message: 'No permission to create invites' });
    }

    const { maxUses = 0, expiresIn, temporary = false } = req.body;

    const invite = group.createInvite(req.user.id, {
      maxUses,
      expiresIn,
      temporary
    });

    await group.save();

    res.status(201).json({
      code: invite.code,
      url: `${process.env.CLIENT_URL}/invite/${invite.code}`,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
      temporary: invite.temporary
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups/join/:inviteCode
// @desc    Join group via invite
// @access  Private
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const group = await Group.findOne({ 'invites.code': inviteCode });
    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    await group.useInvite(inviteCode, req.user.id);

    await group.populate([
      { path: 'owner', select: 'username avatar' },
      { path: 'channels', select: 'name type' }
    ]);

    res.json({
      message: 'Joined group successfully',
      group: {
        _id: group._id,
        name: group.name,
        type: group.type,
        icon: group.icon,
        owner: group.owner,
        memberCount: group.memberCount
      }
    });
  } catch (error) {
    console.error('Join via invite error:', error);
    if (error.message.includes('Invalid invite') || 
        error.message.includes('expired') || 
        error.message.includes('maximum uses') ||
        error.message.includes('already a member')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/:id/members
// @desc    Get group members
// @access  Private
router.get('/:id/members', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['member', 'moderator', 'admin', 'owner']).withMessage('Invalid role filter')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 50, role } = req.query;

    const group = await Group.findById(req.params.id)
      .populate('members.user', 'username avatar status lastSeen')
      .select('members type settings');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check access
    if (group.type === 'private' && !group.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let members = group.members;

    // Filter by role if specified
    if (role) {
      members = members.filter(member => member.role === role);
    }

    // Limit results
    members = members.slice(0, parseInt(limit));

    res.json({
      members,
      totalCount: group.members.length
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/groups/:id/members/:userId/role
// @desc    Update member role
// @access  Private
router.put('/:id/members/:userId/role', [
  auth,
  body('role').isIn(['member', 'moderator', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: groupId, userId } = req.params;
    const { role } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check permissions
    if (!group.canManageGroup(req.user.id)) {
      return res.status(403).json({ message: 'No permission to manage members' });
    }

    if (!group.isMember(userId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    if (group.isOwner(userId)) {
      return res.status(400).json({ message: 'Cannot change owner role' });
    }

    await group.updateMemberRole(userId, role);

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove member from group
// @access  Private
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check permissions
    if (!group.canModerate(req.user.id) && req.user.id !== userId) {
      return res.status(403).json({ message: 'No permission to remove members' });
    }

    if (group.isOwner(userId)) {
      return res.status(400).json({ message: 'Cannot remove group owner' });
    }

    await group.removeMember(userId);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    if (error.message === 'User is not a member') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/:id/join-requests
// @desc    Get pending join requests
// @access  Private
router.get('/:id/join-requests', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('joinRequests.user', 'username avatar')
      .select('joinRequests');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check permissions
    if (!group.canModerate(req.user.id)) {
      return res.status(403).json({ message: 'No permission to view join requests' });
    }

    const pendingRequests = group.joinRequests.filter(req => req.status === 'pending');

    res.json(pendingRequests);
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/groups/:id/join-requests/:requestId
// @desc    Approve or reject join request
// @access  Private
router.put('/:id/join-requests/:requestId', [
  auth,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: groupId, requestId } = req.params;
    const { action } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check permissions
    if (!group.canModerate(req.user.id)) {
      return res.status(403).json({ message: 'No permission to manage join requests' });
    }

    const joinRequest = group.joinRequests.id(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Join request already processed' });
    }

    joinRequest.status = action === 'approve' ? 'approved' : 'rejected';
    joinRequest.reviewedBy = req.user.id;
    joinRequest.reviewedAt = new Date();

    if (action === 'approve') {
      await group.addMember(joinRequest.user);
    }

    await group.save();

    res.json({ message: `Join request ${action}d successfully` });
  } catch (error) {
    console.error('Process join request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/search
// @desc    Search groups
// @access  Public
router.get('/search', [
  query('q').isLength({ min: 1, max: 100 }).withMessage('Search query required and must be less than 100 characters'),
  query('type').optional().isIn(['community', 'private']).withMessage('Invalid type'),
  query('category').optional().isIn([
    'gaming', 'music', 'education', 'science', 'technology',
    'entertainment', 'art', 'sports', 'lifestyle', 'business',
    'community', 'other'
  ]).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q: searchTerm,
      type,
      category,
      limit = 20,
      page = 1
    } = req.query;

    const skip = (page - 1) * limit;

    const groups = await Group.searchGroups(searchTerm, {
      type,
      category,
      limit: parseInt(limit),
      skip
    });

    res.json(groups);
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Event name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
  body('server').isMongoId().withMessage('Valid server ID required'),
  body('channel').optional().isMongoId().withMessage('Valid channel ID required'),
  body('type').isIn(['voice', 'stage', 'external']).withMessage('Invalid event type'),
  body('scheduledStartTime').isISO8601().withMessage('Valid start time required'),
  body('scheduledEndTime').optional().isISO8601().withMessage('Valid end time required'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
  body('maxParticipants').optional().isInt({ min: 1, max: 10000 }).withMessage('Max participants must be between 1 and 10000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      server: serverId,
      channel: channelId,
      type,
      scheduledStartTime,
      scheduledEndTime,
      location,
      maxParticipants,
      coverImage,
      recurrence,
      permissions = {},
      settings = {}
    } = req.body;

    // Validate server and user permissions
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'You must be a member of the server' });
    }

    // Check if user has permission to create events
    const userRole = server.getUserRole(req.user.id);
    if (!userRole || !userRole.permissions.includes('MANAGE_EVENTS')) {
      return res.status(403).json({ message: 'No permission to create events' });
    }

    // Validate channel if provided
    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel || channel.server.toString() !== serverId) {
        return res.status(404).json({ message: 'Channel not found or not in the specified server' });
      }

      if (type === 'voice' && !['voice', 'stage'].includes(channel.type)) {
        return res.status(400).json({ message: 'Voice events require a voice or stage channel' });
      }
    }

    // Validate dates
    const startTime = new Date(scheduledStartTime);
    const endTime = scheduledEndTime ? new Date(scheduledEndTime) : null;
    
    if (startTime <= new Date()) {
      return res.status(400).json({ message: 'Event start time must be in the future' });
    }

    if (endTime && endTime <= startTime) {
      return res.status(400).json({ message: 'Event end time must be after start time' });
    }

    // Create event
    const event = new Event({
      name,
      description,
      server: serverId,
      channel: channelId,
      creator: req.user.id,
      type,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      location,
      maxParticipants,
      coverImage,
      recurrence,
      permissions: {
        viewEvent: permissions.viewEvent || 'everyone',
        joinEvent: permissions.joinEvent || 'everyone',
        manageEvent: permissions.manageEvent || 'moderators'
      },
      settings: {
        requireApproval: settings.requireApproval || false,
        allowInvites: settings.allowInvites !== false,
        showParticipants: settings.showParticipants !== false,
        enableChat: settings.enableChat !== false,
        ...settings
      }
    });

    await event.save();

    // Populate event data
    await event.populate([
      { path: 'creator', select: 'username avatar' },
      { path: 'server', select: 'name icon' },
      { path: 'channel', select: 'name type' }
    ]);

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('server', 'name icon')
      .populate('channel', 'name type')
      .populate('participants.user', 'username avatar');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can view this event
    if (!event.canUserJoin(req.user.id)) {
      return res.status(403).json({ message: 'No permission to view this event' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Event name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
  body('scheduledStartTime').optional().isISO8601().withMessage('Valid start time required'),
  body('scheduledEndTime').optional().isISO8601().withMessage('Valid end time required'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
  body('maxParticipants').optional().isInt({ min: 1, max: 10000 }).withMessage('Max participants must be between 1 and 10000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can manage this event
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');

    if (!isCreator && !canManage) {
      return res.status(403).json({ message: 'No permission to update this event' });
    }

    // Don't allow updates to started or ended events
    if (['active', 'ended'].includes(event.status)) {
      return res.status(400).json({ message: 'Cannot update active or ended events' });
    }

    const updateData = {};
    const allowedFields = [
      'name', 'description', 'scheduledStartTime', 'scheduledEndTime',
      'location', 'maxParticipants', 'coverImage', 'recurrence',
      'permissions', 'settings', 'tags'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Validate dates if provided
    if (updateData.scheduledStartTime) {
      const startTime = new Date(updateData.scheduledStartTime);
      if (startTime <= new Date()) {
        return res.status(400).json({ message: 'Event start time must be in the future' });
      }
    }

    if (updateData.scheduledEndTime && updateData.scheduledStartTime) {
      const startTime = new Date(updateData.scheduledStartTime);
      const endTime = new Date(updateData.scheduledEndTime);
      if (endTime <= startTime) {
        return res.status(400).json({ message: 'Event end time must be after start time' });
      }
    }

    Object.assign(event, updateData);
    await event.save();

    await event.populate([
      { path: 'creator', select: 'username avatar' },
      { path: 'server', select: 'name icon' },
      { path: 'channel', select: 'name type' }
    ]);

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can delete this event
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');

    if (!isCreator && !canManage) {
      return res.status(403).json({ message: 'No permission to delete this event' });
    }

    // Don't allow deletion of active events
    if (event.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete active events. End the event first.' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/join
// @desc    Join an event
// @access  Private
router.post('/:id/join', [
  auth,
  body('role').optional().isIn(['participant', 'speaker', 'moderator']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can join this event
    if (!event.canUserJoin(req.user.id)) {
      return res.status(403).json({ message: 'No permission to join this event' });
    }

    const { role = 'participant' } = req.body;

    await event.addParticipant(req.user.id, role);

    res.json({
      message: 'Joined event successfully',
      participantCount: event.participantCount
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/leave
// @desc    Leave an event
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.removeParticipant(req.user.id);

    res.json({
      message: 'Left event successfully',
      participantCount: event.participantCount
    });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id/participant/:userId
// @desc    Update participant status/role
// @access  Private
router.put('/:id/participant/:userId', [
  auth,
  body('status').optional().isIn(['interested', 'going', 'not_going']).withMessage('Invalid status'),
  body('role').optional().isIn(['participant', 'speaker', 'moderator']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { userId } = req.params;
    const { status, role } = req.body;

    // Check if user can update participant (self or has manage permission)
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');
    const isSelf = userId === req.user.id;

    if (!isSelf && !isCreator && !canManage) {
      return res.status(403).json({ message: 'No permission to update this participant' });
    }

    await event.updateParticipantStatus(userId, status, { role });

    res.json({ message: 'Participant updated successfully' });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/start
// @desc    Start an event
// @access  Private
router.post('/:id/start', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can start this event
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');

    if (!isCreator && !canManage) {
      return res.status(403).json({ message: 'No permission to start this event' });
    }

    await event.startEvent();

    res.json({
      message: 'Event started successfully',
      event: {
        _id: event._id,
        status: event.status,
        actualStartTime: event.actualStartTime
      }
    });
  } catch (error) {
    console.error('Start event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/end
// @desc    End an event
// @access  Private
router.post('/:id/end', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can end this event
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');

    if (!isCreator && !canManage) {
      return res.status(403).json({ message: 'No permission to end this event' });
    }

    await event.endEvent();

    res.json({
      message: 'Event ended successfully',
      event: {
        _id: event._id,
        status: event.status,
        actualEndTime: event.actualEndTime,
        duration: event.duration
      }
    });
  } catch (error) {
    console.error('End event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/cancel
// @desc    Cancel an event
// @access  Private
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can cancel this event
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');

    if (!isCreator && !canManage) {
      return res.status(403).json({ message: 'No permission to cancel this event' });
    }

    await event.cancelEvent();

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/server/:serverId
// @desc    Get events for a server
// @access  Private
router.get('/server/:serverId', [
  auth,
  query('status').optional().isIn(['scheduled', 'active', 'ended', 'cancelled']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('upcoming').optional().isBoolean().withMessage('Upcoming must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serverId } = req.params;
    const { status, limit = 50, upcoming } = req.query;

    // Check if user is a member of the server
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const events = await Event.findByServer(serverId, {
      status,
      limit: parseInt(limit),
      upcoming: upcoming === 'true'
    });

    res.json(events);
  } catch (error) {
    console.error('Get server events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/user/participating
// @desc    Get events user is participating in
// @access  Private
router.get('/user/participating', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 50 } = req.query;

    const events = await Event.findByParticipant(req.user.id, parseInt(limit));

    res.json(events);
  } catch (error) {
    console.error('Get participating events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id/reminders
// @desc    Get upcoming reminders for an event
// @access  Private
router.get('/:id/reminders', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can view this event
    if (!event.canUserJoin(req.user.id)) {
      return res.status(403).json({ message: 'No permission to view this event' });
    }

    const upcomingReminders = event.getUpcomingReminders();

    res.json(upcomingReminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/reminders/:reminderId/mark-sent
// @desc    Mark reminder as sent
// @access  Private
router.post('/:id/reminders/:reminderId/mark-sent', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can manage this event (system/admin only typically)
    const server = await Server.findById(event.server);
    const userRole = server.getUserRole(req.user.id);
    const canManage = userRole && userRole.permissions.includes('MANAGE_EVENTS');

    if (!canManage && !req.user.isAdmin) {
      return res.status(403).json({ message: 'No permission to mark reminders' });
    }

    const { reminderId } = req.params;
    await event.markReminderSent(reminderId);

    res.json({ message: 'Reminder marked as sent' });
  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
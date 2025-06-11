const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Call = require('../models/Call');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   POST /api/calls/initiate
// @desc    Initiate a new call
// @access  Private
router.post('/initiate', [
  auth,
  body('type').isIn(['voice', 'video', 'screen_share', 'group_voice', 'group_video']).withMessage('Invalid call type'),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant required'),
  body('participants.*').isMongoId().withMessage('Valid participant IDs required'),
  body('channel').optional().isMongoId().withMessage('Valid channel ID required'),
  body('server').optional().isMongoId().withMessage('Valid server ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, participants, channel, server, settings = {} } = req.body;

    // Validate channel and server if provided
    if (channel) {
      const channelDoc = await Channel.findById(channel);
      if (!channelDoc) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      // Check if user has permission to start calls in this channel
      if (!channelDoc.canUserSendMessages(req.user.id)) {
        return res.status(403).json({ message: 'No permission to start calls in this channel' });
      }
    }

    if (server) {
      const serverDoc = await Server.findById(server);
      if (!serverDoc) {
        return res.status(404).json({ message: 'Server not found' });
      }
      
      // Check if user is a member of the server
      if (!serverDoc.isMember(req.user.id)) {
        return res.status(403).json({ message: 'Not a member of this server' });
      }
    }

    // Create call
    const call = new Call({
      type,
      initiator: req.user.id,
      channel,
      server,
      settings: {
        maxParticipants: settings.maxParticipants || 25,
        recordingEnabled: settings.recordingEnabled || false,
        noiseSuppression: settings.noiseSuppression !== false,
        echoCancellation: settings.echoCancellation !== false,
        autoGainControl: settings.autoGainControl !== false,
        ...settings
      }
    });

    // Add participants
    for (const participantId of participants) {
      await call.addParticipant(participantId, {
        audioEnabled: type.includes('voice') || type.includes('video'),
        videoEnabled: type.includes('video')
      });
    }

    await call.save();

    // Populate call data
    await call.populate([
      { path: 'initiator', select: 'username avatar' },
      { path: 'participants.user', select: 'username avatar' },
      { path: 'channel', select: 'name type' },
      { path: 'server', select: 'name icon' }
    ]);

    res.status(201).json(call);
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calls/:id/join
// @desc    Join a call
// @access  Private
router.put('/:id/join', [
  auth,
  body('audioEnabled').optional().isBoolean().withMessage('Audio enabled must be boolean'),
  body('videoEnabled').optional().isBoolean().withMessage('Video enabled must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (call.status === 'ended') {
      return res.status(400).json({ message: 'Call has ended' });
    }

    const { audioEnabled = true, videoEnabled = false } = req.body;

    // Check if user is already a participant
    const existingParticipant = call.participants.find(
      p => p.user.toString() === req.user.id
    );

    if (existingParticipant) {
      // Update existing participant status
      await call.updateParticipantStatus(req.user.id, 'connected', {
        audioEnabled,
        videoEnabled,
        joinedAt: new Date()
      });
    } else {
      // Add new participant
      await call.addParticipant(req.user.id, {
        audioEnabled,
        videoEnabled
      });
      await call.updateParticipantStatus(req.user.id, 'connected');
    }

    // Start call if it's the first participant joining
    if (call.status === 'initiating' && call.activeParticipants.length > 0) {
      await call.startCall();
    }

    await call.populate([
      { path: 'participants.user', select: 'username avatar' }
    ]);

    res.json({
      message: 'Joined call successfully',
      call: {
        _id: call._id,
        status: call.status,
        participants: call.participants,
        activeParticipants: call.activeParticipants.length
      }
    });
  } catch (error) {
    console.error('Join call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calls/:id/leave
// @desc    Leave a call
// @access  Private
router.put('/:id/leave', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    await call.removeParticipant(req.user.id);

    res.json({ message: 'Left call successfully' });
  } catch (error) {
    console.error('Leave call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calls/:id/end
// @desc    End a call (initiator only)
// @access  Private
router.put('/:id/end', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is the initiator or has permission to end calls
    if (call.initiator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the call initiator can end the call' });
    }

    await call.endCall();

    res.json({ message: 'Call ended successfully' });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calls/:id/participant/:participantId
// @desc    Update participant settings
// @access  Private
router.put('/:id/participant/:participantId', [
  auth,
  body('audioEnabled').optional().isBoolean().withMessage('Audio enabled must be boolean'),
  body('videoEnabled').optional().isBoolean().withMessage('Video enabled must be boolean'),
  body('screenSharing').optional().isBoolean().withMessage('Screen sharing must be boolean'),
  body('muted').optional().isBoolean().withMessage('Muted must be boolean'),
  body('deafened').optional().isBoolean().withMessage('Deafened must be boolean'),
  body('volume').optional().isInt({ min: 0, max: 200 }).withMessage('Volume must be between 0 and 200')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const { participantId } = req.params;
    
    // Check if user can update this participant (self or has permission)
    if (participantId !== req.user.id && call.initiator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No permission to update this participant' });
    }

    const updateData = {};
    const { audioEnabled, videoEnabled, screenSharing, muted, deafened, volume } = req.body;
    
    if (audioEnabled !== undefined) updateData.audioEnabled = audioEnabled;
    if (videoEnabled !== undefined) updateData.videoEnabled = videoEnabled;
    if (screenSharing !== undefined) updateData.screenSharing = screenSharing;
    if (muted !== undefined) updateData.muted = muted;
    if (deafened !== undefined) updateData.deafened = deafened;
    if (volume !== undefined) updateData.volume = volume;

    await call.updateParticipantStatus(participantId, 'connected', updateData);

    res.json({ message: 'Participant updated successfully' });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/:id
// @desc    Get call details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('initiator', 'username avatar')
      .populate('participants.user', 'username avatar')
      .populate('channel', 'name type')
      .populate('server', 'name icon');

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user has permission to view this call
    const isParticipant = call.participants.some(p => p.user._id.toString() === req.user.id);
    const isInitiator = call.initiator._id.toString() === req.user.id;
    
    if (!isParticipant && !isInitiator) {
      return res.status(403).json({ message: 'No permission to view this call' });
    }

    res.json(call);
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/user/active
// @desc    Get active calls for user
// @access  Private
router.get('/user/active', auth, async (req, res) => {
  try {
    const activeCalls = await Call.findActiveCallsForUser(req.user.id);
    
    await Call.populate(activeCalls, [
      { path: 'initiator', select: 'username avatar' },
      { path: 'participants.user', select: 'username avatar' },
      { path: 'channel', select: 'name type' },
      { path: 'server', select: 'name icon' }
    ]);

    res.json(activeCalls);
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/channel/:channelId
// @desc    Get call history for a channel
// @access  Private
router.get('/channel/:channelId', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { channelId } = req.params;
    const { limit = 50 } = req.query;

    // Check if user has access to this channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (!channel.canUserViewChannel(req.user.id)) {
      return res.status(403).json({ message: 'No permission to view this channel' });
    }

    const calls = await Call.findCallsInChannel(channelId, limit);

    res.json(calls);
  } catch (error) {
    console.error('Get channel calls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calls/:id/statistics
// @desc    Get call statistics
// @access  Private
router.get('/:id/statistics', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user has permission to view statistics
    const isParticipant = call.participants.some(p => p.user.toString() === req.user.id);
    const isInitiator = call.initiator.toString() === req.user.id;
    
    if (!isParticipant && !isInitiator) {
      return res.status(403).json({ message: 'No permission to view call statistics' });
    }

    const statistics = call.getStatistics();

    res.json(statistics);
  } catch (error) {
    console.error('Get call statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calls/:id/quality
// @desc    Update call quality settings
// @access  Private
router.put('/:id/quality', [
  auth,
  body('audio').optional().isObject().withMessage('Audio settings must be an object'),
  body('video').optional().isObject().withMessage('Video settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is the initiator
    if (call.initiator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the call initiator can update quality settings' });
    }

    const { audio, video } = req.body;

    if (audio) {
      call.quality.audio = { ...call.quality.audio, ...audio };
    }

    if (video) {
      call.quality.video = { ...call.quality.video, ...video };
    }

    await call.save();

    res.json({
      message: 'Call quality updated successfully',
      quality: call.quality
    });
  } catch (error) {
    console.error('Update call quality error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/calls/:id/recording/start
// @desc    Start call recording
// @access  Private
router.post('/:id/recording/start', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is the initiator
    if (call.initiator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the call initiator can start recording' });
    }

    if (call.settings.recordingEnabled) {
      return res.status(400).json({ message: 'Recording is already enabled' });
    }

    call.settings.recordingEnabled = true;
    await call.save();

    res.json({ message: 'Recording started successfully' });
  } catch (error) {
    console.error('Start recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/calls/:id/recording/stop
// @desc    Stop call recording
// @access  Private
router.post('/:id/recording/stop', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check if user is the initiator
    if (call.initiator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the call initiator can stop recording' });
    }

    if (!call.settings.recordingEnabled) {
      return res.status(400).json({ message: 'Recording is not enabled' });
    }

    call.settings.recordingEnabled = false;
    await call.save();

    res.json({ message: 'Recording stopped successfully' });
  } catch (error) {
    console.error('Stop recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
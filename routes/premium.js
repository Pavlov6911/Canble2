const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Premium = require('../models/Premium');
const User = require('../models/User');
const Server = require('../models/Server');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/premium/user/:userId
// @desc    Get user's premium subscription
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own premium status unless they're admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const premium = await Premium.findOne({ user: userId })
      .populate('user', 'username email avatar')
      .populate('serverBoosts.server', 'name icon');

    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    res.json(premium);
  } catch (error) {
    console.error('Get premium error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/premium/subscribe
// @desc    Create or upgrade premium subscription
// @access  Private
router.post('/subscribe', [
  auth,
  body('type').isIn(['drift_classic', 'drift', 'drift_basic']).withMessage('Invalid subscription type'),
  body('tier').isIn(['basic', 'classic', 'premium']).withMessage('Invalid subscription tier'),
  body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, tier, billingCycle, paymentMethod, transactionId, autoRenew = true } = req.body;

    // Check if user already has an active subscription
    let premium = await Premium.findOne({ user: req.user.id });

    const subscriptionData = {
      type,
      status: 'active',
      tier,
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      autoRenew,
      billingCycle,
      paymentMethod,
      transactionId
    };

    // Set price based on type and billing cycle
    const prices = {
      drift_basic: { monthly: 2.99, yearly: 29.99 },
      drift_classic: { monthly: 4.99, yearly: 49.99 },
      drift: { monthly: 9.99, yearly: 99.99 }
    };
    subscriptionData.price = prices[type][billingCycle];

    if (premium) {
      // Update existing subscription
      premium.subscription = subscriptionData;
      
      // Update features based on new tier
      premium.features = premium.getFeaturesForTier(tier);
      
      // Add to billing history
      premium.billingHistory.push({
        date: new Date(),
        amount: subscriptionData.price,
        type: 'subscription',
        status: 'completed',
        transactionId
      });
    } else {
      // Create new premium subscription
      premium = new Premium({
        user: req.user.id,
        subscription: subscriptionData,
        features: Premium.schema.methods.getFeaturesForTier.call({ subscription: subscriptionData }, tier),
        billingHistory: [{
          date: new Date(),
          amount: subscriptionData.price,
          type: 'subscription',
          status: 'completed',
          transactionId
        }]
      });
    }

    await premium.save();

    // Update user's premium status
    await User.findByIdAndUpdate(req.user.id, {
      isPremium: true,
      premiumType: type,
      premiumSince: premium.subscription.startDate
    });

    await premium.populate('user', 'username email avatar');

    res.status(201).json({
      message: 'Premium subscription activated successfully',
      premium
    });
  } catch (error) {
    console.error('Subscribe premium error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/premium/cancel
// @desc    Cancel premium subscription
// @access  Private
router.put('/cancel', auth, async (req, res) => {
  try {
    const premium = await Premium.findOne({ user: req.user.id });
    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    if (!premium.isActive) {
      return res.status(400).json({ message: 'Subscription is not active' });
    }

    await premium.cancelSubscription();

    res.json({
      message: 'Premium subscription cancelled successfully',
      premium
    });
  } catch (error) {
    console.error('Cancel premium error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/premium/renew
// @desc    Renew premium subscription
// @access  Private
router.put('/renew', [
  auth,
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId } = req.body;
    
    const premium = await Premium.findOne({ user: req.user.id });
    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    await premium.renewSubscription(transactionId);

    res.json({
      message: 'Premium subscription renewed successfully',
      premium
    });
  } catch (error) {
    console.error('Renew premium error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/premium/boost/:serverId
// @desc    Boost a server with premium
// @access  Private
router.post('/boost/:serverId', auth, async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const premium = await Premium.findOne({ user: req.user.id });
    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    if (!premium.isActive) {
      return res.status(400).json({ message: 'Premium subscription is not active' });
    }

    // Check if user has available boosts
    if (premium.features.serverBoosts <= premium.serverBoosts.length) {
      return res.status(400).json({ message: 'No server boosts available' });
    }

    // Check if server exists and user is a member
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.isMember(req.user.id)) {
      return res.status(403).json({ message: 'You must be a member of the server to boost it' });
    }

    // Check if server is already boosted by this user
    const existingBoost = premium.serverBoosts.find(
      boost => boost.server.toString() === serverId && boost.active
    );

    if (existingBoost) {
      return res.status(400).json({ message: 'Server is already boosted by you' });
    }

    await premium.addServerBoost(serverId);

    res.json({
      message: 'Server boosted successfully',
      premium
    });
  } catch (error) {
    console.error('Boost server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/premium/boost/:serverId
// @desc    Remove server boost
// @access  Private
router.delete('/boost/:serverId', auth, async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const premium = await Premium.findOne({ user: req.user.id });
    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    await premium.removeServerBoost(serverId);

    res.json({
      message: 'Server boost removed successfully',
      premium
    });
  } catch (error) {
    console.error('Remove boost error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/premium/features
// @desc    Get user's premium features
// @access  Private
router.get('/features', auth, async (req, res) => {
  try {
    const premium = await Premium.findOne({ user: req.user.id });
    
    if (!premium || !premium.isActive) {
      // Return default free features
      return res.json({
        isPremium: false,
        features: {
          fileUploadLimit: 8 * 1024 * 1024, // 8MB
          customEmojiSlots: 0,
          serverBoosts: 0,
          profileCustomization: {
            customBanner: false,
            animatedAvatar: false,
            customTag: false,
            profileBadges: []
          },
          communication: {
            screenShare: false,
            goLiveStreaming: false,
            highQualityVideo: false,
            customSounds: false
          },
          advanced: {
            messageHistory: false,
            prioritySupport: false,
            betaFeatures: false,
            customThemes: false
          }
        }
      });
    }

    const features = premium.getFeatures();
    
    res.json({
      isPremium: true,
      tier: premium.subscription.tier,
      features,
      usage: premium.usage,
      daysRemaining: premium.daysRemaining
    });
  } catch (error) {
    console.error('Get features error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/premium/usage
// @desc    Update premium usage statistics
// @access  Private
router.put('/usage', [
  auth,
  body('type').isIn(['fileUpload', 'customEmoji', 'voiceTime', 'screenShareTime']).withMessage('Invalid usage type'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount } = req.body;
    
    const premium = await Premium.findOne({ user: req.user.id });
    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    await premium.updateUsage(type, amount);

    res.json({
      message: 'Usage updated successfully',
      usage: premium.usage
    });
  } catch (error) {
    console.error('Update usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/premium/billing/history
// @desc    Get billing history
// @access  Private
router.get('/billing/history', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 50 } = req.query;
    
    const premium = await Premium.findOne({ user: req.user.id });
    if (!premium) {
      return res.status(404).json({ message: 'No premium subscription found' });
    }

    const billingHistory = premium.billingHistory
      .sort((a, b) => b.date - a.date)
      .slice(0, parseInt(limit));

    res.json({
      billingHistory,
      total: premium.billingHistory.length
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/premium/expiring
// @desc    Get expiring subscriptions (Admin only)
// @access  Private
router.get('/expiring', [
  auth,
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
], async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { days = 7 } = req.query;
    
    const expiring = await Premium.findExpiring(parseInt(days));
    
    await Premium.populate(expiring, {
      path: 'user',
      select: 'username email'
    });

    res.json(expiring);
  } catch (error) {
    console.error('Get expiring subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/premium/statistics
// @desc    Get premium subscription statistics (Admin only)
// @access  Private
router.get('/statistics', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = await Premium.getSubscriptionStats();

    res.json(stats);
  } catch (error) {
    console.error('Get premium statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/premium/gift
// @desc    Gift premium subscription to another user
// @access  Private
router.post('/gift', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID required'),
  body('type').isIn(['drift_classic', 'drift', 'drift_basic']).withMessage('Invalid subscription type'),
  body('duration').isIn(['1', '3', '6', '12']).withMessage('Invalid duration (months)'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, type, duration, transactionId } = req.body;
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if gifter has premium (optional requirement)
    const gifterPremium = await Premium.findOne({ user: req.user.id });
    
    // Create or update recipient's premium
    let recipientPremium = await Premium.findOne({ user: recipientId });
    
    const durationMonths = parseInt(duration);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const subscriptionData = {
      type,
      status: 'active',
      tier: type === 'drift' ? 'premium' : type === 'drift_classic' ? 'classic' : 'basic',
      startDate: new Date(),
      endDate,
      autoRenew: false,
      billingCycle: 'gift',
      giftedBy: req.user.id,
      transactionId
    };

    if (recipientPremium) {
      // Extend existing subscription
      if (recipientPremium.isActive) {
        subscriptionData.startDate = recipientPremium.subscription.endDate;
        subscriptionData.endDate = new Date(subscriptionData.startDate);
        subscriptionData.endDate.setMonth(subscriptionData.endDate.getMonth() + durationMonths);
      }
      
      recipientPremium.subscription = subscriptionData;
      recipientPremium.features = recipientPremium.getFeaturesForTier(subscriptionData.tier);
    } else {
      recipientPremium = new Premium({
        user: recipientId,
        subscription: subscriptionData,
        features: Premium.schema.methods.getFeaturesForTier.call({ subscription: subscriptionData }, subscriptionData.tier)
      });
    }

    await recipientPremium.save();

    // Update recipient's user record
    await User.findByIdAndUpdate(recipientId, {
      isPremium: true,
      premiumType: type,
      premiumSince: subscriptionData.startDate
    });

    res.json({
      message: 'Premium gift sent successfully',
      recipient: {
        username: recipient.username,
        subscription: recipientPremium.subscription
      }
    });
  } catch (error) {
    console.error('Gift premium error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
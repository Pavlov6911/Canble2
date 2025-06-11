const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import MongoDB models
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Server = require('../models/Server');
const Role = require('../models/Role');
const Notification = require('../models/Notification');

class MongoToSupabaseMigration {
  constructor() {
    this.batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE) || 1000;
    this.supabase = null;
    this.migrationLog = [];
  }

  async initialize() {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');

      // Initialize Supabase
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase URL and Service Role Key are required');
      }

      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log('✅ Connected to Supabase');

    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.migrationLog.push(logMessage);
  }

  async migrateUsers() {
    this.log('Starting user migration...');
    
    try {
      const totalUsers = await User.countDocuments();
      this.log(`Found ${totalUsers} users to migrate`);

      let processed = 0;
      let batch = 0;

      while (processed < totalUsers) {
        const users = await User.find()
          .skip(processed)
          .limit(this.batchSize)
          .lean();

        if (users.length === 0) break;

        const supabaseUsers = users.map(user => ({
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          password_hash: user.password,
          avatar: user.avatar || '',
          discriminator: user.discriminator,
          status: user.status || 'offline',
          custom_status: user.customStatus || {},
          bio: user.bio || '',
          banner: user.banner || '',
          accent_color: user.accentColor || '#5865F2',
          badges: user.badges || [],
          premium_type: user.premiumType || 0,
          premium_since: user.premiumSince,
          flags: user.flags || 0,
          public_flags: user.publicFlags || 0,
          locale: user.locale || 'en-US',
          mfa_enabled: user.mfaEnabled || false,
          verified: user.verified || false,
          email_verified: user.emailVerified || false,
          phone: user.phone,
          nsfw_allowed: user.nsfwAllowed || false,
          analytics_token: user.analyticsToken,
          connections: user.connections || [],
          friend_sync: user.friendSync !== false,
          gif_auto_play: user.gifAutoPlay !== false,
          large_threshold: user.largeThreshold || 50,
          show_current_game: user.showCurrentGame !== false,
          restricted_guilds: user.restrictedGuilds || [],
          desktop_notifications: user.desktopNotifications !== false,
          mobile_notifications: user.mobileNotifications !== false,
          disable_games_tab: user.disableGamesTab || false,
          developer_mode: user.developerMode || false,
          detect_platform_accounts: user.detectPlatformAccounts !== false,
          status_settings: user.statusSettings || {},
          custom_activity: user.customActivity || {},
          client_settings: user.clientSettings || {},
          guild_positions: user.guildPositions || [],
          restricted_guild_ids: user.restrictedGuildIds || [],
          friend_source_flags: user.friendSourceFlags || {},
          created_at: user.createdAt || new Date(),
          updated_at: user.updatedAt || new Date()
        }));

        const { error } = await this.supabase
          .from('users')
          .upsert(supabaseUsers, { onConflict: 'id' });

        if (error) {
          throw new Error(`Batch ${batch} failed: ${error.message}`);
        }

        processed += users.length;
        batch++;
        this.log(`Migrated batch ${batch}: ${processed}/${totalUsers} users`);
      }

      this.log(`✅ Successfully migrated ${processed} users`);
    } catch (error) {
      this.log(`❌ User migration failed: ${error.message}`);
      throw error;
    }
  }

  async migrateGroups() {
    this.log('Starting group migration...');
    
    try {
      const totalGroups = await Group.countDocuments();
      this.log(`Found ${totalGroups} groups to migrate`);

      let processed = 0;
      let batch = 0;

      while (processed < totalGroups) {
        const groups = await Group.find()
          .skip(processed)
          .limit(this.batchSize)
          .lean();

        if (groups.length === 0) break;

        const supabaseGroups = groups.map(group => ({
          id: group._id.toString(),
          name: group.name,
          description: group.description || '',
          type: group.type,
          icon: group.icon,
          banner: group.banner,
          owner_id: group.owner.toString(),
          category: group.category || 'general',
          tags: group.tags || [],
          is_public: group.isPublic !== false,
          is_discoverable: group.isDiscoverable !== false,
          max_members: group.maxMembers || 100,
          member_count: group.memberCount || 0,
          online_count: group.onlineCount || 0,
          verification_level: group.verificationLevel || 0,
          explicit_content_filter: group.explicitContentFilter || 0,
          default_message_notifications: group.defaultMessageNotifications || 0,
          vanity_url: group.vanityUrl,
          invite_splash: group.inviteSplash,
          features: group.features || [],
          approximate_member_count: group.approximateMemberCount || 0,
          approximate_presence_count: group.approximatePresenceCount || 0,
          welcome_screen: group.welcomeScreen || {},
          nsfw_level: group.nsfwLevel || 0,
          premium_tier: group.premiumTier || 0,
          premium_subscription_count: group.premiumSubscriptionCount || 0,
          preferred_locale: group.preferredLocale || 'en-US',
          rules_channel_id: group.rulesChannelId?.toString(),
          public_updates_channel_id: group.publicUpdatesChannelId?.toString(),
          safety_alerts_channel_id: group.safetyAlertsChannelId?.toString(),
          created_at: group.createdAt || new Date(),
          updated_at: group.updatedAt || new Date()
        }));

        const { error } = await this.supabase
          .from('groups')
          .upsert(supabaseGroups, { onConflict: 'id' });

        if (error) {
          throw new Error(`Batch ${batch} failed: ${error.message}`);
        }

        // Migrate group members
        for (const group of groups) {
          if (group.members && group.members.length > 0) {
            const groupMembers = group.members.map(member => ({
              group_id: group._id.toString(),
              user_id: member.user.toString(),
              role: member.role || 'member',
              joined_at: member.joinedAt || new Date(),
              permissions: member.permissions || {}
            }));

            const { error: memberError } = await this.supabase
              .from('group_members')
              .upsert(groupMembers, { onConflict: 'group_id,user_id' });

            if (memberError) {
              this.log(`⚠️ Warning: Failed to migrate members for group ${group._id}: ${memberError.message}`);
            }
          }
        }

        processed += groups.length;
        batch++;
        this.log(`Migrated batch ${batch}: ${processed}/${totalGroups} groups`);
      }

      this.log(`✅ Successfully migrated ${processed} groups`);
    } catch (error) {
      this.log(`❌ Group migration failed: ${error.message}`);
      throw error;
    }
  }

  async migrateMessages() {
    this.log('Starting message migration...');
    
    try {
      const totalMessages = await Message.countDocuments();
      this.log(`Found ${totalMessages} messages to migrate`);

      let processed = 0;
      let batch = 0;

      while (processed < totalMessages) {
        const messages = await Message.find()
          .skip(processed)
          .limit(this.batchSize)
          .lean();

        if (messages.length === 0) break;

        const supabaseMessages = messages.map(message => ({
          id: message._id.toString(),
          content: message.content || '',
          author_id: message.author.toString(),
          channel_id: message.channel.toString(),
          server_id: message.server?.toString(),
          type: message.type || 0,
          tts: message.tts || false,
          mention_everyone: message.mentionEveryone || false,
          mentions: message.mentions?.map(m => m.toString()) || [],
          mention_roles: message.mentionRoles?.map(r => r.toString()) || [],
          mention_channels: message.mentionChannels || [],
          attachments: message.attachments || [],
          embeds: message.embeds || [],
          reactions: message.reactions || [],
          nonce: message.nonce,
          pinned: message.pinned || false,
          webhook_id: message.webhookId?.toString(),
          message_type: message.messageType || 0,
          activity: message.activity || {},
          application: message.application || {},
          application_id: message.applicationId?.toString(),
          message_reference: message.messageReference || {},
          flags: message.flags || 0,
          referenced_message: message.referencedMessage || {},
          interaction: message.interaction || {},
          thread: message.thread || {},
          components: message.components || [],
          sticker_items: message.stickerItems || [],
          stickers: message.stickers || [],
          position: message.position,
          edited_timestamp: message.editedTimestamp,
          created_at: message.createdAt || new Date(),
          updated_at: message.updatedAt || new Date()
        }));

        const { error } = await this.supabase
          .from('messages')
          .upsert(supabaseMessages, { onConflict: 'id' });

        if (error) {
          throw new Error(`Batch ${batch} failed: ${error.message}`);
        }

        processed += messages.length;
        batch++;
        this.log(`Migrated batch ${batch}: ${processed}/${totalMessages} messages`);
      }

      this.log(`✅ Successfully migrated ${processed} messages`);
    } catch (error) {
      this.log(`❌ Message migration failed: ${error.message}`);
      throw error;
    }
  }

  async saveMigrationLog() {
    const logPath = path.join(__dirname, '..', 'migration-log.txt');
    fs.writeFileSync(logPath, this.migrationLog.join('\n'));
    this.log(`Migration log saved to: ${logPath}`);
  }

  async run() {
    try {
      this.log('🚀 Starting MongoDB to Supabase migration...');
      
      await this.initialize();
      
      // Run migrations in order
      await this.migrateUsers();
      await this.migrateGroups();
      // await this.migrateMessages(); // Uncomment when ready to migrate messages
      
      this.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      this.log(`💥 Migration failed: ${error.message}`);
      throw error;
    } finally {
      await this.saveMigrationLog();
      await mongoose.disconnect();
      this.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new MongoToSupabaseMigration();
  migration.run().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = MongoToSupabaseMigration;
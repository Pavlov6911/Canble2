const bcrypt = require('bcryptjs');
const dbManager = require('../config/database');

class SupabaseUserService {
  constructor() {
    this.supabase = null;
  }

  async initialize() {
    if (dbManager.isSupabase()) {
      this.supabase = dbManager.getClient();
    }
  }

  async create(userData) {
    await this.initialize();
    
    if (!dbManager.isSupabase()) {
      throw new Error('This service requires Supabase database');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Generate discriminator
    const discriminator = Math.floor(1000 + Math.random() * 9000).toString();

    const newUser = {
      username: userData.username,
      email: userData.email.toLowerCase(),
      password_hash: hashedPassword,
      discriminator,
      avatar: userData.avatar || '',
      status: 'offline',
      custom_status: {},
      bio: userData.bio || '',
      banner: userData.banner || '',
      accent_color: userData.accentColor || '#5865F2',
      badges: userData.badges || [],
      premium_type: 0,
      flags: 0,
      public_flags: 0,
      locale: userData.locale || 'en-US',
      mfa_enabled: false,
      verified: false,
      email_verified: false,
      nsfw_allowed: false,
      connections: [],
      friend_sync: true,
      gif_auto_play: true,
      large_threshold: 50,
      show_current_game: true,
      restricted_guilds: [],
      desktop_notifications: true,
      mobile_notifications: true,
      disable_games_tab: false,
      developer_mode: false,
      detect_platform_accounts: true,
      status_settings: {},
      custom_activity: {},
      client_settings: {},
      guild_positions: [],
      restricted_guild_ids: [],
      friend_source_flags: {}
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.formatUser(data);
  }

  async findById(id) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this.formatUser(data);
  }

  async findByEmail(email) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this.formatUser(data);
  }

  async findByUsername(username) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this.formatUser(data);
  }

  async updateById(id, updateData) {
    await this.initialize();
    
    // Handle password hashing if password is being updated
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password;
    }

    // Convert field names to snake_case for database
    const dbUpdateData = this.convertToDbFormat(updateData);
    dbUpdateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('users')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return this.formatUser(data);
  }

  async deleteById(id) {
    await this.initialize();
    
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  }

  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password || user.password_hash);
  }

  async searchUsers(query, limit = 10) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, discriminator, avatar, status')
      .or(`username.ilike.%${query}%, email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data.map(user => this.formatUser(user));
  }

  async updateStatus(id, status) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }

    return this.formatUser(data);
  }

  // Helper method to format user data from database to application format
  formatUser(dbUser) {
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password_hash, // Keep for compatibility
      password_hash: dbUser.password_hash,
      avatar: dbUser.avatar,
      discriminator: dbUser.discriminator,
      status: dbUser.status,
      customStatus: dbUser.custom_status,
      bio: dbUser.bio,
      banner: dbUser.banner,
      accentColor: dbUser.accent_color,
      badges: dbUser.badges,
      premiumType: dbUser.premium_type,
      premiumSince: dbUser.premium_since,
      flags: dbUser.flags,
      publicFlags: dbUser.public_flags,
      locale: dbUser.locale,
      mfaEnabled: dbUser.mfa_enabled,
      verified: dbUser.verified,
      emailVerified: dbUser.email_verified,
      phone: dbUser.phone,
      nsfwAllowed: dbUser.nsfw_allowed,
      analyticsToken: dbUser.analytics_token,
      connections: dbUser.connections,
      friendSync: dbUser.friend_sync,
      gifAutoPlay: dbUser.gif_auto_play,
      largeThreshold: dbUser.large_threshold,
      showCurrentGame: dbUser.show_current_game,
      restrictedGuilds: dbUser.restricted_guilds,
      desktopNotifications: dbUser.desktop_notifications,
      mobileNotifications: dbUser.mobile_notifications,
      disableGamesTab: dbUser.disable_games_tab,
      developerMode: dbUser.developer_mode,
      detectPlatformAccounts: dbUser.detect_platform_accounts,
      statusSettings: dbUser.status_settings,
      customActivity: dbUser.custom_activity,
      clientSettings: dbUser.client_settings,
      guildPositions: dbUser.guild_positions,
      restrictedGuildIds: dbUser.restricted_guild_ids,
      friendSourceFlags: dbUser.friend_source_flags,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }

  // Helper method to convert application format to database format
  convertToDbFormat(appData) {
    const dbData = {};
    
    const fieldMapping = {
      customStatus: 'custom_status',
      accentColor: 'accent_color',
      premiumType: 'premium_type',
      premiumSince: 'premium_since',
      publicFlags: 'public_flags',
      mfaEnabled: 'mfa_enabled',
      emailVerified: 'email_verified',
      nsfwAllowed: 'nsfw_allowed',
      analyticsToken: 'analytics_token',
      friendSync: 'friend_sync',
      gifAutoPlay: 'gif_auto_play',
      largeThreshold: 'large_threshold',
      showCurrentGame: 'show_current_game',
      restrictedGuilds: 'restricted_guilds',
      desktopNotifications: 'desktop_notifications',
      mobileNotifications: 'mobile_notifications',
      disableGamesTab: 'disable_games_tab',
      developerMode: 'developer_mode',
      detectPlatformAccounts: 'detect_platform_accounts',
      statusSettings: 'status_settings',
      customActivity: 'custom_activity',
      clientSettings: 'client_settings',
      guildPositions: 'guild_positions',
      restrictedGuildIds: 'restricted_guild_ids',
      friendSourceFlags: 'friend_source_flags'
    };

    for (const [appField, dbField] of Object.entries(fieldMapping)) {
      if (appData[appField] !== undefined) {
        dbData[dbField] = appData[appField];
      }
    }

    // Direct mappings
    const directFields = ['username', 'email', 'avatar', 'discriminator', 'status', 'bio', 'banner', 'badges', 'flags', 'locale', 'phone'];
    for (const field of directFields) {
      if (appData[field] !== undefined) {
        dbData[field] = appData[field];
      }
    }

    return dbData;
  }
}

module.exports = SupabaseUserService;
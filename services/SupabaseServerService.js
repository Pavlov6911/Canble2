const { supabase } = require('../config/database');

class SupabaseServerService {
  constructor() {
    this.client = supabase;
  }

  // Create a new server
  async createServer(serverData) {
    try {
      const dbServer = this.formatServerForDB(serverData);
      
      const { data, error } = await this.client
        .from('servers')
        .insert([dbServer])
        .select(`
          *,
          owner:users!owner_id(
            id,
            username,
            discriminator,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      // Add owner as member
      await this.addMember(data.id, data.owner_id, {
        role: 'owner',
        nick: null
      });

      return this.formatServerFromDB(data);
    } catch (error) {
      console.error('Error creating server:', error);
      throw error;
    }
  }

  // Find server by ID
  async findById(serverId, includeChannels = false) {
    try {
      let selectQuery = `
        *,
        owner:users!owner_id(
          id,
          username,
          discriminator,
          avatar
        )
      `;

      if (includeChannels) {
        selectQuery += `,
        channels(
          id,
          name,
          type,
          position,
          topic,
          nsfw,
          parent_id,
          permission_overwrites,
          rate_limit_per_user,
          last_message_id,
          created_at
        )`;
      }

      const { data, error } = await this.client
        .from('servers')
        .select(selectQuery)
        .eq('id', serverId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return this.formatServerFromDB(data);
    } catch (error) {
      console.error('Error finding server:', error);
      throw error;
    }
  }

  // Find servers by owner
  async findByOwner(ownerId) {
    try {
      const { data, error } = await this.client
        .from('servers')
        .select(`
          *,
          owner:users!owner_id(
            id,
            username,
            discriminator,
            avatar
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(server => this.formatServerFromDB(server));
    } catch (error) {
      console.error('Error finding servers by owner:', error);
      throw error;
    }
  }

  // Get user's servers
  async getUserServers(userId) {
    try {
      const { data, error } = await this.client
        .rpc('get_user_servers', { user_id: userId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user servers:', error);
      throw error;
    }
  }

  // Update server
  async updateServer(serverId, updateData) {
    try {
      const dbUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('servers')
        .update(dbUpdate)
        .eq('id', serverId)
        .select(`
          *,
          owner:users!owner_id(
            id,
            username,
            discriminator,
            avatar
          )
        `)
        .single();

      if (error) throw error;
      return this.formatServerFromDB(data);
    } catch (error) {
      console.error('Error updating server:', error);
      throw error;
    }
  }

  // Delete server
  async deleteServer(serverId) {
    try {
      const { error } = await this.client
        .from('servers')
        .delete()
        .eq('id', serverId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting server:', error);
      throw error;
    }
  }

  // Add member to server
  async addMember(serverId, userId, memberData = {}) {
    try {
      const memberRecord = {
        server_id: serverId,
        user_id: userId,
        nick: memberData.nick || null,
        roles: memberData.roles || [],
        joined_at: new Date().toISOString(),
        deaf: memberData.deaf || false,
        mute: memberData.mute || false,
        pending: memberData.pending || false,
        premium_since: memberData.premiumSince || null,
        communication_disabled_until: memberData.communicationDisabledUntil || null
      };

      const { data, error } = await this.client
        .from('server_members')
        .insert([memberRecord])
        .select(`
          *,
          user:users!user_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .single();

      if (error) throw error;
      return this.formatMemberFromDB(data);
    } catch (error) {
      console.error('Error adding server member:', error);
      throw error;
    }
  }

  // Remove member from server
  async removeMember(serverId, userId) {
    try {
      const { error } = await this.client
        .from('server_members')
        .delete()
        .eq('server_id', serverId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing server member:', error);
      throw error;
    }
  }

  // Get server members
  async getMembers(serverId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;

      const { data, error } = await this.client
        .from('server_members')
        .select(`
          *,
          user:users!user_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .eq('server_id', serverId)
        .order('joined_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return data.map(member => this.formatMemberFromDB(member));
    } catch (error) {
      console.error('Error getting server members:', error);
      throw error;
    }
  }

  // Check if user is member of server
  async isMember(serverId, userId) {
    try {
      const { data, error } = await this.client
        .from('server_members')
        .select('user_id')
        .eq('server_id', serverId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return false; // Not found
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking server membership:', error);
      throw error;
    }
  }

  // Get member info
  async getMember(serverId, userId) {
    try {
      const { data, error } = await this.client
        .from('server_members')
        .select(`
          *,
          user:users!user_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .eq('server_id', serverId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return this.formatMemberFromDB(data);
    } catch (error) {
      console.error('Error getting server member:', error);
      throw error;
    }
  }

  // Update member
  async updateMember(serverId, userId, updateData) {
    try {
      const dbUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('server_members')
        .update(dbUpdate)
        .eq('server_id', serverId)
        .eq('user_id', userId)
        .select(`
          *,
          user:users!user_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .single();

      if (error) throw error;
      return this.formatMemberFromDB(data);
    } catch (error) {
      console.error('Error updating server member:', error);
      throw error;
    }
  }

  // Search servers
  async searchServers(query, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      const { data, error } = await this.client
        .from('servers')
        .select(`
          *,
          owner:users!owner_id(
            id,
            username,
            discriminator,
            avatar
          )
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('approximate_member_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return data.map(server => this.formatServerFromDB(server));
    } catch (error) {
      console.error('Error searching servers:', error);
      throw error;
    }
  }

  // Get server count
  async getServerCount() {
    try {
      const { count, error } = await this.client
        .from('servers')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error getting server count:', error);
      throw error;
    }
  }

  // Get member count for server
  async getMemberCount(serverId) {
    try {
      const { count, error } = await this.client
        .from('server_members')
        .select('*', { count: 'exact', head: true })
        .eq('server_id', serverId);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error getting member count:', error);
      throw error;
    }
  }

  // Update server member count
  async updateMemberCount(serverId) {
    try {
      const count = await this.getMemberCount(serverId);
      
      const { error } = await this.client
        .from('servers')
        .update({ 
          approximate_member_count: count,
          updated_at: new Date().toISOString()
        })
        .eq('id', serverId);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error updating member count:', error);
      throw error;
    }
  }

  // Format server data for database storage
  formatServerForDB(serverData) {
    return {
      id: serverData.id,
      name: serverData.name,
      description: serverData.description || null,
      icon: serverData.icon || null,
      banner: serverData.banner || null,
      splash: serverData.splash || null,
      discovery_splash: serverData.discoverySplash || serverData.discovery_splash || null,
      owner_id: serverData.owner || serverData.ownerId || serverData.owner_id,
      permissions: serverData.permissions || null,
      region: serverData.region || 'us-west',
      afk_channel_id: serverData.afkChannelId || serverData.afk_channel_id || null,
      afk_timeout: serverData.afkTimeout || serverData.afk_timeout || 300,
      widget_enabled: serverData.widgetEnabled || serverData.widget_enabled || false,
      widget_channel_id: serverData.widgetChannelId || serverData.widget_channel_id || null,
      verification_level: serverData.verificationLevel || serverData.verification_level || 0,
      default_message_notifications: serverData.defaultMessageNotifications || serverData.default_message_notifications || 0,
      explicit_content_filter: serverData.explicitContentFilter || serverData.explicit_content_filter || 0,
      mfa_level: serverData.mfaLevel || serverData.mfa_level || 0,
      system_channel_id: serverData.systemChannelId || serverData.system_channel_id || null,
      system_channel_flags: serverData.systemChannelFlags || serverData.system_channel_flags || 0,
      rules_channel_id: serverData.rulesChannelId || serverData.rules_channel_id || null,
      max_presences: serverData.maxPresences || serverData.max_presences || null,
      max_members: serverData.maxMembers || serverData.max_members || null,
      vanity_url_code: serverData.vanityUrlCode || serverData.vanity_url_code || null,
      premium_tier: serverData.premiumTier || serverData.premium_tier || 0,
      premium_subscription_count: serverData.premiumSubscriptionCount || serverData.premium_subscription_count || 0,
      preferred_locale: serverData.preferredLocale || serverData.preferred_locale || 'en-US',
      public_updates_channel_id: serverData.publicUpdatesChannelId || serverData.public_updates_channel_id || null,
      max_video_channel_users: serverData.maxVideoChannelUsers || serverData.max_video_channel_users || null,
      approximate_member_count: serverData.approximateMemberCount || serverData.approximate_member_count || 1,
      approximate_presence_count: serverData.approximatePresenceCount || serverData.approximate_presence_count || 1,
      welcome_screen: serverData.welcomeScreen || serverData.welcome_screen || null,
      nsfw_level: serverData.nsfwLevel || serverData.nsfw_level || 0,
      stage_instances: serverData.stageInstances || serverData.stage_instances || [],
      stickers: serverData.stickers || [],
      guild_scheduled_events: serverData.guildScheduledEvents || serverData.guild_scheduled_events || [],
      premium_progress_bar_enabled: serverData.premiumProgressBarEnabled || serverData.premium_progress_bar_enabled || false,
      created_at: serverData.createdAt || serverData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Format server data from database for application use
  formatServerFromDB(dbServer) {
    if (!dbServer) return null;

    return {
      id: dbServer.id,
      name: dbServer.name,
      description: dbServer.description,
      icon: dbServer.icon,
      banner: dbServer.banner,
      splash: dbServer.splash,
      discoverySplash: dbServer.discovery_splash,
      owner: dbServer.owner || {
        id: dbServer.owner_id,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null
      },
      ownerId: dbServer.owner_id,
      permissions: dbServer.permissions,
      region: dbServer.region,
      afkChannelId: dbServer.afk_channel_id,
      afkTimeout: dbServer.afk_timeout,
      widgetEnabled: dbServer.widget_enabled,
      widgetChannelId: dbServer.widget_channel_id,
      verificationLevel: dbServer.verification_level,
      defaultMessageNotifications: dbServer.default_message_notifications,
      explicitContentFilter: dbServer.explicit_content_filter,
      mfaLevel: dbServer.mfa_level,
      systemChannelId: dbServer.system_channel_id,
      systemChannelFlags: dbServer.system_channel_flags,
      rulesChannelId: dbServer.rules_channel_id,
      maxPresences: dbServer.max_presences,
      maxMembers: dbServer.max_members,
      vanityUrlCode: dbServer.vanity_url_code,
      premiumTier: dbServer.premium_tier,
      premiumSubscriptionCount: dbServer.premium_subscription_count,
      preferredLocale: dbServer.preferred_locale,
      publicUpdatesChannelId: dbServer.public_updates_channel_id,
      maxVideoChannelUsers: dbServer.max_video_channel_users,
      approximateMemberCount: dbServer.approximate_member_count,
      approximatePresenceCount: dbServer.approximate_presence_count,
      welcomeScreen: dbServer.welcome_screen,
      nsfwLevel: dbServer.nsfw_level,
      stageInstances: dbServer.stage_instances || [],
      stickers: dbServer.stickers || [],
      guildScheduledEvents: dbServer.guild_scheduled_events || [],
      premiumProgressBarEnabled: dbServer.premium_progress_bar_enabled,
      channels: dbServer.channels || [],
      createdAt: dbServer.created_at,
      updatedAt: dbServer.updated_at,
      // Legacy compatibility
      memberCount: dbServer.approximate_member_count,
      presenceCount: dbServer.approximate_presence_count
    };
  }

  // Format member data from database for application use
  formatMemberFromDB(dbMember) {
    if (!dbMember) return null;

    return {
      user: dbMember.user || {
        id: dbMember.user_id,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null,
        status: 'offline'
      },
      userId: dbMember.user_id,
      serverId: dbMember.server_id,
      nick: dbMember.nick,
      roles: dbMember.roles || [],
      joinedAt: dbMember.joined_at,
      premiumSince: dbMember.premium_since,
      deaf: dbMember.deaf,
      mute: dbMember.mute,
      pending: dbMember.pending,
      communicationDisabledUntil: dbMember.communication_disabled_until,
      createdAt: dbMember.created_at,
      updatedAt: dbMember.updated_at
    };
  }
}

module.exports = SupabaseServerService;
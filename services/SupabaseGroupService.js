const dbManager = require('../config/database');

class SupabaseGroupService {
  constructor() {
    this.supabase = null;
  }

  async initialize() {
    if (dbManager.isSupabase()) {
      this.supabase = dbManager.getClient();
    }
  }

  async create(groupData) {
    await this.initialize();
    
    if (!dbManager.isSupabase()) {
      throw new Error('This service requires Supabase database');
    }

    const newGroup = {
      name: groupData.name,
      description: groupData.description || '',
      type: groupData.type,
      icon: groupData.icon,
      banner: groupData.banner,
      owner_id: groupData.owner || groupData.owner_id,
      category: groupData.category || 'general',
      tags: groupData.tags || [],
      is_public: groupData.isPublic !== false,
      is_discoverable: groupData.isDiscoverable !== false,
      max_members: groupData.maxMembers || 100,
      member_count: 1, // Owner is the first member
      online_count: 0,
      verification_level: groupData.verificationLevel || 0,
      explicit_content_filter: groupData.explicitContentFilter || 0,
      default_message_notifications: groupData.defaultMessageNotifications || 0,
      vanity_url: groupData.vanityUrl,
      invite_splash: groupData.inviteSplash,
      features: groupData.features || [],
      approximate_member_count: 1,
      approximate_presence_count: 0,
      welcome_screen: groupData.welcomeScreen || {},
      nsfw_level: groupData.nsfwLevel || 0,
      premium_tier: 0,
      premium_subscription_count: 0,
      preferred_locale: groupData.preferredLocale || 'en-US'
    };

    const { data: group, error: groupError } = await this.supabase
      .from('groups')
      .insert([newGroup])
      .select()
      .single();

    if (groupError) {
      throw new Error(`Failed to create group: ${groupError.message}`);
    }

    // Add owner as first member
    const ownerMember = {
      group_id: group.id,
      user_id: group.owner_id,
      role: 'owner',
      joined_at: new Date().toISOString(),
      permissions: {}
    };

    const { error: memberError } = await this.supabase
      .from('group_members')
      .insert([ownerMember]);

    if (memberError) {
      // If member insertion fails, we should clean up the group
      await this.supabase.from('groups').delete().eq('id', group.id);
      throw new Error(`Failed to add owner as member: ${memberError.message}`);
    }

    // Create default 'general' channel
    const defaultChannel = {
      group_id: group.id,
      name: 'general',
      type: 0, // Text channel
      position: 0,
      topic: 'General discussion',
      nsfw: false,
      rate_limit_per_user: 0,
      permission_overwrites: []
    };

    const { data: channel, error: channelError } = await this.supabase
      .from('group_channels')
      .insert([defaultChannel])
      .select()
      .single();

    if (channelError) {
      console.warn(`Failed to create default channel for group ${group.id}: ${channelError.message}`);
    }

    return this.formatGroup({ ...group, channels: channel ? [channel] : [] });
  }

  async findById(id) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('groups')
      .select(`
        *,
        owner:users!groups_owner_id_fkey(id, username, avatar, discriminator),
        group_channels(*),
        group_members(
          user_id,
          role,
          joined_at,
          permissions,
          user:users(id, username, avatar, discriminator, status)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Group not found
      }
      throw new Error(`Failed to find group: ${error.message}`);
    }

    return this.formatGroup(data);
  }

  async findByOwnerId(ownerId) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('owner_id', ownerId);

    if (error) {
      throw new Error(`Failed to find groups by owner: ${error.message}`);
    }

    return data.map(group => this.formatGroup(group));
  }

  async findPublicGroups(limit = 20, offset = 0) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('groups')
      .select(`
        *,
        owner:users!groups_owner_id_fkey(id, username, avatar, discriminator)
      `)
      .eq('is_public', true)
      .eq('is_discoverable', true)
      .order('member_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to find public groups: ${error.message}`);
    }

    return data.map(group => this.formatGroup(group));
  }

  async searchGroups(query, limit = 10) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('groups')
      .select(`
        *,
        owner:users!groups_owner_id_fkey(id, username, avatar, discriminator)
      `)
      .eq('is_public', true)
      .eq('is_discoverable', true)
      .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search groups: ${error.message}`);
    }

    return data.map(group => this.formatGroup(group));
  }

  async updateById(id, updateData) {
    await this.initialize();
    
    const dbUpdateData = this.convertToDbFormat(updateData);
    dbUpdateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('groups')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update group: ${error.message}`);
    }

    return this.formatGroup(data);
  }

  async deleteById(id) {
    await this.initialize();
    
    const { error } = await this.supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }

    return true;
  }

  async addMember(groupId, userId, role = 'member') {
    await this.initialize();
    
    const newMember = {
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
      permissions: {}
    };

    const { data, error } = await this.supabase
      .from('group_members')
      .insert([newMember])
      .select(`
        *,
        user:users(id, username, avatar, discriminator, status)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add member to group: ${error.message}`);
    }

    // Update member count
    await this.incrementMemberCount(groupId);

    return data;
  }

  async removeMember(groupId, userId) {
    await this.initialize();
    
    const { error } = await this.supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member from group: ${error.message}`);
    }

    // Update member count
    await this.decrementMemberCount(groupId);

    return true;
  }

  async getMembers(groupId) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('group_members')
      .select(`
        *,
        user:users(id, username, avatar, discriminator, status)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get group members: ${error.message}`);
    }

    return data;
  }

  async isMember(groupId, userId) {
    await this.initialize();
    
    const { data, error } = await this.supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Not a member
      }
      throw new Error(`Failed to check membership: ${error.message}`);
    }

    return true;
  }

  async incrementMemberCount(groupId) {
    await this.initialize();
    
    const { error } = await this.supabase
      .rpc('increment_group_member_count', { group_id: groupId });

    if (error) {
      console.warn(`Failed to increment member count for group ${groupId}: ${error.message}`);
    }
  }

  async decrementMemberCount(groupId) {
    await this.initialize();
    
    const { error } = await this.supabase
      .rpc('decrement_group_member_count', { group_id: groupId });

    if (error) {
      console.warn(`Failed to decrement member count for group ${groupId}: ${error.message}`);
    }
  }

  // Helper method to format group data from database to application format
  formatGroup(dbGroup) {
    if (!dbGroup) return null;

    return {
      _id: dbGroup.id, // For compatibility with existing code
      id: dbGroup.id,
      name: dbGroup.name,
      description: dbGroup.description,
      type: dbGroup.type,
      icon: dbGroup.icon,
      banner: dbGroup.banner,
      owner: dbGroup.owner_id,
      ownerId: dbGroup.owner_id,
      ownerData: dbGroup.owner,
      category: dbGroup.category,
      tags: dbGroup.tags,
      isPublic: dbGroup.is_public,
      isDiscoverable: dbGroup.is_discoverable,
      maxMembers: dbGroup.max_members,
      memberCount: dbGroup.member_count,
      onlineCount: dbGroup.online_count,
      verificationLevel: dbGroup.verification_level,
      explicitContentFilter: dbGroup.explicit_content_filter,
      defaultMessageNotifications: dbGroup.default_message_notifications,
      vanityUrl: dbGroup.vanity_url,
      inviteSplash: dbGroup.invite_splash,
      features: dbGroup.features,
      approximateMemberCount: dbGroup.approximate_member_count,
      approximatePresenceCount: dbGroup.approximate_presence_count,
      welcomeScreen: dbGroup.welcome_screen,
      nsfwLevel: dbGroup.nsfw_level,
      premiumTier: dbGroup.premium_tier,
      premiumSubscriptionCount: dbGroup.premium_subscription_count,
      preferredLocale: dbGroup.preferred_locale,
      rulesChannelId: dbGroup.rules_channel_id,
      publicUpdatesChannelId: dbGroup.public_updates_channel_id,
      safetyAlertsChannelId: dbGroup.safety_alerts_channel_id,
      channels: dbGroup.group_channels || [],
      members: dbGroup.group_members || [],
      createdAt: dbGroup.created_at,
      updatedAt: dbGroup.updated_at
    };
  }

  // Helper method to convert application format to database format
  convertToDbFormat(appData) {
    const dbData = {};
    
    const fieldMapping = {
      isPublic: 'is_public',
      isDiscoverable: 'is_discoverable',
      maxMembers: 'max_members',
      memberCount: 'member_count',
      onlineCount: 'online_count',
      verificationLevel: 'verification_level',
      explicitContentFilter: 'explicit_content_filter',
      defaultMessageNotifications: 'default_message_notifications',
      vanityUrl: 'vanity_url',
      inviteSplash: 'invite_splash',
      approximateMemberCount: 'approximate_member_count',
      approximatePresenceCount: 'approximate_presence_count',
      welcomeScreen: 'welcome_screen',
      nsfwLevel: 'nsfw_level',
      premiumTier: 'premium_tier',
      premiumSubscriptionCount: 'premium_subscription_count',
      preferredLocale: 'preferred_locale',
      rulesChannelId: 'rules_channel_id',
      publicUpdatesChannelId: 'public_updates_channel_id',
      safetyAlertsChannelId: 'safety_alerts_channel_id'
    };

    for (const [appField, dbField] of Object.entries(fieldMapping)) {
      if (appData[appField] !== undefined) {
        dbData[dbField] = appData[appField];
      }
    }

    // Direct mappings
    const directFields = ['name', 'description', 'type', 'icon', 'banner', 'category', 'tags', 'features'];
    for (const field of directFields) {
      if (appData[field] !== undefined) {
        dbData[field] = appData[field];
      }
    }

    return dbData;
  }
}

module.exports = SupabaseGroupService;
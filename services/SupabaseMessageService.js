const { supabase } = require('../config/database');

class SupabaseMessageService {
  constructor() {
    this.client = supabase;
  }

  // Create a new message
  async createMessage(messageData) {
    try {
      const dbMessage = this.formatMessageForDB(messageData);
      
      const { data, error } = await this.client
        .from('messages')
        .insert([dbMessage])
        .select(`
          *,
          author:users!author_id(
            id,
            username,
            discriminator,
            avatar,
            status
          ),
          channel:channels!channel_id(
            id,
            name,
            type
          )
        `)
        .single();

      if (error) throw error;
      return this.formatMessageFromDB(data);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Find message by ID
  async findById(messageId) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .select(`
          *,
          author:users!author_id(
            id,
            username,
            discriminator,
            avatar,
            status
          ),
          channel:channels!channel_id(
            id,
            name,
            type
          )
        `)
        .eq('id', messageId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return this.formatMessageFromDB(data);
    } catch (error) {
      console.error('Error finding message:', error);
      throw error;
    }
  }

  // Get messages for a channel with pagination
  async getChannelMessages(channelId, options = {}) {
    try {
      const {
        limit = 50,
        before = null,
        after = null,
        around = null
      } = options;

      let query = this.client
        .from('messages')
        .select(`
          *,
          author:users!author_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      } else if (after) {
        query = query.gt('created_at', after);
      } else if (around) {
        // Get messages around a specific timestamp
        const halfLimit = Math.floor(limit / 2);
        query = query.gte('created_at', around).limit(halfLimit);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map(message => this.formatMessageFromDB(message));
    } catch (error) {
      console.error('Error getting channel messages:', error);
      throw error;
    }
  }

  // Update message
  async updateMessage(messageId, updateData) {
    try {
      const dbUpdate = {
        ...updateData,
        edited_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('messages')
        .update(dbUpdate)
        .eq('id', messageId)
        .select(`
          *,
          author:users!author_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .single();

      if (error) throw error;
      return this.formatMessageFromDB(data);
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const { error } = await this.client
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(query, options = {}) {
    try {
      const {
        channelId = null,
        serverId = null,
        authorId = null,
        limit = 50,
        offset = 0
      } = options;

      const { data, error } = await this.client
        .rpc('search_messages', {
          search_query: query,
          channel_id: channelId,
          server_id: serverId,
          author_id: authorId,
          limit_count: limit,
          offset_count: offset
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  // Get pinned messages for a channel
  async getPinnedMessages(channelId) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .select(`
          *,
          author:users!author_id(
            id,
            username,
            discriminator,
            avatar,
            status
          )
        `)
        .eq('channel_id', channelId)
        .eq('pinned', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(message => this.formatMessageFromDB(message));
    } catch (error) {
      console.error('Error getting pinned messages:', error);
      throw error;
    }
  }

  // Pin/unpin message
  async togglePin(messageId, pinned = true) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .update({ 
          pinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return this.formatMessageFromDB(data);
    } catch (error) {
      console.error('Error toggling message pin:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, emoji, userId) {
    try {
      // Get current message
      const message = await this.findById(messageId);
      if (!message) throw new Error('Message not found');

      const reactions = message.reactions || {};
      
      if (!reactions[emoji]) {
        reactions[emoji] = {
          count: 0,
          users: []
        };
      }

      // Add user if not already reacted
      if (!reactions[emoji].users.includes(userId)) {
        reactions[emoji].users.push(userId);
        reactions[emoji].count = reactions[emoji].users.length;
      }

      const { data, error } = await this.client
        .from('messages')
        .update({ 
          reactions,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return this.formatMessageFromDB(data);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, emoji, userId) {
    try {
      // Get current message
      const message = await this.findById(messageId);
      if (!message) throw new Error('Message not found');

      const reactions = message.reactions || {};
      
      if (reactions[emoji] && reactions[emoji].users.includes(userId)) {
        reactions[emoji].users = reactions[emoji].users.filter(id => id !== userId);
        reactions[emoji].count = reactions[emoji].users.length;
        
        // Remove emoji if no users left
        if (reactions[emoji].count === 0) {
          delete reactions[emoji];
        }
      }

      const { data, error } = await this.client
        .from('messages')
        .update({ 
          reactions,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return this.formatMessageFromDB(data);
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Get message count for a channel
  async getMessageCount(channelId) {
    try {
      const { count, error } = await this.client
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error getting message count:', error);
      throw error;
    }
  }

  // Get messages by author
  async getMessagesByAuthor(authorId, options = {}) {
    try {
      const { limit = 50, offset = 0, channelId = null } = options;

      let query = this.client
        .from('messages')
        .select(`
          *,
          author:users!author_id(
            id,
            username,
            discriminator,
            avatar,
            status
          ),
          channel:channels!channel_id(
            id,
            name,
            type
          )
        `)
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (channelId) {
        query = query.eq('channel_id', channelId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map(message => this.formatMessageFromDB(message));
    } catch (error) {
      console.error('Error getting messages by author:', error);
      throw error;
    }
  }

  // Format message data for database storage
  formatMessageForDB(messageData) {
    return {
      id: messageData.id,
      content: messageData.content || '',
      author_id: messageData.author || messageData.authorId || messageData.author_id,
      channel_id: messageData.channel || messageData.channelId || messageData.channel_id,
      server_id: messageData.server || messageData.serverId || messageData.server_id || null,
      type: messageData.type || 0,
      attachments: messageData.attachments || [],
      embeds: messageData.embeds || [],
      reactions: messageData.reactions || {},
      pinned: messageData.pinned || false,
      mention_everyone: messageData.mentionEveryone || messageData.mention_everyone || false,
      mentions: messageData.mentions || [],
      mention_roles: messageData.mentionRoles || messageData.mention_roles || [],
      mention_channels: messageData.mentionChannels || messageData.mention_channels || [],
      flags: messageData.flags || 0,
      webhook_id: messageData.webhookId || messageData.webhook_id || null,
      application_id: messageData.applicationId || messageData.application_id || null,
      message_reference: messageData.messageReference || messageData.message_reference || null,
      thread_id: messageData.threadId || messageData.thread_id || null,
      edited_timestamp: messageData.editedTimestamp || messageData.edited_timestamp || null,
      created_at: messageData.createdAt || messageData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Format message data from database for application use
  formatMessageFromDB(dbMessage) {
    if (!dbMessage) return null;

    return {
      id: dbMessage.id,
      content: dbMessage.content,
      author: dbMessage.author || {
        id: dbMessage.author_id,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null,
        status: 'offline'
      },
      authorId: dbMessage.author_id,
      channel: dbMessage.channel || {
        id: dbMessage.channel_id,
        name: 'Unknown Channel',
        type: 0
      },
      channelId: dbMessage.channel_id,
      serverId: dbMessage.server_id,
      type: dbMessage.type,
      attachments: dbMessage.attachments || [],
      embeds: dbMessage.embeds || [],
      reactions: dbMessage.reactions || {},
      pinned: dbMessage.pinned || false,
      mentionEveryone: dbMessage.mention_everyone || false,
      mentions: dbMessage.mentions || [],
      mentionRoles: dbMessage.mention_roles || [],
      mentionChannels: dbMessage.mention_channels || [],
      flags: dbMessage.flags || 0,
      webhookId: dbMessage.webhook_id,
      applicationId: dbMessage.application_id,
      messageReference: dbMessage.message_reference,
      threadId: dbMessage.thread_id,
      editedTimestamp: dbMessage.edited_timestamp,
      createdAt: dbMessage.created_at,
      updatedAt: dbMessage.updated_at,
      // Legacy compatibility
      timestamp: dbMessage.created_at,
      editedAt: dbMessage.edited_timestamp
    };
  }
}

module.exports = SupabaseMessageService;
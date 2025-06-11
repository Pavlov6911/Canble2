import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface MessageAttachment {
  id: string;
  filename: string;
  description?: string;
  contentType?: string;
  size: number;
  url: string;
  proxyUrl: string;
  height?: number;
  width?: number;
  ephemeral?: boolean;
}

export interface MessageEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    iconUrl?: string;
    proxyIconUrl?: string;
  };
  image?: {
    url: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
  };
  thumbnail?: {
    url: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
  };
  video?: {
    url?: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
  };
  provider?: {
    name?: string;
    url?: string;
  };
  author?: {
    name: string;
    url?: string;
    iconUrl?: string;
    proxyIconUrl?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export interface MessageReaction {
  emoji: {
    id?: string;
    name: string;
    animated?: boolean;
  };
  count: number;
  me: boolean;
  users: string[];
}

export interface Message {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
  };
  channel: string;
  server?: string;
  type: number;
  tts: boolean;
  mentionEveryone: boolean;
  mentions: string[];
  mentionRoles: string[];
  mentionChannels: any[];
  attachments: MessageAttachment[];
  embeds: MessageEmbed[];
  reactions: MessageReaction[];
  nonce?: string;
  pinned: boolean;
  webhookId?: string;
  activity?: any;
  application?: any;
  applicationId?: string;
  messageReference?: {
    messageId?: string;
    channelId?: string;
    serverId?: string;
    failIfNotExists?: boolean;
  };
  flags?: number;
  referencedMessage?: Message;
  interaction?: any;
  thread?: any;
  components?: any[];
  stickerItems?: any[];
  position?: number;
  editedTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessagesState {
  messages: { [channelId: string]: Message[] };
  loading: boolean;
  loadingMore: boolean;
  hasMore: { [channelId: string]: boolean };
  error: string | null;
  typingUsers: { [channelId: string]: { [userId: string]: { username: string; timestamp: number } } };
}

const initialState: MessagesState = {
  messages: {
    // Mock messages for DM channels
    'dm_1': [
      {
        _id: 'msg_dm1_1',
        content: 'Hey! How are you doing?',
        author: {
           _id: 'user_test',
           username: 'Test',
           discriminator: '1234',
           avatar: undefined
         },
        channel: 'dm_1',
        type: 0,
        tts: false,
        mentionEveryone: false,
        mentions: [],
        mentionRoles: [],
        mentionChannels: [],
        attachments: [],
        embeds: [],
        reactions: [],
        pinned: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        _id: 'msg_dm1_2',
        content: 'I\'m doing great! Thanks for asking. What about you?',
        author: {
           _id: 'current_user',
           username: 'You',
           discriminator: '0001',
           avatar: undefined
         },
        channel: 'dm_1',
        type: 0,
        tts: false,
        mentionEveryone: false,
        mentions: [],
        mentionRoles: [],
        mentionChannels: [],
        attachments: [],
        embeds: [],
        reactions: [],
        pinned: false,
        createdAt: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
        updatedAt: new Date(Date.now() - 3000000).toISOString()
      },
      {
        _id: 'msg_dm1_3',
        content: 'Pretty good! Just working on some projects. Are you free this weekend?',
        author: {
           _id: 'user_test',
           username: 'Test',
           discriminator: '1234',
           avatar: undefined
         },
        channel: 'dm_1',
        type: 0,
        tts: false,
        mentionEveryone: false,
        mentions: [],
        mentionRoles: [],
        mentionChannels: [],
        attachments: [],
        embeds: [],
        reactions: [],
        pinned: false,
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  loading: false,
  loadingMore: false,
  hasMore: {},
  error: null,
  typingUsers: {}
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ channelId, before, limit = 50 }: { channelId: string; before?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (before) params.append('before', before);
      params.append('limit', limit.toString());
      
      const response = await axios.get(`/channels/${channelId}/messages?${params}`);
      return { channelId, messages: response.data, hasMore: response.data.length === limit };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch messages';
      return rejectWithValue(message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ channelId, messageData }: { channelId: string; messageData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/channels/${channelId}/messages`, messageData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async ({ channelId, messageId, content }: { channelId: string; messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/channels/${channelId}/messages/${messageId}`, { content });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to edit message';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async ({ channelId, messageId }: { channelId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`/channels/${channelId}/messages/${messageId}`);
      return { channelId, messageId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete message';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const addReaction = createAsyncThunk(
  'messages/addReaction',
  async ({ channelId, messageId, emoji }: { channelId: string; messageId: string; emoji: string }, { rejectWithValue }) => {
    try {
      await axios.put(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`);
      return { channelId, messageId, emoji };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add reaction';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeReaction = createAsyncThunk(
  'messages/removeReaction',
  async ({ channelId, messageId, emoji, userId }: { channelId: string; messageId: string; emoji: string; userId?: string }, { rejectWithValue }) => {
    try {
      const userPath = userId ? `/${userId}` : '/@me';
      await axios.delete(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}${userPath}`);
      return { channelId, messageId, emoji, userId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove reaction';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const searchMessages = createAsyncThunk(
  'messages/searchMessages',
  async ({ channelId, query, authorId, mentions, has, before, after, during }: {
    channelId?: string;
    query?: string;
    authorId?: string;
    mentions?: string;
    has?: string;
    before?: string;
    after?: string;
    during?: string;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (channelId) params.append('channel_id', channelId);
      if (query) params.append('content', query);
      if (authorId) params.append('author_id', authorId);
      if (mentions) params.append('mentions', mentions);
      if (has) params.append('has', has);
      if (before) params.append('max_id', before);
      if (after) params.append('min_id', after);
      if (during) params.append('during', during);
      
      const response = await axios.get(`/search?${params}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to search messages';
      return rejectWithValue(message);
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const channelId = message.channel;
      
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      
      // Add message to the end (newest)
      state.messages[channelId].push(message);
      
      // Keep only the last 100 messages per channel to prevent memory issues
      if (state.messages[channelId].length > 100) {
        state.messages[channelId] = state.messages[channelId].slice(-100);
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const channelId = message.channel;
      
      if (state.messages[channelId]) {
        const index = state.messages[channelId].findIndex(m => m._id === message._id);
        if (index !== -1) {
          state.messages[channelId][index] = message;
        }
      }
    },
    removeMessage: (state, action: PayloadAction<{ channelId: string; messageId: string }>) => {
      const { channelId, messageId } = action.payload;
      
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(m => m._id !== messageId);
      }
    },
    clearChannelMessages: (state, action: PayloadAction<string>) => {
      const channelId = action.payload;
      delete state.messages[channelId];
      delete state.hasMore[channelId];
      delete state.typingUsers[channelId];
    },
    addTypingUser: (state, action: PayloadAction<{ channelId: string; userId: string; username: string }>) => {
      const { channelId, userId, username } = action.payload;
      
      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = {};
      }
      
      state.typingUsers[channelId][userId] = {
        username,
        timestamp: Date.now()
      };
    },
    removeTypingUser: (state, action: PayloadAction<{ channelId: string; userId: string }>) => {
      const { channelId, userId } = action.payload;
      
      if (state.typingUsers[channelId]) {
        delete state.typingUsers[channelId][userId];
        
        if (Object.keys(state.typingUsers[channelId]).length === 0) {
          delete state.typingUsers[channelId];
        }
      }
    },
    clearOldTypingUsers: (state) => {
      const now = Date.now();
      const timeout = 10000; // 10 seconds
      
      Object.keys(state.typingUsers).forEach(channelId => {
        Object.keys(state.typingUsers[channelId]).forEach(userId => {
          if (now - state.typingUsers[channelId][userId].timestamp > timeout) {
            delete state.typingUsers[channelId][userId];
          }
        });
        
        if (Object.keys(state.typingUsers[channelId]).length === 0) {
          delete state.typingUsers[channelId];
        }
      });
    },
    updateMessageReaction: (state, action: PayloadAction<{ channelId: string; messageId: string; reaction: MessageReaction }>) => {
      const { channelId, messageId, reaction } = action.payload;
      
      if (state.messages[channelId]) {
        const message = state.messages[channelId].find(m => m._id === messageId);
        if (message) {
          const existingReactionIndex = message.reactions.findIndex(
            r => r.emoji.name === reaction.emoji.name && r.emoji.id === reaction.emoji.id
          );
          
          if (existingReactionIndex !== -1) {
            message.reactions[existingReactionIndex] = reaction;
          } else {
            message.reactions.push(reaction);
          }
        }
      }
    },
    removeMessageReaction: (state, action: PayloadAction<{ channelId: string; messageId: string; emoji: { name: string; id?: string }; userId?: string }>) => {
      const { channelId, messageId, emoji, userId } = action.payload;
      
      if (state.messages[channelId]) {
        const message = state.messages[channelId].find(m => m._id === messageId);
        if (message) {
          const reactionIndex = message.reactions.findIndex(
            r => r.emoji.name === emoji.name && r.emoji.id === emoji.id
          );
          
          if (reactionIndex !== -1) {
            const reaction = message.reactions[reactionIndex];
            
            if (userId) {
              reaction.users = reaction.users.filter(id => id !== userId);
              reaction.count = reaction.users.length;
              
              if (reaction.count === 0) {
                message.reactions.splice(reactionIndex, 1);
              }
            } else {
              message.reactions.splice(reactionIndex, 1);
            }
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state, action) => {
        if (action.meta.arg.before) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const { channelId, messages, hasMore } = action.payload;
        
        if (action.meta.arg.before) {
          // Prepend older messages
          state.messages[channelId] = [...messages, ...(state.messages[channelId] || [])];
        } else {
          // Set initial messages
          state.messages[channelId] = messages;
        }
        
        state.hasMore[channelId] = hasMore;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload as string;
      })
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const channelId = message.channel;
        
        if (!state.messages[channelId]) {
          state.messages[channelId] = [];
        }
        
        state.messages[channelId].push(message);
      })
      // Edit Message
      .addCase(editMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const channelId = message.channel;
        
        if (state.messages[channelId]) {
          const index = state.messages[channelId].findIndex(m => m._id === message._id);
          if (index !== -1) {
            state.messages[channelId][index] = message;
          }
        }
      })
      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { channelId, messageId } = action.payload;
        
        if (state.messages[channelId]) {
          state.messages[channelId] = state.messages[channelId].filter(m => m._id !== messageId);
        }
      });
  }
});

export const {
  clearError,
  addMessage,
  updateMessage,
  removeMessage,
  clearChannelMessages,
  addTypingUser,
  removeTypingUser,
  clearOldTypingUsers,
  updateMessageReaction,
  removeMessageReaction
} = messagesSlice.actions;

export default messagesSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface Channel {
  _id: string;
  name: string;
  type: number;
  topic?: string;
  server?: string;
  position: number;
  permissionOverwrites: any[];
  nsfw: boolean;
  lastMessageId?: string;
  bitrate?: number;
  userLimit?: number;
  rateLimitPerUser?: number;
  recipients?: string[];
  icon?: string;
  ownerId?: string;
  applicationId?: string;
  parentId?: string;
  lastPinTimestamp?: string;
  rtcRegion?: string;
  videoQualityMode?: number;
  messageCount?: number;
  memberCount?: number;
  threadMetadata?: any;
  member?: any;
  defaultAutoArchiveDuration?: number;
  permissions?: string;
  flags?: number;
  totalMessageSent?: number;
  availableTags?: any[];
  appliedTags?: string[];
  defaultReactionEmoji?: any;
  defaultThreadRateLimitPerUser?: number;
  defaultSortOrder?: number;
  defaultForumLayout?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChannelsState {
  channels: { [serverId: string]: Channel[] };
  dmChannels: Channel[];
  currentChannel: Channel | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChannelsState = {
  channels: {},
  dmChannels: [
    {
      _id: 'dm_1',
      name: 'Test',
      type: 1, // DM channel type
      position: 0,
      permissionOverwrites: [],
      nsfw: false,
      recipients: ['user_test'],
      lastMessageId: 'msg_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  currentChannel: null,
  loading: false,
  error: null
};

// Async thunks
export const fetchChannels = createAsyncThunk(
  'channels/fetchChannels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/channels');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channels');
    }
  }
);

export const fetchServerChannels = createAsyncThunk(
  'channels/fetchServerChannels',
  async (serverId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/servers/${serverId}/channels`);
      return { serverId, channels: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch channels';
      return rejectWithValue(message);
    }
  }
);

export const fetchDMChannels = createAsyncThunk(
  'channels/fetchDMChannels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/users/@me/channels');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch DM channels';
      return rejectWithValue(message);
    }
  }
);

export const fetchChannel = createAsyncThunk(
  'channels/fetchChannel',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/channels/${channelId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch channel';
      return rejectWithValue(message);
    }
  }
);

export const createChannel = createAsyncThunk(
  'channels/createChannel',
  async ({ serverId, channelData }: { serverId: string; channelData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/servers/${serverId}/channels`, channelData);
      toast.success('Channel created successfully!');
      return { serverId, channel: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create channel';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateChannel = createAsyncThunk(
  'channels/updateChannel',
  async ({ channelId, channelData }: { channelId: string; channelData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/channels/${channelId}`, channelData);
      toast.success('Channel updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update channel';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteChannel = createAsyncThunk(
  'channels/deleteChannel',
  async (channelId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/channels/${channelId}`);
      toast.success('Channel deleted successfully!');
      return channelId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete channel';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const createDMChannel = createAsyncThunk(
  'channels/createDMChannel',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/users/@me/channels', { recipientId: userId });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create DM channel';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const sendTyping = createAsyncThunk(
  'channels/sendTyping',
  async (channelId: string, { rejectWithValue }) => {
    try {
      await axios.post(`/channels/${channelId}/typing`);
      return channelId;
    } catch (error: any) {
      return rejectWithValue('Failed to send typing indicator');
    }
  }
);

export const getPinnedMessages = createAsyncThunk(
  'channels/getPinnedMessages',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/channels/${channelId}/pins`);
      return { channelId, messages: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch pinned messages';
      return rejectWithValue(message);
    }
  }
);

export const pinMessage = createAsyncThunk(
  'channels/pinMessage',
  async ({ channelId, messageId }: { channelId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await axios.put(`/channels/${channelId}/pins/${messageId}`);
      toast.success('Message pinned successfully!');
      return { channelId, messageId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to pin message';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const unpinMessage = createAsyncThunk(
  'channels/unpinMessage',
  async ({ channelId, messageId }: { channelId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`/channels/${channelId}/pins/${messageId}`);
      toast.success('Message unpinned successfully!');
      return { channelId, messageId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to unpin message';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setCurrentChannel: (state, action: PayloadAction<Channel | null>) => {
      state.currentChannel = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addChannel: (state, action: PayloadAction<{ serverId: string; channel: Channel }>) => {
      const { serverId, channel } = action.payload;
      if (!state.channels[serverId]) {
        state.channels[serverId] = [];
      }
      state.channels[serverId].push(channel);
    },
    updateChannelInList: (state, action: PayloadAction<Channel>) => {
      const channel = action.payload;
      
      // Update in server channels
      if (channel.server) {
        const serverChannels = state.channels[channel.server];
        if (serverChannels) {
          const index = serverChannels.findIndex(c => c._id === channel._id);
          if (index !== -1) {
            serverChannels[index] = channel;
          }
        }
      } else {
        // Update in DM channels
        const index = state.dmChannels.findIndex(c => c._id === channel._id);
        if (index !== -1) {
          state.dmChannels[index] = channel;
        }
      }
      
      // Update current channel if it's the same
      if (state.currentChannel?._id === channel._id) {
        state.currentChannel = channel;
      }
    },
    removeChannel: (state, action: PayloadAction<{ serverId?: string; channelId: string }>) => {
      const { serverId, channelId } = action.payload;
      
      if (serverId && state.channels[serverId]) {
        state.channels[serverId] = state.channels[serverId].filter(c => c._id !== channelId);
      } else {
        state.dmChannels = state.dmChannels.filter(c => c._id !== channelId);
      }
      
      if (state.currentChannel?._id === channelId) {
        state.currentChannel = null;
      }
    },
    addDMChannel: (state, action: PayloadAction<Channel>) => {
      const existingIndex = state.dmChannels.findIndex(c => c._id === action.payload._id);
      if (existingIndex === -1) {
        state.dmChannels.push(action.payload);
      }
    },
    updateChannelLastMessage: (state, action: PayloadAction<{ channelId: string; messageId: string }>) => {
      const { channelId, messageId } = action.payload;
      
      // Update in server channels
      Object.values(state.channels).forEach(serverChannels => {
        const channel = serverChannels.find(c => c._id === channelId);
        if (channel) {
          channel.lastMessageId = messageId;
        }
      });
      
      // Update in DM channels
      const dmChannel = state.dmChannels.find(c => c._id === channelId);
      if (dmChannel) {
        dmChannel.lastMessageId = messageId;
      }
      
      // Update current channel
      if (state.currentChannel?._id === channelId) {
        state.currentChannel.lastMessageId = messageId;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Server Channels
      .addCase(fetchServerChannels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServerChannels.fulfilled, (state, action) => {
        state.loading = false;
        const { serverId, channels } = action.payload;
        state.channels[serverId] = channels;
        state.error = null;
      })
      .addCase(fetchServerChannels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch DM Channels
      .addCase(fetchDMChannels.fulfilled, (state, action) => {
        state.dmChannels = action.payload;
      })
      // Fetch Channel
      .addCase(fetchChannel.fulfilled, (state, action) => {
        state.currentChannel = action.payload;
      })
      // Create Channel
      .addCase(createChannel.fulfilled, (state, action) => {
        const { serverId, channel } = action.payload;
        if (!state.channels[serverId]) {
          state.channels[serverId] = [];
        }
        state.channels[serverId].push(channel);
      })
      // Update Channel
      .addCase(updateChannel.fulfilled, (state, action) => {
        const channel = action.payload;
        
        if (channel.server) {
          const serverChannels = state.channels[channel.server];
          if (serverChannels) {
            const index = serverChannels.findIndex(c => c._id === channel._id);
            if (index !== -1) {
              serverChannels[index] = channel;
            }
          }
        } else {
          const index = state.dmChannels.findIndex(c => c._id === channel._id);
          if (index !== -1) {
            state.dmChannels[index] = channel;
          }
        }
        
        if (state.currentChannel?._id === channel._id) {
          state.currentChannel = channel;
        }
      })
      // Delete Channel
      .addCase(deleteChannel.fulfilled, (state, action) => {
        const channelId = action.payload;
        
        // Remove from server channels
        Object.keys(state.channels).forEach(serverId => {
          state.channels[serverId] = state.channels[serverId].filter(c => c._id !== channelId);
        });
        
        // Remove from DM channels
        state.dmChannels = state.dmChannels.filter(c => c._id !== channelId);
        
        if (state.currentChannel?._id === channelId) {
          state.currentChannel = null;
        }
      })
      // Create DM Channel
      .addCase(createDMChannel.fulfilled, (state, action) => {
        const existingIndex = state.dmChannels.findIndex(c => c._id === action.payload._id);
        if (existingIndex === -1) {
          state.dmChannels.push(action.payload);
        }
        state.currentChannel = action.payload;
      });
  }
});

export const {
  setCurrentChannel,
  clearError,
  addChannel,
  updateChannelInList,
  removeChannel,
  addDMChannel,
  updateChannelLastMessage
} = channelsSlice.actions;

export default channelsSlice.reducer;
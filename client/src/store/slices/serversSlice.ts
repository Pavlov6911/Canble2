import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface Server {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  splash?: string;
  discoverySplash?: string;
  owner: string;
  permissions?: string;
  region: string;
  afkChannelId?: string;
  afkTimeout: number;
  widgetEnabled: boolean;
  widgetChannelId?: string;
  verificationLevel: number;
  defaultMessageNotifications: number;
  explicitContentFilter: number;
  mfaLevel: number;
  applicationId?: string;
  systemChannelId?: string;
  systemChannelFlags: number;
  rulesChannelId?: string;
  maxPresences?: number;
  maxMembers?: number;
  vanityUrlCode?: string;
  premiumTier: number;
  premiumSubscriptionCount?: number;
  preferredLocale: string;
  publicUpdatesChannelId?: string;
  maxVideoChannelUsers?: number;
  approximateMemberCount?: number;
  approximatePresenceCount?: number;
  welcomeScreen?: any;
  nsfwLevel: number;
  stickers?: any[];
  premiumProgressBarEnabled: boolean;
  channels: string[];
  members: any[];
  roles: string[];
  emojis: any[];
  features: string[];
  invites: any[];
  bans: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ServerMember {
  _id: string;
  user: string;
  server: string;
  nick?: string;
  avatar?: string;
  roles: string[];
  joinedAt: string;
  premiumSince?: string;
  deaf: boolean;
  mute: boolean;
  flags: number;
  pending?: boolean;
  permissions?: string;
  communicationDisabledUntil?: string;
}

interface ServersState {
  servers: Server[];
  currentServer: Server | null;
  members: { [serverId: string]: ServerMember[] };
  loading: boolean;
  error: string | null;
}

const initialState: ServersState = {
  servers: [],
  currentServer: null,
  members: {},
  loading: false,
  error: null
};

// Async thunks
export const fetchServers = createAsyncThunk(
  'servers/fetchServers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/servers');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch servers';
      return rejectWithValue(message);
    }
  }
);

export const fetchServer = createAsyncThunk(
  'servers/fetchServer',
  async (serverId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/servers/${serverId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch server';
      return rejectWithValue(message);
    }
  }
);

export const createServer = createAsyncThunk(
  'servers/createServer',
  async (serverData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/servers', serverData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Server created successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create server';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateServer = createAsyncThunk(
  'servers/updateServer',
  async ({ serverId, serverData }: { serverId: string; serverData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/servers/${serverId}`, serverData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Server updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update server';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteServer = createAsyncThunk(
  'servers/deleteServer',
  async (serverId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/servers/${serverId}`);
      toast.success('Server deleted successfully!');
      return serverId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete server';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const joinServer = createAsyncThunk(
  'servers/joinServer',
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/servers/join/${inviteCode}`);
      toast.success('Joined server successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to join server';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const leaveServer = createAsyncThunk(
  'servers/leaveServer',
  async (serverId: string, { rejectWithValue }) => {
    try {
      await axios.post(`/servers/${serverId}/leave`);
      toast.success('Left server successfully!');
      return serverId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to leave server';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const createInvite = createAsyncThunk(
  'servers/createInvite',
  async ({ serverId, inviteData }: { serverId: string; inviteData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/servers/${serverId}/invites`, inviteData);
      toast.success('Invite created successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create invite';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchServerMembers = createAsyncThunk(
  'servers/fetchServerMembers',
  async (serverId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/servers/${serverId}/members`);
      return { serverId, members: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch server members';
      return rejectWithValue(message);
    }
  }
);

export const updateServerMember = createAsyncThunk(
  'servers/updateServerMember',
  async ({ serverId, userId, memberData }: { serverId: string; userId: string; memberData: any }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/servers/${serverId}/members/${userId}`, memberData);
      toast.success('Member updated successfully!');
      return { serverId, member: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const kickServerMember = createAsyncThunk(
  'servers/kickServerMember',
  async ({ serverId, userId }: { serverId: string; userId: string }, { rejectWithValue }) => {
    try {
      await axios.delete(`/servers/${serverId}/members/${userId}`);
      toast.success('Member kicked successfully!');
      return { serverId, userId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to kick member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const banServerMember = createAsyncThunk(
  'servers/banServerMember',
  async ({ serverId, userId, reason }: { serverId: string; userId: string; reason?: string }, { rejectWithValue }) => {
    try {
      await axios.post(`/servers/${serverId}/bans/${userId}`, { reason });
      toast.success('Member banned successfully!');
      return { serverId, userId };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to ban member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setCurrentServer: (state, action: PayloadAction<Server | null>) => {
      state.currentServer = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addServer: (state, action: PayloadAction<Server>) => {
      state.servers.push(action.payload);
    },
    updateServerInList: (state, action: PayloadAction<Server>) => {
      const index = state.servers.findIndex(server => server._id === action.payload._id);
      if (index !== -1) {
        state.servers[index] = action.payload;
      }
      if (state.currentServer?._id === action.payload._id) {
        state.currentServer = action.payload;
      }
    },
    removeServer: (state, action: PayloadAction<string>) => {
      state.servers = state.servers.filter(server => server._id !== action.payload);
      if (state.currentServer?._id === action.payload) {
        state.currentServer = null;
      }
      delete state.members[action.payload];
    },
    addMemberToServer: (state, action: PayloadAction<{ serverId: string; member: ServerMember }>) => {
      const { serverId, member } = action.payload;
      if (!state.members[serverId]) {
        state.members[serverId] = [];
      }
      state.members[serverId].push(member);
    },
    removeMemberFromServer: (state, action: PayloadAction<{ serverId: string; userId: string }>) => {
      const { serverId, userId } = action.payload;
      if (state.members[serverId]) {
        state.members[serverId] = state.members[serverId].filter(member => member.user !== userId);
      }
    },
    updateMemberInServer: (state, action: PayloadAction<{ serverId: string; member: ServerMember }>) => {
      const { serverId, member } = action.payload;
      if (state.members[serverId]) {
        const index = state.members[serverId].findIndex(m => m.user === member.user);
        if (index !== -1) {
          state.members[serverId][index] = member;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Servers
      .addCase(fetchServers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServers.fulfilled, (state, action) => {
        state.loading = false;
        state.servers = action.payload;
        state.error = null;
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Server
      .addCase(fetchServer.fulfilled, (state, action) => {
        state.currentServer = action.payload;
      })
      // Create Server
      .addCase(createServer.fulfilled, (state, action) => {
        state.servers.push(action.payload);
      })
      // Update Server
      .addCase(updateServer.fulfilled, (state, action) => {
        const index = state.servers.findIndex(server => server._id === action.payload._id);
        if (index !== -1) {
          state.servers[index] = action.payload;
        }
        if (state.currentServer?._id === action.payload._id) {
          state.currentServer = action.payload;
        }
      })
      // Delete Server
      .addCase(deleteServer.fulfilled, (state, action) => {
        state.servers = state.servers.filter(server => server._id !== action.payload);
        if (state.currentServer?._id === action.payload) {
          state.currentServer = null;
        }
        delete state.members[action.payload];
      })
      // Join Server
      .addCase(joinServer.fulfilled, (state, action) => {
        state.servers.push(action.payload);
      })
      // Leave Server
      .addCase(leaveServer.fulfilled, (state, action) => {
        state.servers = state.servers.filter(server => server._id !== action.payload);
        if (state.currentServer?._id === action.payload) {
          state.currentServer = null;
        }
        delete state.members[action.payload];
      })
      // Fetch Server Members
      .addCase(fetchServerMembers.fulfilled, (state, action) => {
        const { serverId, members } = action.payload;
        state.members[serverId] = members;
      })
      // Update Server Member
      .addCase(updateServerMember.fulfilled, (state, action) => {
        const { serverId, member } = action.payload;
        if (state.members[serverId]) {
          const index = state.members[serverId].findIndex(m => m.user === member.user);
          if (index !== -1) {
            state.members[serverId][index] = member;
          }
        }
      })
      // Kick Server Member
      .addCase(kickServerMember.fulfilled, (state, action) => {
        const { serverId, userId } = action.payload;
        if (state.members[serverId]) {
          state.members[serverId] = state.members[serverId].filter(member => member.user !== userId);
        }
      })
      // Ban Server Member
      .addCase(banServerMember.fulfilled, (state, action) => {
        const { serverId, userId } = action.payload;
        if (state.members[serverId]) {
          state.members[serverId] = state.members[serverId].filter(member => member.user !== userId);
        }
      });
  }
});

export const {
  setCurrentServer,
  clearError,
  addServer,
  updateServerInList,
  removeServer,
  addMemberToServer,
  removeMemberFromServer,
  updateMemberInServer
} = serversSlice.actions;

export default serversSlice.reducer;
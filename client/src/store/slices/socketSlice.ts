import { createSlice, createAsyncThunk, PayloadAction, current } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../store';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
}

const initialState: SocketState = {
  socket: null,
  connected: false,
  error: null
};

export const connectSocket = createAsyncThunk<Socket, void, { rejectValue: string }>(
  'socket/connect',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('No authentication token');
      }

      const socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      return new Promise<Socket>((resolve, reject) => {
        socket.on('connect', () => {
          resolve(socket);
        });

        socket.on('connect_error', (error) => {
          reject(error.message);
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
        });

        // Set up event listeners for real-time updates
        socket.on('message', (message) => {
          // Handle new message
          console.log('New message:', message);
        });

        socket.on('messageUpdate', (message) => {
          // Handle message update
          console.log('Message updated:', message);
        });

        socket.on('messageDelete', (messageId) => {
          // Handle message deletion
          console.log('Message deleted:', messageId);
        });

        socket.on('userStatusUpdate', (user) => {
          // Handle user status update
          console.log('User status updated:', user);
        });

        socket.on('serverUpdate', (server) => {
          // Handle server update
          console.log('Server updated:', server);
        });

        socket.on('channelUpdate', (channel) => {
          // Handle channel update
          console.log('Channel updated:', channel);
        });

        socket.on('typing', (data) => {
          // Handle typing indicator
          console.log('User typing:', data);
        });

        socket.on('stopTyping', (data) => {
          // Handle stop typing
          console.log('User stopped typing:', data);
        });

        socket.on('voiceStateUpdate', (voiceState) => {
          // Handle voice state update
          console.log('Voice state updated:', voiceState);
        });

        socket.on('presenceUpdate', (presence) => {
          // Handle presence update
          console.log('Presence updated:', presence);
        });

        socket.on('friendRequest', (request) => {
          // Handle friend request
          console.log('Friend request:', request);
        });

        socket.on('friendRequestAccepted', (friendship) => {
          // Handle friend request accepted
          console.log('Friend request accepted:', friendship);
        });

        socket.on('friendRemoved', (friendshipId) => {
          // Handle friend removed
          console.log('Friend removed:', friendshipId);
        });

        socket.on('serverMemberJoin', (member) => {
          // Handle server member join
          console.log('Member joined server:', member);
        });

        socket.on('serverMemberLeave', (data) => {
          // Handle server member leave
          console.log('Member left server:', data);
        });

        socket.on('serverMemberUpdate', (member) => {
          // Handle server member update
          console.log('Server member updated:', member);
        });

        socket.on('roleUpdate', (role) => {
          // Handle role update
          console.log('Role updated:', role);
        });

        socket.on('roleDelete', (roleId) => {
          // Handle role deletion
          console.log('Role deleted:', roleId);
        });

        socket.on('channelCreate', (channel) => {
          // Handle channel creation
          console.log('Channel created:', channel);
        });

        socket.on('channelDelete', (channelId) => {
          // Handle channel deletion
          console.log('Channel deleted:', channelId);
        });

        socket.on('inviteCreate', (invite) => {
          // Handle invite creation
          console.log('Invite created:', invite);
        });

        socket.on('inviteDelete', (inviteCode) => {
          // Handle invite deletion
          console.log('Invite deleted:', inviteCode);
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });
      });
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const disconnectSocket = createAsyncThunk(
  'socket/disconnect',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const socket = state.socket.socket;
    
    if (socket) {
      socket.disconnect();
    }
    
    return null;
  }
);

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      state.socket = action.payload as any;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectSocket.pending, (state) => {
        state.error = null;
      })
      .addCase(connectSocket.fulfilled, (state, action) => {
        state.socket = action.payload as any;
        state.connected = true;
        state.error = null;
      })
      .addCase(connectSocket.rejected, (state, action) => {
        state.socket = null;
        state.connected = false;
        state.error = action.payload as string;
      })
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.socket = null;
        state.connected = false;
        state.error = null;
      });
  }
});

export const { setSocket, setConnected, setError, clearError } = socketSlice.actions;
export default socketSlice.reducer;

// Socket event emitters
export const emitJoinServer = (socket: Socket, serverId: string) => {
  socket.emit('joinServer', serverId);
};

export const emitLeaveServer = (socket: Socket, serverId: string) => {
  socket.emit('leaveServer', serverId);
};

export const emitJoinChannel = (socket: Socket, channelId: string) => {
  socket.emit('joinChannel', channelId);
};

export const emitLeaveChannel = (socket: Socket, channelId: string) => {
  socket.emit('leaveChannel', channelId);
};

export const emitTyping = (socket: Socket, channelId: string) => {
  socket.emit('typing', { channelId });
};

export const emitStopTyping = (socket: Socket, channelId: string) => {
  socket.emit('stopTyping', { channelId });
};

export const emitVoiceStateUpdate = (socket: Socket, voiceState: any) => {
  socket.emit('voiceStateUpdate', voiceState);
};

export const emitPresenceUpdate = (socket: Socket, presence: any) => {
  socket.emit('presenceUpdate', presence);
};
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User } from './authSlice';

export interface Friend {
  _id: string;
  user: User;
  status: 'pending' | 'accepted' | 'blocked';
  type: 'incoming' | 'outgoing' | 'friend';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  mutualServers?: string[];
  mutualFriends?: string[];
  note?: string;
}

interface UsersState {
  users: { [userId: string]: User };
  friends: Friend[];
  blockedUsers: User[];
  pendingRequests: Friend[];
  searchResults: User[];
  currentUserProfile: UserProfile | null;
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: {},
  friends: [],
  blockedUsers: [],
  pendingRequests: [],
  searchResults: [],
  currentUserProfile: null,
  loading: false,
  searchLoading: false,
  error: null
};

// Async thunks
export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to search users';
      return rejectWithValue(message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'users/getUserProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch user profile';
      return rejectWithValue(message);
    }
  }
);

export const getFriends = createAsyncThunk(
  'users/getFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/users/@me/friends');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch friends';
      return rejectWithValue(message);
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'users/sendFriendRequest',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/users/@me/friends', { username });
      toast.success('Friend request sent!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send friend request';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'users/acceptFriendRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/users/@me/friends/${requestId}`, { status: 'accepted' });
      toast.success('Friend request accepted!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to accept friend request';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const declineFriendRequest = createAsyncThunk(
  'users/declineFriendRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/users/@me/friends/${requestId}`);
      toast.success('Friend request declined');
      return requestId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to decline friend request';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeFriend = createAsyncThunk(
  'users/removeFriend',
  async (friendId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/users/@me/friends/${friendId}`);
      toast.success('Friend removed');
      return friendId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove friend';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const blockUser = createAsyncThunk(
  'users/blockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/users/@me/blocked`, { userId });
      toast.success('User blocked');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to block user';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const unblockUser = createAsyncThunk(
  'users/unblockUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/users/@me/blocked/${userId}`);
      toast.success('User unblocked');
      return userId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to unblock user';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getBlockedUsers = createAsyncThunk(
  'users/getBlockedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/users/@me/blocked');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch blocked users';
      return rejectWithValue(message);
    }
  }
);

export const updateUserNote = createAsyncThunk(
  'users/updateUserNote',
  async ({ userId, note }: { userId: string; note: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/users/${userId}/note`, { note });
      return { userId, note: response.data.note };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update note';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'users/uploadAvatar',
  async (avatarFile: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await axios.post('/users/@me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Avatar updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload avatar';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const uploadBanner = createAsyncThunk(
  'users/uploadBanner',
  async (bannerFile: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);
      
      const response = await axios.post('/users/@me/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Banner updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload banner';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'users/updateUserSettings',
  async (settings: any, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/users/@me/settings', settings);
      toast.success('Settings updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update settings';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users[action.payload._id] = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.users[user._id] = user;
      
      // Update user in friends list
      const friendIndex = state.friends.findIndex(f => f.user._id === user._id);
      if (friendIndex !== -1) {
        state.friends[friendIndex].user = user;
      }
      
      // Update user in search results
      const searchIndex = state.searchResults.findIndex(u => u._id === user._id);
      if (searchIndex !== -1) {
        state.searchResults[searchIndex] = user;
      }
      
      // Update current user profile
      if (state.currentUserProfile?._id === user._id) {
        state.currentUserProfile = { ...state.currentUserProfile, ...user };
      }
    },
    addFriend: (state, action: PayloadAction<Friend>) => {
      const friend = action.payload;
      const existingIndex = state.friends.findIndex(f => f._id === friend._id);
      
      if (existingIndex !== -1) {
        state.friends[existingIndex] = friend;
      } else {
        state.friends.push(friend);
      }
      
      // Remove from pending requests if it was there
      state.pendingRequests = state.pendingRequests.filter(r => r._id !== friend._id);
    },
    removeFriendById: (state, action: PayloadAction<string>) => {
      const friendId = action.payload;
      state.friends = state.friends.filter(f => f._id !== friendId);
      state.pendingRequests = state.pendingRequests.filter(r => r._id !== friendId);
    },
    addPendingRequest: (state, action: PayloadAction<Friend>) => {
      const request = action.payload;
      const existingIndex = state.pendingRequests.findIndex(r => r._id === request._id);
      
      if (existingIndex !== -1) {
        state.pendingRequests[existingIndex] = request;
      } else {
        state.pendingRequests.push(request);
      }
    },
    removePendingRequest: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      state.pendingRequests = state.pendingRequests.filter(r => r._id !== requestId);
    },
    updateUserStatus: (state, action: PayloadAction<{ userId: string; status: string; customStatus?: string }>) => {
      const { userId, status, customStatus } = action.payload;
      
      if (state.users[userId]) {
        state.users[userId].status = status as any;
        if (customStatus !== undefined) {
          state.users[userId].customStatus = customStatus;
        }
      }
      
      // Update in friends list
      const friendIndex = state.friends.findIndex(f => f.user._id === userId);
      if (friendIndex !== -1) {
        state.friends[friendIndex].user.status = status as any;
        if (customStatus !== undefined) {
          state.friends[friendIndex].user.customStatus = customStatus;
        }
      }
    },
    setUserNote: (state, action: PayloadAction<{ userId: string; note: string }>) => {
      const { userId, note } = action.payload;
      
      if (state.currentUserProfile?._id === userId) {
        state.currentUserProfile.note = note;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
        
        // Add users to users cache
        action.payload.forEach((user: User) => {
          state.users[user._id] = user;
        });
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
      })
      // Get User Profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUserProfile = action.payload;
        state.users[action.payload._id] = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Friends
      .addCase(getFriends.fulfilled, (state, action) => {
        const friendsData = action.payload;
        state.friends = friendsData.filter((f: Friend) => f.status === 'accepted');
        state.pendingRequests = friendsData.filter((f: Friend) => f.status === 'pending');
        
        // Add users to cache
        friendsData.forEach((friend: Friend) => {
          state.users[friend.user._id] = friend.user;
        });
      })
      // Send Friend Request
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.pendingRequests.push(action.payload);
        state.users[action.payload.user._id] = action.payload.user;
      })
      // Accept Friend Request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const friend = action.payload;
        state.friends.push(friend);
        state.pendingRequests = state.pendingRequests.filter(r => r._id !== friend._id);
        state.users[friend.user._id] = friend.user;
      })
      // Decline Friend Request
      .addCase(declineFriendRequest.fulfilled, (state, action) => {
        const requestId = action.payload;
        state.pendingRequests = state.pendingRequests.filter(r => r._id !== requestId);
      })
      // Remove Friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        const friendId = action.payload;
        state.friends = state.friends.filter(f => f._id !== friendId);
      })
      // Block User
      .addCase(blockUser.fulfilled, (state, action) => {
        const user = action.payload;
        state.blockedUsers.push(user);
        
        // Remove from friends if they were a friend
        state.friends = state.friends.filter(f => f.user._id !== user._id);
        state.pendingRequests = state.pendingRequests.filter(r => r.user._id !== user._id);
      })
      // Unblock User
      .addCase(unblockUser.fulfilled, (state, action) => {
        const userId = action.payload;
        state.blockedUsers = state.blockedUsers.filter(u => u._id !== userId);
      })
      // Get Blocked Users
      .addCase(getBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload;
        
        // Add users to cache
        action.payload.forEach((user: User) => {
          state.users[user._id] = user;
        });
      })
      // Update User Note
      .addCase(updateUserNote.fulfilled, (state, action) => {
        const { userId, note } = action.payload;
        
        if (state.currentUserProfile?._id === userId) {
          state.currentUserProfile.note = note;
        }
      });
  }
});

export const {
  clearError,
  clearSearchResults,
  addUser,
  updateUser,
  addFriend,
  removeFriendById,
  addPendingRequest,
  removePendingRequest,
  updateUserStatus,
  setUserNote
} = usersSlice.actions;

export default usersSlice.reducer;
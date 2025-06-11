import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Group {
  _id: string;
  name: string;
  description: string;
  type: 'community' | 'private';
  icon?: string;
  banner?: string;
  owner: {
    _id: string;
    username: string;
    avatar?: string;
  };
  members: Array<{
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    joinedAt: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    nickname?: string;
  }>;
  memberCount: number;
  isPublic: boolean;
  requireApproval: boolean;
  allowInvites: boolean;
  memberLimit?: number;
  category: string;
  tags: string[];
  vanityUrl?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  loading: boolean;
  error: string | null;
  joinRequests: Array<{
    _id: string;
    group: string;
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  }>;
}

const initialState: GroupsState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null,
  joinRequests: []
};

// Async thunks
export const fetchUserGroups = createAsyncThunk(
  'groups/fetchUserGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/groups/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      return data.groups;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: groupData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create group');
      }
      
      const data = await response.json();
      return data.group;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinGroup = createAsyncThunk(
  'groups/joinGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join group');
      }
      
      const data = await response.json();
      return data.group;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinGroupByInvite = createAsyncThunk(
  'groups/joinGroupByInvite',
  async (inviteCode: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/groups/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid invite code');
      }
      
      const data = await response.json();
      return data.group;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to leave group');
      }
      
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchGroups = createAsyncThunk(
  'groups/searchGroups',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/groups/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search groups');
      }
      
      const data = await response.json();
      return data.groups;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJoinRequests = createAsyncThunk(
  'groups/fetchJoinRequests',
  async (groupId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch join requests');
      }
      
      const data = await response.json();
      return data.requests;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setCurrentGroup: (state, action: PayloadAction<Group | null>) => {
      state.currentGroup = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateGroupMember: (state, action: PayloadAction<{ groupId: string; userId: string; updates: any }>) => {
      const { groupId, userId, updates } = action.payload;
      
      // Update in groups array
      const groupIndex = state.groups.findIndex(g => g._id === groupId);
      if (groupIndex !== -1) {
        const memberIndex = state.groups[groupIndex].members.findIndex(m => m.user._id === userId);
        if (memberIndex !== -1) {
          state.groups[groupIndex].members[memberIndex] = {
            ...state.groups[groupIndex].members[memberIndex],
            ...updates
          };
        }
      }
      
      // Update current group if it matches
      if (state.currentGroup?._id === groupId) {
        const memberIndex = state.currentGroup.members.findIndex(m => m.user._id === userId);
        if (memberIndex !== -1) {
          state.currentGroup.members[memberIndex] = {
            ...state.currentGroup.members[memberIndex],
            ...updates
          };
        }
      }
    },
    removeMemberFromGroup: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
      const { groupId, userId } = action.payload;
      
      // Remove from groups array
      const groupIndex = state.groups.findIndex(g => g._id === groupId);
      if (groupIndex !== -1) {
        state.groups[groupIndex].members = state.groups[groupIndex].members.filter(m => m.user._id !== userId);
        state.groups[groupIndex].memberCount = state.groups[groupIndex].members.length;
      }
      
      // Remove from current group if it matches
      if (state.currentGroup?._id === groupId) {
        state.currentGroup.members = state.currentGroup.members.filter(m => m.user._id !== userId);
        state.currentGroup.memberCount = state.currentGroup.members.length;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user groups
      .addCase(fetchUserGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.push(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Join group
      .addCase(joinGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.loading = false;
        const existingGroup = state.groups.find(g => g._id === action.payload._id);
        if (!existingGroup) {
          state.groups.push(action.payload);
        }
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Join group by invite
      .addCase(joinGroupByInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinGroupByInvite.fulfilled, (state, action) => {
        state.loading = false;
        const existingGroup = state.groups.find(g => g._id === action.payload._id);
        if (!existingGroup) {
          state.groups.push(action.payload);
        }
      })
      .addCase(joinGroupByInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Leave group
      .addCase(leaveGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = state.groups.filter(g => g._id !== action.payload);
        if (state.currentGroup?._id === action.payload) {
          state.currentGroup = null;
        }
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch join requests
      .addCase(fetchJoinRequests.fulfilled, (state, action) => {
        state.joinRequests = action.payload;
      });
  }
});

export const {
  setCurrentGroup,
  clearError,
  updateGroupMember,
  removeMemberFromGroup
} = groupsSlice.actions;

export default groupsSlice.reducer;
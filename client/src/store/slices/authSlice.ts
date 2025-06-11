import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Add request interceptor to include token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  username: string;
  discriminator: string;
  email: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  customStatus?: string;
  verified: boolean;
  mfaEnabled: boolean;
  locale: string;
  flags: number;
  premiumType: number;
  publicFlags: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return { token, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      toast.success('Account created successfully!');
      return { token, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Check if this is a dev token (mock token)
      if (token.startsWith('dev-token-')) {
        // Return the mock DEV user for dev tokens
        const devUser: User = {
          _id: 'dev-user-123',
          username: 'DEV',
          discriminator: '0001',
          email: 'dev@canble.com',
          avatar: undefined,
          banner: undefined,
          bio: undefined,
          status: 'online',
          customStatus: undefined,
          verified: true,
          mfaEnabled: false,
          locale: 'en-US',
          flags: 0,
          premiumType: 0,
          publicFlags: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { token, user: devUser };
      }
      
      // For real tokens, make API call
      const response = await axios.get('/auth/me');
      return { token, user: response.data };
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue('Authentication failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/auth/logout');
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      return null;
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue('Logout failed');
    }
  }
);

export const directLogin = createAsyncThunk(
  'auth/directLogin',
  async (_, { rejectWithValue }) => {
    try {
      // Create a mock DEV user for development mode
      const devUser: User = {
        _id: 'dev-user-123',
        username: 'DEV',
        discriminator: '0001',
        email: 'dev@canble.com',
        avatar: undefined,
        banner: undefined,
        bio: undefined,
        status: 'online',
        customStatus: undefined,
        verified: true,
        mfaEnabled: false,
        locale: 'en-US',
        flags: 0,
        premiumType: 0,
        publicFlags: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create a mock token for development
      const devToken = 'dev-token-' + Date.now();
      
      // Store token in localStorage
      localStorage.setItem('token', devToken);
      
      toast.success('Logged in as DEV user!');
      return { token: devToken, user: devUser };
    } catch (error: any) {
      const message = 'Direct login failed';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateStatus = createAsyncThunk(
  'auth/updateStatus',
  async (status: { status: string; customStatus?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/auth/status', status);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/auth/profile', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = null;
      })
      // Direct Login
      .addCase(directLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(directLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(directLogin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      // Update Status
      .addCase(updateStatus.fulfilled, (state, action) => {
        if (state.user) {
          state.user.status = action.payload.status;
          state.user.customStatus = action.payload.customStatus;
        }
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
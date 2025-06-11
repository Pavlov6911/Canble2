import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Modal {
  type: string;
  data?: any;
  isOpen: boolean;
}

export interface ContextMenu {
  type: string;
  data?: any;
  position: { x: number; y: number };
  isOpen: boolean;
}

interface UIState {
  // Sidebar states
  sidebarCollapsed: boolean;
  memberListCollapsed: boolean;
  
  // Direct Message category
  selectedDMCategory: 'friends' | 'drft' | 'drift-king' | 'direct-messages' | null;
  
  // Modal states
  modals: { [key: string]: Modal };
  
  // Context menu
  contextMenu: ContextMenu | null;
  
  // Theme and appearance
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  messageDisplayCompact: boolean;
  
  // Notification settings
  notifications: {
    desktop: boolean;
    sounds: boolean;
    badge: boolean;
  };
  
  // Voice and video settings
  voice: {
    inputDevice?: string;
    outputDevice?: string;
    inputVolume: number;
    outputVolume: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    automaticGainControl: boolean;
    pushToTalk: boolean;
    pushToTalkKey?: string;
    voiceActivityDetection: boolean;
    inputSensitivity: number;
  };
  
  // Voice state
  voiceState: {
    channelId: string | null;
    channelName: string | null;
    serverId: string | null;
    isConnected: boolean;
  };
  isMuted: boolean;
  isDeafened: boolean;
  isVideoEnabled: boolean;
  
  // Privacy settings
  privacy: {
    directMessages: 'everyone' | 'friends' | 'none';
    serverMessages: 'everyone' | 'friends' | 'none';
    friendRequests: 'everyone' | 'friends_of_friends' | 'none';
    readReceipts: boolean;
    typingIndicators: boolean;
  };
  
  // Accessibility
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
  
  // Loading states
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  
  // Error states
  errors: {
    [key: string]: string | null;
  };
  
  // Connection status
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  
  // Current view
  currentView: 'servers' | 'friends' | 'library' | 'store';
  
  // Search
  searchQuery: string;
  searchResults: any[];
  searchLoading: boolean;
  
  // User status
  userStatus: 'online' | 'idle' | 'dnd' | 'invisible';
  customStatus: string;
  
  // Window focus
  windowFocused: boolean;
  
  // Mobile responsive
  isMobile: boolean;
  mobileMenuOpen: boolean;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  memberListCollapsed: false,
  selectedDMCategory: null,
  modals: {},
  contextMenu: null,
  theme: 'dark',
  fontSize: 'medium',
  messageDisplayCompact: false,
  notifications: {
    desktop: true,
    sounds: true,
    badge: true
  },
  voice: {
    inputVolume: 100,
    outputVolume: 100,
    echoCancellation: true,
    noiseSuppression: true,
    automaticGainControl: true,
    pushToTalk: false,
    voiceActivityDetection: true,
    inputSensitivity: 50
  },
  voiceState: {
    channelId: null,
    channelName: null,
    serverId: null,
    isConnected: false
  },
  isMuted: false,
  isDeafened: false,
  isVideoEnabled: false,
  privacy: {
    directMessages: 'friends',
    serverMessages: 'everyone',
    friendRequests: 'everyone',
    readReceipts: true,
    typingIndicators: true
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
    keyboardNavigation: false
  },
  loading: {
    global: false
  },
  errors: {},
  connectionStatus: 'disconnected',
  currentView: 'servers',
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  userStatus: 'online',
  customStatus: '',
  windowFocused: true,
  isMobile: false,
  mobileMenuOpen: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMemberList: (state) => {
      state.memberListCollapsed = !state.memberListCollapsed;
    },
    setMemberListCollapsed: (state, action: PayloadAction<boolean>) => {
      state.memberListCollapsed = action.payload;
    },
    
    // DM Category actions
    setSelectedDMCategory: (state, action: PayloadAction<'friends' | 'drft' | 'drift-king' | 'direct-messages' | null>) => {
      state.selectedDMCategory = action.payload;
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      const { type, data } = action.payload;
      state.modals[type] = {
        type,
        data,
        isOpen: true
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const modalType = action.payload;
      if (state.modals[modalType]) {
        state.modals[modalType].isOpen = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key].isOpen = false;
      });
    },
    
    // Context menu actions
    openContextMenu: (state, action: PayloadAction<{ type: string; data?: any; position: { x: number; y: number } }>) => {
      const { type, data, position } = action.payload;
      state.contextMenu = {
        type,
        data,
        position,
        isOpen: true
      };
    },
    closeContextMenu: (state) => {
      state.contextMenu = null;
    },
    
    // Theme and appearance
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    setMessageDisplayCompact: (state, action: PayloadAction<boolean>) => {
      state.messageDisplayCompact = action.payload;
    },
    
    // Notification settings
    updateNotificationSettings: (state, action: PayloadAction<Partial<UIState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    
    // Voice settings
    updateVoiceSettings: (state, action: PayloadAction<Partial<UIState['voice']>>) => {
      state.voice = { ...state.voice, ...action.payload };
    },
    
    // Voice actions
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
      if (state.isMuted) {
        state.isDeafened = false;
      }
    },
    
    toggleDeafen: (state) => {
      state.isDeafened = !state.isDeafened;
      if (state.isDeafened) {
        state.isMuted = true;
      }
    },
    
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },
    
    joinVoiceChannel: (state, action: PayloadAction<{ channelId: string; channelName: string; serverId?: string }>) => {
      state.voiceState = {
        channelId: action.payload.channelId,
        channelName: action.payload.channelName,
        serverId: action.payload.serverId || null,
        isConnected: true
      };
    },
    
    leaveVoiceChannel: (state) => {
      state.voiceState = {
        channelId: null,
        channelName: null,
        serverId: null,
        isConnected: false
      };
      state.isMuted = false;
      state.isDeafened = false;
      state.isVideoEnabled = false;
    },
    
    // Privacy settings
    updatePrivacySettings: (state, action: PayloadAction<Partial<UIState['privacy']>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },
    
    // Accessibility settings
    updateAccessibilitySettings: (state, action: PayloadAction<Partial<UIState['accessibility']>>) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    // Error states
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.errors[key];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    
    // Connection status
    setConnectionStatus: (state, action: PayloadAction<UIState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    
    // Current view
    setCurrentView: (state, action: PayloadAction<UIState['currentView']>) => {
      state.currentView = action.payload;
    },
    
    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.searchLoading = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.searchLoading = false;
    },
    
    // User status
    setUserStatus: (state, action: PayloadAction<UIState['userStatus']>) => {
      state.userStatus = action.payload;
    },
    setCustomStatus: (state, action: PayloadAction<string>) => {
      state.customStatus = action.payload;
    },
    
    // Window focus
    setWindowFocused: (state, action: PayloadAction<boolean>) => {
      state.windowFocused = action.payload;
    },
    
    // Mobile responsive
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    // Bulk settings update
    updateSettings: (state, action: PayloadAction<Partial<UIState>>) => {
      return { ...state, ...action.payload };
    },
    
    // Reset to defaults
    resetSettings: (state) => {
      state.theme = initialState.theme;
      state.fontSize = initialState.fontSize;
      state.messageDisplayCompact = initialState.messageDisplayCompact;
      state.notifications = { ...initialState.notifications };
      state.voice = { ...initialState.voice };
      state.privacy = { ...initialState.privacy };
      state.accessibility = { ...initialState.accessibility };
    }
  }
});

export const {
  // UI state actions
  setSidebarCollapsed,
  setMemberListCollapsed,
  toggleSidebar,
  toggleMemberList,
  setSelectedDMCategory,
  setIsMobile,
  setMobileMenuOpen,
  toggleMobileMenu,
  
  // Modal and context menu actions
  openModal,
  closeModal,
  closeAllModals,
  openContextMenu,
  closeContextMenu,
  
  // Theme and appearance actions
  setTheme,
  setFontSize,
  setMessageDisplayCompact,
  
  // Notification actions
  updateNotificationSettings,
  
  // Voice and video actions
  updateVoiceSettings,
  toggleMute,
  toggleDeafen,
  toggleVideo,
  joinVoiceChannel,
  leaveVoiceChannel,
  
  // Privacy actions
  updatePrivacySettings,
  
  // Accessibility actions
  updateAccessibilitySettings,
  
  // Loading and error actions
  setLoading,
  setGlobalLoading,
  setError,
  clearError,
  clearAllErrors,
  
  // Connection actions
  setConnectionStatus,
  
  // View actions
  setCurrentView,
  
  // Search actions
  setSearchQuery,
  setSearchResults,
  setSearchLoading,
  clearSearch,
  
  // User status actions
  setUserStatus,
  setCustomStatus,
  
  // Window actions
  setWindowFocused,
  
  // Settings actions
  updateSettings,
  resetSettings
} = uiSlice.actions;

export default uiSlice.reducer;
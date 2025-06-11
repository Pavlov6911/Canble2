import React, { useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { connectSocket } from '../../store/slices/socketSlice';
import { fetchServers } from '../../store/slices/serversSlice';
import { fetchServerChannels } from '../../store/slices/channelsSlice';
import { fetchUserGroups } from '../../store/slices/groupsSlice';
import { setIsMobile } from '../../store/slices/uiSlice';
import ServerSidebar from './ServerSidebar';
import ChannelSidebar from './ChannelSidebar';
import ChatArea from './ChatArea';
import MemberList from './MemberList';
import UserPanel from './UserPanel';
import VoicePanel from './VoicePanel';
import HomeScreen from '../Home/HomeScreen';

const LayoutContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  minHeight: '600px',
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
  overflow: 'hidden',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    minHeight: '500px'
  }
}));

const ContentArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'row'
  }
}));

const MainContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  position: 'relative',
  overflow: 'hidden'
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}));

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  
  const {
    user,
    token
  } = useAppSelector((state) => state.auth);
  
  const {
    connected
  } = useAppSelector((state) => state.socket);
  
  const {
    currentServer
  } = useAppSelector((state) => state.servers);
  
  const {
    currentChannel
  } = useAppSelector((state) => state.channels);
  
  const {
    sidebarCollapsed,
    memberListCollapsed,
    voiceState,
    selectedDMCategory
  } = useAppSelector((state) => state.ui);

  useEffect(() => {
    dispatch(setIsMobile(isMobile));
  }, [isMobile, dispatch]);

  useEffect(() => {
    if (token && !connected) {
      dispatch(connectSocket());
    }
  }, [token, connected, dispatch]);

  useEffect(() => {
    if (user && connected) {
      dispatch(fetchServers());
    }
  }, [user, connected, dispatch]);

  useEffect(() => {
    if (currentServer) {
      if (currentServer?._id) {
        dispatch(fetchServerChannels(currentServer._id));
      }
    }
  }, [currentServer, dispatch]);

  if (!user) {
    return null;
  }

  return (
    <LayoutContainer>
      {/* Server Sidebar */}
      <ServerSidebar />
      
      <ContentArea>
        {/* Channel Sidebar - Show when a server is selected OR when no server is selected (for DMs) */}
        {!sidebarCollapsed && (
          <ChannelSidebar />
        )}
        
        <MainContent>
          {/* Voice Panel */}
          {voiceState.channelId && (
            <VoicePanel />
          )}
          
          {/* Show HomeScreen when no server is selected AND no DM category is selected, otherwise show ChatArea */}
          {!currentServer && !selectedDMCategory ? (
            <HomeScreen />
          ) : (
            <ChatContainer>
              {/* Chat Area */}
              <ChatArea />
              
              {/* Member List */}
              {!memberListCollapsed && !isMobile && currentChannel?.type === 0 && (
                <MemberList />
              )}
            </ChatContainer>
          )}
        </MainContent>
      </ContentArea>
      
      {/* User Panel - Positioned at bottom left */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 72,
        zIndex: 1000
      }}>
        <UserPanel />
      </Box>
    </LayoutContainer>
  );
};

export default MainLayout;
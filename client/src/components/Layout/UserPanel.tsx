import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Badge
} from '@mui/material';
import {
  Mic,
  MicOff,
  Headset,
  HeadsetOff,
  Settings,
  ExitToApp,
  Person,
  Notifications,
  DarkMode,
  LightMode,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout, updateStatus } from '../../store/slices/authSlice';
import { setTheme, toggleMute, toggleDeafen } from '../../store/slices/uiSlice';
import UserSettingsDialog from '../Dialogs/UserSettingsDialog';

const UserPanelContainer = styled(Box)(({ theme }) => ({
  width: 240,
  minWidth: 240,
  maxWidth: 240,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1, 1, 0, 0),
  padding: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  backdropFilter: 'blur(10px)',
  boxShadow: theme.shadows[8],
  [theme.breakpoints.down('md')]: {
    width: 240,
    minWidth: 200,
    padding: theme.spacing(1)
  },
  [theme.breakpoints.down('sm')]: {
    width: 200,
    minWidth: 180,
    padding: theme.spacing(0.5)
  }
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1.5),
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4]
  }
}));

const UserDetails = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  marginLeft: theme.spacing(1)
}));

const UserControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5)
}));

const StatusBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'status'
})<{ status: string }>(({ theme, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return theme.palette.success.main;
      case 'idle': return theme.palette.warning.main;
      case 'dnd': return theme.palette.error.main;
      case 'invisible': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return {
    '& .MuiBadge-badge': {
      backgroundColor: getStatusColor(),
      color: getStatusColor(),
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      width: 12,
      height: 12,
      borderRadius: '50%',
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '1px solid currentColor',
        content: '""'
      }
    }
  };
});

const VoicePanel = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.success.dark,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const UserPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { user } = useAppSelector((state) => state.auth);
  const { 
    theme, 
    isMuted, 
    isDeafened, 
    voiceState 
  } = useAppSelector((state) => state.ui);

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleStatusChange = (status: string) => {
    dispatch(updateStatus({ status }));
    handleCloseUserMenu();
  };

  const handleLogout = () => {
    dispatch(logout());
    handleCloseUserMenu();
  };

  const handleToggleMute = () => {
    dispatch(toggleMute());
  };

  const handleToggleDeafen = () => {
    dispatch(toggleDeafen());
  };

  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Away';
      case 'dnd': return 'Do Not Disturb';
      case 'invisible': return 'Invisible';
      default: return 'Online';
    }
  };

  const getStatusIcon = (status: string) => {
    const size = 8;
    const color = {
      online: '#43b581',
      idle: '#faa61a',
      dnd: '#f04747',
      invisible: '#747f8d'
    }[status] || '#43b581';

    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          mr: 1
        }}
      />
    );
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <UserPanelContainer>
        {/* Voice Connection Panel */}
        {voiceState.channelId && (
          <VoicePanel>
            <Box>
              <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                Voice Connected
              </Typography>
              <Typography variant="body2" color="white" fontWeight="bold" noWrap>
                {voiceState.channelName}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => console.log('Disconnect voice')}
            >
              <VolumeOff fontSize="small" />
            </IconButton>
          </VoicePanel>
        )}

        {/* User Info */}
        <UserInfo onClick={handleUserMenuClick}>
          <StatusBadge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            status={user.status || 'online'}
          >
            <Avatar
              src={user.avatar}
              sx={{ width: 32, height: 32 }}
            >
              {user.username[0].toUpperCase()}
            </Avatar>
          </StatusBadge>
          
          <UserDetails>
            <Typography
              variant="body2"
              fontWeight="bold"
              color="text.primary"
              noWrap
            >
              {user.username}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
            >
              #{user.discriminator || '0001'}
            </Typography>
          </UserDetails>

          <UserControls>
            <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
              <IconButton
                size="small"
                color={isMuted ? 'error' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMute();
                }}
              >
                {isMuted ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isDeafened ? 'Undeafen' : 'Deafen'}>
              <IconButton
                size="small"
                color={isDeafened ? 'error' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleDeafen();
                }}
              >
                {isDeafened ? <HeadsetOff fontSize="small" /> : <Headset fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="User Settings">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                }}
              >
                <Settings fontSize="small" />
              </IconButton>
            </Tooltip>
          </UserControls>
        </UserInfo>
      </UserPanelContainer>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleCloseUserMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        {/* Status Options */}
        <MenuItem onClick={() => handleStatusChange('online')}>
          <ListItemIcon>
            {getStatusIcon('online')}
          </ListItemIcon>
          <ListItemText>Online</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleStatusChange('idle')}>
          <ListItemIcon>
            {getStatusIcon('idle')}
          </ListItemIcon>
          <ListItemText>Away</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleStatusChange('dnd')}>
          <ListItemIcon>
            {getStatusIcon('dnd')}
          </ListItemIcon>
          <ListItemText>Do Not Disturb</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleStatusChange('invisible')}>
          <ListItemIcon>
            {getStatusIcon('invisible')}
          </ListItemIcon>
          <ListItemText>Invisible</ListItemText>
        </MenuItem>
        
        <Divider />
        
        {/* Profile */}
        <MenuItem onClick={handleCloseUserMenu}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        {/* Settings */}
        <MenuItem onClick={() => { setSettingsOpen(true); handleCloseUserMenu(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        {/* Theme Toggle */}
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {theme === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        {/* Logout */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* Settings Dialog */}
      <UserSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default UserPanel;
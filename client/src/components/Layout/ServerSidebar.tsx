import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog
} from '@mui/material';
import {
  Add,
  Explore,
  Download,
  Settings,
  ExitToApp,
  Home,
  Notifications,
  NotificationsOff,
  Group,
  GroupAdd
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setCurrentServer } from '../../store/slices/serversSlice';
import { logout } from '../../store/slices/authSlice';
import { setCurrentGroup, fetchUserGroups } from '../../store/slices/groupsSlice';
import CreateServerDialog from '../Dialogs/CreateServerDialog';
import JoinServerDialog from '../Dialogs/JoinServerDialog';
import CreateGroupDialog from '../Dialogs/CreateGroupDialog';
import JoinGroupDialog from '../Dialogs/JoinGroupDialog';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 72,
  minWidth: 72,
  maxWidth: 72,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  overflowY: 'auto',
  borderRight: `1px solid ${theme.palette.divider}`,
  backdropFilter: 'blur(10px)',
  flexShrink: 0,
  '&::-webkit-scrollbar': {
    width: 0
  },
  [theme.breakpoints.down('sm')]: {
    width: 60,
    minWidth: 60
  }
}));

const ServerButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  width: 48,
  height: 48,
  margin: theme.spacing(0.5, 0),
  borderRadius: isActive ? '16px' : '24px',
  background: isActive 
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
    : theme.palette.background.paper,
  color: isActive ? 'white' : theme.palette.text.secondary,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  border: `2px solid ${isActive ? 'transparent' : theme.palette.divider}`,
  boxShadow: isActive ? '0 8px 25px rgba(99, 102, 241, 0.3)' : 'none',
  '&:hover': {
    borderRadius: '16px',
    background: isActive 
      ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    color: 'white',
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 12px 30px rgba(99, 102, 241, 0.4)'
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
    transition: 'all 0.1s ease'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -12,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 4,
    height: isActive ? 40 : 0,
    background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    borderRadius: '0 2px 2px 0',
    transition: 'height 0.3s ease'
  }
}));

const HomeButton = styled(ServerButton)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: 'white',
  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: '0 12px 30px rgba(99, 102, 241, 0.4)'
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
    transition: 'all 0.1s ease'
  }
}));

const AddServerButton = styled(ServerButton)(({ theme }) => ({
  backgroundColor: theme.palette.grey[700],
  border: `2px dashed ${theme.palette.grey[500]}`,
  '&:hover': {
    backgroundColor: theme.palette.success.main,
    borderColor: theme.palette.success.main,
    transform: 'translateY(-2px) scale(1.05) rotate(90deg)',
    boxShadow: '0 12px 30px rgba(76, 175, 80, 0.4)'
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98) rotate(90deg)',
    transition: 'all 0.1s ease'
  }
}));

const ServerAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  fontSize: '1.2rem',
  fontWeight: 600
}));

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: 'white',
    fontSize: '0.7rem',
    minWidth: 16,
    height: 16,
    borderRadius: 8
  }
}));

const ServerSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    serverId?: string;
  } | null>(null);
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [joinServerOpen, setJoinServerOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  
  const { servers, currentServer } = useAppSelector((state) => state.servers);
  const { user } = useAppSelector((state) => state.auth);
  const { groups, currentGroup } = useAppSelector((state) => state.groups);

  const handleServerClick = (serverId: string | null) => {
    const server = serverId ? servers.find(s => s._id === serverId) || null : null;
    dispatch(setCurrentServer(server));
    dispatch(setCurrentGroup(null));
  };

  const handleGroupClick = (groupId: string | null) => {
    const group = groupId ? groups.find(g => g._id === groupId) || null : null;
    dispatch(setCurrentGroup(group));
    dispatch(setCurrentServer(null));
  };

  // Fetch user groups on component mount
  React.useEffect(() => {
    if (user) {
      dispatch(fetchUserGroups());
    }
  }, [dispatch, user]);

  const handleContextMenu = (event: React.MouseEvent, serverId?: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      serverId
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleCloseContextMenu();
  };

  const getServerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUnreadCount = (serverId: string) => {
    // This would be calculated based on unread messages
    // For now, return a random number for demo
    return Math.floor(Math.random() * 10);
  };

  return (
    <>
      <SidebarContainer>
        {/* Home/DM Button */}
        <Tooltip title="Direct Messages" placement="right">
          <HomeButton
            isActive={!currentServer}
            onClick={() => handleServerClick(null)}
            onContextMenu={(e) => handleContextMenu(e)}
          >
            <Home />
          </HomeButton>
        </Tooltip>

        <Divider sx={{ width: 32, my: 1, backgroundColor: 'grey.600' }} />

        {/* Server List */}
        {servers.map((server) => {
          const unreadCount = getUnreadCount(server._id);
          const isActive = currentServer?._id === server._id;

          return (
            <Tooltip key={server._id} title={server.name} placement="right">
              <NotificationBadge
                badgeContent={unreadCount > 0 ? unreadCount : undefined}
                invisible={unreadCount === 0}
              >
                <ServerButton
                  isActive={isActive}
                  onClick={() => handleServerClick(server._id)}
                  onContextMenu={(e) => handleContextMenu(e, server._id)}
                >
                  {server.icon ? (
                    <ServerAvatar src={server.icon} alt={server.name} />
                  ) : (
                    <ServerAvatar>
                      {getServerInitials(server.name)}
                    </ServerAvatar>
                  )}
                </ServerButton>
              </NotificationBadge>
            </Tooltip>
          );
        })}

        {/* Add Server Button */}
        <Tooltip title="Add a Server" placement="right">
          <AddServerButton onClick={() => setCreateServerOpen(true)}>
            <Add />
          </AddServerButton>
        </Tooltip>

        {/* Explore Public Servers */}
        <Tooltip title="Explore Public Servers" placement="right">
          <ServerButton onClick={() => setJoinServerOpen(true)}>
            <Explore />
          </ServerButton>
        </Tooltip>

        <Divider sx={{ width: 32, my: 1, backgroundColor: 'grey.600' }} />

        {/* Groups Section */}
        <Divider sx={{ width: 32, my: 1, backgroundColor: 'grey.600' }} />
        
        {/* Groups List */}
        {groups.map((group) => {
          const isActive = currentGroup?._id === group._id;
          
          return (
            <Tooltip key={group._id} title={group.name} placement="right">
              <ServerButton
                isActive={isActive}
                onClick={() => handleGroupClick(group._id)}
                onContextMenu={(e) => handleContextMenu(e, group._id)}
              >
                {group.icon ? (
                  <ServerAvatar src={group.icon} alt={group.name} />
                ) : (
                  <ServerAvatar>
                    {getServerInitials(group.name)}
                  </ServerAvatar>
                )}
              </ServerButton>
            </Tooltip>
          );
        })}

        {/* Add Group Button */}
        <Tooltip title="Create a Group" placement="right">
          <AddServerButton onClick={() => setCreateGroupOpen(true)}>
            <GroupAdd />
          </AddServerButton>
        </Tooltip>

        {/* Explore Groups */}
        <Tooltip title="Discover Groups" placement="right">
          <ServerButton onClick={() => setJoinGroupOpen(true)}>
            <Group />
          </ServerButton>
        </Tooltip>

        <Divider sx={{ width: 32, my: 1, backgroundColor: 'grey.600' }} />

        {/* Download Apps */}
        <Tooltip title="Download Apps" placement="right">
          <ServerButton>
            <Download />
          </ServerButton>
        </Tooltip>
      </SidebarContainer>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.serverId ? (
          [
            <MenuItem key="notifications" onClick={handleCloseContextMenu}>
              <ListItemIcon>
                <Notifications fontSize="small" />
              </ListItemIcon>
              <ListItemText>Notification Settings</ListItemText>
            </MenuItem>,
            <MenuItem key="mute" onClick={handleCloseContextMenu}>
              <ListItemIcon>
                <NotificationsOff fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mute Server</ListItemText>
            </MenuItem>,
            <MenuItem key="settings" onClick={handleCloseContextMenu}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Server Settings</ListItemText>
            </MenuItem>,
            <MenuItem key="leave" onClick={handleCloseContextMenu}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>Leave Server</ListItemText>
            </MenuItem>
          ]
        ) : (
          [
            <MenuItem key="settings" onClick={handleCloseContextMenu}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>User Settings</ListItemText>
            </MenuItem>,
            <MenuItem key="logout" onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>Log Out</ListItemText>
            </MenuItem>
          ]
        )}
      </Menu>

      {/* Dialogs */}
      <CreateServerDialog
        open={createServerOpen}
        onClose={() => setCreateServerOpen(false)}
      />
      
      <JoinServerDialog
        open={joinServerOpen}
        onClose={() => setJoinServerOpen(false)}
      />
      
      <CreateGroupDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
      
      <JoinGroupDialog
        open={joinGroupOpen}
        onClose={() => setJoinGroupOpen(false)}
      />
    </>
  );
};

export default ServerSidebar;
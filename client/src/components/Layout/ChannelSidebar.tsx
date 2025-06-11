import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Tag,
  VolumeUp,
  Settings,
  PersonAdd,
  Notifications,
  Add,
  Lock,
  VolumeOff,
  Mic,
  MicOff,
  Headset,
  HeadsetOff,
  Group
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchChannels, setCurrentChannel, Channel } from '../../store/slices/channelsSlice';
import { setCurrentServer } from '../../store/slices/serversSlice';
import { openModal, closeModal, closeContextMenu, openContextMenu, setSelectedDMCategory } from '../../store/slices/uiSlice';
import CreateChannelDialog from '../Dialogs/CreateChannelDialog';
import InviteDialog from '../Dialogs/InviteDialog';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 240,
  minWidth: 240,
  maxWidth: 240,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backdropFilter: 'blur(10px)',
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    width: 240,
    minWidth: 240
  },
  [theme.breakpoints.down('sm')]: {
    width: 200,
    minWidth: 200
  }
}));

const ServerHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}25 0%, ${theme.palette.secondary.main}25 100%)`,
    transform: 'translateY(-1px)'
  }
}));

const ChannelList = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1, 0),
  '&::-webkit-scrollbar': {
    width: 8
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[600],
    borderRadius: 4
  }
}));

const CategoryHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  '&:hover': {
    '& .category-actions': {
      opacity: 1
    }
  }
}));

const CategoryTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  letterSpacing: '0.5px'
}));

const CategoryActions = styled(Box)(({ theme }) => ({
  opacity: 0,
  transition: 'opacity 0.2s ease',
  display: 'flex',
  gap: theme.spacing(0.5)
}));

const ChannelItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  padding: theme.spacing(0.5, 2),
  margin: theme.spacing(0, 1),
  borderRadius: theme.spacing(0.5),
  backgroundColor: isActive ? theme.palette.action.selected : 'transparent',
  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
    '& .channel-actions': {
      opacity: 1
    }
  }
}));

const ChannelActions = styled(Box)(({ theme }) => ({
  opacity: 0,
  transition: 'opacity 0.2s ease',
  display: 'flex',
  gap: theme.spacing(0.5)
}));

const UserArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.grey[900]
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.spacing(0.5),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const VoiceControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5)
}));

interface Category {
  name: string;
  channels: Channel[];
  collapsed: boolean;
}

const ChannelSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const [serverMenuAnchor, setServerMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [channelMenuAnchor, setChannelMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');


  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const { currentServer } = useAppSelector((state) => state.servers);
  const { channels, dmChannels, currentChannel } = useAppSelector((state) => state.channels);
  const { user } = useAppSelector((state) => state.auth);
  const { currentGroup } = useAppSelector((state) => state.groups);
  const ui = useAppSelector((state) => state.ui);
  const { selectedDMCategory, voiceState } = ui;

  // Group channels by category
  const categorizedChannels = React.useMemo(() => {
    const categories: { [key: string]: Channel[] } = {};
    let entityChannels: Channel[] = [];
    
    if (currentServer) {
      entityChannels = channels[currentServer?._id || ''] || [];
    } else if (currentGroup) {
      // In real app, this would fetch group channels
      entityChannels = channels[currentGroup._id] || [];
    }
    
    entityChannels.forEach((channel: Channel) => {
      const categoryName = 'Text Channels'; // Default category since channel.category doesn't exist
      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }
      categories[categoryName].push(channel);
    });

    return Object.entries(categories).map(([name, channels]) => ({
      name,
      channels: channels.sort((a, b) => a.name.localeCompare(b.name)),
      collapsed: collapsedCategories.has(name)
    }));
  }, [currentServer, currentGroup, channels, collapsedCategories]);

  const handleServerMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setServerMenuAnchor(event.currentTarget);
  };

  const handleCategoryMenuClick = (event: React.MouseEvent<HTMLElement>, categoryName: string) => {
    event.stopPropagation();
    setSelectedCategory(categoryName);
    setCategoryMenuAnchor(event.currentTarget);
  };

  const handleChannelMenuClick = (event: React.MouseEvent<HTMLElement>, channelId: string) => {
    event.stopPropagation();
    setSelectedChannel(channelId);
    setChannelMenuAnchor(event.currentTarget);
  };

  const handleChannelClick = (channel: Channel) => {
    dispatch(setCurrentChannel(channel));
  };

  const toggleCategory = (categoryName: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryName)) {
      newCollapsed.delete(categoryName);
    } else {
      newCollapsed.add(categoryName);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleCloseMenus = () => {
    setServerMenuAnchor(null);
    setCategoryMenuAnchor(null);
    setChannelMenuAnchor(null);
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.type === 2) { // 2 is voice channel type
      return <VolumeUp fontSize="small" />;
    }
    return <Tag fontSize="small" />;
  };

  if (!currentServer && !currentGroup) {
    return (
      <SidebarContainer>
        {/* Direct Messages Header */}
        <ServerHeader>
          <Typography variant="h6" fontWeight="bold" noWrap>
            Direct Messages
          </Typography>
        </ServerHeader>

        {/* DM Categories */}
        <ChannelList>
          {/* Friends - Single Button */}
          <List dense>
            <ListItem disablePadding>
              <ChannelItem 
                onClick={() => dispatch(setSelectedDMCategory('friends'))}
                sx={{
                  backgroundColor: selectedDMCategory === 'friends' ? 'action.selected' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Tag fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Friends"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    noWrap: true
                  }}
                />
              </ChannelItem>
            </ListItem>
          </List>

          {/* Drift - Single Button (combining both DRFT sections) */}
          <List dense>
            <ListItem disablePadding>
              <ChannelItem 
                onClick={() => dispatch(setSelectedDMCategory('drft'))}
                sx={{
                  backgroundColor: selectedDMCategory === 'drft' ? 'action.selected' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Tag fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Drift"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    noWrap: true
                  }}
                />
              </ChannelItem>
            </ListItem>
          </List>

          {/* Direct Messages - Title with + button only */}
          <Box>
            <CategoryHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryTitle>Direct Messages</CategoryTitle>
              </Box>
              <CategoryActions>
                <Tooltip title="Create DM">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle create DM action
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CategoryActions>
            </CategoryHeader>
          </Box>

          {/* DM Channels List */}
          <List dense>
            {dmChannels.map((dmChannel) => (
              <ListItem key={dmChannel._id} disablePadding>
                <ChannelItem 
                  onClick={() => {
                    dispatch(setCurrentChannel(dmChannel));
                    dispatch(setSelectedDMCategory('direct-messages'));
                  }}
                  sx={{
                    backgroundColor: currentChannel?._id === dmChannel._id ? 'action.selected' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                      {dmChannel.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={dmChannel.name}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      noWrap: true,
                      fontWeight: currentChannel?._id === dmChannel._id ? 600 : 400
                    }}
                  />
                </ChannelItem>
              </ListItem>
            ))}
          </List>
        </ChannelList>
      </SidebarContainer>
    );
  }

  return (
    <>
      <SidebarContainer>
        {/* Server/Group Header */}
        <ServerHeader onClick={handleServerMenuClick}>
          <Box display="flex" alignItems="center" gap={1}>
            {currentGroup && (
              <Avatar sx={{ width: 24, height: 24 }}>
                <Group fontSize="small" />
              </Avatar>
            )}
            <Typography variant="h6" fontWeight="bold" noWrap>
              {currentServer?.name || currentGroup?.name}
            </Typography>
          </Box>
          <ExpandMore />
        </ServerHeader>

        {/* Channel List */}
        <ChannelList>
          {categorizedChannels.map((category) => (
            <Box key={category.name}>
              <CategoryHeader onClick={() => toggleCategory(category.name)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.collapsed ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                  <CategoryTitle>{category.name}</CategoryTitle>
                </Box>
                <CategoryActions className="category-actions">
                  <Tooltip title="Create Channel">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const entityId = currentServer?._id || currentGroup?._id;
                        const entityType = currentServer ? 'server' : 'group';
                        dispatch(openModal({ 
                          type: 'createChannel', 
                          data: { 
                            serverId: currentServer?._id,
                            groupId: currentGroup?._id,
                            entityType 
                          } 
                        }));
                      }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={(e) => handleCategoryMenuClick(e, category.name)}
                  >
                    <Settings fontSize="small" />
                  </IconButton>
                </CategoryActions>
              </CategoryHeader>

              <Collapse in={!category.collapsed}>
                <List dense>
                  {category.channels.map((channel) => (
                    <ListItem key={channel._id} disablePadding>
                    <ChannelItem
                      isActive={currentChannel?._id === channel._id}
                      onClick={() => handleChannelClick(channel)}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getChannelIcon(channel)}
                        </ListItemIcon>
                        <ListItemText
                          primary={channel.name}
                          primaryTypographyProps={{
                            fontSize: '0.9rem',
                            noWrap: true
                          }}
                        />

                        <ChannelActions className="channel-actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleChannelMenuClick(e, channel._id)}
                          >
                            <Settings fontSize="small" />
                          </IconButton>
                        </ChannelActions>
                      </ChannelItem>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </ChannelList>

        {/* User Area */}
        <UserArea>
          {voiceState.channelId && (
            <Box sx={{ mb: 1, p: 1, backgroundColor: 'success.dark', borderRadius: 1 }}>
              <Typography variant="caption" color="white">
                Voice Connected
              </Typography>
              <Typography variant="body2" color="white" noWrap>
                {voiceState.channelName}
              </Typography>
            </Box>
          )}
          
          <UserInfo>
            <Avatar
              src={user?.avatar}
              sx={{ width: 32, height: 32, mr: 1 }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight="bold" noWrap>
                {user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.status || 'Online'}
              </Typography>
            </Box>
            <VoiceControls>
              <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                <IconButton
                  size="small"
                  color={isMuted ? 'error' : 'default'}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isDeafened ? 'Undeafen' : 'Deafen'}>
                <IconButton
                  size="small"
                  color={isDeafened ? 'error' : 'default'}
                  onClick={() => setIsDeafened(!isDeafened)}
                >
                  {isDeafened ? <HeadsetOff fontSize="small" /> : <Headset fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="User Settings">
                <IconButton size="small">
                  <Settings fontSize="small" />
                </IconButton>
              </Tooltip>
            </VoiceControls>
          </UserInfo>
        </UserArea>
      </SidebarContainer>

      {/* Server Menu */}
      <Menu
        anchorEl={serverMenuAnchor}
        open={Boolean(serverMenuAnchor)}
        onClose={handleCloseMenus}
      >
        <MenuItem onClick={() => { dispatch(openModal({ type: 'invite', data: { serverId: currentServer?._id || '' } })); handleCloseMenus(); }}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>Invite People</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Server Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { dispatch(openModal({ type: 'createChannel', data: { serverId: currentServer?._id || '' } })); handleCloseMenus(); }}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Channel</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCloseMenus}>
          <ListItemIcon>
            <Notifications fontSize="small" />
          </ListItemIcon>
          <ListItemText>Notification Settings</ListItemText>
        </MenuItem>
      </Menu>

      {/* Category Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={handleCloseMenus}
      >
        <MenuItem onClick={() => { dispatch(openModal({ type: 'createChannel', data: { serverId: currentServer?._id || '' } })); handleCloseMenus(); }}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Channel</ListItemText>
        </MenuItem>
      </Menu>

      {/* Channel Menu */}
      <Menu
        anchorEl={channelMenuAnchor}
        open={Boolean(channelMenuAnchor)}
        onClose={handleCloseMenus}
      >
        <MenuItem onClick={handleCloseMenus}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Channel</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCloseMenus}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          <ListItemText>Invite People</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <CreateChannelDialog
        open={ui.modals.createChannel?.isOpen || false}
        serverId={ui.modals.createChannel?.data?.serverId || currentServer?._id || ''}
      />
      
      <InviteDialog
        open={ui.modals.invite?.isOpen || false}
        serverId={ui.modals.invite?.data?.serverId || currentServer?._id || ''}
      />
    </>
  );
};

export default ChannelSidebar;
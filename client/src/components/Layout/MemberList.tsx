import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Chip,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Search,
  PersonAdd,
  Block,
  VolumeOff,
  Message,
  Call,
  VideoCall,
  MoreVert
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchServerMembers } from '../../store/slices/serversSlice';

const MemberListContainer = styled(Box)(({ theme }) => ({
  width: 240,
  minWidth: 240,
  maxWidth: 240,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  borderLeft: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '100vh',
  backdropFilter: 'blur(10px)',
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    width: 200,
    minWidth: 180
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`
}));

const MembersContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
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

const RoleHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const RoleTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  letterSpacing: '0.5px'
}));

const MemberItem = styled(ListItemButton)(({ theme }) => ({
  padding: theme.spacing(0.5, 2),
  margin: theme.spacing(0, 1),
  borderRadius: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    '& .member-actions': {
      opacity: 1
    }
  }
}));

const MemberActions = styled(Box)(({ theme }) => ({
  opacity: 0,
  transition: 'opacity 0.2s ease',
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
      case 'offline': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return {
    '& .MuiBadge-badge': {
      backgroundColor: getStatusColor(),
      color: getStatusColor(),
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
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

interface Member {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  roles: string[];
  isBot?: boolean;
  joinedAt: string;
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching';
    name: string;
    details?: string;
  };
}

interface Role {
  id: string;
  name: string;
  color?: string;
  members: Member[];
}

const MemberList: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { currentServer, members: serverMembers } = useAppSelector((state) => state.servers);
  const members = currentServer ? serverMembers[currentServer?._id || ''] || [] : [];
  const { user } = useAppSelector((state) => state.auth);

  // Group members by roles
  const membersByRole = React.useMemo(() => {
    if (!members || members.length === 0) {
      return [];
    }

    const roleMap = new Map<string, Member[]>();
    
    // Initialize with default roles
    roleMap.set('online', []);
    roleMap.set('offline', []);

    members.forEach((member: any) => {
      const isOnline = member.status !== 'offline';
      const roleKey = isOnline ? 'online' : 'offline';
      
      if (!roleMap.has(roleKey)) {
        roleMap.set(roleKey, []);
      }
      
      roleMap.get(roleKey)!.push(member);
    });

    // Filter by search term
    const filteredRoles: Role[] = [];
    roleMap.forEach((members, roleName) => {
      const filteredMembers = members.filter(member => 
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredMembers.length > 0) {
        filteredRoles.push({
          id: roleName,
          name: roleName === 'online' ? 'Online' : 'Offline',
          members: filteredMembers.sort((a, b) => a.username.localeCompare(b.username))
        });
      }
    });

    return filteredRoles;
  }, [members, searchTerm]);

  const handleMemberClick = (member: Member, event: React.MouseEvent<HTMLElement>) => {
    setSelectedMember(member);
    setMemberMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  const toggleRole = (roleId: string) => {
    const newCollapsed = new Set(collapsedRoles);
    if (newCollapsed.has(roleId)) {
      newCollapsed.delete(roleId);
    } else {
      newCollapsed.add(roleId);
    }
    setCollapsedRoles(newCollapsed);
  };

  const getActivityText = (member: Member) => {
    if (!member.activity) return null;
    
    const { type, name, details } = member.activity;
    const prefix = type === 'playing' ? 'Playing' : 
                  type === 'streaming' ? 'Streaming' :
                  type === 'listening' ? 'Listening to' : 'Watching';
    
    return `${prefix} ${name}${details ? ` - ${details}` : ''}`;
  };

  const totalMembers = membersByRole.reduce((total, role) => total + role.members.length, 0);

  return (
    <>
      <MemberListContainer>
        {/* Search */}
        <SearchContainer>
          <TextField
            size="small"
            fullWidth
            placeholder="Search members"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </SearchContainer>

        {/* Members List */}
        <MembersContainer>
          {membersByRole.map((role) => (
            <Box key={role.id}>
              <RoleHeader onClick={() => toggleRole(role.id)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {collapsedRoles.has(role.id) ? 
                    <ExpandMore fontSize="small" /> : 
                    <ExpandLess fontSize="small" />
                  }
                  <RoleTitle>
                    {role.name} — {role.members.length}
                  </RoleTitle>
                </Box>
              </RoleHeader>

              <Collapse in={!collapsedRoles.has(role.id)}>
                <List dense>
                  {role.members.map((member) => (
                    <ListItem key={member.id} disablePadding>
                      <MemberItem onClick={(e) => handleMemberClick(member, e)}>
                        <ListItemAvatar>
                          <StatusBadge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            status={member.status}
                          >
                            <Avatar
                              src={member.avatar}
                              sx={{ width: 32, height: 32 }}
                            >
                              {member.username[0].toUpperCase()}
                            </Avatar>
                          </StatusBadge>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="body2"
                                fontWeight={member.status === 'offline' ? 400 : 500}
                                color={member.status === 'offline' ? 'text.secondary' : 'text.primary'}
                                noWrap
                              >
                                {member.displayName || member.username}
                              </Typography>
                              {member.isBot && (
                                <Chip
                                  label="BOT"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.6rem',
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            member.activity && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {getActivityText(member)}
                              </Typography>
                            )
                          }
                        />
                        
                        <MemberActions className="member-actions">
                          <IconButton size="small">
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </MemberActions>
                      </MemberItem>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </MembersContainer>
      </MemberListContainer>

      {/* Member Context Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {selectedMember && [
          <MenuItem key="profile" onClick={handleCloseMenu}>
            <ListItemIcon>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Profile</ListItemText>
          </MenuItem>,
          <MenuItem key="message" onClick={handleCloseMenu}>
            <ListItemIcon>
              <Message fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Message</ListItemText>
          </MenuItem>,
          <MenuItem key="call" onClick={handleCloseMenu}>
            <ListItemIcon>
              <Call fontSize="small" />
            </ListItemIcon>
            <ListItemText>Call</ListItemText>
          </MenuItem>,
          <MenuItem key="video" onClick={handleCloseMenu}>
            <ListItemIcon>
              <VideoCall fontSize="small" />
            </ListItemIcon>
            <ListItemText>Video Call</ListItemText>
          </MenuItem>,
          <Divider key="divider" />,
          <MenuItem key="mute" onClick={handleCloseMenu}>
            <ListItemIcon>
              <VolumeOff fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mute</ListItemText>
          </MenuItem>,
          <MenuItem key="block" onClick={handleCloseMenu}>
            <ListItemIcon>
              <Block fontSize="small" />
            </ListItemIcon>
            <ListItemText>Block</ListItemText>
          </MenuItem>
        ]}
      </Menu>
    </>
  );
};

export default MemberList;
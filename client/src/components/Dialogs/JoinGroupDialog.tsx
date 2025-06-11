import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { searchGroups, joinGroupByInvite } from '../../store/slices/groupsSlice';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  Grid,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';

import {
  Search,
  Close,
  Group,
  Lock,
  Public,
  People,
  Star,
  TrendingUp,
  Add,
  Check
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface JoinGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

interface GroupData {
  _id: string;
  name: string;
  description: string;
  type: 'community' | 'private';
  icon?: string;
  memberCount: number;
  isPublic: boolean;
  category: string;
  tags: string[];
  owner: {
    _id: string;
    username: string;
    avatar?: string;
  };
  isJoined?: boolean;
  requireApproval?: boolean;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    minWidth: 700,
    maxWidth: 800,
    height: '80vh',
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    backdropFilter: 'blur(10px)'
  }
}));

const GroupCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8]
  }
}));

const JoinGroupDialog: React.FC<JoinGroupDialogProps> = ({
  open,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const { groups, loading, error } = useAppSelector((state) => state.groups);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [popularGroups, setPopularGroups] = useState<GroupData[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<GroupData[]>([]);
  const [localError, setLocalError] = useState('');
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());



  useEffect(() => {
    if (open) {
      // TODO: Fetch popular and recommended groups from API
      setPopularGroups([]);
      setRecommendedGroups([]);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setLocalError('Please enter a search term');
      return;
    }

    setLocalError('');
    
    try {
      await dispatch(searchGroups(searchQuery)).unwrap();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to search groups');
    }
  };

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim()) {
      setLocalError('Please enter an invite code');
      return;
    }

    setLocalError('');
    
    try {
      await dispatch(joinGroupByInvite(inviteCode)).unwrap();
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to join group');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setLocalError('');
    
    try {
      // For now, just mark as joined locally
      // TODO: Implement actual join group API call
      setJoinedGroups(prev => new Set(Array.from(prev).concat(groupId)));
    } catch (err: any) {
      setLocalError(err.message || 'Failed to join group');
    }
  };

  const renderGroupCard = (group: GroupData) => {
    const isJoined = joinedGroups.has(group._id);
    
    return (
      <GroupCard key={group._id}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Avatar
              src={group.icon}
              sx={{ width: 56, height: 56 }}
            >
              {group.name[0]}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" fontWeight={600}>
                  {group.name}
                </Typography>
                {group.type === 'private' ? (
                  <Lock fontSize="small" color="action" />
                ) : (
                  <Public fontSize="small" color="action" />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={1}>
                {group.description}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <People fontSize="small" color="action" />
                  <Typography variant="caption">
                    {group.memberCount.toLocaleString()} members
                  </Typography>
                </Box>
                <Typography variant="caption" color="primary">
                  {group.category}
                </Typography>
              </Box>
              
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {group.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
                {group.tags.length > 3 && (
                  <Chip label={`+${group.tags.length - 3}`} size="small" variant="outlined" />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={group.owner.avatar} sx={{ width: 24, height: 24 }}>
              {group.owner.username[0]}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              by {group.owner.username}
            </Typography>
          </Box>
          
          <Button
            variant={isJoined ? "outlined" : "contained"}
            size="small"
            onClick={() => !isJoined && handleJoinGroup(group._id)}
            disabled={loading || isJoined}
            startIcon={isJoined ? <Check /> : <Add />}
          >
            {isJoined ? 'Joined' : (group.requireApproval ? 'Request' : 'Join')}
          </Button>
        </CardActions>
      </GroupCard>
    );
  };

  const handleClose = () => {
    setActiveTab(0);
    setSearchQuery('');
    setInviteCode('');
    setLocalError('');
    onClose();
  };

  // Clear search results when dialog closes
  useEffect(() => {
    if (!open) {
      // Could dispatch an action to clear search results if needed
    }
  }, [open]);

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            Discover Groups
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {(localError || error) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError('')}>
            {localError || error}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Discover" icon={<Search />} iconPosition="start" />
          <Tab label="Join by Invite" icon={<Add />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* Search */}
            <Box mb={3}>
              <TextField
                fullWidth
                placeholder="Search for groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                      >
                        Search
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* Search Results */}
            {groups.length > 0 && (
              <Box mb={4}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Search Results
                </Typography>
                <Grid container spacing={2}>
                     {groups.map((group: GroupData) => (
                       <Grid size={12} key={group._id}>
                         {renderGroupCard(group)}
                       </Grid>
                     ))}
                   </Grid>
              </Box>
            )}

            {/* Popular Groups */}
            <Box mb={4}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingUp color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Popular Groups
                </Typography>
              </Box>
              <Grid container spacing={2}>
                   {popularGroups.map((group: GroupData) => (
                     <Grid size={12} key={group._id}>
                       {renderGroupCard(group)}
                     </Grid>
                   ))}
                 </Grid>
            </Box>

            {/* Recommended Groups */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Star color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Recommended for You
                </Typography>
              </Box>
              <Grid container spacing={2}>
                   {recommendedGroups.map((group: GroupData) => (
                     <Grid size={12} key={group._id}>
                       {renderGroupCard(group)}
                     </Grid>
                   ))}
                 </Grid>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Have an invite code? Enter it below to join a private group.
            </Typography>
            
            <TextField
              fullWidth
              label="Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code (e.g., abc123def)"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinByInvite()}
              sx={{ mb: 3 }}
            />
            
            <Button
              variant="contained"
              onClick={handleJoinByInvite}
              disabled={loading || !inviteCode.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <Group />}
              fullWidth
            >
              {loading ? 'Joining...' : 'Join Group'}
            </Button>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Invite codes are case-sensitive and may expire. 
              Make sure you have the correct code from the group owner or admin.
            </Typography>
          </Box>
        )}

        {loading && groups.length === 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default JoinGroupDialog;
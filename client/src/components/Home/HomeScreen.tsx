import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Badge
} from '@mui/material';
import {
  VolumeUp,
  Mic,
  MicOff,
  Headset,
  Games,
  MusicNote,
  Movie,
  Code,
  FiberManualRecord
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector } from '../../store/hooks';
import { Friend } from '../../store/slices/usersSlice';
import { Group } from '../../store/slices/groupsSlice';

const HomeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
  overflow: 'hidden'
}));

const ActivityFeed = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 8
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.paper,
    borderRadius: 4
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.primary.main,
    borderRadius: 4,
    '&:hover': {
      background: theme.palette.primary.dark
    }
  }
}));

const FriendsPanel = styled(Box)(({ theme }) => ({
  width: 300,
  background: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: 6
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.primary.main,
    borderRadius: 3
  }
}));

const ActivityCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${theme.palette.primary.main}20`
  }
}));

const OnlineIndicator = styled(FiberManualRecord)(({ theme }) => ({
  fontSize: 12,
  color: theme.palette.success.main,
  marginRight: theme.spacing(0.5)
}));

const VoiceChannelCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
  border: `1px solid ${theme.palette.primary.main}40`,
  borderRadius: 8
}));

interface Activity {
  id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
    discriminator: string;
  };
  type: 'playing' | 'listening' | 'watching' | 'streaming' | 'voice';
  name: string;
  details?: string;
  state?: string;
  timestamp: number;
  groupName?: string;
  channelName?: string;
}

const HomeScreen: React.FC = () => {
  const { friends } = useAppSelector((state) => state.users);
  const { groups } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockActivities: Activity[] = [
      {
        id: '1',
        user: {
          _id: '1',
          username: 'GamerFriend',
          avatar: '',
          discriminator: '1234'
        },
        type: 'playing',
        name: 'Valorant',
        details: 'Competitive Match',
        state: 'In Game',
        timestamp: Date.now() - 300000
      },
      {
        id: '2',
        user: {
          _id: '2',
          username: 'MusicLover',
          avatar: '',
          discriminator: '5678'
        },
        type: 'listening',
        name: 'Spotify',
        details: 'Chill Vibes Playlist',
        state: 'by Various Artists',
        timestamp: Date.now() - 600000
      },
      {
        id: '3',
        user: {
          _id: '3',
          username: 'DevCoder',
          avatar: '',
          discriminator: '9012'
        },
        type: 'voice',
        name: 'General Voice',
        groupName: 'Dev Team',
        channelName: 'General Voice',
        timestamp: Date.now() - 900000
      }
    ];
    setActivities(mockActivities);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'playing':
        return <Games color="primary" />;
      case 'listening':
        return <MusicNote color="secondary" />;
      case 'watching':
        return <Movie color="info" />;
      case 'streaming':
        return <Movie color="error" />;
      case 'voice':
        return <Headset color="success" />;
      default:
        return <Code color="primary" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'playing':
        return 'primary';
      case 'listening':
        return 'secondary';
      case 'watching':
        return 'info';
      case 'streaming':
        return 'error';
      case 'voice':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  const onlineFriends = friends.filter(friend => 
    friend.status === 'accepted' && friend.type === 'friend'
  ).slice(0, 10); // Show first 10 online friends

  // Mock voice channel data since groups don't have channels in the current interface
  const voiceChannelUsers = groups.slice(0, 2).map(group => ({
    groupName: group.name,
    channelName: 'General Voice',
    users: [] // This would be populated with actual voice channel users
  }));

  return (
    <HomeContainer>
      <ActivityFeed>
        <Typography variant="h4" gutterBottom sx={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          mb: 3
        }}>
          Welcome back, {user?.username}!
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
          Friends Activity
        </Typography>
        
        {activities.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', background: 'transparent' }}>
            <Typography variant="body1" color="text.secondary">
              No recent activity from your friends.
            </Typography>
          </Card>
        ) : (
          activities.map((activity) => (
            <ActivityCard key={activity.id}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar 
                    src={activity.user.avatar} 
                    sx={{ width: 40, height: 40, mr: 2 }}
                  >
                    {activity.user.username[0].toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {activity.user.username}#{activity.user.discriminator}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(activity.timestamp)}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={getActivityIcon(activity.type)}
                    label={activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    color={getActivityColor(activity.type) as any}
                    size="small"
                  />
                </Box>
                
                <Box ml={7}>
                  <Typography variant="body1" fontWeight={500}>
                    {activity.name}
                  </Typography>
                  {activity.details && (
                    <Typography variant="body2" color="text.secondary">
                      {activity.details}
                    </Typography>
                  )}
                  {activity.state && (
                    <Typography variant="body2" color="text.secondary">
                      {activity.state}
                    </Typography>
                  )}
                  {activity.groupName && activity.channelName && (
                    <Typography variant="body2" color="success.main">
                      🎤 {activity.groupName} - {activity.channelName}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </ActivityCard>
          ))
        )}
      </ActivityFeed>
      
      <FriendsPanel>
        <Typography variant="h6" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 2
        }}>
          <OnlineIndicator />
          Online Friends ({onlineFriends.length})
        </Typography>
        
        <List>
          {onlineFriends.map((friend) => (
            <ListItem key={friend._id} sx={{ px: 0, py: 1 }}>
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: 'success.main',
                        border: '2px solid',
                        borderColor: 'background.paper'
                      }}
                    />
                  }
                >
                  <Avatar src={friend.user.avatar} sx={{ width: 32, height: 32 }}>
                    {friend.user.username[0].toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={500}>
                    {friend.user.username}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Online
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
        
        {voiceChannelUsers.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 2
            }}>
              <VolumeUp sx={{ mr: 1, fontSize: 20 }} />
              Voice Channels
            </Typography>
            
            {voiceChannelUsers.map((channel, index) => (
              <VoiceChannelCard key={index}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="body2" fontWeight={500}>
                    {channel.groupName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    🎤 {channel.channelName}
                  </Typography>
                </CardContent>
              </VoiceChannelCard>
            ))}
          </>
        )}
        
        {onlineFriends.length === 0 && (
          <Box textAlign="center" mt={4}>
            <Typography variant="body2" color="text.secondary">
              No friends online right now.
            </Typography>
          </Box>
        )}
      </FriendsPanel>
    </HomeContainer>
  );
};

export default HomeScreen;
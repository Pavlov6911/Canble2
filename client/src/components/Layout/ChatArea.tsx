import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PurchasePanel from '../PurchasePanel/PurchasePanel';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Send,
  EmojiEmotions,
  AttachFile,
  Gif,
  Add,
  Search,
  PersonAdd,
  Block,
  VolumeUp,
  Help,
  Settings,
  Notifications,
  Star,
  VideoCall,
  Call,
  PushPin,
  Payment,
  Security,
  Close,
  Info
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { RootState } from '../../store/store';
import { addMessage } from '../../store/slices/messagesSlice';
import { setSelectedDMCategory } from '../../store/slices/uiSlice';

// Discord-style Styled components with pure black and violet theme
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100vw',
  height: '100vh',
  backgroundColor: '#000000',
  position: 'relative'
}));

const ChannelInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '2px solid #8B5CF6',
  backgroundColor: '#000000',
  minHeight: '52px',
  boxShadow: '0 1px 0 rgba(139, 92, 246, 0.3)'
}));

const ChannelName = styled(Typography)(({ theme }) => ({
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '16px',
  marginLeft: '8px',
  textShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
}));

const ChannelTopic = styled(Typography)(({ theme }) => ({
  color: '#8B5CF6',
  fontSize: '14px',
  opacity: 0.8
}));

const HeaderActions = styled(Box)(({ theme }) => ({
  marginLeft: 'auto',
  display: 'flex',
  gap: '4px'
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: '0',
  backgroundColor: '#000000',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#000000'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#8B5CF6',
    borderRadius: '4px',
    '&:hover': {
      background: '#A855F7'
    }
  }
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  padding: '20px',
  backgroundColor: '#000000',
  borderTop: '1px solid #8B5CF6'
}));

const MessageInputWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  backgroundColor: '#1a1a1a',
  border: '2px solid #8B5CF6',
  borderRadius: '12px',
  padding: '12px 16px',
  gap: '12px',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#A855F7',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
  },
  '&:focus-within': {
    borderColor: '#A855F7',
    boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)'
  }
}));

const InputActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  padding: '8px 20px',
  color: '#8B5CF6',
  fontSize: '14px',
  fontStyle: 'italic',
  backgroundColor: '#000000'
}));

// Discord-style components
const DiscordContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100vw',
  height: '100vh',
  backgroundColor: '#000000'
}));

const DiscordHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '2px solid #8B5CF6',
  backgroundColor: '#000000',
  minHeight: '48px'
}));

const DiscordContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  backgroundColor: '#000000',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#000000'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#8B5CF6',
    borderRadius: '4px'
  }
}));

const TabsContainer = styled(Box)(({ theme }) => ({
  borderBottom: '2px solid #8B5CF6',
  backgroundColor: '#000000'
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: '#8B5CF6'
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: '#8B5CF6',
  textTransform: 'none',
  fontWeight: 500,
  '&.Mui-selected': {
    color: '#ffffff'
  },
  '&:hover': {
    color: '#A855F7'
  }
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderBottom: '2px solid #8B5CF6',
  backgroundColor: '#000000'
}));

const UserCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#000000',
  border: '1px solid #8B5CF6',
  borderRadius: '8px',
  marginBottom: '8px',
  '&:hover': {
    backgroundColor: '#1a1a1a'
  }
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  fontSize: '11px',
  height: '20px',
  backgroundColor: '#8B5CF6',
  color: '#ffffff'
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#000000',
  border: '1px solid #8B5CF6',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#1a1a1a',
    transform: 'translateY(-2px)',
    borderColor: '#A855F7'
  }
}));

const PremiumButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#8B5CF6',
  color: 'white',
  fontWeight: 600,
  padding: '12px 24px',
  borderRadius: '8px',
  textTransform: 'none',
  fontSize: '16px',
  '&:hover': {
    backgroundColor: '#7C3AED',
    transform: 'translateY(-1px)'
  }
}));

// Interfaces
interface Friend {
  id: string;
  username: string;
  discriminator: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activity?: string;
}

interface PendingRequest {
  id: string;
  username: string;
  discriminator: string;
  incoming: boolean;
}

interface BlockedUser {
  id: string;
  username: string;
  discriminator: string;
}

const ChatArea: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentChannel } = useSelector((state: RootState) => state.channels);
  const { messages, typingUsers } = useSelector((state: RootState) => state.messages);
  const { memberListCollapsed } = useSelector((state: RootState) => state.ui);
  const { selectedDMCategory } = useSelector((state: RootState) => state.ui);

  // Mock messages for Test DM channel
  const testChannelMessages = [
    {
      _id: 'test_msg_1',
      content: 'Hey! Welcome to the Test DM channel! 👋',
      author: {
        _id: 'test_user_1',
        username: 'Alice',
        discriminator: '1234',
        avatar: undefined
      },
      channel: 'dm_1',
      type: 0,
      tts: false,
      mentionEveryone: false,
      mentions: [],
      mentionRoles: [],
      mentionChannels: [],
      attachments: [],
      embeds: [],
      reactions: [],
      pinned: false,
      editedTimestamp: undefined,
      createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      updatedAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      _id: 'test_msg_2',
      content: 'This is a demo of our Discord-like chat interface with the beautiful black and violet theme! ✨',
      author: {
        _id: 'test_user_2',
        username: 'Bob',
        discriminator: '5678',
        avatar: undefined
      },
      channel: 'dm_1',
      type: 0,
      tts: false,
      mentionEveryone: false,
      mentions: [],
      mentionRoles: [],
      mentionChannels: [],
      attachments: [],
      embeds: [],
      reactions: [],
      pinned: false,
      editedTimestamp: undefined,
      createdAt: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
      updatedAt: new Date(Date.now() - 240000).toISOString()
    },
    {
      _id: 'test_msg_3',
      content: 'You can type messages, see hover effects, and experience the smooth UI/UX! 🚀',
      author: {
        _id: 'test_user_1',
        username: 'Alice',
        discriminator: '1234',
        avatar: undefined
      },
      channel: 'dm_1',
      type: 0,
      tts: false,
      mentionEveryone: false,
      mentions: [],
      mentionRoles: [],
      mentionChannels: [],
      attachments: [],
      embeds: [],
      reactions: [],
      pinned: false,
      editedTimestamp: undefined,
      createdAt: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
      updatedAt: new Date(Date.now() - 180000).toISOString()
    },
    {
      _id: 'test_msg_4',
      content: 'The violet glow effects and smooth animations make it feel really modern! 💜',
      author: {
        _id: 'test_user_3',
        username: 'Charlie',
        discriminator: '9012',
        avatar: undefined
      },
      channel: 'dm_1',
      type: 0,
      tts: false,
      mentionEveryone: false,
      mentions: [],
      mentionRoles: [],
      mentionChannels: [],
      attachments: [],
      embeds: [],
      reactions: [],
      pinned: false,
      editedTimestamp: undefined,
      createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      updatedAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      _id: 'test_msg_5',
      content: 'Try typing a message below to see how it works! The input has nice focus effects too. 😊',
      author: {
        _id: 'test_user_2',
        username: 'Bob',
        discriminator: '5678',
        avatar: undefined
      },
      channel: 'dm_1',
      type: 0,
      tts: false,
      mentionEveryone: false,
      mentions: [],
      mentionRoles: [],
      mentionChannels: [],
      attachments: [],
      embeds: [],
      reactions: [],
      pinned: false,
      editedTimestamp: undefined,
      createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      updatedAt: new Date(Date.now() - 60000).toISOString()
    }
  ];
  
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [friendsTab, setFriendsTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [purchasePanelOpen, setPurchasePanelOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for friends
  const [friends] = useState<Friend[]>([
    { id: '1', username: 'Alice', discriminator: '1234', status: 'online', activity: 'Playing Valorant' },
    { id: '2', username: 'Bob', discriminator: '5678', status: 'idle', activity: 'Away' },
    { id: '3', username: 'Charlie', discriminator: '9012', status: 'dnd', activity: 'In a meeting' },
    { id: '4', username: 'Diana', discriminator: '3456', status: 'offline' },
    { id: '5', username: 'Eve', discriminator: '7890', status: 'online', activity: 'Listening to Spotify' }
  ]);

  // Mock data for pending friend requests
  const [pendingRequests] = useState<PendingRequest[]>([
    { id: '1', username: 'NewFriend1', discriminator: '1111', incoming: true },
    { id: '2', username: 'NewFriend2', discriminator: '2222', incoming: true },
    { id: '3', username: 'OutgoingReq', discriminator: '3333', incoming: false }
  ]);

  // Mock data for blocked users
  const [blockedUsers] = useState<BlockedUser[]>([
    { id: '1', username: 'BlockedUser1', discriminator: '4444' },
    { id: '2', username: 'BlockedUser2', discriminator: '5555' }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim() && currentChannel) {
      dispatch(addMessage({
        _id: Date.now().toString(),
        content: messageText.trim(),
        author: {
          _id: 'current-user',
          username: 'You',
          discriminator: '0001',
          avatar: undefined
        },
        channel: currentChannel._id,
        type: 0,
        tts: false,
        mentionEveryone: false,
        mentions: [],
        mentionRoles: [],
        mentionChannels: [],
        attachments: [],
        embeds: [],
        reactions: [],
        pinned: false,
        editedTimestamp: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setMessageText('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getChannelIcon = () => {
    if (!currentChannel) return null;
    return currentChannel.type === 0 ? '#' : currentChannel.type === 2 ? '🔊' : '📢';
  };

  const handleSubscribe = (planName: string, planPrice: string) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setPurchasePanelOpen(true);
  };

  const handleAddFriend = () => {
    if (!addFriendUsername.trim()) {
      setAddFriendError('Please enter a username');
      return;
    }
    
    // Validate username format (basic validation)
    if (addFriendUsername.length < 2) {
      setAddFriendError('Username must be at least 2 characters long');
      return;
    }
    
    // Check if trying to add yourself
    if (addFriendUsername.toLowerCase() === 'yourself') {
      setAddFriendError('You cannot add yourself as a friend');
      return;
    }
    
    // Check if user is already a friend
    const isAlreadyFriend = friends.some(friend => 
      friend.username.toLowerCase() === addFriendUsername.toLowerCase()
    );
    if (isAlreadyFriend) {
      setAddFriendError('This user is already your friend');
      return;
    }
    
    // Check if there's already a pending request
    const hasPendingRequest = pendingRequests.some(request => 
      request.username.toLowerCase() === addFriendUsername.toLowerCase()
    );
    if (hasPendingRequest) {
      setAddFriendError('Friend request already sent to this user');
      return;
    }
    
    // Mock validation for demo
    if (addFriendUsername.toLowerCase() === 'invalid') {
      setAddFriendError('User not found');
      return;
    }
    
    // Success case
    alert(`Friend request sent to ${addFriendUsername}!`);
    setAddFriendOpen(false);
    setAddFriendUsername('');
    setAddFriendError('');
  };

  const handleCloseAddFriend = () => {
    setAddFriendOpen(false);
    setAddFriendUsername('');
    setAddFriendError('');
  };

  const handleAcceptRequest = (requestId: string) => {
    // Remove from pending requests and add to friends
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      // In a real app, this would make an API call
      console.log('Accepting friend request from:', request.username);
      // Show success message
      alert(`Friend request from ${request.username} accepted!`);
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    // Remove from pending requests
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      // In a real app, this would make an API call
      console.log('Declining friend request from:', request.username);
      // Show success message
      alert(`Friend request from ${request.username} declined.`);
    }
  };

  const handleCancelRequest = (requestId: string) => {
    // Cancel outgoing friend request
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      // In a real app, this would make an API call
      console.log('Canceling friend request to:', request.username);
      // Show success message
      alert(`Friend request to ${request.username} canceled.`);
    }
  };

  const handleUnblockUser = (userId: string) => {
    // Remove from blocked users
    const user = blockedUsers.find(u => u.id === userId);
    if (user) {
      // In a real app, this would make an API call
      console.log('Unblocking user:', user.username);
      // Show success message
      alert(`${user.username} has been unblocked.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#3ba55d';
      case 'idle': return '#faa81a';
      case 'dnd': return '#ed4245';
      default: return '#747f8d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Away';
      case 'dnd': return 'Do Not Disturb';
      default: return 'Offline';
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingRequests = pendingRequests.filter(request => 
    request.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlockedUsers = blockedUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Friends page
  if (selectedDMCategory === 'friends') {
    return (
      <DiscordContainer>
        <DiscordHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAdd sx={{ color: '#8B5CF6', mr: 2 }} />
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Friends
            </Typography>
          </Box>
        </DiscordHeader>
        
        <TabsContainer>
          <StyledTabs value={friendsTab} onChange={(e, newValue) => setFriendsTab(newValue)}>
            <StyledTab label="Online" />
            <StyledTab label="All" />
            <StyledTab label="Pending" />
            <StyledTab label="Blocked" />
            <StyledTab 
              label="Add Friend" 
              sx={{ 
                color: '#8B5CF6 !important',
                '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' }
              }}
              onClick={() => setAddFriendOpen(true)}
            />
          </StyledTabs>
        </TabsContainer>

        <SearchContainer>
          <TextField
            fullWidth
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#40444b',
                '& fieldset': { border: 'none' },
                '& input': { color: '#dcddde' }
              }
            }}
            InputProps={{
              startAdornment: <Search sx={{ color: '#72767d', mr: 1 }} />
            }}
          />
        </SearchContainer>

        <DiscordContent>
          <ContentArea sx={{ 
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {friendsTab === 0 && (
              <>
                <Typography variant="h6" sx={{ color: '#b9bbbe', mb: 2, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Online — {filteredFriends.filter(f => f.status === 'online').length}
                </Typography>
                {filteredFriends.filter(friend => friend.status === 'online').length === 0 ? (
                  <Box sx={{ 
                    py: 8,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch'
                  }}>
                    <Box sx={{ 
                      backgroundColor: '#000000', 
                      border: '2px solid #8B5CF6', 
                      borderRadius: '8px', 
                      p: 4, 
                      width: '100%'
                    }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        No one's around to play with Wumpus.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                        None of your friends are online right now.
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <List>
                    {filteredFriends.filter(friend => friend.status === 'online').map((friend) => (
                    <UserCard key={friend.id}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: getStatusColor(friend.status) }}>
                              {friend.username[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ color: '#dcddde', fontWeight: 500 }}>
                                {friend.username}#{friend.discriminator}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#b9bbbe', fontSize: '12px' }}>
                                {friend.activity || getStatusText(friend.status)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ color: '#b9bbbe' }}>
                              <Call fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#b9bbbe' }}>
                              <VideoCall fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </UserCard>
                    ))}
                  </List>
                )}
              </>
            )}

            {friendsTab === 1 && (
              <>
                <Typography variant="h6" sx={{ color: '#b9bbbe', mb: 2, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  All Friends — {filteredFriends.length}
                </Typography>
                {filteredFriends.length === 0 ? (
                  <Box sx={{ 
                    py: 8,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch'
                  }}>
                    <Box sx={{ 
                      backgroundColor: '#000000', 
                      border: '2px solid #8B5CF6', 
                      borderRadius: '8px', 
                      p: 4, 
                      width: '100%'
                    }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        Wumpus is waiting on friends.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                        You can start by adding a friend above!
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <List>
                    {filteredFriends.map((friend) => (
                    <UserCard key={friend.id}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: getStatusColor(friend.status) }}>
                              {friend.username[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ color: '#dcddde', fontWeight: 500 }}>
                                {friend.username}#{friend.discriminator}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#b9bbbe', fontSize: '12px' }}>
                                {friend.activity || getStatusText(friend.status)}
                              </Typography>
                            </Box>
                          </Box>
                          <StatusChip 
                            label={getStatusText(friend.status)}
                            size="small"
                            sx={{ 
                              backgroundColor: getStatusColor(friend.status),
                              color: 'white'
                            }}
                          />
                        </Box>
                      </CardContent>
                    </UserCard>
                    ))}
                  </List>
                )}
              </>
            )}

            {friendsTab === 2 && (
              <>
                <Typography variant="h6" sx={{ color: '#b9bbbe', mb: 2, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Pending — {filteredPendingRequests.length}
                </Typography>
                {filteredPendingRequests.length === 0 ? (
                  <Box sx={{ 
                    py: 8,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch'
                  }}>
                    <Box sx={{ 
                      backgroundColor: '#000000', 
                      border: '2px solid #8B5CF6', 
                      borderRadius: '8px', 
                      p: 4, 
                      width: '100%'
                    }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        There are no pending friend requests.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                        Here's where you'll see incoming and outgoing friend requests.
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <List>
                    {filteredPendingRequests.map((request) => (
                    <UserCard key={request.id}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#5865f2' }}>
                              {request.username[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ color: '#dcddde', fontWeight: 500 }}>
                                {request.username}#{request.discriminator}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#b9bbbe', fontSize: '12px' }}>
                                {request.incoming ? 'Incoming Friend Request' : 'Outgoing Friend Request'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {request.incoming ? (
                              <>
                                <Button 
                                  variant="contained" 
                                  size="small"
                                  onClick={() => handleAcceptRequest(request.id)}
                                  sx={{ 
                                    backgroundColor: '#3BA55D', 
                                    '&:hover': { backgroundColor: '#2D7D32' }
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  onClick={() => handleDeclineRequest(request.id)}
                                  sx={{ 
                                    borderColor: '#ED4245', 
                                    color: '#ED4245',
                                    '&:hover': { 
                                      borderColor: '#C62828',
                                      backgroundColor: 'rgba(237, 66, 69, 0.1)'
                                    }
                                  }}
                                >
                                  Ignore
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => handleCancelRequest(request.id)}
                                sx={{ 
                                  borderColor: '#72767d', 
                                  color: '#72767d',
                                  '&:hover': { 
                                    borderColor: '#5865f2',
                                    backgroundColor: 'rgba(88, 101, 242, 0.1)'
                                  }
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </UserCard>
                    ))}
                  </List>
                )}
              </>
            )}

            {friendsTab === 3 && (
              <>
                <Typography variant="h6" sx={{ color: '#b9bbbe', mb: 2, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Blocked — {filteredBlockedUsers.length}
                </Typography>
                {filteredBlockedUsers.length === 0 ? (
                  <Box sx={{ 
                    py: 8,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch'
                  }}>
                    <Box sx={{ 
                      backgroundColor: '#000000', 
                      border: '2px solid #8B5CF6', 
                      borderRadius: '8px', 
                      p: 4, 
                      width: '100%'
                    }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                        You can't unblock the Wumpus.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                        You haven't blocked anyone yet.
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <List>
                    {filteredBlockedUsers.map((user) => (
                    <UserCard key={user.id}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#ED4245' }}>
                              {user.username[0].toUpperCase()}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ color: '#dcddde', fontWeight: 500 }}>
                                  {user.username}#{user.discriminator}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  Blocked
                                </Typography>
                              }
                            />
                          </Box>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleUnblockUser(user.id)}
                            sx={{ 
                              borderColor: '#3BA55D', 
                              color: '#3BA55D',
                              '&:hover': { 
                                borderColor: '#2D7D32',
                                backgroundColor: 'rgba(59, 165, 93, 0.1)'
                              }
                            }}
                          >
                            Unblock
                          </Button>
                        </Box>
                      </CardContent>
                    </UserCard>
                    ))}
                  </List>
                )}
              </>
            )}
            
            {/* Add Friend Dialog */}
            <Dialog open={addFriendOpen} onClose={handleCloseAddFriend} maxWidth="sm" fullWidth>
              <DialogTitle>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Add Friend
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You can add friends with their Canble username.
                </Typography>
              </DialogTitle>
              <DialogContent>
                {addFriendError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {addFriendError}
                  </Alert>
                )}
                <TextField
                  autoFocus
                  fullWidth
                  label="Username"
                  placeholder="Enter a username"
                  value={addFriendUsername}
                  onChange={(e) => {
                    setAddFriendUsername(e.target.value);
                    setAddFriendError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFriend();
                    }
                  }}
                  sx={{ mt: 1 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseAddFriend} color="inherit">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddFriend} 
                  variant="contained"
                  sx={{
                    backgroundColor: '#5865F2',
                    '&:hover': { backgroundColor: '#4752C4' }
                  }}
                >
                  Send Friend Request
                </Button>
              </DialogActions>
            </Dialog>
            
          </ContentArea>
        </DiscordContent>
      </DiscordContainer>
      
    );
  }

  // Render Learn More page
  if (showLearnMore) {
    return (
      <DiscordContainer>
        <DiscordHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Info sx={{ color: '#8B5CF6', mr: 2 }} />
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Learn More - Canble Drift
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setShowLearnMore(false)}
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DiscordHeader>
        
        <DiscordContent>
          <ContentArea sx={{ 
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px'
          }}>
            {/* Hero Section */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h2" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>
                Canble Drift Premium
              </Typography>
              <Typography variant="h5" sx={{ color: '#8B5CF6', mb: 4, maxWidth: '800px', mx: 'auto' }}>
                Unlock the full potential of your Canble experience with premium features designed for power users and communities.
              </Typography>
            </Box>

            {/* Detailed Features */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                  border: '2px solid #8B5CF6',
                  borderRadius: '16px',
                  p: 4,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <VideoCall sx={{ color: '#8B5CF6', fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      Enhanced Streaming
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#ffffff', mb: 3, lineHeight: 1.6 }}>
                    Experience crystal-clear communication with:
                  </Typography>
                  <Box component="ul" sx={{ color: '#8B5CF6', pl: 2 }}>
                    <li>1080p 60fps video streaming</li>
                    <li>High-quality audio with noise suppression</li>
                    <li>Screen sharing with full resolution</li>
                    <li>Priority server connections</li>
                  </Box>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                  border: '2px solid #8B5CF6',
                  borderRadius: '16px',
                  p: 4,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AttachFile sx={{ color: '#8B5CF6', fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      File & Media
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#ffffff', mb: 3, lineHeight: 1.6 }}>
                    Share more with expanded limits:
                  </Typography>
                  <Box component="ul" sx={{ color: '#8B5CF6', pl: 2 }}>
                    <li>100MB file upload limit (vs 8MB)</li>
                    <li>High-quality image uploads</li>
                    <li>Video file sharing support</li>
                    <li>Custom emoji uploads</li>
                  </Box>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                  border: '2px solid #8B5CF6',
                  borderRadius: '16px',
                  p: 4,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Star sx={{ color: '#8B5CF6', fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      Personalization
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#ffffff', mb: 3, lineHeight: 1.6 }}>
                    Express yourself uniquely:
                  </Typography>
                  <Box component="ul" sx={{ color: '#8B5CF6', pl: 2 }}>
                    <li>Animated profile pictures</li>
                    <li>Custom profile banners</li>
                    <li>Drift King badge</li>
                    <li>Priority username changes</li>
                  </Box>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                  border: '2px solid #8B5CF6',
                  borderRadius: '16px',
                  p: 4,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <EmojiEmotions sx={{ color: '#8B5CF6', fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      Global Features
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#ffffff', mb: 3, lineHeight: 1.6 }}>
                    Use premium features everywhere:
                  </Typography>
                  <Box component="ul" sx={{ color: '#8B5CF6', pl: 2 }}>
                    <li>Custom emojis across all servers</li>
                    <li>Global profile customization</li>
                    <li>Enhanced friend list features</li>
                    <li>Priority customer support</li>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Pricing Section */}
            <Box sx={{ 
              textAlign: 'center', 
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              border: '2px solid #8B5CF6',
              borderRadius: '20px',
              p: 6,
              mb: 6
            }}>
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
                Simple Pricing
              </Typography>
              <Typography variant="h1" sx={{ color: '#8B5CF6', fontWeight: 700, mb: 2 }}>
                $9.99
                <Typography component="span" variant="h4" sx={{ color: '#A855F7' }}>
                  /month
                </Typography>
              </Typography>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 4 }}>
                Cancel anytime • No hidden fees • Instant activation
              </Typography>
              <PremiumButton
                onClick={() => {
                  setShowLearnMore(false);
                  handleSubscribe('Canble Drift', '$9.99/month');
                }}
                sx={{ fontSize: '18px', py: 2, px: 4 }}
              >
                Get Canble Drift Now
              </PremiumButton>
            </Box>

            {/* FAQ Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 700, mb: 4, textAlign: 'center' }}>
                Frequently Asked Questions
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 600, mb: 1 }}>
                      Can I cancel anytime?
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      Yes! You can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 600, mb: 1 }}>
                      Do I get a free trial?
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      We offer a 7-day free trial for new users. No credit card required to start your trial.
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 600, mb: 1 }}>
                      What payment methods do you accept?
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      We accept all major credit cards, PayPal, and various regional payment methods.
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 600, mb: 1 }}>
                      Is my data secure?
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff' }}>
                      Absolutely. We use industry-standard encryption and security measures to protect your data and privacy.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Back to Drift Button */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setShowLearnMore(false)}
                sx={{
                  borderColor: '#8B5CF6',
                  color: '#8B5CF6',
                  fontSize: '16px',
                  py: 1.5,
                  px: 4,
                  '&:hover': {
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)'
                  }
                }}
              >
                Back to Drift
              </Button>
            </Box>
          </ContentArea>
        </DiscordContent>
        
        {/* Purchase Panel for Drift page */}
        <PurchasePanel
          open={purchasePanelOpen}
          onClose={() => setPurchasePanelOpen(false)}
          planName={selectedPlan?.name || ''}
          planPrice={selectedPlan?.price || ''}
        />
      </DiscordContainer>
    );
  }

  // Render Direct Messages page (only when no specific channel is selected)
  if (selectedDMCategory === 'direct-messages' && !currentChannel) {
    return (
      <DiscordContainer>
        <DiscordHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Send sx={{ color: '#8B5CF6', mr: 2 }} />
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Direct Messages
            </Typography>
          </Box>
        </DiscordHeader>
        
        <DiscordContent>
          <ContentArea sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-start', 
            alignItems: 'stretch',
            minHeight: '100%',
            backgroundColor: '#000000'
          }}>
            {/* Main Content */}
            <Box sx={{ width: '100%', maxWidth: 'none' }}>
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
                Direct Messages
              </Typography>
              <Typography variant="h6" sx={{ color: '#8B5CF6', mb: 6 }}>
                Start a conversation with your friends.
              </Typography>
              
              <Box sx={{ 
                backgroundColor: '#000000', 
                border: '2px solid #8B5CF6', 
                borderRadius: '8px', 
                p: 4, 
                mb: 4,
                width: '100%'
              }}>
                <Typography variant="h5" sx={{ color: '#ffffff', mb: 2 }}>
                  No Direct Messages
                </Typography>
                <Typography variant="body1" sx={{ color: '#8B5CF6' }}>
                  When you start a conversation, it will appear here.
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#8B5CF6', opacity: 0.7 }}>
                Click on a friend from the sidebar to start chatting
              </Typography>
            </Box>
          </ContentArea>
        </DiscordContent>
      </DiscordContainer>
    );
  }

  // Render Drift page
  if (selectedDMCategory === 'drft') {
    return (
      <DiscordContainer>
        <DiscordHeader>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VolumeUp sx={{ color: '#8B5CF6', mr: 2 }} />
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Drift
            </Typography>
          </Box>
        </DiscordHeader>
        
        <DiscordContent>
          <ContentArea sx={{ 
            minHeight: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Hero Section */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
                Canble Drift
              </Typography>
              <Typography variant="h6" sx={{ color: '#8B5CF6', mb: 4 }}>
                Get an enhanced Canble experience for you and your friends.
              </Typography>
              <PremiumButton
                onClick={() => handleSubscribe('Canble Drift', '$9.99/month')}
                sx={{ mr: 2 }}
              >
                Subscribe for $9.99/month
              </PremiumButton>
              <Button
                variant="outlined"
                onClick={() => setShowLearnMore(true)}
                sx={{
                  borderColor: '#8B5CF6',
                  color: '#8B5CF6',
                  '&:hover': {
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)'
                  }
                }}>
                Learn More
              </Button>
            </Box>

            {/* Features Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '12px', 
                        backgroundColor: '#8B5CF6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <Star sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        Higher Quality Streaming
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                      Stream, share videos and use your camera in higher quality.
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '12px', 
                        backgroundColor: '#8B5CF6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <EmojiEmotions sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        Custom Emojis Everywhere
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                      Use custom emojis from any server in any other server.
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '12px', 
                        backgroundColor: '#8B5CF6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <AttachFile sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        Bigger File Uploads
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                      Upload files up to 100MB and send super high-quality images.
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '12px', 
                        backgroundColor: '#8B5CF6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <Star sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        Drift King
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                      Get a Drift King badge to show off your favorite server.
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            </Grid>

            {/* Second Row Features */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '12px', 
                        backgroundColor: '#8B5CF6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <Star sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        Animated Avatar
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                      Express yourself with an animated avatar and profile.
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FeatureCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '12px', 
                        backgroundColor: '#8B5CF6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <VideoCall sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        HD Video
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
                      Go live and stream in up to 1080p 60fps quality.
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            </Grid>

            {/* Bottom Section */}
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography variant="h5" sx={{ color: '#ffffff', mb: 2 }}>
                {selectedDMCategory === 'drft' ? 'Drift King Elite' : 'No Direct Messages'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#8B5CF6' }}>
                {selectedDMCategory === 'drft' 
                  ? 'Premium features coming soon...' 
                  : 'When you start a conversation, it will appear here.'}
              </Typography>
            </Box>
          </ContentArea>
        </DiscordContent>
      </DiscordContainer>
    );
  }

  // Default chat interface
  if (!currentChannel) {
    return (
      <ChatContainer>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#b9bbbe'
        }}>
          <Typography variant="h6">Select a channel to start chatting</Typography>
        </Box>
      </ChatContainer>
    );
  }

  // At this point, currentChannel is guaranteed to exist
  // Use test messages for Test DM channel, otherwise use real messages
  const channelMessages = currentChannel._id === 'dm_1' 
    ? testChannelMessages 
    : messages[currentChannel._id] || [];
  const currentChannelTypingUsers = Object.values(typingUsers[currentChannel._id] || {}).map((user: any) => user.username);

  return (
    <ChatContainer>
      <ChannelInfo>
        {getChannelIcon()}
        <ChannelName variant="h6">
          {currentChannel.name}
        </ChannelName>
        {currentChannel.topic && (
          <>
            <Box sx={{ width: '2px', height: '24px', backgroundColor: '#8B5CF6', mx: 2, borderRadius: '1px', boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' }} />
            <ChannelTopic variant="body2">
              {currentChannel.topic}
            </ChannelTopic>
          </>
        )}
        <HeaderActions>
          <Tooltip title="Start Voice Call">
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <Call />
            </IconButton>
          </Tooltip>
          <Tooltip title="Start Video Call">
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <VideoCall />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pin Message">
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <PushPin />
            </IconButton>
          </Tooltip>
          <Tooltip title="Member List">
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notification Settings">
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <Notifications />
            </IconButton>
          </Tooltip>
          <Tooltip title="Help">
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <Help />
            </IconButton>
          </Tooltip>
        </HeaderActions>
      </ChannelInfo>
      
      <MessagesContainer>
        {channelMessages.map((message: any) => (
          <Box 
            key={message.id} 
            sx={{ 
              display: 'flex', 
              gap: 2,
              padding: '12px 20px',
              borderRadius: '8px',
              margin: '2px 0',
              transition: 'all 0.1s ease',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderLeft: '3px solid #8B5CF6'
              }
            }}
          >
            <Avatar 
              src={message.author.avatar} 
              sx={{ 
                width: 40, 
                height: 40,
                border: '2px solid #8B5CF6',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
              }}
            >
              {message.author.username[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#8B5CF6', 
                    fontWeight: 600,
                    fontSize: '16px',
                    textShadow: '0 0 5px rgba(139, 92, 246, 0.5)'
                  }}
                >
                  {message.author.username}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#A855F7',
                    fontSize: '12px',
                    opacity: 0.8
                  }}
                >
                  {new Date(message.createdAt).toLocaleTimeString()}
                </Typography>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#ffffff',
                  fontSize: '16px',
                  lineHeight: 1.375,
                  wordWrap: 'break-word'
                }}
              >
                {message.content}
              </Typography>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      {currentChannelTypingUsers.length > 0 && (
        <TypingIndicator>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              gap: '2px',
              '& > div': {
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#8B5CF6',
                boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)',
                animation: 'typing 1.4s infinite ease-in-out'
              },
              '& > div:nth-of-type(1)': { animationDelay: '-0.32s' },
              '& > div:nth-of-type(2)': { animationDelay: '-0.16s' },
              '@keyframes typing': {
                '0%, 80%, 100%': { transform: 'scale(0)' },
                '40%': { transform: 'scale(1)' }
              }
            }}>
              <div />
              <div />
              <div />
            </Box>
            <Typography variant="body2" sx={{ color: '#8B5CF6' }}>
              {currentChannelTypingUsers.join(', ')} {currentChannelTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </Typography>
          </Box>
        </TypingIndicator>
      )}
      
      <MessageInputContainer>
        <MessageInputWrapper>
          <IconButton 
            size="small" 
            sx={{ 
              color: '#8B5CF6',
              '&:hover': {
                color: '#A855F7',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
              }
            }}
          >
            <Add />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Message #${currentChannel.name}`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                color: '#ffffff',
                fontSize: '16px',
                backgroundColor: 'transparent',
                '& .MuiInputBase-input': {
                  padding: '8px 0',
                  '&::placeholder': {
                    color: '#8B5CF6',
                    opacity: 0.7
                  }
                }
              }
            }}
          />
          <InputActions>
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <Gif />
            </IconButton>
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              <AttachFile />
            </IconButton>
            <IconButton 
              size="small" 
              sx={{ 
                color: '#8B5CF6',
                '&:hover': {
                  color: '#A855F7',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <EmojiEmotions />
            </IconButton>
            {messageText.trim() && (
              <Tooltip title="Send message">
                <IconButton 
                  size="small" 
                  onClick={handleSendMessage}
                  sx={{ 
                    color: '#A855F7',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid #8B5CF6',
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: '#8B5CF6',
                      boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
                    }
                  }}
                >
                  <Send />
                </IconButton>
              </Tooltip>
            )}
          </InputActions>
        </MessageInputWrapper>
      </MessageInputContainer>
    </ChatContainer>
  );
};

export default ChatArea;
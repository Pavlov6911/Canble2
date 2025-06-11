import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useAppSelector } from '../../store/hooks';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 2),
  minHeight: 32,
  opacity: 0.8
}));

const TypingDots = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.25),
  marginLeft: theme.spacing(1)
}));

const Dot = styled('div')(({ theme }) => ({
  width: 4,
  height: 4,
  borderRadius: '50%',
  backgroundColor: theme.palette.text.secondary,
  animation: `${bounce} 1.4s infinite ease-in-out`,
  '&:nth-of-type(1)': {
    animationDelay: '-0.32s'
  },
  '&:nth-of-type(2)': {
    animationDelay: '-0.16s'
  }
}));

const UserAvatars = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& .MuiAvatar-root': {
    marginLeft: theme.spacing(-0.5),
    border: `2px solid ${theme.palette.background.paper}`,
    '&:first-of-type': {
      marginLeft: 0
    }
  }
}));

interface TypingUser {
  id: string;
  username: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  channelId: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ channelId }) => {
  const { typingUsers } = useAppSelector((state) => state.messages);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  // Filter out current user and get typing users for this channel
  const channelTypingUsers = Object.entries(typingUsers[channelId] || {})
    .filter(([userId]) => userId !== currentUser?._id)
    .map(([userId, userData]) => ({
      id: userId,
      username: userData.username,
      avatar: undefined // Avatar not stored in typing users
    }));

  if (channelTypingUsers.length === 0) {
    return null;
  }

  const renderTypingText = () => {
    const count = channelTypingUsers.length;
    
    if (count === 1) {
      return (
        <Typography variant="caption" color="text.secondary">
          <strong>{channelTypingUsers[0].username}</strong> is typing
        </Typography>
      );
    } else if (count === 2) {
      return (
        <Typography variant="caption" color="text.secondary">
          <strong>{channelTypingUsers[0].username}</strong> and{' '}
          <strong>{channelTypingUsers[1].username}</strong> are typing
        </Typography>
      );
    } else if (count === 3) {
      return (
        <Typography variant="caption" color="text.secondary">
          <strong>{channelTypingUsers[0].username}</strong>,{' '}
          <strong>{channelTypingUsers[1].username}</strong>, and{' '}
          <strong>{channelTypingUsers[2].username}</strong> are typing
        </Typography>
      );
    } else {
      return (
        <Typography variant="caption" color="text.secondary">
          <strong>{channelTypingUsers[0].username}</strong>,{' '}
          <strong>{channelTypingUsers[1].username}</strong>, and{' '}
          <strong>{count - 2} others</strong> are typing
        </Typography>
      );
    }
  };

  return (
    <TypingContainer>
      <UserAvatars>
        {channelTypingUsers.slice(0, 3).map((user: TypingUser) => (
          <Avatar
            key={user.id}
            src={user.avatar}
            sx={{ width: 20, height: 20, fontSize: '0.75rem' }}
          >
            {user.username[0].toUpperCase()}
          </Avatar>
        ))}
      </UserAvatars>
      
      {renderTypingText()}
      
      <TypingDots>
        <Dot />
        <Dot />
        <Dot />
      </TypingDots>
    </TypingContainer>
  );
};

export default TypingIndicator;
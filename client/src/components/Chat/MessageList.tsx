import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { Message as MessageType } from '../../store/slices/messagesSlice';

interface MessageListProps {
  channelId: string;
}

const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, hasMore } = useAppSelector((state) => state.messages);
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const channelMessages = messages[channelId] || [];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [channelMessages]);
  
  if (loading && channelMessages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (channelMessages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          textAlign: 'center',
          px: 3
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No messages yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Be the first to send a message in this channel!
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {channelMessages.map((message: MessageType, index: number) => {
        const previousMessage = index > 0 ? channelMessages[index - 1] : null;
        const isGrouped = previousMessage &&
          previousMessage.author._id === message.author._id &&
          new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 5 * 60 * 1000; // 5 minutes
        
        return (
          <Message
            key={message._id}
            message={message}
          />
        );
      })}
      
      <TypingIndicator channelId={channelId} />
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Link,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Button
} from '@mui/material';
import {
  MoreVert,
  Reply,
  Edit,
  Delete,
  ContentCopy,
  PushPin,
  EmojiEmotions,
  Link as LinkIcon,
  Download,
  PlayArrow,
  VolumeUp,
  Image as ImageIcon,
  Description,
  VideoFile
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addReaction, removeReaction } from '../../store/slices/messagesSlice';
import { Message as MessageType, MessageReaction } from '../../store/slices/messagesSlice';

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn' && prop !== 'isHovered'
})<{ isOwn?: boolean; isHovered?: boolean }>(({ theme, isOwn, isHovered }) => ({
  padding: theme.spacing(0.5, 2),
  backgroundColor: isHovered ? theme.palette.action.hover : 'transparent',
  borderLeft: isOwn ? `3px solid ${theme.palette.primary.main}` : 'none',
  transition: 'background-color 0.2s ease',
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    '& .message-actions': {
      opacity: 1
    }
  }
}));

const MessageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(0.5)
}));

const MessageContent = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(6),
  wordBreak: 'break-word',
  '& p': {
    margin: 0,
    lineHeight: 1.4
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  '& code': {
    backgroundColor: theme.palette.grey[800],
    padding: theme.spacing(0.25, 0.5),
    borderRadius: 4,
    fontSize: '0.875rem',
    fontFamily: 'monospace'
  },
  '& pre': {
    backgroundColor: theme.palette.grey[800],
    padding: theme.spacing(1),
    borderRadius: 4,
    overflow: 'auto',
    margin: theme.spacing(1, 0),
    '& code': {
      backgroundColor: 'transparent',
      padding: 0
    }
  }
}));

const MessageActions = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -8,
  right: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 4,
  display: 'flex',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  boxShadow: theme.shadows[2]
}));

const AttachmentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

const AttachmentCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  backgroundColor: theme.palette.grey[800]
}));

const EmbedCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  backgroundColor: theme.palette.grey[800],
  borderLeft: `4px solid ${theme.palette.primary.main}`
}));

const ReactionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
  marginLeft: theme.spacing(6)
}));

const ReactionChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'isReacted'
})<{ isReacted?: boolean }>(({ theme, isReacted }) => ({
  height: 24,
  fontSize: '0.75rem',
  backgroundColor: isReacted ? theme.palette.primary.main : theme.palette.grey[700],
  color: isReacted ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: isReacted ? theme.palette.primary.dark : theme.palette.grey[600]
  }
}));

const ReplyIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginLeft: theme.spacing(6),
  marginBottom: theme.spacing(0.5),
  opacity: 0.7,
  fontSize: '0.875rem'
}));

interface MessageProps {
  message: MessageType;
  showAvatar?: boolean;
  isCompact?: boolean;
}

const Message: React.FC<MessageProps> = ({ message, showAvatar = true, isCompact = false }) => {
  const dispatch = useAppDispatch();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAppSelector((state) => state.auth);
  const isOwn = message.author._id === user?._id;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleReaction = (emoji: string) => {
    const existingReaction = message.reactions?.find(r => r.emoji.name === emoji);
    const userReacted = existingReaction?.users.includes(user?._id || '');

    if (userReacted) {
      dispatch(removeReaction({ channelId: message.channel, messageId: message._id, emoji }));
    } else {
      dispatch(addReaction({ channelId: message.channel, messageId: message._id, emoji }));
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  const handleReply = () => {
    // Implement reply functionality
    handleMenuClose();
  };

  const handleEdit = () => {
    // Implement edit functionality
    handleMenuClose();
  };

  const handleDelete = () => {
    // Implement delete functionality
    handleMenuClose();
  };

  const handlePin = () => {
    // Implement pin functionality
    handleMenuClose();
  };

  const formatContent = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  const renderAttachment = (attachment: any) => {
    const isImage = attachment.contentType?.startsWith('image/');
    const isVideo = attachment.contentType?.startsWith('video/');
    const isAudio = attachment.contentType?.startsWith('audio/');

    if (isImage) {
      return (
        <AttachmentCard key={attachment.id}>
          <CardMedia
            component="img"
            image={attachment.url}
            alt={attachment.filename}
            sx={{ maxHeight: 300, objectFit: 'contain' }}
          />
          <CardContent sx={{ p: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {attachment.filename} • {(attachment.size / 1024).toFixed(1)} KB
            </Typography>
          </CardContent>
        </AttachmentCard>
      );
    }

    if (isVideo) {
      return (
        <AttachmentCard key={attachment.id}>
          <CardMedia
            component="video"
            src={attachment.url}
            controls
            sx={{ maxHeight: 300 }}
          />
          <CardContent sx={{ p: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {attachment.filename} • {(attachment.size / 1024 / 1024).toFixed(1)} MB
            </Typography>
          </CardContent>
        </AttachmentCard>
      );
    }

    if (isAudio) {
      return (
        <AttachmentCard key={attachment.id}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUp />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{attachment.filename}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(attachment.size / 1024 / 1024).toFixed(1)} MB
                </Typography>
              </Box>
              <IconButton size="small">
                <PlayArrow />
              </IconButton>
            </Box>
            <audio controls style={{ width: '100%', marginTop: 8 }}>
              <source src={attachment.url} type={attachment.contentType} />
            </audio>
          </CardContent>
        </AttachmentCard>
      );
    }

    return (
      <AttachmentCard key={attachment.id}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{attachment.filename}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(attachment.size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            <IconButton size="small" component="a" href={attachment.url} download>
              <Download />
            </IconButton>
          </Box>
        </CardContent>
      </AttachmentCard>
    );
  };

  const renderEmbed = (embed: any) => {
    return (
      <EmbedCard key={embed.url}>
        {embed.image && (
          <CardMedia
            component="img"
            image={embed.image.url}
            alt={embed.title}
            sx={{ maxHeight: 200, objectFit: 'cover' }}
          />
        )}
        <CardContent>
          {embed.title && (
            <Typography variant="h6" gutterBottom>
              {embed.url ? (
                <Link href={embed.url} target="_blank" rel="noopener noreferrer">
                  {embed.title}
                </Link>
              ) : (
                embed.title
              )}
            </Typography>
          )}
          {embed.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {embed.description}
            </Typography>
          )}
          {embed.fields && embed.fields.map((field: any, index: number) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {field.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {field.value}
              </Typography>
            </Box>
          ))}
          {embed.footer && (
            <Typography variant="caption" color="text.secondary">
              {embed.footer.text}
            </Typography>
          )}
        </CardContent>
      </EmbedCard>
    );
  };

  return (
    <MessageContainer
      ref={messageRef}
      isOwn={isOwn}
      isHovered={isHovered}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {message.referencedMessage && (
        <ReplyIndicator>
          <Reply fontSize="small" />
          <Avatar src={message.referencedMessage.author.avatar} sx={{ width: 16, height: 16 }}>
            {message.referencedMessage.author.username[0]}
          </Avatar>
          <Typography variant="caption">
            {message.referencedMessage.author.username}: {message.referencedMessage.content.substring(0, 50)}
            {message.referencedMessage.content.length > 50 ? '...' : ''}
          </Typography>
        </ReplyIndicator>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {showAvatar && (
          <Avatar
            src={message.author.avatar}
            sx={{ width: 40, height: 40, mt: 0.5 }}
          >
            {message.author.username[0].toUpperCase()}
          </Avatar>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {showAvatar && (
            <MessageHeader>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {message.author.username}
              </Typography>
              {message.author.bot && (
                <Chip label="BOT" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem' }} />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </Typography>
              {message.editedTimestamp && (
                <Tooltip title={`Edited ${formatDistanceToNow(new Date(message.editedTimestamp), { addSuffix: true })}`}>
                  <Typography variant="caption" color="text.secondary">
                    (edited)
                  </Typography>
                </Tooltip>
              )}
            </MessageHeader>
          )}

          <MessageContent>
            <Typography
              variant="body2"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </MessageContent>

          {message.attachments && message.attachments.length > 0 && (
            <AttachmentContainer>
              {message.attachments.map(renderAttachment)}
            </AttachmentContainer>
          )}

          {message.embeds && message.embeds.length > 0 && (
            <AttachmentContainer>
              {message.embeds.map(renderEmbed)}
            </AttachmentContainer>
          )}
        </Box>
      </Box>

      {message.reactions && message.reactions.length > 0 && (
        <ReactionsContainer>
          {message.reactions.map((reaction: MessageReaction) => {
            const userReacted = reaction.users.includes(user?._id || '');
            return (
              <ReactionChip
                key={reaction.emoji.name}
                label={`${reaction.emoji.name} ${reaction.count}`}
                size="small"
                isReacted={userReacted}
                onClick={() => handleReaction(reaction.emoji.name)}
                clickable
              />
            );
          })}
          <IconButton
            size="small"
            sx={{ width: 24, height: 24 }}
            onClick={() => handleReaction('👍')}
          >
            <EmojiEmotions fontSize="small" />
          </IconButton>
        </ReactionsContainer>
      )}

      <MessageActions className="message-actions">
        <Tooltip title="Add Reaction">
          <IconButton size="small" onClick={() => handleReaction('👍')}>
            <EmojiEmotions fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reply">
          <IconButton size="small" onClick={handleReply}>
            <Reply fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="More">
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </MessageActions>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Message</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleReply}>
          <ListItemIcon>
            <Reply fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>

        {isOwn && [
          <MenuItem key="edit" onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Message</ListItemText>
          </MenuItem>,
          <MenuItem key="delete" onClick={handleDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Message</ListItemText>
          </MenuItem>
        ]}

        <Divider />
        
        <MenuItem onClick={handlePin}>
          <ListItemIcon>
            <PushPin fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pin Message</ListItemText>
        </MenuItem>
      </Menu>
    </MessageContainer>
  );
};

export default Message;
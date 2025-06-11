import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Typography,
  Paper,
  Divider,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  GifBox,
  Close,
  Image,
  VideoFile,
  AudioFile,
  Description,
  Reply,
  Edit
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { sendMessage, editMessage } from '../../store/slices/messagesSlice';
import { sendTyping } from '../../store/slices/channelsSlice';

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2, 2, 2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`
}));

const ReplyContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.grey[800],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const AttachmentPreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[800],
  borderRadius: theme.shape.borderRadius
}));

const AttachmentItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.grey[700],
  borderRadius: theme.shape.borderRadius,
  maxWidth: 200
}));

const InputWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.grey[800],
  borderRadius: 24,
  padding: theme.spacing(0.5, 1)
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    border: 'none',
    '& fieldset': {
      border: 'none'
    },
    '&:hover fieldset': {
      border: 'none'
    },
    '&.Mui-focused fieldset': {
      border: 'none'
    }
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 0),
    fontSize: '0.875rem',
    lineHeight: 1.4,
    maxHeight: 120,
    overflowY: 'auto'
  }
}));

const EmojiPicker = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: '100%',
  right: 0,
  width: 300,
  height: 200,
  padding: theme.spacing(1),
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gap: theme.spacing(0.5),
  overflowY: 'auto',
  zIndex: 1000
}));

const EmojiButton = styled(IconButton)(({ theme }) => ({
  fontSize: '1.2rem',
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

interface MessageInputProps {
  channelId: string;
  placeholder?: string;
  replyingTo?: any;
  editingMessage?: any;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  placeholder = "Message",
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit
}) => {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState<null | HTMLElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentChannel } = useAppSelector((state) => state.channels);

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐'
  ];

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      textFieldRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value && !isTyping) {
      setIsTyping(true);
      dispatch(sendTyping(channelId));
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
    setTypingTimeout(timeout);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!user || !channelId) return;

    try {
      if (editingMessage) {
        dispatch(editMessage({
          channelId,
          messageId: editingMessage.id,
          content: message.trim()
        }));
        onCancelEdit?.();
      } else {
        const formData = new FormData();
        formData.append('content', message.trim());
        if (replyingTo?.id) {
          formData.append('replyToId', replyingTo.id);
        }
        if (attachments.length > 0) {
          const uploadedAttachments = await uploadAttachments();
          if (uploadedAttachments) {
            formData.append('attachments', JSON.stringify(uploadedAttachments));
          }
        }
        
        dispatch(sendMessage({ channelId, messageData: formData }));
        onCancelReply?.();
      }

      // Reset form
      setMessage('');
      setAttachments([]);
      setIsTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const uploadAttachments = async (): Promise<any[]> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedAttachments = [];
      
      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        const formData = new FormData();
        formData.append('file', file);

        // Simulate upload progress
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          uploadedAttachments.push(result);
        }

        setUploadProgress(((i + 1) / attachments.length) * 100);
      }

      return uploadedAttachments;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.size <= 25 * 1024 * 1024); // 25MB limit
    
    if (validFiles.length !== files.length) {
      // Show error for files that are too large
      console.warn('Some files were too large and were not added');
    }

    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textFieldRef.current?.focus();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image />;
    if (file.type.startsWith('video/')) return <VideoFile />;
    if (file.type.startsWith('audio/')) return <AudioFile />;
    return <Description />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <InputContainer>
      {uploading && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Uploading attachments... {Math.round(uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {replyingTo && (
        <ReplyContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Reply fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Replying to <strong>{replyingTo.author.username}</strong>
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Close fontSize="small" />
          </IconButton>
        </ReplyContainer>
      )}

      {editingMessage && (
        <ReplyContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Editing message
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelEdit}>
            <Close fontSize="small" />
          </IconButton>
        </ReplyContainer>
      )}

      {attachments.length > 0 && (
        <AttachmentPreview>
          {attachments.map((file, index) => (
            <AttachmentItem key={index}>
              {getFileIcon(file)}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => removeAttachment(index)}
                sx={{ ml: 1 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </AttachmentItem>
          ))}
        </AttachmentPreview>
      )}

      <InputWrapper>
        <Tooltip title="Attach files">
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>

        <StyledTextField
          ref={textFieldRef}
          multiline
          maxRows={4}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={`${placeholder} ${currentChannel?.name || ''}`}
          disabled={uploading}
          variant="outlined"
        />

        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Emoji">
            <IconButton
              size="small"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <EmojiEmotions />
            </IconButton>
          </Tooltip>

          {showEmojiPicker && (
            <EmojiPicker>
              {commonEmojis.map((emoji, index) => (
                <EmojiButton
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  size="small"
                >
                  {emoji}
                </EmojiButton>
              ))}
            </EmojiPicker>
          )}
        </Box>

        <Tooltip title="GIF">
          <IconButton size="small">
            <GifBox />
          </IconButton>
        </Tooltip>

        <Tooltip title={editingMessage ? 'Save changes' : 'Send message'}>
          <IconButton
            size="small"
            onClick={handleSendMessage}
            disabled={!message.trim() && attachments.length === 0 || uploading}
            color="primary"
          >
            <Send />
          </IconButton>
        </Tooltip>
      </InputWrapper>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
    </InputContainer>
  );
};

export default MessageInput;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import { Group, Person } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { joinServer } from '../../store/slices/serversSlice';
import { closeModal } from '../../store/slices/uiSlice';

interface JoinServerDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ServerPreview {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  memberCount: number;
  onlineCount: number;
  verified: boolean;
  partnered: boolean;
}

const JoinServerDialog: React.FC<JoinServerDialogProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.servers);
  
  const [inviteLink, setInviteLink] = useState('');
  const [serverPreview, setServerPreview] = useState<ServerPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  
  const handleClose = () => {
    onClose();
    setInviteLink('');
    setServerPreview(null);
    setPreviewError('');
  };
  
  const extractInviteCode = (link: string): string | null => {
    // Extract invite code from various formats
    const patterns = [
      /canble\.gg\/([a-zA-Z0-9]+)/,
      /canbleapp\.com\/invite\/([a-zA-Z0-9]+)/,
      /canble\.app\/invite\/([a-zA-Z0-9]+)/,
      /^([a-zA-Z0-9]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  };
  
  const fetchServerPreview = async (link: string) => {
    const inviteCode = extractInviteCode(link);
    
    if (!inviteCode) {
      setPreviewError('Invalid invite link');
      return;
    }
    
    setPreviewLoading(true);
    setPreviewError('');
    
    try {
      // Mock server preview - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock server data
      const mockServer: ServerPreview = {
        id: inviteCode,
        name: 'Awesome Gaming Server',
        description: 'A place for gamers to hang out and play together',
        icon: '',
        memberCount: 1234,
        onlineCount: 567,
        verified: Math.random() > 0.7,
        partnered: Math.random() > 0.8
      };
      
      setServerPreview(mockServer);
    } catch (error) {
      setPreviewError('Failed to load server preview');
    } finally {
      setPreviewLoading(false);
    }
  };
  
  const handleInviteLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInviteLink(value);
    setServerPreview(null);
    setPreviewError('');
    
    if (value.trim()) {
      const timeoutId = setTimeout(() => {
        fetchServerPreview(value.trim());
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };
  
  const handleJoinServer = async () => {
    if (!serverPreview) {
      return;
    }
    
    try {
      await dispatch(joinServer(serverPreview.id)).unwrap();
      
      handleClose();
    } catch (error) {
      // Error is handled by the slice
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle>
        Join a Server
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter an invite below to join an existing server
        </Typography>
        
        <TextField
          autoFocus
          label="Invite Link"
          fullWidth
          value={inviteLink}
          onChange={handleInviteLinkChange}
          placeholder={`${process.env.REACT_APP_APP_URL || 'https://canble.app'}/invite/hTKzmak or hTKzmak`}
          error={!!previewError}
          helperText={previewError || 'Enter a server invite link or code'}
          sx={{ mb: 3 }}
        />
        
        {previewLoading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Loading server preview...
            </Typography>
          </Box>
        )}
        
        {serverPreview && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              You're about to join:
            </Typography>
            
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'action.hover'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={serverPreview.icon}
                  sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}
                >
                  {serverPreview.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6">
                      {serverPreview.name}
                    </Typography>
                    {serverPreview.verified && (
                      <Chip
                        label="Verified"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {serverPreview.partnered && (
                      <Chip
                        label="Partner"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {serverPreview.description && (
                    <Typography variant="body2" color="text.secondary">
                      {serverPreview.description}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {serverPreview.memberCount.toLocaleString()} members
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main'
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {serverPreview.onlineCount.toLocaleString()} online
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleJoinServer}
          disabled={!serverPreview || loading}
        >
          {loading ? 'Joining...' : 'Join Server'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinServerDialog;
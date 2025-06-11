import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ContentCopy, Refresh, Settings } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeModal } from '../../store/slices/uiSlice';

interface InviteDialogProps {
  open: boolean;
  serverId?: string;
  channelId?: string;
}

const InviteDialog: React.FC<InviteDialogProps> = ({ open, serverId, channelId }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const [inviteLink, setInviteLink] = useState('');
  const [expiresAfter, setExpiresAfter] = useState('7d');
  const [maxUses, setMaxUses] = useState('0');
  const [temporaryMembership, setTemporaryMembership] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const generateInviteLink = async () => {
    setLoading(true);
    try {
      // Mock invite link generation
      const inviteCode = Math.random().toString(36).substring(2, 10);
      const link = `${process.env.REACT_APP_APP_URL || 'https://canble.app'}/invite/${inviteCode}`;
      setInviteLink(link);
    } catch (error) {
      console.error('Failed to generate invite link:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (open && !inviteLink) {
      generateInviteLink();
    }
  }, [open]);
  
  const handleClose = () => {
    dispatch(closeModal('invite'));
    setInviteLink('');
    setCopied(false);
    setShowAdvanced(false);
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };
  
  const expirationOptions = [
    { value: '30m', label: '30 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '6h', label: '6 hours' },
    { value: '12h', label: '12 hours' },
    { value: '1d', label: '1 day' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'never', label: 'Never' }
  ];
  
  const maxUsesOptions = [
    { value: '0', label: 'No limit' },
    { value: '1', label: '1 use' },
    { value: '5', label: '5 uses' },
    { value: '10', label: '10 uses' },
    { value: '25', label: '25 uses' },
    { value: '50', label: '50 uses' },
    { value: '100', label: '100 uses' }
  ];
  
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
        Invite friends to {serverId ? 'server' : 'channel'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send a server invite link to a friend
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              value={inviteLink}
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: 'action.hover',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                }
              }}
              placeholder={loading ? 'Generating invite link...' : 'Invite link will appear here'}
            />
            <Tooltip title={copied ? 'Copied!' : 'Copy'}>
              <IconButton
                onClick={handleCopyLink}
                disabled={!inviteLink || loading}
                color={copied ? 'success' : 'default'}
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title="Generate new link">
              <IconButton
                onClick={generateInviteLink}
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Your invite link expires in {expirationOptions.find(opt => opt.value === expiresAfter)?.label.toLowerCase()}
            </Typography>
            <Chip
              size="small"
              label={maxUses === '0' ? 'No limit' : `${maxUses} uses`}
              variant="outlined"
            />
          </Box>
          
          <Button
            startIcon={<Settings />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            size="small"
            sx={{ mb: showAdvanced ? 2 : 0 }}
          >
            {showAdvanced ? 'Hide' : 'Edit invite link'}
          </Button>
          
          {showAdvanced && (
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Expire after</InputLabel>
                <Select
                  value={expiresAfter}
                  label="Expire after"
                  onChange={(e) => setExpiresAfter(e.target.value)}
                >
                  {expirationOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Max number of uses</InputLabel>
                <Select
                  value={maxUses}
                  label="Max number of uses"
                  onChange={(e) => setMaxUses(e.target.value)}
                >
                  {maxUsesOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={temporaryMembership}
                    onChange={(e) => setTemporaryMembership(e.target.checked)}
                  />
                }
                label="Grant temporary membership"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Members who used this invite will be kicked from the server after 24 hours unless a role is assigned to them.
              </Typography>
            </Box>
          )}
        </Box>
        
        {inviteLink && (
          <Alert severity="info">
            Anyone with this link will be able to join your server.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleCopyLink}
          disabled={!inviteLink || loading}
        >
          Copy Link
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteDialog;
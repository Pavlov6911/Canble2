import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Tag, VolumeUp } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createChannel } from '../../store/slices/channelsSlice';
import { closeModal } from '../../store/slices/uiSlice';

interface CreateChannelDialogProps {
  open: boolean;
  serverId: string;
}

const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({ open, serverId }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.channels);
  
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [description, setDescription] = useState('');
  
  const handleClose = () => {
    dispatch(closeModal('createChannel'));
    setChannelName('');
    setChannelType('text');
    setDescription('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelName.trim()) {
      return;
    }
    
    try {
      await dispatch(createChannel({
        serverId,
        channelData: {
          name: channelName.trim(),
          type: channelType,
          description: description.trim() || undefined
        }
      })).unwrap();
      
      handleClose();
    } catch (error) {
      // Error is handled by the slice
    }
  };
  
  const isValidChannelName = (name: string) => {
    return /^[a-z0-9-_]+$/.test(name) && name.length >= 1 && name.length <= 100;
  };
  
  const formatChannelName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };
  
  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatChannelName(e.target.value);
    setChannelName(formatted);
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
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Create Channel
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 2 }}>
                Channel Type
              </FormLabel>
              <RadioGroup
                value={channelType}
                onChange={(e) => setChannelType(e.target.value as 'text' | 'voice')}
              >
                <FormControlLabel
                  value="text"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tag fontSize="small" />
                      <Box>
                        <Typography variant="body1">Text</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Send messages, images, GIFs, emoji, opinions, and puns
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="voice"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VolumeUp fontSize="small" />
                      <Box>
                        <Typography variant="body1">Voice</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hang out together with voice, video, and screen share
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>
          
          <TextField
            autoFocus
            label="Channel Name"
            fullWidth
            value={channelName}
            onChange={handleChannelNameChange}
            error={channelName.length > 0 && !isValidChannelName(channelName)}
            helperText={
              channelName.length > 0 && !isValidChannelName(channelName)
                ? 'Channel names can only contain lowercase letters, numbers, hyphens, and underscores'
                : 'Channel names must be lowercase and cannot contain spaces'
            }
            sx={{ mb: 2 }}
            inputProps={{
              maxLength: 100
            }}
          />
          
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText="Help others understand what this channel is for"
            inputProps={{
              maxLength: 1024
            }}
          />
          
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
            type="submit"
            variant="contained"
            disabled={!channelName.trim() || !isValidChannelName(channelName) || loading}
          >
            {loading ? 'Creating...' : 'Create Channel'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateChannelDialog;
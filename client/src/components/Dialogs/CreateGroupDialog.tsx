import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { createGroup } from '../../store/slices/groupsSlice';
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
  Avatar,
  IconButton,
  Chip,
  Switch,
  Divider,
  Alert
} from '@mui/material';
import {
  PhotoCamera,
  Close,
  Group,
  Lock,
  Public
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    minWidth: 500,
    maxWidth: 600,
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    backdropFilter: 'blur(10px)'
  }
}));

const ImageUploadBox = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  border: `2px dashed ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}));

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'community', // 'community' or 'private'
    isPublic: true,
    requireApproval: false,
    allowInvites: true,
    memberLimit: 0,
    category: '',
    tags: [] as string[],
    icon: null as File | null
  });
  const [currentTag, setCurrentTag] = useState('');
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Icon file size must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, icon: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    if (formData.name.length < 2 || formData.name.length > 100) {
      setError('Group name must be between 2 and 100 characters');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('isPublic', formData.isPublic.toString());
      formDataToSend.append('requireApproval', formData.requireApproval.toString());
      formDataToSend.append('allowInvites', formData.allowInvites.toString());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      
      if (formData.memberLimit > 0) {
        formDataToSend.append('memberLimit', formData.memberLimit.toString());
      }
      
      if (formData.icon) {
        formDataToSend.append('icon', formData.icon);
      }
      
      await dispatch(createGroup(formDataToSend)).unwrap();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      type: 'community',
      isPublic: true,
      requireApproval: false,
      allowInvites: true,
      memberLimit: 0,
      category: '',
      tags: [],
      icon: null
    });
    setCurrentTag('');
    setIconPreview(null);
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            Create a Group
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Group Icon */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="icon-upload"
            type="file"
            onChange={handleIconUpload}
          />
          <label htmlFor="icon-upload">
            {iconPreview ? (
              <Avatar
                src={iconPreview}
                sx={{ width: 80, height: 80, cursor: 'pointer' }}
              />
            ) : (
              <ImageUploadBox>
                <PhotoCamera color="action" />
              </ImageUploadBox>
            )}
          </label>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              Group Icon
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upload an image for your group (optional)
            </Typography>
          </Box>
        </Box>

        {/* Group Name */}
        <TextField
          fullWidth
          label="Group Name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter group name"
          sx={{ mb: 2 }}
          required
        />

        {/* Group Description */}
        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="What's this group about?"
          multiline
          rows={3}
          sx={{ mb: 3 }}
        />

        {/* Group Type */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
            Group Type
          </FormLabel>
          <RadioGroup
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <FormControlLabel
              value="community"
              control={<Radio />}
              label={
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Public fontSize="small" />
                    <Typography fontWeight={600}>Community Group</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Open to everyone, discoverable, and can have many members
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="private"
              control={<Radio />}
              label={
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Lock fontSize="small" />
                    <Typography fontWeight={600}>Private Group</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Invite-only, not discoverable, perfect for friends
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Group Settings */}
        <Typography variant="subtitle2" fontWeight={600} mb={2}>
          Group Settings
        </Typography>

        {formData.type === 'community' && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Public Group
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Anyone can find and join this group
                </Typography>
              </Box>
              <Switch
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Require Approval
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  New members need approval to join
                </Typography>
              </Box>
              <Switch
                checked={formData.requireApproval}
                onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
              />
            </Box>

            {/* Category */}
            <TextField
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="e.g., Gaming, Technology, Art"
              sx={{ mb: 2 }}
            />

            {/* Tags */}
            <Box mb={2}>
              <Typography variant="body2" fontWeight={500} mb={1}>
                Tags (up to 5)
              </Typography>
              <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
              {formData.tags.length < 5 && (
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} disabled={!currentTag.trim()}>
                    Add
                  </Button>
                </Box>
              )}
            </Box>

            {/* Member Limit */}
            <TextField
              fullWidth
              label="Member Limit (0 = unlimited)"
              type="number"
              value={formData.memberLimit}
              onChange={(e) => handleInputChange('memberLimit', parseInt(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />
          </>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Allow Member Invites
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Let members invite others to the group
            </Typography>
          </Box>
          <Switch
            checked={formData.allowInvites}
            onChange={(e) => handleInputChange('allowInvites', e.target.checked)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.name.trim()}
          startIcon={<Group />}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default CreateGroupDialog;
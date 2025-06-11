import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  IconButton,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  RadioGroup,
  Radio,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
  Paper,
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  VolumeUp,
  Palette,
  Language,
  Accessibility,
  PhotoCamera,
  Close,
  ExpandMore,
  Mic,
  MicOff,
  Headset,
  Videocam,
  VideocamOff,
  Block,
  Shield,
  Key,
  Visibility,
  VisibilityOff,
  Delete,
  Download,
  Upload,
  Settings,
  Info,
  Warning,
  CheckCircle,
  Error,
  Keyboard,
  Mouse,
  Games,
  Stream,
  Code,
  BugReport,
  Help,
  Logout,
  AccountCircle,
  Edit,
  Save,
  Cancel,
  Add,
  Remove,
  VolumeDown,
  VolumeOff,
  Tune,
  ColorLens,
  TextFields,
  Contrast,
  Speed,
  Timer,
  PhoneAndroid,
  Computer,
  Tablet,
  Watch,
  SportsEsports,
  Headphones,
  Speaker,
  RecordVoiceOver,
  GraphicEq,
  Equalizer,
  Star,
  Rocket,
  CardGiftcard
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeModal, updateSettings, setTheme } from '../../store/slices/uiSlice';
import { updateProfile, logout } from '../../store/slices/authSlice';

interface UserSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' }
];

const settingsCategories = [
  { id: 'account', label: 'My Account', icon: <Person />, color: '#5865F2' },
  { id: 'profile', label: 'User Profile', icon: <AccountCircle />, color: '#57F287' },
  { id: 'privacy', label: 'Privacy & Safety', icon: <Security />, color: '#ED4245' },
  { id: 'authorized-apps', label: 'Authorized Apps', icon: <Shield />, color: '#FEE75C' },
  { id: 'connections', label: 'Connections', icon: <Settings />, color: '#EB459E' },
  { id: 'billing', label: 'Billing', icon: <Key />, color: '#00D166' },
  { id: 'drift', label: 'Canble Drift', icon: <Star />, color: '#FF73FA' },
  { id: 'subscriptions', label: 'Server Boost', icon: <Rocket />, color: '#F47FFF' },
  { id: 'gift-inventory', label: 'Gift Inventory', icon: <CardGiftcard />, color: '#FEE75C' },
  { id: 'notifications', label: 'Notifications', icon: <Notifications />, color: '#FAA61A' },
  { id: 'voice', label: 'Voice & Video', icon: <VolumeUp />, color: '#57F287' },
  { id: 'text-images', label: 'Text & Images', icon: <TextFields />, color: '#5865F2' },
  { id: 'appearance', label: 'Appearance', icon: <Palette />, color: '#EB459E' },
  { id: 'accessibility', label: 'Accessibility', icon: <Accessibility />, color: '#00D166' },
  { id: 'keybinds', label: 'Keybinds', icon: <Keyboard />, color: '#ED4245' },
  { id: 'language', label: 'Language', icon: <Language />, color: '#57F287' },
  { id: 'windows', label: 'Windows Settings', icon: <Computer />, color: '#5865F2' },
  { id: 'streamer-mode', label: 'Streamer Mode', icon: <Stream />, color: '#593695' },
  { id: 'advanced', label: 'Advanced', icon: <Code />, color: '#ED4245' },
  { id: 'activity-status', label: 'Activity Status', icon: <Games />, color: '#57F287' },
  { id: 'game-overlay', label: 'Game Overlay', icon: <SportsEsports />, color: '#5865F2' },
  { id: 'hotkeys', label: 'Hotkeys', icon: <Mouse />, color: '#FAA61A' },
  { id: 'experiments', label: 'Experiments', icon: <BugReport />, color: '#ED4245' },
  { id: 'developer-options', label: 'Developer Options', icon: <Code />, color: '#36393F' },
  { id: 'hypesquad', label: 'HypeSquad', icon: <Star />, color: '#FF73FA' },
  { id: 'logout', label: 'Log Out', icon: <Logout />, color: '#ED4245' }
];

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const settings = useAppSelector((state) => state.ui);
  
  const [activeCategory, setActiveCategory] = useState('account');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
  const [bannerPreview, setBannerPreview] = useState<string>(user?.banner || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.mfaEnabled || false);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.locale || 'en');
  const [showPassword, setShowPassword] = useState(false);
  const [microphoneTest, setMicrophoneTest] = useState(false);
  const [speakerTest, setSpeakerTest] = useState(false);
  const [cameraTest, setCameraTest] = useState(false);
  
  const handleClose = () => {
    onClose();
    setActiveCategory('account');
    setError('');
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('email', email.trim());
      formData.append('bio', bio.trim());
      if (avatar) {
        formData.append('avatar', avatar);
      }
      if (banner) {
        formData.append('banner', banner);
      }
      await dispatch(updateProfile(formData)).unwrap();
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Implementation for password change
      // await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    dispatch(logout());
    handleClose();
  };
  
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'account':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              My Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your account settings and preferences
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={avatarPreview}
                      sx={{ width: 80, height: 80 }}
                    >
                      {username.charAt(0).toUpperCase()}
                    </Avatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: -8,
                        right: -8,
                        bgcolor: 'background.paper',
                        border: 2,
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <PhotoCamera fontSize="small" />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </IconButton>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {user?.username}#{user?.discriminator}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                    <Chip 
                      label={user?.verified ? 'Verified' : 'Unverified'} 
                      color={user?.verified ? 'success' : 'warning'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Username"
                      fullWidth
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      helperText="This is how others will see you on Canble"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      helperText="Used for account recovery and notifications"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Bio"
                      multiline
                      rows={3}
                      fullWidth
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      helperText="Tell others about yourself (max 190 characters)"
                      inputProps={{ maxLength: 190 }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={loading}
                    startIcon={<Save />}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setUsername(user?.username || '');
                      setEmail(user?.email || '');
                      setBio(user?.bio || '');
                      setAvatarPreview(user?.avatar || '');
                      setBannerPreview(user?.banner || '');
                    }}
                  >
                    Reset
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password & Authentication
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Current Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Confirm Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      />
                    }
                    label="Two-Factor Authentication"
                  />
                  <Button
                    variant="contained"
                    onClick={handlePasswordChange}
                    disabled={!currentPassword || !newPassword || !confirmPassword || loading}
                  >
                    Change Password
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );
        
      case 'profile':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              User Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize how you appear to others on Canble
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profile Banner
                </Typography>
                <Box sx={{ 
                  height: 120, 
                  bgcolor: bannerPreview ? 'transparent' : 'action.hover',
                  backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 1,
                  position: 'relative',
                  mb: 2
                }}>
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                    }}
                  >
                    <PhotoCamera />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleBannerChange}
                    />
                  </IconButton>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  About Me
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  helperText={`${bio.length}/190 characters`}
                  inputProps={{ maxLength: 190 }}
                />
              </CardContent>
            </Card>
          </Box>
        );
        
      case 'privacy':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Privacy & Safety
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Control who can interact with you and how
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Direct Messages</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Who can send you direct messages</InputLabel>
                  <Select
                    value={settings.privacy.directMessages}
                    label="Who can send you direct messages"
                    onChange={(e) => dispatch(updateSettings({
                      privacy: { ...settings.privacy, directMessages: e.target.value as any }
                    }))}
                  >
                    <MenuItem value="everyone">Everyone</MenuItem>
                    <MenuItem value="friends">Friends only</MenuItem>
                    <MenuItem value="none">No one</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Who can send you friend requests</InputLabel>
                  <Select
                    value={settings.privacy.friendRequests}
                    label="Who can send you friend requests"
                    onChange={(e) => dispatch(updateSettings({
                      privacy: { ...settings.privacy, friendRequests: e.target.value as any }
                    }))}
                  >
                    <MenuItem value="everyone">Everyone</MenuItem>
                    <MenuItem value="friends_of_friends">Friends of friends</MenuItem>
                    <MenuItem value="none">No one</MenuItem>
                  </Select>
                </FormControl>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Activity Status</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.readReceipts}
                      onChange={(e) => dispatch(updateSettings({
                        privacy: { ...settings.privacy, readReceipts: e.target.checked }
                      }))}
                    />
                  }
                  label="Show when you've read messages"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.typingIndicators}
                      onChange={(e) => dispatch(updateSettings({
                        privacy: { ...settings.privacy, typingIndicators: e.target.checked }
                      }))}
                    />
                  }
                  label="Show when you're typing"
                />
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Data & Privacy</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="outlined" startIcon={<Download />}>
                    Request Data Export
                  </Button>
                  <Button variant="outlined" color="warning" startIcon={<Delete />}>
                    Delete Account
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        );
        
      case 'notifications':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose what notifications you want to receive
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Desktop Notifications
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.desktop}
                      onChange={(e) => dispatch(updateSettings({
                        notifications: { ...settings.notifications, desktop: e.target.checked }
                      }))}
                    />
                  }
                  label="Enable desktop notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.sounds}
                      onChange={(e) => dispatch(updateSettings({
                        notifications: { ...settings.notifications, sounds: e.target.checked }
                      }))}
                    />
                  }
                  label="Notification sounds"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.badge}
                      onChange={(e) => dispatch(updateSettings({
                        notifications: { ...settings.notifications, badge: e.target.checked }
                      }))}
                    />
                  }
                  label="Unread message badge"
                />
              </CardContent>
            </Card>
          </Box>
        );
        
      case 'voice':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Voice & Video
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure your audio and video settings
            </Typography>
            
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Microphone</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Input Device</InputLabel>
                  <Select
                    value={settings.voice.inputDevice || 'default'}
                    label="Input Device"
                    onChange={(e) => dispatch(updateSettings({
                      voice: { ...settings.voice, inputDevice: e.target.value }
                    }))}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="microphone1">Microphone 1</MenuItem>
                    <MenuItem value="microphone2">Microphone 2</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="subtitle2" gutterBottom>
                  Input Volume: {settings.voice.inputVolume}%
                </Typography>
                <Slider
                  value={settings.voice.inputVolume}
                  onChange={(_, value) => dispatch(updateSettings({
                    voice: { ...settings.voice, inputVolume: value as number }
                  }))}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant={microphoneTest ? 'contained' : 'outlined'}
                    onClick={() => setMicrophoneTest(!microphoneTest)}
                    startIcon={microphoneTest ? <MicOff /> : <Mic />}
                  >
                    {microphoneTest ? 'Stop Test' : 'Test Microphone'}
                  </Button>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.voice.echoCancellation}
                      onChange={(e) => dispatch(updateSettings({
                        voice: { ...settings.voice, echoCancellation: e.target.checked }
                      }))}
                    />
                  }
                  label="Echo Cancellation"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.voice.noiseSuppression}
                      onChange={(e) => dispatch(updateSettings({
                        voice: { ...settings.voice, noiseSuppression: e.target.checked }
                      }))}
                    />
                  }
                  label="Noise Suppression"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.voice.automaticGainControl}
                      onChange={(e) => dispatch(updateSettings({
                        voice: { ...settings.voice, automaticGainControl: e.target.checked }
                      }))}
                    />
                  }
                  label="Automatic Gain Control"
                />
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Speakers</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Output Device</InputLabel>
                  <Select
                    value={settings.voice.outputDevice || 'default'}
                    label="Output Device"
                    onChange={(e) => dispatch(updateSettings({
                      voice: { ...settings.voice, outputDevice: e.target.value }
                    }))}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="speakers1">Speakers 1</MenuItem>
                    <MenuItem value="headphones1">Headphones 1</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="subtitle2" gutterBottom>
                  Output Volume: {settings.voice.outputVolume}%
                </Typography>
                <Slider
                  value={settings.voice.outputVolume}
                  onChange={(_, value) => dispatch(updateSettings({
                    voice: { ...settings.voice, outputVolume: value as number }
                  }))}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2 }}
                />
                
                <Button
                  variant={speakerTest ? 'contained' : 'outlined'}
                  onClick={() => setSpeakerTest(!speakerTest)}
                  startIcon={<Headphones />}
                >
                  {speakerTest ? 'Stop Test' : 'Test Speakers'}
                </Button>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Camera</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Camera Device</InputLabel>
                  <Select
                    value="default"
                    label="Camera Device"
                  >
                    <MenuItem value="default">Default Camera</MenuItem>
                    <MenuItem value="camera1">Camera 1</MenuItem>
                    <MenuItem value="camera2">Camera 2</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant={cameraTest ? 'contained' : 'outlined'}
                  onClick={() => setCameraTest(!cameraTest)}
                  startIcon={cameraTest ? <VideocamOff /> : <Videocam />}
                >
                  {cameraTest ? 'Stop Test' : 'Test Camera'}
                </Button>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Voice Activity</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.voice.voiceActivityDetection}
                      onChange={(e) => dispatch(updateSettings({
                        voice: { ...settings.voice, voiceActivityDetection: e.target.checked }
                      }))}
                    />
                  }
                  label="Voice Activity Detection"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.voice.pushToTalk}
                      onChange={(e) => dispatch(updateSettings({
                        voice: { ...settings.voice, pushToTalk: e.target.checked }
                      }))}
                    />
                  }
                  label="Push to Talk"
                />
                
                {settings.voice.voiceActivityDetection && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Input Sensitivity: {settings.voice.inputSensitivity}%
                    </Typography>
                    <Slider
                      value={settings.voice.inputSensitivity}
                      onChange={(_, value) => dispatch(updateSettings({
                        voice: { ...settings.voice, inputSensitivity: value as number }
                      }))}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        );
        
      case 'appearance':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize how Canble looks and feels
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Theme
                </Typography>
                
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <RadioGroup
                    value={settings.theme}
                    onChange={(e) => dispatch(setTheme(e.target.value as 'light' | 'dark'))}
                    row
                  >
                    <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                    <FormControlLabel value="light" control={<Radio />} label="Light" />
                  </RadioGroup>
                </FormControl>
                
                <Typography variant="h6" gutterBottom>
                  Message Display
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.messageDisplayCompact}
                      onChange={(e) => dispatch(updateSettings({ messageDisplayCompact: e.target.checked }))}
                    />
                  }
                  label="Compact message display"
                />
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Font Size
                </Typography>
                
                <FormControl component="fieldset">
                  <RadioGroup
                    value={settings.fontSize}
                    onChange={(e) => dispatch(updateSettings({ fontSize: e.target.value as 'small' | 'medium' | 'large' }))}
                    row
                  >
                    <FormControlLabel value="small" control={<Radio />} label="Small" />
                    <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                    <FormControlLabel value="large" control={<Radio />} label="Large" />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Box>
        );
        
      case 'accessibility':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Accessibility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Make Canble more accessible for your needs
            </Typography>
            
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.accessibility.reducedMotion}
                      onChange={(e) => dispatch(updateSettings({
                        accessibility: { ...settings.accessibility, reducedMotion: e.target.checked }
                      }))}
                    />
                  }
                  label="Reduce motion"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.accessibility.highContrast}
                      onChange={(e) => dispatch(updateSettings({
                        accessibility: { ...settings.accessibility, highContrast: e.target.checked }
                      }))}
                    />
                  }
                  label="High contrast mode"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.accessibility.screenReader}
                      onChange={(e) => dispatch(updateSettings({
                        accessibility: { ...settings.accessibility, screenReader: e.target.checked }
                      }))}
                    />
                  }
                  label="Screen reader support"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.accessibility.keyboardNavigation}
                      onChange={(e) => dispatch(updateSettings({
                        accessibility: { ...settings.accessibility, keyboardNavigation: e.target.checked }
                      }))}
                    />
                  }
                  label="Enhanced keyboard navigation"
                />
              </CardContent>
            </Card>
          </Box>
        );
        
      case 'language':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Language
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose your preferred language for Canble
            </Typography>
            
            <Card>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={selectedLanguage}
                    label="Language"
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.code} value={lang.code}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{lang.name}</span>
                          <span style={{ color: 'text.secondary' }}>{lang.nativeName}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  Language changes will take effect after restarting Canble.
                </Alert>
              </CardContent>
            </Card>
          </Box>
        );
        
      case 'logout':
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
              Log Out
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Are you sure you want to log out of Canble?
            </Typography>
            
            <Card>
              <CardContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You will be signed out of all devices and will need to log in again.
                </Alert>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleLogout}
                    startIcon={<Logout />}
                  >
                    Log Out
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveCategory('account')}
                  >
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
        
      default:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {settingsCategories.find(cat => cat.id === activeCategory)?.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This feature is coming soon to Canble!
            </Typography>
            
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Under Development
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We're working hard to bring you this feature. Stay tuned!
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}>
        <Typography variant="h5" fontWeight="bold">
          User Settings
        </Typography>
        <IconButton onClick={handleClose} size="large">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
        {/* Settings sidebar */}
        <Box
          sx={{
            width: 280,
            bgcolor: 'background.default',
            borderRight: 1,
            borderColor: 'divider',
            overflowY: 'auto'
          }}
        >
          <List sx={{ p: 1 }}>
            {settingsCategories.map((category) => (
              <ListItem key={category.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    },
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: activeCategory === category.id ? 'inherit' : category.color,
                    minWidth: 40
                  }}>
                    {category.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.label} 
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: activeCategory === category.id ? 'bold' : 'normal'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        {/* Settings content */}
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: 'background.paper' }}>
          {renderCategoryContent()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsDialog;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Slider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  Settings,
  MoreVert,
  VolumeDown,
  Person,
  PersonOff
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { leaveVoiceChannel, toggleMute, toggleDeafen, toggleVideo } from '../../store/slices/uiSlice';

const VoicePanelContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[800],
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 52
}));

const VoiceInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flex: 1,
  minWidth: 0
}));

const VoiceControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}));

const ParticipantsList = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  maxWidth: 200,
  overflowX: 'auto',
  '&::-webkit-scrollbar': {
    height: 4
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[600],
    borderRadius: 2
  }
}));

const ParticipantAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isSpeaking' && prop !== 'isMuted'
})<{ isSpeaking?: boolean; isMuted?: boolean }>(({ theme, isSpeaking, isMuted }) => ({
  width: 24,
  height: 24,
  fontSize: '0.75rem',
  border: isSpeaking ? `2px solid ${theme.palette.success.main}` : '2px solid transparent',
  opacity: isMuted ? 0.6 : 1,
  transition: 'all 0.2s ease'
}));

const VolumeSlider = styled(Box)(({ theme }) => ({
  width: 100,
  padding: theme.spacing(0, 1)
}));

interface VoiceParticipant {
  id: string;
  username: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volume: number;
}

const VoicePanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const [volumeMenuAnchor, setVolumeMenuAnchor] = useState<null | HTMLElement>(null);
  const [participantMenuAnchor, setParticipantMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<VoiceParticipant | null>(null);
  const [masterVolume, setMasterVolume] = useState(100);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const {
    voiceState,
    isMuted,
    isDeafened,
    isVideoEnabled
  } = useAppSelector((state) => state.ui);
  
  const { user } = useAppSelector((state) => state.auth);

  // Mock voice participants - in real app this would come from voice state
  const [participants, setParticipants] = useState<VoiceParticipant[]>([
    {
      id: user?._id || '1',
      username: user?.username || 'You',
      avatar: user?.avatar,
      isMuted,
      isDeafened,
      isSpeaking: false,
      volume: 100
    }
  ]);

  useEffect(() => {
    // Update current user's mute/deafen status
    setParticipants(prev =>
      prev.map(p =>
        p.id === user?._id
          ? { ...p, isMuted, isDeafened }
          : p
      )
    );
  }, [isMuted, isDeafened, user?._id]);

  const handleLeaveVoice = () => {
    dispatch(leaveVoiceChannel());
  };

  const handleToggleMute = () => {
    dispatch(toggleMute());
  };

  const handleToggleDeafen = () => {
    dispatch(toggleDeafen());
  };

  const handleToggleVideo = () => {
    dispatch(toggleVideo());
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // Implement screen sharing logic here
  };

  const handleVolumeMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setVolumeMenuAnchor(event.currentTarget);
  };

  const handleParticipantClick = (participant: VoiceParticipant, event: React.MouseEvent<HTMLElement>) => {
    setSelectedParticipant(participant);
    setParticipantMenuAnchor(event.currentTarget);
  };

  const handleCloseMenus = () => {
    setVolumeMenuAnchor(null);
    setParticipantMenuAnchor(null);
    setSelectedParticipant(null);
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setMasterVolume(newValue as number);
  };

  if (!voiceState.channelId) {
    return null;
  }

  return (
    <>
      <VoicePanelContainer elevation={0}>
        <VoiceInfo>
          <VolumeUp color="success" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight="bold" color="success.main" noWrap>
              {voiceState.channelName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <ParticipantsList>
            {participants.map((participant) => (
              <Tooltip
                key={participant.id}
                title={`${participant.username}${participant.isMuted ? ' (Muted)' : ''}${participant.isDeafened ? ' (Deafened)' : ''}`}
              >
                <ParticipantAvatar
                  src={participant.avatar}
                  isSpeaking={participant.isSpeaking}
                  isMuted={participant.isMuted}
                  onClick={(e) => handleParticipantClick(participant, e)}
                  sx={{ cursor: 'pointer' }}
                >
                  {participant.username[0].toUpperCase()}
                </ParticipantAvatar>
              </Tooltip>
            ))}
          </ParticipantsList>
        </VoiceInfo>

        <VoiceControls>
          <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
            <IconButton
              size="small"
              color={isMuted ? 'error' : 'success'}
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isDeafened ? 'Undeafen' : 'Deafen'}>
            <IconButton
              size="small"
              color={isDeafened ? 'error' : 'default'}
              onClick={handleToggleDeafen}
            >
              {isDeafened ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
            <IconButton
              size="small"
              color={isVideoEnabled ? 'primary' : 'default'}
              onClick={handleToggleVideo}
            >
              {isVideoEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
            <IconButton
              size="small"
              color={isScreenSharing ? 'primary' : 'default'}
              onClick={handleToggleScreenShare}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Volume">
            <IconButton size="small" onClick={handleVolumeMenuClick}>
              <VolumeDown />
            </IconButton>
          </Tooltip>

          <Tooltip title="Voice Settings">
            <IconButton size="small">
              <Settings />
            </IconButton>
          </Tooltip>

          <Tooltip title="Disconnect">
            <IconButton
              size="small"
              color="error"
              onClick={handleLeaveVoice}
            >
              <CallEnd />
            </IconButton>
          </Tooltip>
        </VoiceControls>
      </VoicePanelContainer>

      {/* Volume Menu */}
      <Menu
        anchorEl={volumeMenuAnchor}
        open={Boolean(volumeMenuAnchor)}
        onClose={handleCloseMenus}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="body2" gutterBottom>
            Master Volume
          </Typography>
          <VolumeSlider>
            <Slider
              value={masterVolume}
              onChange={handleVolumeChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
              min={0}
              max={100}
              size="small"
            />
          </VolumeSlider>
        </Box>
      </Menu>

      {/* Participant Menu */}
      <Menu
        anchorEl={participantMenuAnchor}
        open={Boolean(participantMenuAnchor)}
        onClose={handleCloseMenus}
      >
        {selectedParticipant && [
          <MenuItem key="profile" onClick={handleCloseMenus}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Profile</ListItemText>
          </MenuItem>,
          
          selectedParticipant.id !== user?._id && [
            <MenuItem key="mute" onClick={handleCloseMenus}>
              <ListItemIcon>
                <PersonOff fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {selectedParticipant.isMuted ? 'Unmute' : 'Mute'} {selectedParticipant.username}
              </ListItemText>
            </MenuItem>,
            
            <Divider key="divider" />,
            
            <Box key="volume" sx={{ p: 2, minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>
                {selectedParticipant.username} Volume
              </Typography>
              <Slider
                value={selectedParticipant.volume}
                onChange={(_, value) => {
                  setParticipants(prev => 
                    prev.map(p => 
                      p.id === selectedParticipant.id 
                        ? { ...p, volume: value as number }
                        : p
                    )
                  );
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                min={0}
                max={200}
                size="small"
              />
            </Box>
          ]
        ]}
      </Menu>
    </>
  );
};

export default VoicePanel;
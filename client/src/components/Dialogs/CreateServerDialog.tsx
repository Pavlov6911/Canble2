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
  IconButton,
  Step,
  Stepper,
  StepLabel,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import { PhotoCamera, Group, School, SportsEsports, Mic, Code } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createServer } from '../../store/slices/serversSlice';
import { closeModal } from '../../store/slices/uiSlice';

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
}

const serverTemplates = [
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Hang out and play games with your friends',
    icon: <SportsEsports />,
    channels: ['general', 'gaming', 'voice-chat']
  },
  {
    id: 'school',
    name: 'Study Group',
    description: 'Get help with homework and collaborate on projects',
    icon: <School />,
    channels: ['general', 'homework-help', 'study-room']
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Build a community around shared interests',
    icon: <Group />,
    channels: ['general', 'announcements', 'community-chat']
  },
  {
    id: 'creative',
    name: 'Creative Arts',
    description: 'Share and collaborate on creative projects',
    icon: <Code />,
    channels: ['general', 'showcase', 'feedback']
  }
];

const CreateServerDialog: React.FC<CreateServerDialogProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.servers);
  
  const [activeStep, setActiveStep] = useState(0);
  const [serverName, setServerName] = useState('');
  const [serverIcon, setServerIcon] = useState<File | null>(null);
  const [serverIconPreview, setServerIconPreview] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const steps = ['Choose Template', 'Customize Server'];
  
  const handleClose = () => {
    onClose();
    setActiveStep(0);
    setServerName('');
    setServerIcon(null);
    setServerIconPreview('');
    setSelectedTemplate('');
  };
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setServerIcon(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setServerIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async () => {
    if (!serverName.trim()) {
      return;
    }
    
    try {
      const template = serverTemplates.find(t => t.id === selectedTemplate);
      
      const formData = new FormData();
      formData.append('name', serverName.trim());
      if (serverIcon) {
        formData.append('icon', serverIcon);
      }
      if (selectedTemplate) {
        formData.append('template', selectedTemplate);
      }
      if (template?.channels) {
        formData.append('channels', JSON.stringify(template.channels));
      }
      await dispatch(createServer(formData)).unwrap();
      
      handleClose();
    } catch (error) {
      // Error is handled by the slice
    }
  };
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tell us more about your server
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              In order to help you with your setup, is your new server for just a few friends or a larger community?
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {serverTemplates.map((template) => (
                <Card
                  key={template.id}
                  variant={selectedTemplate === template.id ? 'outlined' : 'elevation'}
                  sx={{
                    border: selectedTemplate === template.id ? 2 : 0,
                    borderColor: 'primary.main'
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedTemplate(template.id)}
                    sx={{ p: 2 }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ color: 'primary.main' }}>
                          {template.icon}
                        </Box>
                        <Typography variant="h6">
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
              
              <Card
                variant={selectedTemplate === '' ? 'outlined' : 'elevation'}
                sx={{
                  border: selectedTemplate === '' ? 2 : 0,
                  borderColor: 'primary.main'
                }}
              >
                <CardActionArea
                  onClick={() => setSelectedTemplate('')}
                  sx={{ p: 2 }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Box sx={{ color: 'primary.main' }}>
                        <Group />
                      </Box>
                      <Typography variant="h6">
                        Create My Own
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Start from scratch and build your own server
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Customize your server
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Give your new server a personality with a name and an icon. You can always change it later.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={serverIconPreview}
                  sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                >
                  {serverName.charAt(0).toUpperCase()}
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
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <PhotoCamera fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleIconChange}
                  />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Minimum size: 128x128
              </Typography>
            </Box>
            
            <TextField
              autoFocus
              label="Server Name"
              fullWidth
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Enter server name"
              inputProps={{
                maxLength: 100
              }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              By creating a server, you agree to Canble's Community Guidelines.
            </Typography>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          minHeight: 500
        }
      }}
    >
      <DialogTitle>
        Create a server
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent(activeStep)}
        
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
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === 0 && !selectedTemplate && selectedTemplate !== ''}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!serverName.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create Server'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateServerDialog;
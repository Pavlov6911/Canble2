import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
  animation: `${fadeIn} 0.5s ease-in-out`
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 80,
  height: 80,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
  animation: `${pulse} 2s infinite ease-in-out`
}));

const CanbleLogo = styled('svg')(({ theme }) => ({
  width: 40,
  height: 40,
  fill: 'white'
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(2),
  fontWeight: 500
}));

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading Canble...' }) => {
  return (
    <LoadingContainer>
      <LogoContainer>
        <CanbleLogo viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </CanbleLogo>
      </LogoContainer>
      
      <CircularProgress
        size={40}
        thickness={4}
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round'
          }
        }}
      />
      
      <LoadingText variant="body1">
        {message}
      </LoadingText>
      
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          marginTop: 1,
          fontSize: '0.75rem'
        }}
      >
        Connecting to servers...
      </Typography>
    </LoadingContainer>
  );
};

export default LoadingScreen;
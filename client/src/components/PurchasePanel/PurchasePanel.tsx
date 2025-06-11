import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Close,
  PaymentOutlined,
  CreditCard,
  AccountBalanceWallet
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Modern Animation keyframes
const successPulse = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const successGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.4);
  }
`;

const failureShake = keyframes`
  0%, 100% {
    transform: translateX(0) scale(1);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px) scale(0.98);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px) scale(1.02);
  }
`;

const slideInFromBottom = keyframes`
  0% {
    transform: translateY(100px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeInScale = keyframes`
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const textGlow = keyframes`
  0%, 100% {
    text-shadow: 0 0 10px currentColor;
  }
  50% {
    text-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
  }
`;

const checkmarkDraw = keyframes`
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
`;

const errorX = keyframes`
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
`;

interface PurchasePanelProps {
  open: boolean;
  onClose: () => void;
  planName?: string;
  planPrice?: string;
}

const PurchasePanel: React.FC<PurchasePanelProps> = ({ 
  open, 
  onClose, 
  planName = "Premium Plan", 
  planPrice = "$9.99" 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'failure' | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Sound effect for animations
  useEffect(() => {
    if (showAnimation && animationType) {
      // Play a subtle notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for success vs failure
      const frequency = animationType === 'success' ? 800 : 400;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, [showAnimation, animationType]);

  const handlePayment = async (method: 'paypal' | 'card') => {
    setPaymentMethod(method);
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    // For demo, we'll randomly succeed or fail
    const success = Math.random() > 0.5;
    handlePaymentResult(success);
  };

  const handlePaymentResult = (success: boolean) => {
    setAnimationType(success ? 'success' : 'failure');
    setShowAnimation(true);
    
    setTimeout(() => {
      setShowResult(true);
    }, 1000);

    setTimeout(() => {
      setShowAnimation(false);
      setShowResult(false);
      setAnimationType(null);
      setPaymentMethod(null);
      if (success) {
        onClose();
      }
    }, 4000);
  };

  const handleTestPayment = (success: boolean) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      handlePaymentResult(success);
    }, 1000);
  };

  const resetPanel = () => {
    setPaymentMethod(null);
    setIsProcessing(false);
    setShowAnimation(false);
    setAnimationType(null);
    setShowResult(false);
  };

  const handleClose = () => {
    resetPanel();
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(5px)'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Card sx={{ 
            background: 'transparent',
            boxShadow: 'none'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 3,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <PaymentOutlined sx={{ color: '#8b5cf6' }} />
                Purchase {planName}
              </Typography>
              <IconButton onClick={handleClose} sx={{ color: '#ffffff' }}>
                <Close />
              </IconButton>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Plan Details */}
              <Box sx={{ 
                textAlign: 'center',
                mb: 4,
                p: 3,
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800,
                  color: '#8b5cf6',
                  mb: 1
                }}>
                  {planPrice}
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {planName}
                </Typography>
              </Box>

              {/* Payment Methods */}
              {!isProcessing && !showAnimation && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ 
                    color: '#ffffff',
                    mb: 3,
                    textAlign: 'center'
                  }}>
                    Choose Payment Method
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant={paymentMethod === 'paypal' ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => handlePayment('paypal')}
                      sx={{
                        py: 2,
                        backgroundColor: paymentMethod === 'paypal' ? '#0070ba' : 'transparent',
                        borderColor: '#0070ba',
                        color: paymentMethod === 'paypal' ? '#ffffff' : '#0070ba',
                        '&:hover': {
                          backgroundColor: '#005ea6',
                          borderColor: '#005ea6'
                        }
                      }}
                    >
                      <AccountBalanceWallet sx={{ mr: 1 }} />
                      PayPal
                    </Button>
                    
                    <Button
                      variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => handlePayment('card')}
                      sx={{
                        py: 2,
                        backgroundColor: paymentMethod === 'card' ? '#8b5cf6' : 'transparent',
                        borderColor: '#8b5cf6',
                        color: paymentMethod === 'card' ? '#ffffff' : '#8b5cf6',
                        '&:hover': {
                          backgroundColor: '#7c3aed',
                          borderColor: '#7c3aed'
                        }
                      }}
                    >
                      <CreditCard sx={{ mr: 1 }} />
                      Credit Card
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Processing State */}
              {isProcessing && (
                <Box sx={{ 
                  textAlign: 'center',
                  py: 4
                }}>
                  <CircularProgress sx={{ color: '#8b5cf6', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    Processing Payment...
                  </Typography>
                </Box>
              )}

              {/* Test Buttons */}
              {!isProcessing && !showAnimation && (
                <Box sx={{ 
                  borderTop: '1px solid rgba(139, 92, 246, 0.3)',
                  pt: 3,
                  mt: 3
                }}>
                  <Typography variant="body2" sx={{ 
                    color: '#b9bbbe',
                    textAlign: 'center',
                    mb: 2
                  }}>
                    Test Animation Buttons
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleTestPayment(true)}
                      sx={{
                        borderColor: '#10b981',
                        color: '#10b981',
                        '&:hover': {
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          borderColor: '#059669'
                        }
                      }}
                    >
                      Test Success
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleTestPayment(false)}
                      sx={{
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderColor: '#dc2626'
                        }
                      }}
                    >
                      Test Failed
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Animation Overlay */}
      {showAnimation && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Success Animation */}
          {animationType === 'success' && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10000
            }}>
              {/* Success Icon */}
              <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                animation: `${successPulse} 0.8s ease-out, ${successGlow} 2s ease-in-out infinite 0.8s`
              }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                    style={{
                      animation: `${checkmarkDraw} 0.8s ease-out 0.5s forwards`
                    }}
                  />
                </svg>
              </Box>
            </Box>
          )}

          {/* Failure Animation */}
          {animationType === 'failure' && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 10000
            }}>
              {/* Error Icon */}
              <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                animation: `${failureShake} 0.8s ease-out`
              }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      animation: `${errorX} 0.8s ease-out 0.3s forwards`
                    }}
                  />
                </svg>
              </Box>
            </Box>
          )}

          {/* Result Text */}
          {showResult && (
            <Fade in={showResult}>
              <Box sx={{
                position: 'absolute',
                top: '60%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 10002,
                animation: `${slideInFromBottom} 0.6s ease-out`
              }}>
                <Typography variant="h2" sx={{
                  fontWeight: 900,
                  color: animationType === 'success' ? '#10b981' : '#ef4444',
                  animation: `${textGlow} 1.5s ease-in-out infinite`,
                  textShadow: `0 0 20px ${animationType === 'success' ? '#10b981' : '#ef4444'}`,
                  fontSize: { xs: '2rem', md: '3rem' },
                  mb: 2
                }}>
                  {animationType === 'success' ? 'Payment Successful!' : 'Payment Failed!'}
                </Typography>
                {animationType === 'success' && (
                  <Typography variant="h5" sx={{
                    color: '#ffffff',
                    opacity: 0.9,
                    animation: `${fadeInScale} 0.8s ease-out 0.3s both`
                  }}>
                    Welcome to Premium! 🎉
                  </Typography>
                )}
                {animationType === 'failure' && (
                  <Typography variant="h6" sx={{
                    color: '#ffffff',
                    opacity: 0.8,
                    animation: `${fadeInScale} 0.8s ease-out 0.3s both`
                  }}>
                    Please try again
                  </Typography>
                )}
              </Box>
            </Fade>
          )}
        </Box>
      )}
    </>
  );
};

export default PurchasePanel;
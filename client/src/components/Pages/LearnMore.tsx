import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import PurchasePanel from '../PurchasePanel/PurchasePanel';
import {
  CheckCircle,
  VideoCall,
  EmojiEmotions,
  CloudUpload,
  Rocket,
  Animation,
  PersonAdd,
  Star,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LearnMore: React.FC = () => {
  const navigate = useNavigate();
  const [purchasePanelOpen, setPurchasePanelOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);

  const handleSubscribe = (planName: string, planPrice: string) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setPurchasePanelOpen(true);
  };

  const features = [
    {
      icon: <VideoCall sx={{ fontSize: 40, color: '#5865F2' }} />,
      title: 'Higher Quality Streaming',
      description: 'Stream in 1080p 60fps and share your screen in crystal clear quality. Perfect for gaming sessions, presentations, and movie nights with friends.',
      benefits: [
        '1080p 60fps streaming',
        'Crystal clear screen sharing',
        'Low latency for gaming',
        'Enhanced audio quality'
      ]
    },
    {
      icon: <EmojiEmotions sx={{ fontSize: 40, color: '#5865F2' }} />,
      title: 'Custom Emojis Everywhere',
      description: 'Use custom emojis from any server in any other server. Express yourself with unlimited emoji reactions and animated emojis.',
      benefits: [
        'Cross-server emoji usage',
        'Animated emoji support',
        'Unlimited emoji reactions',
        'Custom emoji creation tools'
      ]
    },
    {
      icon: <CloudUpload sx={{ fontSize: 40, color: '#5865F2' }} />,
      title: 'Bigger File Uploads',
      description: 'Upload files up to 100MB and share high-quality content including videos, documents, and media files.',
      benefits: [
        'Up to 100MB file uploads',
        'High-quality video sharing',
        'Document collaboration',
        'Media file support'
      ]
    },
    {
      icon: <Rocket sx={{ fontSize: 40, color: '#5865F2' }} />,
      title: 'Drift King Boosts',
      description: 'Get 2 Drift King boosts to help your favorite communities unlock exclusive features and perks.',
      benefits: [
        '2 monthly server boosts',
        'Exclusive server perks',
        'Community enhancement',
        'Priority support'
      ]
    },
    {
      icon: <Animation sx={{ fontSize: 40, color: '#5865F2' }} />,
      title: 'Animated Avatar',
      description: 'Stand out with animated profile pictures and custom status animations that reflect your personality.',
      benefits: [
        'Animated profile pictures',
        'Custom status animations',
        'Unique visual identity',
        'Premium avatar frames'
      ]
    },
    {
      icon: <PersonAdd sx={{ fontSize: 40, color: '#5865F2' }} />,
      title: 'Enhanced Social Features',
      description: 'Access advanced friend management, custom status messages, and priority customer support.',
      benefits: [
        'Advanced friend management',
        'Custom status messages',
        'Priority support',
        'Exclusive badges'
      ]
    }
  ];

  const pricingPlans = [
    {
      name: 'Canble Drift',
      price: '$9.99',
      period: 'per month',
      description: 'Perfect for individual users who want enhanced features',
      features: [
        'All premium features',
        'Higher quality streaming',
        'Custom emojis everywhere',
        'Bigger file uploads',
        '2 Drift King boosts',
        'Animated avatar',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Drift King',
      price: '$19.99',
      period: 'per month',
      description: 'For power users and community leaders',
      features: [
        'Everything in Drift',
        '5 Drift King boosts',
        'Server management tools',
        'Advanced moderation',
        'Custom server themes',
        'Analytics dashboard',
        'White-label options'
      ],
      popular: false
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b69 50%, #1a1a1a 100%)',
      color: '#ffffff'
    }}>
      {/* Header */}
      <Box sx={{ 
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 2
          }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ 
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }
              }}
            >
              Back to Canble
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
              Canble Drift - Learn More
            </Typography>
            <Box />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 800, 
            mb: 3,
            background: 'linear-gradient(45deg, #8b5cf6, #5865F2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Unlock the Full Potential of Canble
          </Typography>
          <Typography variant="h5" sx={{ 
            color: '#b9bbbe', 
            mb: 4, 
            maxWidth: '800px', 
            mx: 'auto',
            lineHeight: 1.6
          }}>
            Canble Drift brings you premium features that enhance your communication, 
            creativity, and community experience. Join millions of users who have upgraded 
            their Canble experience.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Typography variant="h3" sx={{ 
          textAlign: 'center', 
          mb: 6, 
          fontWeight: 700,
          color: '#ffffff'
        }}>
          Premium Features
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: 4, 
          mb: 8 
        }}>
          {features.map((feature, index) => (
            <Card key={index} sx={{ 
                height: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
                  borderColor: '#8b5cf6'
                }
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    {feature.icon}
                    <Typography variant="h5" sx={{ 
                      ml: 2, 
                      fontWeight: 600,
                      color: '#ffffff'
                    }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ 
                    color: '#b9bbbe', 
                    mb: 3,
                    lineHeight: 1.6
                  }}>
                    {feature.description}
                  </Typography>
                  <List dense>
                    {feature.benefits.map((benefit, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle sx={{ color: '#8b5cf6', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit}
                          sx={{ 
                            '& .MuiListItemText-primary': {
                              color: '#ffffff',
                              fontSize: '0.9rem'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
          ))}
        </Box>

        {/* Pricing Section */}
        <Typography variant="h3" sx={{ 
          textAlign: 'center', 
          mb: 6, 
          fontWeight: 700,
          color: '#ffffff'
        }}>
          Choose Your Plan
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4, 
          mb: 8,
          flexWrap: 'wrap'
        }}>
          {pricingPlans.map((plan, index) => (
            <Card key={index} sx={{
              minWidth: '350px',
              maxWidth: '400px',
              flex: '1', 
                height: '100%',
                background: plan.popular 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(88, 101, 242, 0.2))'
                  : 'rgba(0, 0, 0, 0.6)',
                border: plan.popular 
                  ? '2px solid #8b5cf6'
                  : '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 3,
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 15px 40px rgba(139, 92, 246, 0.4)'
                }
              }}>
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#8b5cf6',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  />
                )}
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: '#ffffff'
                  }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800,
                      color: '#8b5cf6'
                    }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#b9bbbe' }}>
                      {plan.period}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ 
                    color: '#b9bbbe', 
                    mb: 4,
                    lineHeight: 1.6
                  }}>
                    {plan.description}
                  </Typography>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(139, 92, 246, 0.3)' }} />
                  <List>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, justifyContent: 'center' }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Star sx={{ color: '#8b5cf6', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          sx={{ 
                            textAlign: 'left',
                            '& .MuiListItemText-primary': {
                              color: '#ffffff',
                              fontSize: '0.9rem'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    size="large"
                    fullWidth
                    onClick={() => handleSubscribe(plan.name, plan.price)}
                    sx={{
                      mt: 3,
                      py: 1.5,
                      backgroundColor: plan.popular ? '#8b5cf6' : 'transparent',
                      borderColor: '#8b5cf6',
                      color: plan.popular ? '#ffffff' : '#8b5cf6',
                      '&:hover': {
                        backgroundColor: plan.popular ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)',
                        borderColor: '#7c3aed'
                      }
                    }}
                  >
                    {plan.popular ? 'Subscribe Now' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
          ))}
        </Box>

        {/* CTA Section */}
        <Box sx={{ 
          textAlign: 'center',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: 3,
          border: '1px solid rgba(139, 92, 246, 0.3)',
          p: 6
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 2,
            color: '#ffffff'
          }}>
            Ready to Upgrade Your Experience?
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#b9bbbe', 
            mb: 4,
            maxWidth: '600px',
            mx: 'auto'
          }}>
            Join millions of users who have already upgraded to Canble Drift. 
            Start your premium journey today!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => handleSubscribe('Premium Plan', '$9.99')}
              sx={{ 
                backgroundColor: '#8b5cf6',
                '&:hover': { backgroundColor: '#7c3aed' },
                px: 6,
                py: 2,
                fontSize: '1.1rem'
              }}
            >
              Subscribe Now
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate(-1)}
              sx={{ 
                borderColor: '#8b5cf6',
                color: '#8b5cf6',
                '&:hover': { 
                  borderColor: '#7c3aed',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)'
                },
                px: 6,
                py: 2,
                fontSize: '1.1rem'
              }}
            >
              Back to App
            </Button>
          </Box>
        </Box>
      </Container>
      
      {/* Purchase Panel */}
      <PurchasePanel
        open={purchasePanelOpen}
        onClose={() => setPurchasePanelOpen(false)}
        planName={selectedPlan?.name || 'Premium Plan'}
        planPrice={selectedPlan?.price || '$9.99'}
      />
    </Box>
  );
};

export default LearnMore;
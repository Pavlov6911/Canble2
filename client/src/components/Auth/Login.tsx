import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  GitHub,
  Google
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, directLogin, clearError } from '../../store/slices/authSlice';

const LoginContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: `linear-gradient(135deg, 
    ${theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC'} 0%, 
    ${theme.palette.mode === 'dark' ? '#1E293B' : '#E2E8F0'} 100%)`,
  padding: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)`,
    animation: 'canbleFloat 4s ease-in-out infinite'
  },
  '@keyframes canbleFloat': {
    '0%, 100%': {
      transform: 'translateY(0px) rotate(0deg)'
    },
    '25%': {
      transform: 'translateY(-15px) rotate(1deg)'
    },
    '50%': {
      transform: 'translateY(-30px) rotate(0deg)'
    },
    '75%': {
      transform: 'translateY(-15px) rotate(-1deg)'
    }
  }
}));

const LoginCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 480,
  padding: theme.spacing(4),
  background: theme.palette.mode === 'dark' 
    ? 'rgba(30, 41, 59, 0.8)' 
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(139, 92, 246, 0.2)' 
    : 'rgba(139, 92, 246, 0.3)'}`,
  borderRadius: theme.spacing(3),
  boxShadow: theme.palette.mode === 'dark'
    ? '0 25px 50px -12px rgba(139, 92, 246, 0.3)'
    : '0 25px 50px -12px rgba(139, 92, 246, 0.2)',
  position: 'relative',
  zIndex: 1,
  animation: 'canbleSlideUp 0.8s ease-out',
  '@keyframes canbleSlideUp': {
    '0%': {
      opacity: 0,
      transform: 'translateY(50px) scale(0.9)'
    },
    '50%': {
      opacity: 0.7,
      transform: 'translateY(-10px) scale(1.02)'
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0) scale(1)'
    }
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3)
}));

const Logo = styled('div')(({ theme }) => ({
  width: 56,
  height: 56,
  background: `linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)`,
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
  animation: 'canblePulse 3s ease-in-out infinite',
  '@keyframes canblePulse': {
    '0%, 100%': {
      transform: 'scale(1) rotate(0deg)',
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)'
    },
    '33%': {
      transform: 'scale(1.08) rotate(2deg)',
      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.6)'
    },
    '66%': {
      transform: 'scale(1.05) rotate(-1deg)',
      boxShadow: '0 10px 36px rgba(139, 92, 246, 0.5)'
    }
  },
  '& svg': {
    width: 32,
    height: 32,
    fill: 'white'
  }
}));

const SocialButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  borderColor: theme.palette.divider,
  color: theme.palette.text.primary,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(88, 101, 242, 0.04)'
  }
}));

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError());
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSocialLogin = (provider: string) => {
    // Implement social login logic here
    console.log(`Login with ${provider}`);
  };

  const handleDirectLogin = async () => {
    dispatch(clearError());
    const result = await dispatch(directLogin());
    if (directLogin.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <CardContent>
          <LogoContainer>
            <Logo>
              <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Logo>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ 
              color: '#8B5CF6',
              textShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
            }}>
              Canble
            </Typography>
          </LogoContainer>

          <Typography
            variant="h5"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ 
              mb: 3,
              fontWeight: 600,
              color: 'text.primary',
              animation: 'fadeIn 0.8s ease-out 0.2s both'
            }}
          >
            Welcome back!
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ 
              mb: 4,
              animation: 'fadeIn 0.8s ease-out 0.4s both'
            }}
          >
            Connect, collaborate, and create with Canble!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{
            '& .MuiTextField-root': {
              animation: 'slideInLeft 0.6s ease-out',
              '&:nth-of-type(1)': {
                animationDelay: '0.6s',
                animationFillMode: 'both'
              },
              '&:nth-of-type(2)': {
                animationDelay: '0.8s',
                animationFillMode: 'both'
              }
            },
            '@keyframes slideInLeft': {
              '0%': {
                opacity: 0,
                transform: 'translateX(-30px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(0)'
              }
            },
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0
              },
              '100%': {
                opacity: 1
              }
            }
          }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              disabled={loading}
              onClick={handleDirectLogin}
              sx={{
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              {loading ? 'Logging In...' : 'Direct Login (Dev)'}
            </Button>

            <Box textAlign="center" sx={{ mb: 3 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => console.log('Forgot password')}
                sx={{ textDecoration: 'none' }}
              >
                Forgot your password?
              </Link>
            </Box>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Or continue with
              </Typography>
            </Divider>

            <SocialButton
              fullWidth
              variant="outlined"
              startIcon={<GitHub />}
              onClick={() => handleSocialLogin('github')}
            >
              Continue with GitHub
            </SocialButton>

            <SocialButton
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={() => handleSocialLogin('google')}
            >
              Continue with Google
            </SocialButton>

            <Box textAlign="center" sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Need an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
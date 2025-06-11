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
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  GitHub,
  Google
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register as registerUser, clearError } from '../../store/slices/authSlice';

const RegisterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.background.default} 100%)`,
  padding: theme.spacing(2)
}));

const RegisterCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 480,
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3)
}));

const Logo = styled('svg')(({ theme }) => ({
  width: 48,
  height: 48,
  fill: theme.palette.primary.main,
  marginRight: theme.spacing(1)
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
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be less than 32 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the Terms of Service')
});

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    dispatch(clearError());
    const { confirmPassword, agreeToTerms, ...registerData } = data;
    const result = await dispatch(registerUser(registerData));
    if (registerUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSocialLogin = (provider: string) => {
    // Implement social login logic here
    console.log(`Register with ${provider}`);
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <CardContent>
          <LogoContainer>
            <Logo viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </Logo>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Canble
            </Typography>
          </LogoContainer>

          <Typography
            variant="h5"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 2 }}
          >
            Create an account
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4 }}
          >
            Join millions of users on Canble!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Username"
                  autoComplete="username"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

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
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 2 }}
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

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                          aria-label="toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <Controller
              name="agreeToTerms"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      I agree to the{' '}
                      <Link href="#" color="primary" underline="hover">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="#" color="primary" underline="hover">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                  sx={{ mb: 2, alignItems: 'flex-start' }}
                />
              )}
            />
            {errors.agreeToTerms && (
              <Typography variant="caption" color="error" sx={{ mb: 2, display: 'block' }}>
                {errors.agreeToTerms.message}
              </Typography>
            )}

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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

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
                Already have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { checkAuth } from './store/slices/authSlice';
import { createTheme } from './theme/theme';
import LoadingScreen from './components/Common/LoadingScreen';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainLayout from './components/Layout/MainLayout';
import LearnMore from './components/Pages/LearnMore';
import './i18n';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to app if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// App Content Component (needs to be inside Provider to use hooks)
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme: themeMode } = useAppSelector((state) => state.ui);
  const { loading: authLoading } = useAppSelector((state) => state.auth);
  
  const theme = createTheme(themeMode);

  useEffect(() => {
    // Check if user is authenticated on app start
    dispatch(checkAuth());
  }, [dispatch]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen message="Starting Canble..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channels/:serverId/:channelId?"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channels/@me/:channelId?"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
          
          {/* Learn More Page */}
          <Route
            path="/learn-more"
            element={<LearnMore />}
          />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;

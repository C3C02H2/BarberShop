import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from './api';

// Create the auth context
const AuthContext = createContext(null);

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token exists and validate on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication status');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Token found, validating with backend');
        const response = await getMe();
        
        if (response.data && response.data.user) {
          console.log('User authenticated:', response.data.user.username);
          setUser(response.data.user);
          setIsAdmin(response.data.is_admin);
          setIsAuthenticated(true);
          setError(null);
        } else {
          console.warn('Invalid response format from /auth/me/', response.data);
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
        setError('Authentication failed. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      console.log('Attempting login with credentials');
      const response = await apiLogin(credentials);
      const { access_token, user, is_admin } = response.data;
      
      if (!access_token) {
        console.error('No access token in response');
        return { 
          success: false, 
          error: 'Login failed - no token received' 
        };
      }
      
      console.log('Login successful, setting auth state');
      localStorage.setItem('token', access_token);
      setUser(user);
      setIsAdmin(is_admin);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'An error occurred during login');
      return {
        success: false,
        error: error.response?.data?.error || 'An error occurred during login'
      };
    }
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    window.location.href = '/admin/login';
  };

  // Context value
  const value = {
    isAuthenticated,
    isAdmin,
    user,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
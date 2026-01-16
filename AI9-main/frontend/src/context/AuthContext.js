import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_V1 = `${BACKEND_URL}/api/v1`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // DEMO_MODE OFF - require real authentication
  const DEMO_MODE = false;
  const mockUser = null; // No mock user in production

  const [user, setUser] = useState(mockUser);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [clientToken, setClientToken] = useState(localStorage.getItem('clientToken'));
  const [portalToken, setPortalToken] = useState(localStorage.getItem('portalToken'));
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('clientToken');
      if (storedToken) {
        try {
          // Validate token with new API
          const response = await axios.post(`${API_V1}/auth/validate-token`, {}, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (response.data.valid) {
            setUser(response.data.user);
            setToken(storedToken);
            setClientToken(storedToken);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('clientToken');
            setToken(null);
            setClientToken(null);
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('clientToken');
          setToken(null);
          setClientToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    // Use direct login endpoint
    const loginResponse = await axios.post(`${API_V1}/auth/login`, {
      username,
      password
    });
    
    if (!loginResponse.data.success) {
      throw new Error(loginResponse.data.message || 'Login failed');
    }
    
    const { access_token, user: userData } = loginResponse.data;
    
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    
    return userData;
  };

  // Client-specific login for portal
  const clientPasswordLogin = async (username, password) => {
    try {
      const loginResponse = await axios.post(`${API_V1}/auth/login`, {
        username,
        password
      });
      
      if (!loginResponse.data.success) {
        return { success: false, message: loginResponse.data.message || 'Login failed' };
      }
      
      const { access_token, user: userData } = loginResponse.data;
      
      localStorage.setItem('clientToken', access_token);
      localStorage.setItem('token', access_token);
      setClientToken(access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail?.message || error.message || 'Login failed' 
      };
    }
  };

  const register = async (username, password, displayName, referralCode) => {
    const response = await axios.post(`${API_V1}/auth/signup`, {
      username,
      password,
      display_name: displayName,
      referred_by_code: referralCode || null
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Registration failed');
    }
    
    // Auto-login after registration
    return await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('clientToken');
    localStorage.removeItem('portalToken');
    setToken(null);
    setClientToken(null);
    setPortalToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    clientToken,
    portalToken,
    loading,
    isAuthenticated: !!user,
    isPortalAuthenticated: !!user || !!clientToken || !!portalToken,
    isAdmin: user?.role === 'admin',
    login,
    clientPasswordLogin,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

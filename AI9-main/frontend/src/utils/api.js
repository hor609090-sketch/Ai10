/**
 * Centralized API Configuration
 * Single source of truth for backend URL
 */

export const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
export const API_V1 = `${API_BASE}/api/v1`;

// Axios instance with base URL
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_V1,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clientToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token may be invalid or expired');
      // Don't auto-logout, let components handle it
    }
    return Promise.reject(error);
  }
);

export default apiClient;

import axios from 'axios';

// Safe fallback to localhost if env is undefined
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clientToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('clientToken');
      // Check if on portal or admin route
      if (window.location.pathname.startsWith('/portal')) {
        window.location.href = '/client-login';
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

// Export the base URL for components that need it directly
export const BACKEND_URL = API_URL;

import axios from 'axios';
import {
  getAccessToken,
  handleLogin,
  handleLogout
} from './localStorageUtils';

// Base URL for your backend API
const BASE_URL = 'http://localhost:3000/api'; // Update with your actual backend URL

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for sending cookies and credentials
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip adding token for login and registration endpoints
    const noTokenRequiredPaths = ['/auth/login', '/auth/register', '/auth/check-phone', '/auth/send-registration-otp'];

    if (!noTokenRequiredPaths.some(path => config.url.includes(path))) {
      const token = getAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent refresh token calls for login and registration
    const noRefreshPaths = ['/auth/login', '/auth/register'];
    if (noRefreshPaths.some(path => originalRequest.url.includes(path))) {
      return Promise.reject(error);
    }

    // If the error status is 401 and there is no originalRequest._retry flag
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is already in progress, add the request to subscribers
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({ resolve, reject, originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token endpoint now relies on HTTP-only cookie
        const response = await api.post('/auth/refresh-token');

        const { accessToken, user } = response.data;

        // Update tokens and user info
        handleLogin(accessToken, user);

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Logout user if refresh fails
        handleLogout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API methods
export const authApi = {
  // Login method
  login: (phoneNumber, password) => {
    return api.post('/auth/login', { phoneNumber, password })
      .then(response => {
        const { accessToken, user } = response.data;
        handleLogin(accessToken, user);
        return response.data;
      })
      .catch(error => {
        // Extract error message from different possible response structures
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Login failed';

        // Throw a structured error for better handling
        throw {
          message: errorMessage,
          status: error.response?.status,
          originalError: error
        };
      });
  },

  // Logout method
  logout: () => {
    return api.post('/auth/logout')
      .then(() => {
        handleLogout();
      });
  },

  // Other existing methods
  checkPhoneExists: (phoneNumber) => {
    return api.post('/auth/check-phone', { phoneNumber });
  },

  sendRegistrationOTP: (phoneNumber) => {
    return api.post('/auth/send-registration-otp', { phoneNumber });
  },

  sendResetPasswordOTP: (phoneNumber) => {
    return api.post('/auth/send-reset-password-otp', { phoneNumber });
  },

  verifyOTP: (data) => {
    return api.post('/auth/verify-otp', data);
  },

  // User registration
  register: (userData) => {
    return api.post('/auth/register', userData);
  },


  resetPassword: (phoneNumber, newPassword) => {
    return api.post('/auth/reset-password', { phoneNumber, newPassword });
  },

  getProfile: () => {
    return api.get('/user/profile');
  }
};

export default api;

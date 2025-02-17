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
    const noRefreshPaths = ['/auth/login', '/auth/register', '/auth/logout'];
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
        // Attempt to refresh token
        const response = await api.post('/auth/refresh-token', {
          // Include any additional context if needed
          context: 'token_refresh'
        });

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
        console.error('Login error:', error.response?.data || error.message);
        throw error;
      });
  },

  // Logout method with improved error handling
  logout: () => {
    return api.post('/auth/logout')
      .then(response => {
        // Clear local storage and reset application state
        handleLogout();
        return response.data;
      })
      .catch(error => {
        // Handle various logout scenarios
        const errorResponse = error.response?.data;
        
        // If token is expired or invalid, force logout
        if (errorResponse?.error === 'TOKEN_EXPIRED' || 
            errorResponse?.error === 'INVALID_TOKEN') {
          handleLogout();
          return { 
            message: 'Logged out successfully', 
            logoutType: 'FORCE_LOGOUT' 
          };
        }

        console.error('Logout error:', errorResponse || error.message);
        throw error;
      })
      .finally(() => {
        // Always redirect to login after logout attempt
        window.location.href = '/login';
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

// Removed old appApi methods 
// These are now replaced by superAdminApi methods

// Chat API methods
export const chatApi = {
  // Send a message
  sendMessage: (messageData) => {
    return api.post('/chat/send-message', messageData)
      .then(response => response.data)
      .catch(error => {
        console.error('Failed to send message:', error.response?.data || error.message);
        throw error;
      });
  },

  // Get messages
  getMessages: (messagePayload) => {
    return api.post('/chat/messages', messagePayload)
      .then(response => {
        // Return the full message object from the backend
        return response.data;
      })
      .catch(error => {
        console.error('Failed to fetch messages:', error.response?.data || error.message);
        throw error;
      });
  }
};

// Superadmin API methods
export const superAdminApi = {
  // Application Management
  createApplication: async (applicationData) => {
    try {
      const response = await api.post('/superadmin/applications', applicationData);
      return response.data;
    } catch (error) {
      console.error('Error creating application:', error.response?.data || error.message);
      throw error;
    }
  },

  getApplications: async () => {
    try {
      const response = await api.get('/superadmin/applications');
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteApplication: async (applicationId) => {
    try {
      const response = await api.delete(`/superadmin/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting application:', error.response?.data || error.message);
      throw error;
    }
  },

  getApplicationManagementDetails: async (applicationId) => {
    try {
      console.log('Fetching application management details for ID:', applicationId);
      const response = await api.get(`/superadmin/applications/${applicationId}/manage`);
      console.log('Received application management details:', response.data);
      return response.data;
    } catch (error) {
      console.error('Detailed error fetching application management details:', {
        errorResponse: error.response?.data,
        errorMessage: error.message,
        applicationId: applicationId
      });
      
      // Provide a more informative error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(
          error.response.data.message || 
          'Failed to fetch application management details'
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Error setting up the request');
      }
    }
  },

  addApplicationAdmin: async (applicationId, phoneNumber) => {
    try {
      console.log('Adding admin to application:', { applicationId, phoneNumber });
      const response = await api.post(
        `/superadmin/applications/${applicationId}/add-admin`, 
        { phoneNumber }
      );
      console.log('Admin added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Detailed error adding application admin:', {
        errorResponse: error.response?.data,
        errorMessage: error.message,
        applicationId: applicationId,
        phoneNumber: phoneNumber
      });
      
      // Provide a more informative error
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to add application admin'
        );
      } else if (error.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error('Error setting up the request');
      }
    }
  },

  // Block User from Application
  blockUserFromApplication: async (applicationId, phoneNumber, reason = '') => {
    try {
      console.log('Attempting to block user:', { 
        applicationId, 
        phoneNumber,
        reason
      });

      const response = await api.post(
        `/superadmin/applications/${applicationId}/block-user`, 
        { phoneNumber, reason }
      );
      
      console.log('User blocked successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Detailed error blocking user:', {
        errorResponse: error.response?.data,
        errorMessage: error.message,
        applicationId: applicationId,
        phoneNumber: phoneNumber
      });
      
      // Provide a more informative error
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to block user'
        );
      } else if (error.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error('Error setting up the request');
      }
    }
  },

  // Unblock User from Application
  unblockUserFromApplication: async (applicationId, phoneNumber) => {
    try {
      console.log('Attempting to unblock user:', { 
        applicationId, 
        phoneNumber 
      });

      const response = await api.post(
        `/superadmin/applications/${applicationId}/unblock-user`, 
        { phoneNumber }
      );
      
      console.log('User unblocked successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Detailed error unblocking user:', {
        errorResponse: error.response?.data,
        errorMessage: error.message,
        applicationId: applicationId,
        phoneNumber: phoneNumber
      });
      
      // Provide a more informative error
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to unblock user'
        );
      } else if (error.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error('Error setting up the request');
      }
    }
  },

  // Get Blocked Users for Application
  getBlockedUsersForApplication: async (applicationId) => {
    try {
      console.log('Fetching blocked users for application:', applicationId);

      const response = await api.get(
        `/superadmin/applications/${applicationId}/blocked-users`
      );
      
      console.log('Blocked users retrieved successfully:', response.data);
      return response.data.blockedUsers;
    } catch (error) {
      console.error('Detailed error fetching blocked users:', {
        errorResponse: error.response?.data,
        errorMessage: error.message,
        applicationId: applicationId
      });
      
      // Provide a more informative error
      if (error.response) {
        throw new Error(
          error.response.data.message || 
          'Failed to retrieve blocked users'
        );
      } else if (error.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error('Error setting up the request');
      }
    }
  },

  // User Management
  getAllUsers: async () => {
    try {
      const response = await api.get('/superadmin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/superadmin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/superadmin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
      throw error;
    }
  },

  // System Analytics
  getSystemAnalytics: async () => {
    try {
      const response = await api.get('/superadmin/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching system analytics:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default api;

// LocalStorage Utility Functions for Authentication and User Management

const USER_TOKEN_KEY = 'user_token';
const USER_INFO_KEY = 'user_info';

/**
 * Set authentication token in localStorage
 * @param {string} token - Authentication token
 */
export const setAuthToken = (token) => {
  localStorage.setItem(USER_TOKEN_KEY, token);
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} Authentication token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem(USER_TOKEN_KEY);
};

/**
 * Set user information in localStorage
 * @param {Object} userInfo - User information object
 */
export const setUserInfo = (userInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

/**
 * Get user information from localStorage
 * @returns {Object|null} User information object or null
 */
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * Update authentication token and user info on login
 * @param {string} token - Authentication token
 * @param {Object} userInfo - User information object
 */
export const handleLogin = (token, userInfo) => {
  setAuthToken(token);
  setUserInfo(userInfo);
};

/**
 * Update authentication token on token refresh
 * @param {string} newToken - New authentication token
 */
export const handleTokenRefresh = (newToken) => {
  setAuthToken(newToken);
};

/**
 * Clear all authentication-related data on logout
 */
export const handleLogout = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Authentication and Local Storage Utilities

// Local storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';

/**
 * Handle user login by storing access token and user information in localStorage
 * @param {string} accessToken - Access token
 * @param {Object} userInfo - User information object
 */
export const handleLogin = (accessToken, userInfo) => {
  try {
    // Store tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    // Store user info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

    // Dispatch custom event for authentication state change
    window.dispatchEvent(new Event('authChange'));
  } catch (error) {
    console.error('Error storing login information:', error);
  }
};

/**
 * Handle user logout by removing access token, refresh token, and user information from localStorage
 */
export const handleLogout = () => {
  try {
    // Remove tokens
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    // Remove user info
    localStorage.removeItem(USER_INFO_KEY);

    // Dispatch custom event for authentication state change
    window.dispatchEvent(new Event('authChange'));
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

/**
 * Get access token from localStorage
 * @returns {string|null} Access token or null
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} Refresh token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Get user information from localStorage
 * @returns {Object|null} User information object or null
 */
export const getUserInfo = () => {
  const userInfoString = localStorage.getItem(USER_INFO_KEY);
  return userInfoString ? JSON.parse(userInfoString) : null;
};

/**
 * Check if user is authenticated by checking for access token in localStorage
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Get user role from user information
 * @returns {string|null} User role or null
 */
export const getUserRole = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.role : null;
};

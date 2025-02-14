// Authentication and Local Storage Utilities

// Local storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_INFO_KEY = 'userInfo';

/**
 * Handle user login by storing access token and user information in localStorage
 * @param {string} accessToken - Access token
 * @param {Object} userInfo - User information object
 */
export const handleLogin = (accessToken, userInfo) => {
  try {
    // Store access token
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
 * Handle user logout by removing access token and user information from localStorage
 */
export const handleLogout = () => {
  try {
    // Remove tokens and user info
    localStorage.removeItem(ACCESS_TOKEN_KEY);
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
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving access token:', error);
    return null;
  }
};

/**
 * Get user info from localStorage
 * @returns {Object|null} User info object or null
 */
export const getUserInfo = () => {
  try {
    const userInfoString = localStorage.getItem(USER_INFO_KEY);
    return userInfoString ? JSON.parse(userInfoString) : null;
  } catch (error) {
    console.error('Error retrieving user info:', error);
    return null;
  }
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

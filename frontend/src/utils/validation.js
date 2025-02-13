/**
 * Validates a phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  
  // Check if the number is exactly 10 digits
  // Optional: Add more specific validation for Indian mobile numbers
  const indianMobileRegex = /^[6-9]\d{9}$/;
  return indianMobileRegex.test(cleanedNumber);
};

/**
 * Sanitizes a phone number by removing non-digit characters
 * @param {string} phoneNumber - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  return phoneNumber.replace(/\D/g, '');
};

// Name validation
/**
 * Validates a name
 * @param {string} name - Name to validate
 * @returns {string|null} - Error message if invalid, null if valid
 */
export const validateName = (name) => {
  // Trim whitespace
  const trimmedName = name.trim();
  
  // Check name length
  if (trimmedName.length < 2) {
    return "Name must be at least 2 characters long";
  }
  
  // Check for valid name characters (letters, spaces, hyphens)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  
  return null; // No error
};

// Password validation
/**
 * Validates a password
 * @param {string} password - Password to validate
 * @param {string} [confirmPassword] - Password confirmation
 * @returns {string|null} - Error message if invalid, null if valid
 */
export const validatePassword = (password, confirmPassword = null) => {
  // Check password length
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character";
  }
  
  // Check password confirmation if provided
  if (confirmPassword !== null && password !== confirmPassword) {
    return "Passwords do not match";
  }
  
  return null; // No error
};

/**
 * Validates an Indian phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const validateIndianPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  
  // Check for valid Indian mobile number patterns
  const indianMobileRegex = /^[6-9]\d{9}$/;
  
  return indianMobileRegex.test(cleanedNumber);
};

/**
 * Validates a phone number based on country code
 * @param {string} phoneNumber - Phone number to validate
 * @param {string} countryCode - Country code (default: +91)
 * @returns {boolean} - Whether the phone number is valid
 */
export const validatePhoneNumber = (
  phoneNumber, 
  countryCode = '+91'
) => {
  switch(countryCode) {
    case '+91': // India
      return validateIndianPhoneNumber(phoneNumber);
    default:
      // Generic validation for other country codes
      return /^\d{10}$/.test(phoneNumber.replace(/\D/g, ''));
  }
};

/**
 * Sanitizes a phone number by removing non-digit characters
 * @param {string} phoneNumber - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/\D/g, '');
};

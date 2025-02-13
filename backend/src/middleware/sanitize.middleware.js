import validator from 'validator';
import xss from 'xss';

// Helper function to sanitize object values recursively
const sanitizeData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return typeof data === 'string' ? xss(validator.escape(data)) : data;
  }

  return Object.keys(data).reduce((acc, key) => {
    acc[key] = sanitizeData(data[key]);
    return acc;
  }, Array.isArray(data) ? [] : {});
};

// Middleware to sanitize request body and check for malicious content
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    req.sanitizedBody = sanitizeData(req.body);

    // Basic security checks
    const suspiciousPatterns = [
      /<script\b[^>]*>/i,                 // Inline scripts
      /javascript:/i,                     // JavaScript protocol
      /data:/i,                           // Data URLs
      /vbscript:/i,                       // VBScript protocol
      /onload=/i,                         // onload events
      /onerror=/i,                        // onerror events
      /<%[^>]*%>/,                        // Server-side includes
      /\${.*}/,                           // Template literals
      /eval\s*\(/,                        // eval() function
      /exec\s*\(/,                        // exec() function
    ];

    // Check for suspicious patterns in sanitized body
    Object.keys(req.sanitizedBody).forEach(key => {
      const value = req.sanitizedBody[key];
      if (typeof value === 'string') {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(value)) {
            throw new Error(`Potential security risk detected in ${key}`);
          }
        });
      }
    });

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json({ 
      message: 'Invalid request data', 
      error: error.message 
    });
  }
};

export default sanitizeInput;

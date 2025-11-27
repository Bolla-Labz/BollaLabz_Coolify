/**
 * Input Sanitization Middleware
 * Sanitizes all user input to prevent XSS and injection attacks
 * Last Modified: 2025-11-24 01:30
 */

/**
 * Strip HTML tags from a string
 * SECURITY: Removes all HTML/XML tags to prevent XSS
 */
function stripHtmlTags(str) {
  // Remove HTML tags but keep text content
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags and content
    .replace(/<[^>]+>/g, '') // Remove all other HTML tags
    .replace(/&lt;/g, '<') // Decode HTML entities that might have been encoded
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Recursively sanitize object values
 * SECURITY: Strip ALL HTML tags from API inputs
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Remove null bytes
    value = value.replace(/\0/g, '');

    // Trim whitespace
    value = value.trim();

    // SECURITY FIX: Strip ALL HTML tags
    // This prevents XSS attacks by removing any HTML/script content
    // For API inputs, we don't need HTML - strip everything
    value = stripHtmlTags(value);

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item));
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        // Sanitize keys to prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue; // Skip dangerous keys
        }
        sanitized[key] = sanitizeValue(value[key]);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters by creating a new object
  if (req.query) {
    const sanitizedQuery = sanitizeValue(req.query);
    // Replace the query with sanitized version
    Object.keys(req.query).forEach(key => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }

  // Sanitize URL parameters by creating a new object
  if (req.params) {
    const sanitizedParams = sanitizeValue(req.params);
    // Replace the params with sanitized version
    Object.keys(req.params).forEach(key => delete req.params[key]);
    Object.assign(req.params, sanitizedParams);
  }

  next();
};

/**
 * Validate that string doesn't contain SQL injection patterns
 * This is a defense-in-depth measure - parameterized queries are the primary defense
 */
export function containsSQLInjectionPatterns(input) {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/gi,
    /(--|\/\*|\*\/|;)/g, // SQL comment patterns and semicolons
    /(\bXP_\w+)/gi, // Extended stored procedures
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Middleware to detect SQL injection attempts
 */
export const detectSQLInjection = (req, res, next) => {
  const checkValue = (value, path = '') => {
    if (typeof value === 'string' && containsSQLInjectionPatterns(value)) {
      return path;
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = checkValue(value[i], `${path}[${i}]`);
        if (result) return result;
      }
    }

    if (value !== null && typeof value === 'object') {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          const result = checkValue(value[key], path ? `${path}.${key}` : key);
          if (result) return result;
        }
      }
    }

    return null;
  };

  // Check body
  if (req.body) {
    const suspiciousField = checkValue(req.body, 'body');
    if (suspiciousField) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Potentially malicious input detected'
      });
    }
  }

  // Check query
  if (req.query) {
    const suspiciousField = checkValue(req.query, 'query');
    if (suspiciousField) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Potentially malicious input detected'
      });
    }
  }

  next();
};

export default sanitizeInput;

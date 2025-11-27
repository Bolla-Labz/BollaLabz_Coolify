// Last Modified: 2025-11-23 17:30
/**
 * Additional Security Headers Middleware
 * Adds extra security headers beyond what helmet provides
 */

/**
 * Add security headers to all responses
 */
export const addSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Disable browser features that could be exploited
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

/**
 * Add cache control headers based on content type
 */
export const addCacheHeaders = (req, res, next) => {
  // Default: no caching for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  next();
};

/**
 * Add CORS preflight cache headers
 */
export const addCorsPreflightCache = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Cache preflight requests for 1 hour
    res.setHeader('Access-Control-Max-Age', '3600');
  }
  next();
};

/**
 * Prevent information disclosure in errors
 */
export const sanitizeErrorHeaders = (req, res, next) => {
  // Override res.json to sanitize error responses
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // In production, remove stack traces and internal details
    if (process.env.NODE_ENV === 'production' && body.error) {
      if (body.stack) {
        delete body.stack;
      }
      if (body.sql) {
        delete body.sql;
      }
      if (body.detail) {
        delete body.detail;
      }
    }

    return originalJson(body);
  };

  next();
};

export default addSecurityHeaders;

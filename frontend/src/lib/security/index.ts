// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz Security Layer
 * Comprehensive security implementation aligned with project vision:
 * - Zero cognitive load through automatic protection
 * - Production-grade reliability with enterprise security
 * - Human-first design with transparent security measures
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// ============================================
// 1. INPUT SANITIZATION
// ============================================

/**
 * Sanitize user input to prevent XSS attacks
 * Aligns with "Production-Grade Reliability" principle
 */
export const sanitizeInput = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'li', 'ol'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  });
};

/**
 * Sanitize HTML content for rich text editors
 */
export const sanitizeRichText = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'code', 'pre', 'table', 'thead', 'tbody',
      'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize phone numbers - critical for Twilio integration
 */
export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Validate E.164 format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(cleaned)) {
    throw new Error('Invalid phone number format');
  }

  // Ensure + prefix for E.164
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// ============================================
// 2. CSRF PROTECTION
// ============================================

/**
 * CSRF Token Management
 * Prevents cross-site request forgery attacks
 */
export class CSRFProtection {
  private static TOKEN_KEY = 'bollalabz_csrf_token';
  private static TOKEN_HEADER = 'X-CSRF-Token';

  /**
   * Generate a cryptographically secure CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Store CSRF token in session storage
   */
  static storeToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Retrieve CSRF token
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Add CSRF token to request headers
   */
  static addToHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = this.getToken();
    if (token) {
      return {
        ...headers,
        [this.TOKEN_HEADER]: token,
      };
    }
    return headers;
  }

  /**
   * Verify CSRF token on incoming requests
   */
  static verifyToken(requestToken: string): boolean {
    const storedToken = this.getToken();
    return !!storedToken && storedToken === requestToken;
  }
}

// ============================================
// 3. RATE LIMITING
// ============================================

/**
 * Client-side rate limiting to prevent abuse
 * Implements exponential backoff for failed requests
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 10, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed
   */
  isAllowed(action: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(action) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(action, recentAttempts);

    return true;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(action: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(action) || [];
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Calculate exponential backoff delay
   */
  getBackoffDelay(failureCount: number): number {
    return Math.min(1000 * Math.pow(2, failureCount), 30000);
  }

  /**
   * Reset attempts for an action
   */
  reset(action: string): void {
    this.attempts.delete(action);
  }
}

// ============================================
// 4. DATA VALIDATION SCHEMAS
// ============================================

/**
 * Comprehensive validation schemas using Zod
 * Ensures data integrity throughout the application
 */

// Contact validation schema - critical for relationship management
export const ContactSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .transform(val => sanitizeInput(val.trim())),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .transform(val => sanitizeInput(val.trim())),

  email: z.string()
    .email('Invalid email address')
    .max(255)
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .transform(val => sanitizePhoneNumber(val))
    .optional()
    .or(z.literal('')),

  context: z.string()
    .max(5000, 'Context must be less than 5000 characters')
    .transform(val => sanitizeRichText(val))
    .optional(),

  tags: z.array(z.string().max(30))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "At least one contact method (email or phone) is required",
    path: ['email']
  }
);

// Message validation for conversations
export const MessageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long')
    .transform(val => sanitizeRichText(val)),

  recipientPhone: z.string()
    .transform(val => sanitizePhoneNumber(val)),

  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'document', 'audio']),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  })).optional(),
});

// Task validation for scheduling
export const TaskSchema = z.object({
  title: z.string()
    .min(1, 'Task title is required')
    .max(200)
    .transform(val => sanitizeInput(val.trim())),

  description: z.string()
    .max(5000)
    .transform(val => sanitizeRichText(val))
    .optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent']),

  dueDate: z.string().datetime().optional(),

  assignedTo: z.string().uuid().optional(),

  dependencies: z.array(z.string().uuid()).optional(),
});

// ============================================
// 5. SECURE STORAGE
// ============================================

/**
 * Secure storage wrapper with encryption for sensitive data
 * Implements "Zero Cognitive Load" by handling encryption automatically
 */
export class SecureStorage {
  private static ENCRYPTION_KEY = 'bollalabz_encryption_key';

  /**
   * Encrypt sensitive data before storage
   */
  private static async encrypt(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Get or generate encryption key
    let key = await this.getKey();
    if (!key) {
      key = await this.generateKey();
    }

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data from storage
   */
  private static async decrypt(encryptedText: string): Promise<string> {
    const key = await this.getKey();
    if (!key) {
      throw new Error('No encryption key found');
    }

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Generate encryption key
   */
  private static async generateKey(): Promise<CryptoKey> {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Store key (in production, use more secure method)
    const exported = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(this.ENCRYPTION_KEY, JSON.stringify(exported));

    return key;
  }

  /**
   * Retrieve encryption key
   */
  private static async getKey(): Promise<CryptoKey | null> {
    const stored = localStorage.getItem(this.ENCRYPTION_KEY);
    if (!stored) return null;

    const jwk = JSON.parse(stored);
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Store sensitive data securely
   */
  static async setSecure(key: string, value: any): Promise<void> {
    const stringified = JSON.stringify(value);
    const encrypted = await this.encrypt(stringified);
    localStorage.setItem(`secure_${key}`, encrypted);
  }

  /**
   * Retrieve sensitive data
   */
  static async getSecure<T>(key: string): Promise<T | null> {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;

    try {
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static removeSecure(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }
}

// ============================================
// 6. CONTENT SECURITY POLICY
// ============================================

/**
 * Generate Content Security Policy headers
 * Prevents various injection attacks
 */
export const generateCSP = (): string => {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.bollalabz.com wss://api.bollalabz.com https://api.twilio.com https://api.elevenlabs.io",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  return policies.join('; ');
};

// ============================================
// 7. SESSION MANAGEMENT
// ============================================

/**
 * Secure session management
 * Implements automatic session timeout for security
 */
export class SessionManager {
  private static IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  private static lastActivity = Date.now();
  private static warningShown = false;
  private static timeoutId: NodeJS.Timeout | null = null;
  private static warningCallback?: () => void;
  private static timeoutCallback?: () => void;

  /**
   * Initialize session monitoring
   */
  static init(
    onWarning?: () => void,
    onTimeout?: () => void
  ): void {
    this.warningCallback = onWarning;
    this.timeoutCallback = onTimeout;

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer());
    });

    this.resetTimer();
  }

  /**
   * Reset inactivity timer
   */
  private static resetTimer(): void {
    this.lastActivity = Date.now();
    this.warningShown = false;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set warning timeout
    const warningTimeout = this.IDLE_TIMEOUT - this.WARNING_TIME;
    this.timeoutId = setTimeout(() => {
      if (!this.warningShown && this.warningCallback) {
        this.warningShown = true;
        this.warningCallback();
      }

      // Set final timeout
      this.timeoutId = setTimeout(() => {
        if (this.timeoutCallback) {
          this.timeoutCallback();
        }
      }, this.WARNING_TIME);
    }, warningTimeout);
  }

  /**
   * Get remaining session time
   */
  static getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.IDLE_TIMEOUT - elapsed);
  }

  /**
   * Extend session
   */
  static extendSession(): void {
    this.resetTimer();
  }

  /**
   * End session
   */
  static endSession(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    sessionStorage.clear();
    // Don't clear localStorage to preserve user preferences
  }
}

// ============================================
// 8. AUDIT LOGGING
// ============================================

/**
 * Security audit logging
 * Tracks all security-related events for compliance
 * NOTE: The interface is exported at the end of this file
 */

export class SecurityAudit {
  private static logs: SecurityLog[] = [];
  private static MAX_LOGS = 1000;

  /**
   * Log security event
   */
  static log(
    event: string,
    severity: SecurityLog['severity'] = 'info',
    details?: any
  ): void {
    const log: SecurityLog = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      userId: this.getCurrentUserId(),
      details,
      ip: this.getClientIP(),
    };

    this.logs.push(log);

    // Trim logs if exceeding max
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Send critical events to server immediately
    if (severity === 'critical') {
      this.sendToServer([log]);
    }
  }

  /**
   * Get current user ID from auth store
   */
  private static getCurrentUserId(): string | undefined {
    // This would integrate with your auth store
    return undefined; // Placeholder
  }

  /**
   * Get client IP (requires server cooperation)
   */
  private static getClientIP(): string | undefined {
    // This would be set by the server in a meta tag or API response
    return undefined; // Placeholder
  }

  /**
   * Send logs to server
   */
  private static async sendToServer(logs: SecurityLog[]): Promise<void> {
    try {
      await fetch('/api/security/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...CSRFProtection.addToHeaders(),
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('Failed to send security logs:', error);
    }
  }

  /**
   * Get recent logs
   */
  static getRecentLogs(count = 100): SecurityLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    this.logs = [];
  }
}

// ============================================
// 9. EXPORT SECURITY MIDDLEWARE
// ============================================

/**
 * Security middleware for API requests
 * Automatically applies all security measures
 */
export const securityMiddleware = {
  /**
   * Apply security headers to request
   */
  applyRequestSecurity: (config: any) => {
    // Add CSRF token
    config.headers = CSRFProtection.addToHeaders(config.headers);

    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-Content-Type-Options'] = 'nosniff';

    return config;
  },

  /**
   * Validate response security
   */
  validateResponseSecurity: (response: any) => {
    // Check for security headers
    const csp = response.headers.get('Content-Security-Policy');
    if (!csp) {
      SecurityAudit.log('Missing CSP header', 'warning', {
        url: response.url,
      });
    }

    return response;
  },
};

// Export type for SecurityLog
export interface SecurityLog {
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  details?: any;
  ip?: string;
}

export default {
  sanitizeInput,
  sanitizeRichText,
  sanitizePhoneNumber,
  CSRFProtection,
  RateLimiter,
  ContactSchema,
  MessageSchema,
  TaskSchema,
  SecureStorage,
  generateCSP,
  SessionManager,
  SecurityAudit,
  securityMiddleware,
};
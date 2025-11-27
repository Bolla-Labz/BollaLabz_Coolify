// Last Modified: 2025-11-23 17:30
/**
 * XSS Protection Utilities
 * Provides sanitization and validation for user input to prevent XSS attacks
 */

import DOMPurify from 'dompurify'
import type { Config as DOMPurifyConfig } from 'dompurify'

/**
 * Default DOMPurify configuration
 */
const DEFAULT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div', 'a', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  SAFE_FOR_TEMPLATES: true,
}

/**
 * Strict configuration for plain text only
 */
const STRICT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(
  dirty: string,
  config: DOMPurifyConfig = DEFAULT_CONFIG
): string {
  if (typeof window === 'undefined') {
    // Server-side: Strip all HTML tags as a fallback
    // This prevents XSS but preserves text content
    console.warn('DOMPurify is not available on server-side, stripping HTML tags')
    return dirty.replace(/<[^>]*>/g, '').trim()
  }

  return String(DOMPurify.sanitize(dirty, config))
}

/**
 * Sanitize plain text (removes all HTML)
 */
export function sanitizeText(dirty: string): string {
  return sanitizeHTML(dirty, STRICT_CONFIG)
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string): string {
  if (!url) return ''

  // Remove javascript: and data: protocols
  const sanitized = url.replace(/^(javascript|data):/gi, '')

  // Ensure the URL starts with http://, https://, or /
  if (!/^(https?:\/\/|\/)/i.test(sanitized)) {
    return ''
  }

  return sanitized
}

/**
 * Escape HTML entities
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Unescape HTML entities
 */
export function unescapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  }

  return text.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;)/g, (entity) => map[entity] || entity)
}

/**
 * Validate and sanitize JSON string
 */
export function sanitizeJSON(jsonString: string): object | null {
  try {
    const parsed = JSON.parse(jsonString)
    // Recursively sanitize string values in the parsed object
    return sanitizeObject(parsed)
  } catch (error) {
    console.error('Invalid JSON:', error)
    return null
  }
}

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeText(key)
        sanitized[sanitizedKey] = sanitizeObject(obj[key])
      }
    }
    return sanitized
  }

  return obj
}

/**
 * Content Security Policy (CSP) helper
 */
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    // Only allow unsafe-eval for development; use nonce for inline scripts in production
    "script-src 'self' https://apis.google.com https://cdn.vapi.ai",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' ws://localhost:* wss://localhost:* https://api.bollalabz.com https://api.anthropic.com https://api.elevenlabs.io https://api.vapi.ai wss://api.vapi.ai",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
}

/**
 * Validate input against common XSS patterns
 */
export function containsXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<img[^>]*src[\\s]*=[\\s]*["\']javascript:/gi,
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Safe innerHTML setter with sanitization
 */
export function setSafeInnerHTML(
  element: HTMLElement,
  html: string,
  config?: DOMPurifyConfig
): void {
  if (!element) return

  const sanitized = sanitizeHTML(html, config)
  element.innerHTML = sanitized
}

/**
 * Hook for using XSS protection in React components
 */
export function useXSSProtection() {
  return {
    sanitizeHTML,
    sanitizeText,
    sanitizeURL,
    escapeHTML,
    unescapeHTML,
    containsXSSPatterns,
    createMarkup: (html: string) => ({
      __html: sanitizeHTML(html),
    }),
  }
}
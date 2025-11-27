// Last Modified: 2025-11-23 17:30
/**
 * CSRF Protection Utilities
 * Implements token-based CSRF protection for the application
 */

import { generateId } from '@/lib/utils'

const CSRF_TOKEN_KEY = 'bollalabz_csrf_token'
const CSRF_HEADER = 'X-CSRF-Token'

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  const token = generateId('csrf')
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token)
  }
  return token
}

/**
 * Get the current CSRF token
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null

  let token = sessionStorage.getItem(CSRF_TOKEN_KEY)
  if (!token) {
    token = generateCSRFToken()
  }
  return token
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken()
  return storedToken === token && storedToken !== null
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken()
  if (token) {
    return {
      ...headers,
      [CSRF_HEADER]: token,
    }
  }
  return headers
}

/**
 * Extract CSRF token from meta tag (for server-rendered pages)
 */
export function getCSRFTokenFromMeta(): string | null {
  if (typeof document === 'undefined') return null

  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta?.getAttribute('content') || null
}

/**
 * Create a CSRF meta tag
 */
export function createCSRFMetaTag(): void {
  if (typeof document === 'undefined') return

  const existingMeta = document.querySelector('meta[name="csrf-token"]')
  if (existingMeta) {
    existingMeta.setAttribute('content', getCSRFToken() || '')
  } else {
    const meta = document.createElement('meta')
    meta.name = 'csrf-token'
    meta.content = getCSRFToken() || ''
    document.head.appendChild(meta)
  }
}

/**
 * CSRF middleware for axios or fetch
 */
export function csrfMiddleware(config: any): any {
  // For axios config
  if (config.headers) {
    config.headers = addCSRFHeader(config.headers)
  }
  return config
}

/**
 * Hook to use CSRF protection in components
 */
export function useCSRF() {
  const token = getCSRFToken()

  return {
    token,
    regenerateToken: generateCSRFToken,
    validateToken: validateCSRFToken,
    getHeaders: () => ({ [CSRF_HEADER]: token }),
  }
}

// Initialize CSRF token on app load
if (typeof window !== 'undefined') {
  if (!getCSRFToken()) {
    generateCSRFToken()
  }
  createCSRFMetaTag()
}
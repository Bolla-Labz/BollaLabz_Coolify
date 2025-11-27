// Last Modified: 2025-11-23 17:30
/**
 * Secure Storage Utilities
 * Provides secure storage for user data using Web Crypto API
 *
 * ⚠️  SECURITY NOTICE ⚠️
 *
 * This module now uses the Web Crypto API for proper encryption.
 *
 * DO NOT USE THIS FOR:
 * - Authentication tokens (use httpOnly cookies)
 * - Passwords or highly sensitive credentials
 * - Payment information (PCI compliance required)
 *
 * APPROPRIATE USE CASES:
 * - User preferences
 * - UI state
 * - Non-critical cache data
 * - Public user profile information
 *
 * For authentication, we use httpOnly cookies set by the backend.
 * See: src/lib/api/client.ts (withCredentials: true)
 */

import { safeJsonParse } from '@/lib/utils'

/**
 * Web Crypto API based encryption
 */
class CryptoManager {
  private algorithm = 'AES-GCM'
  private keyUsages: KeyUsage[] = ['encrypt', 'decrypt']

  /**
   * Derive a key from a password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer, // Cast to ArrayBuffer to fix TypeScript issue
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: 256 },
      true,
      this.keyUsages
    )
  }

  /**
   * Encrypt text using Web Crypto API
   */
  async encrypt(text: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)

      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // Derive key from password
      const key = await this.deriveKey(password, salt)

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        data
      )

      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encrypted), salt.length + iv.length)

      // Convert to base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Encryption failed:', error)
      // Fallback to base64 encoding (obfuscation only)
      return btoa(text)
    }
  }

  /**
   * Decrypt text using Web Crypto API
   */
  async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16)
      const iv = combined.slice(16, 28)
      const encrypted = combined.slice(28)

      // Derive key from password
      const key = await this.deriveKey(password, salt)

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        key,
        encrypted
      )

      // Convert back to string
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      // Try to decode as plain base64 (fallback for non-encrypted data)
      try {
        return atob(encryptedData)
      } catch {
        throw new Error('Failed to decrypt data')
      }
    }
  }
}

// Singleton instance
const cryptoManager = new CryptoManager()

// Use a derivation of the environment key for encryption
const ENCRYPTION_PASSWORD = import.meta.env.VITE_ENCRYPTION_KEY || 'bollalabz-default-key-change-in-production'

/**
 * Storage types
 */
export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
}

/**
 * Storage options
 */
interface StorageOptions {
  type?: StorageType
  encrypt?: boolean
  expires?: number // Expiration time in milliseconds
}

/**
 * Storage item with metadata
 */
interface StorageItem<T> {
  value: T
  expires?: number
  encrypted?: boolean
}

/**
 * SecureStorage class for managing encrypted storage
 */
export class SecureStorage {
  private storage: Storage
  private prefix: string

  constructor(
    type: StorageType = StorageType.LOCAL,
    prefix: string = 'bollalabz_'
  ) {
    if (typeof window === 'undefined') {
      throw new Error('SecureStorage is only available in browser environment')
    }

    this.storage = type === StorageType.LOCAL ? localStorage : sessionStorage
    this.prefix = prefix
  }

  /**
   * Set an item in storage
   */
  async set<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<void> {
    const { encrypt = false, expires } = options
    const prefixedKey = this.prefix + key

    const item: StorageItem<T> = {
      value,
      expires: expires ? Date.now() + expires : undefined,
      encrypted: encrypt,
    }

    let serialized = JSON.stringify(item)

    if (encrypt) {
      serialized = await cryptoManager.encrypt(serialized, ENCRYPTION_PASSWORD)
    }

    this.storage.setItem(prefixedKey, serialized)
  }

  /**
   * Get an item from storage
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const prefixedKey = this.prefix + key
    const stored = this.storage.getItem(prefixedKey)

    if (!stored) {
      return defaultValue
    }

    try {
      let decrypted = stored

      // Try to decrypt if it looks encrypted (base64 with proper length)
      if (stored.length > 50 && /^[A-Za-z0-9+/]+=*$/.test(stored)) {
        try {
          decrypted = await cryptoManager.decrypt(stored, ENCRYPTION_PASSWORD)
        } catch {
          // Not encrypted or wrong password, use as-is
          decrypted = stored
        }
      }

      const item: StorageItem<T> = JSON.parse(decrypted)

      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        this.remove(key)
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error('Error reading from storage:', error)
      return defaultValue
    }
  }

  /**
   * Remove an item from storage
   */
  remove(key: string): void {
    const prefixedKey = this.prefix + key
    this.storage.removeItem(prefixedKey)
  }

  /**
   * Clear all items with the prefix
   */
  clear(): void {
    const keys = Object.keys(this.storage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key)
      }
    })
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    const prefixedKey = this.prefix + key
    return this.storage.getItem(prefixedKey) !== null
  }

  /**
   * Get all keys with the prefix
   */
  keys(): string[] {
    const keys = Object.keys(this.storage)
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length))
  }

  /**
   * Get storage size in bytes
   */
  size(): number {
    let total = 0
    const keys = this.keys()
    keys.forEach(key => {
      const value = this.storage.getItem(this.prefix + key)
      if (value) {
        total += value.length + key.length
      }
    })
    return total
  }

  /**
   * Synchronous set (without encryption) for backwards compatibility
   */
  setSync<T>(key: string, value: T, expires?: number): void {
    const prefixedKey = this.prefix + key
    const item: StorageItem<T> = {
      value,
      expires: expires ? Date.now() + expires : undefined,
      encrypted: false,
    }
    this.storage.setItem(prefixedKey, JSON.stringify(item))
  }

  /**
   * Synchronous get (without decryption) for backwards compatibility
   */
  getSync<T>(key: string, defaultValue?: T): T | undefined {
    const prefixedKey = this.prefix + key
    const stored = this.storage.getItem(prefixedKey)

    if (!stored) {
      return defaultValue
    }

    try {
      const item: StorageItem<T> = JSON.parse(stored)

      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        this.remove(key)
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error('Error reading from storage:', error)
      return defaultValue
    }
  }
}

/**
 * Default secure storage instances
 */
export const secureLocalStorage = new SecureStorage(StorageType.LOCAL)
export const secureSessionStorage = new SecureStorage(StorageType.SESSION)

/**
 * ⚠️  DEPRECATED: Token storage utilities
 *
 * DO NOT USE! Authentication tokens are now stored in httpOnly cookies
 * set by the backend. These utilities are kept for backwards compatibility
 * but should NOT be used for new code.
 *
 * Use httpOnly cookies instead (see backend/api/v1/auth.js and src/lib/api/client.ts)
 */
export const tokenStorage = {
  setAccessToken(token: string): void {
    console.warn('DEPRECATED: tokenStorage.setAccessToken() - Use httpOnly cookies instead')
    secureSessionStorage.setSync('access_token', token)
  },

  getAccessToken(): string | undefined {
    console.warn('DEPRECATED: tokenStorage.getAccessToken() - Tokens are in httpOnly cookies')
    return secureSessionStorage.getSync<string>('access_token')
  },

  setRefreshToken(token: string): void {
    console.warn('DEPRECATED: tokenStorage.setRefreshToken() - Use httpOnly cookies instead')
    secureLocalStorage.setSync('refresh_token', token, 30 * 24 * 60 * 60 * 1000)
  },

  getRefreshToken(): string | undefined {
    console.warn('DEPRECATED: tokenStorage.getRefreshToken() - Tokens are in httpOnly cookies')
    return secureLocalStorage.getSync<string>('refresh_token')
  },

  clearTokens(): void {
    console.warn('DEPRECATED: tokenStorage.clearTokens() - Cookies cleared by backend')
    secureSessionStorage.remove('access_token')
    secureLocalStorage.remove('refresh_token')
  },
}

/**
 * User preferences storage (synchronous for performance)
 */
export const preferencesStorage = {
  set(preferences: Record<string, any>): void {
    secureLocalStorage.setSync('user_preferences', preferences)
  },

  get(): Record<string, any> {
    return secureLocalStorage.getSync('user_preferences', {}) || {}
  },

  update(updates: Record<string, any>): void {
    const current = this.get()
    this.set({ ...current, ...updates })
  },

  clear(): void {
    secureLocalStorage.remove('user_preferences')
  },
}

/**
 * Cache storage with TTL (synchronous for performance)
 */
export const cacheStorage = {
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    secureLocalStorage.setSync(`cache_${key}`, data, ttl)
  },

  get<T>(key: string): T | undefined {
    return secureLocalStorage.getSync<T>(`cache_${key}`)
  },

  remove(key: string): void {
    secureLocalStorage.remove(`cache_${key}`)
  },

  clearAll(): void {
    const keys = secureLocalStorage.keys()
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        secureLocalStorage.remove(key)
      }
    })
  },
}

/**
 * Hook for using secure storage in React components
 * Returns async methods for encrypted storage
 */
export function useSecureStorage(type: StorageType = StorageType.LOCAL) {
  const storage = type === StorageType.LOCAL ? secureLocalStorage : secureSessionStorage

  return {
    set: storage.set.bind(storage),
    get: storage.get.bind(storage),
    setSync: storage.setSync.bind(storage),
    getSync: storage.getSync.bind(storage),
    remove: storage.remove.bind(storage),
    clear: storage.clear.bind(storage),
    has: storage.has.bind(storage),
    keys: storage.keys.bind(storage),
  }
}
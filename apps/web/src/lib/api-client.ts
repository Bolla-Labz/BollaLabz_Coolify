/**
 * Authenticated API Client
 * Centralized fetch wrapper with Clerk JWT authentication
 */

import { auth } from "@clerk/nextjs/server";

/**
 * API base URL - configured via environment variable
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * Server-side authenticated fetch wrapper
 * Automatically includes Clerk session token in Authorization header
 *
 * @param endpoint - API endpoint path (e.g., "/contacts")
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response>
 *
 * @example
 * ```typescript
 * // Server Component or Server Action
 * const response = await authenticatedFetch("/contacts", {
 *   method: "POST",
 *   body: JSON.stringify({ firstName: "John" })
 * });
 * ```
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get session token from Clerk
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new Error("No authentication token available");
  }

  // Merge headers with Authorization
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  // Construct full URL
  const url = `${API_BASE_URL}${endpoint}`;

  // Make authenticated request
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Client-side authenticated fetch wrapper hook
 * Use this in Client Components with useAuth from Clerk
 *
 * @param token - Session token from useAuth().getToken()
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Promise<Response>
 *
 * @example
 * ```typescript
 * // Client Component
 * "use client";
 * import { useAuth } from "@clerk/nextjs";
 *
 * const { getToken } = useAuth();
 * const token = await getToken();
 * const response = await clientFetch(token, "/contacts");
 * ```
 */
export async function clientFetch(
  token: string | null,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!token) {
    throw new Error("No authentication token provided");
  }

  // Merge headers with Authorization
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  // Construct full URL
  const url = `${API_BASE_URL}${endpoint}`;

  // Make authenticated request
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper to create query params string
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

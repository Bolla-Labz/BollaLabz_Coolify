# API Client Usage Guide
<!-- Last Modified: 2025-11-24 00:00 -->

## Overview

This directory contains a safe, production-ready API client with automatic error handling, retry logic, and user-friendly notifications. The client uses a **Result pattern** inspired by Rust to handle errors explicitly without throwing exceptions.

## Key Features

- **Safe Error Handling**: No unhandled promise rejections or application crashes
- **Automatic Retries**: Retry logic with exponential backoff for transient failures (5xx errors)
- **User-Friendly Notifications**: Automatic toast notifications for all error types
- **Type-Safe**: Full TypeScript support with strict typing
- **Logging**: Integrated Sentry logging for monitoring and debugging

## Result Pattern

Instead of throwing exceptions, API functions return a `Result<T, E>` type that explicitly represents success or failure:

```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### Benefits

1. **No crashes**: Errors are values, not exceptions
2. **Explicit handling**: You must check if the result succeeded
3. **Type-safe**: TypeScript forces you to handle both cases
4. **Composable**: Easy to chain operations with helper functions

## Basic Usage

### Making API Calls

```typescript
import { safeGet, safePost, isSuccess, isFailure } from '@/lib/api/client';

// GET request
const result = await safeGet<User[]>('/v1/users');

if (isSuccess(result)) {
  // TypeScript knows result.data is User[]
  const users = result.data;
  console.log('Users:', users);
} else {
  // TypeScript knows result.error is ApiError
  console.error('Error:', result.error.message);
  // User already saw a toast notification
}

// POST request
const createResult = await safePost<User>('/v1/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

if (isSuccess(createResult)) {
  const newUser = createResult.data;
  console.log('Created user:', newUser);
}
```

### Available Safe Functions

- `safeGet<T>(url, config?)` - GET request
- `safePost<T>(url, data?, config?)` - POST request
- `safePut<T>(url, data?, config?)` - PUT request
- `safePatch<T>(url, data?, config?)` - PATCH request
- `safeDelete<T>(url, config?)` - DELETE request

All functions:
- Return `Promise<Result<T, ApiError>>`
- Automatically retry 5xx errors (max 3 attempts)
- Show toast notifications on errors
- Never throw exceptions (unless retry logic itself fails catastrophically)

## Using in Zustand Stores

The Result pattern works great with Zustand stores for state management:

```typescript
import { safePost, isSuccess } from '@/lib/api/client';

interface UserStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  addUser: (user: Partial<User>) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  addUser: async (user) => {
    set({ isLoading: true, error: null });

    const result = await safePost<User>('/v1/users', user);

    if (isSuccess(result)) {
      set((state) => ({
        users: [...state.users, result.data],
        isLoading: false,
      }));
      toast.success('User created successfully');
    } else {
      // Error toast already shown by handleApiError
      set({
        isLoading: false,
        error: result.error.message
      });
    }
  },
}));
```

## Automatic Retry Logic

Retries happen automatically for transient failures:

### Retryable Errors

- **408** - Request Timeout
- **429** - Too Many Requests
- **500** - Internal Server Error
- **502** - Bad Gateway
- **503** - Service Unavailable
- **504** - Gateway Timeout

### Non-Retryable Errors

- **4xx errors** (except 408, 429) - Client errors like 400, 401, 403, 404
- **Network errors with no response** - Will retry once

### Retry Configuration

Default configuration:
- **Max attempts**: 3 (1 initial + 2 retries)
- **Initial delay**: 1000ms (1 second)
- **Backoff multiplier**: 2 (exponential backoff: 1s, 2s, 4s)

Example retry sequence for a 503 error:
1. **Attempt 1**: Request fails with 503
2. **Wait 1s**
3. **Attempt 2**: Request fails with 503
4. **Wait 2s**
5. **Attempt 3**: Request succeeds or fails permanently

### Custom Retry Config

If you need to customize retry behavior, use the retry module directly:

```typescript
import { withRetry, RetryPresets } from '@/lib/api/retry';
import { apiClient } from '@/lib/api/client';

// Use preset
const response = await withRetry(
  () => apiClient.get('/v1/users'),
  RetryPresets.aggressive // 5 attempts, 2s initial delay
);

// Custom config
const response = await withRetry(
  () => apiClient.get('/v1/users'),
  {
    maxAttempts: 5,
    delayMs: 2000,
    backoffMultiplier: 3,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
);
```

## Error Toast Notifications

All API errors automatically show user-friendly toast notifications:

| Status | Message |
|--------|---------|
| 500-599 | "Server error. Please try again later." |
| 404 | "Resource not found." |
| 401 | "Unauthorized. Please log in again." |
| 403 | "You don't have permission to perform this action." |
| 400 | Shows specific error message from server |
| Network error | "Network error. Please check your connection." |
| Other | Shows error message from server or generic message |

These toasts are shown automatically by the `handleApiError` function in `client.ts`. You don't need to manually show error toasts.

## Advanced Usage

### Type Guards

```typescript
import { isSuccess, isFailure } from '@/lib/api/client';

const result = await safeGet<User>('/v1/users/123');

// Type guard narrows the type
if (isSuccess(result)) {
  result.data; // Type: User
} else {
  result.error; // Type: ApiError
}
```

### Helper Functions

```typescript
import { unwrap, unwrapOr, mapResult } from '@/lib/api/types';

// Unwrap (throws if error - use carefully!)
const user = unwrap(result); // User | throws

// Unwrap with default
const user = unwrapOr(result, defaultUser); // User

// Map over success
const nameResult = mapResult(userResult, (user) => user.name);
// Result<string, ApiError>
```

### Composing Operations

```typescript
async function getUserWithPosts(userId: string) {
  const userResult = await safeGet<User>(`/v1/users/${userId}`);

  if (isFailure(userResult)) {
    return userResult; // Propagate error
  }

  const postsResult = await safeGet<Post[]>(`/v1/users/${userId}/posts`);

  if (isFailure(postsResult)) {
    return postsResult; // Propagate error
  }

  return success({
    user: userResult.data,
    posts: postsResult.data
  });
}
```

## Migration from Old Pattern

### Before (throws exceptions)

```typescript
// ❌ Old pattern - throws exceptions
try {
  const user = await api.get('/v1/users/123');
  set({ user, isLoading: false });
  toast.success('User loaded');
} catch (error) {
  set({ error: error.message, isLoading: false });
  toast.error(error.message);
}
```

### After (Result pattern)

```typescript
// ✅ New pattern - no exceptions
const result = await safeGet<User>('/v1/users/123');

if (isSuccess(result)) {
  set({ user: result.data, isLoading: false });
  toast.success('User loaded');
} else {
  // Error toast already shown
  set({ error: result.error.message, isLoading: false });
}
```

## Testing

### Testing with Result Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { safeGet } from '@/lib/api/client';

describe('User Store', () => {
  it('should handle successful user fetch', async () => {
    // Mock successful response
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: '1', name: 'John' }
    });

    const result = await safeGet<User>('/v1/users/1');

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.name).toBe('John');
    }
  });

  it('should handle API errors gracefully', async () => {
    // Mock error response
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 404 },
      message: 'Not found'
    });

    const result = await safeGet<User>('/v1/users/999');

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.status).toBe(404);
    }
  });
});
```

## Troubleshooting

### Problem: Application crashes on API errors

**Solution**: Use safe functions (`safeGet`, `safePost`, etc.) instead of direct axios calls or the old `api` object.

### Problem: Too many toast notifications

**Solution**: The safe functions automatically show one toast per error. If you're seeing duplicates, remove manual `toast.error()` calls.

### Problem: Need to customize retry behavior

**Solution**: Import and use `withRetry` directly with custom `RetryConfig`.

### Problem: Need to suppress toast notifications

**Solution**: Currently all errors show toasts. If you need silent errors, you can modify `handleApiError` in `client.ts` or wrap the safe functions.

## Files Overview

- **`types.ts`** - Result type definitions and helper functions
- **`retry.ts`** - Retry logic with exponential backoff
- **`client.ts`** - Axios client with safe wrapper functions
- **`README.md`** - This documentation

## Best Practices

1. **Always use safe functions** for new code
2. **Check success before accessing data** using `isSuccess` or `isFailure`
3. **Don't re-throw errors** in stores - the Result pattern avoids exceptions
4. **Don't manually show error toasts** - they're automatic
5. **Set error state** in stores for UI error display
6. **Use type guards** to narrow TypeScript types
7. **Migrate old code gradually** - safe functions coexist with old pattern

## Related Documentation

- [Frontend Architecture](../../../docs/FRONTEND_ARCHITECTURE.md)
- [Error Handling Strategy](../errors/README.md)
- [Toast Notifications](../notifications/toast.ts)
- [Sentry Monitoring](../monitoring/sentry.ts)

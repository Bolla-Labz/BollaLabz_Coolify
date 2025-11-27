# Predictive Data Prefetching System
<!-- Last Modified: 2025-11-24 13:05 -->

## Overview

BollaLabz now includes an intelligent predictive prefetching system that anticipates user needs and loads data proactively, providing instant page transitions and a seamless user experience.

## Architecture

### Core Components

1. **React Query Client** (`src/lib/query/queryClient.ts`)
   - Configured with 5-minute stale time
   - 10-minute garbage collection
   - Smart retry logic with exponential backoff
   - Network-aware refetching

2. **PrefetchManager** (`src/lib/prefetch/PrefetchManager.ts`)
   - Tracks navigation patterns in localStorage
   - Predicts next likely destinations
   - Manages prefetch queue with priority
   - Bandwidth-aware (1MB/minute limit)
   - Exponential backoff for failures

3. **BackgroundRefresh** (`src/lib/prefetch/BackgroundRefresh.ts`)
   - Refreshes stale data during idle time
   - Uses `requestIdleCallback` for non-blocking updates
   - Pauses when tab is hidden
   - Skips during active user interaction

4. **Prefetch Analytics** (`src/lib/prefetch/analytics.ts`)
   - Tracks prefetch hit rate
   - Monitors bandwidth usage
   - Calculates prediction accuracy
   - Exports metrics to console in dev mode

5. **usePrefetchOnHover Hook** (`src/hooks/usePrefetchOnHover.ts`)
   - Prefetches on 100ms hover delay
   - Cancels if mouse leaves
   - Mobile support via touch events
   - Priority-based prefetching

## Configuration

### React Query Settings

```typescript
// Default configuration
{
  staleTime: 5 * 60 * 1000,     // 5 minutes
  gcTime: 10 * 60 * 1000,       // 10 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 3,                      // With exponential backoff
}
```

### PrefetchManager Settings

```typescript
// Default configuration
{
  maxConcurrent: 3,              // Max concurrent prefetches
  maxRetries: 2,                 // Retry failed prefetches
  bandwidthLimit: 1024 * 1024,   // 1MB per minute
  patternHistorySize: 100,       // Max navigation patterns
  predictionThreshold: 0.2,      // 20% probability to trigger
}
```

### BackgroundRefresh Settings

```typescript
// Default configuration
{
  interval: 30 * 1000,           // 30 seconds
  maxStaleAge: 5 * 60 * 1000,    // 5 minutes
  refreshOnFocus: true,
  useIdleCallback: true,
}
```

## Usage

### 1. Navigation Prefetching (Auto-enabled in Sidebar)

```tsx
import { usePrefetchRoute } from '@/hooks/usePrefetchOnHover';

function NavLink({ to, children }) {
  const prefetchHandlers = usePrefetchRoute(to, {
    priority: 'high',
    delay: 100
  });

  return (
    <Link
      to={to}
      {...prefetchHandlers}
    >
      {children}
    </Link>
  );
}
```

### 2. Manual Prefetching

```typescript
import { prefetchManager } from '@/lib/prefetch/PrefetchManager';

// Prefetch a route manually
prefetchManager.prefetch('/contacts', 2); // priority: 2
```

### 3. Background Refresh

Background refresh starts automatically in `App.tsx`. No additional setup required.

### 4. Analytics

```typescript
import { prefetchAnalytics } from '@/lib/prefetch/analytics';

// Get metrics
const metrics = prefetchAnalytics.getMetrics();
console.log('Hit Rate:', metrics.hitRate);
console.log('Waste Rate:', metrics.wasteRate);
console.log('Avg Time Saved:', metrics.averageTimeSaved);
```

Or use the React hook:

```tsx
import { usePrefetchAnalytics } from '@/lib/prefetch/analytics';

function AnalyticsDashboard() {
  const metrics = usePrefetchAnalytics();
  return <div>Hit Rate: {metrics.hitRate}%</div>;
}
```

## Optimistic Updates

### Helper Utilities

Location: `src/lib/utils/optimistic-updates.ts`

### Basic Pattern

```typescript
import { executeOptimisticUpdate } from '@/lib/utils/optimistic-updates';

// In Zustand store
addContact: async (contact) => {
  await executeOptimisticUpdate(set, get, {
    optimisticUpdate: (state) => ({
      ...state,
      contacts: [...state.contacts, { ...contact, id: 'temp-id' }],
    }),
    apiCall: () => contactsService.create(contact),
    onSuccess: (state, response) => ({
      ...state,
      contacts: state.contacts.map(c =>
        c.id === 'temp-id' ? response : c
      ),
    }),
    successMessage: 'Contact added',
    errorMessage: 'Failed to add contact',
  });
}
```

### Implementing in Stores

#### Example: ContactsStore

```typescript
import {
  executeOptimisticUpdate,
  optimisticAdd,
  optimisticUpdate,
  optimisticDelete,
  replaceTempId
} from '@/lib/utils/optimistic-updates';

export const useContactsStore = create<ContactsState>()((set, get) => ({
  // ... existing state

  // Optimistic add
  addContact: async (contact) => {
    const tempId = `temp-${Date.now()}`;

    await executeOptimisticUpdate(set, get, {
      optimisticUpdate: (state) => ({
        ...state,
        contacts: optimisticAdd(state.contacts, contact, tempId),
      }),
      apiCall: () => contactsService.create(contact),
      onSuccess: (state, response) => ({
        ...state,
        contacts: replaceTempId(state.contacts, tempId, response),
      }),
      successMessage: 'Contact added successfully',
    });
  },

  // Optimistic update
  updateContact: async (id, updates) => {
    await executeOptimisticUpdate(set, get, {
      optimisticUpdate: (state) => ({
        ...state,
        contacts: optimisticUpdate(state.contacts, id, updates),
      }),
      apiCall: () => contactsService.update(id, updates),
      onSuccess: (state, response) => ({
        ...state,
        contacts: optimisticUpdate(state.contacts, id, response),
      }),
      successMessage: 'Contact updated successfully',
    });
  },

  // Optimistic delete
  deleteContact: async (id) => {
    await executeOptimisticUpdate(set, get, {
      optimisticUpdate: (state) => ({
        ...state,
        contacts: optimisticDelete(state.contacts, id),
      }),
      apiCall: () => contactsService.delete(id),
      onSuccess: (state) => state, // Already deleted optimistically
      successMessage: 'Contact deleted successfully',
    });
  },
}));
```

#### Example: ConversationsStore

```typescript
sendMessage: async (conversationId, content, contactId) => {
  const tempMessage = {
    id: `temp-${Date.now()}`,
    conversationId,
    content,
    direction: 'outbound',
    timestamp: new Date().toISOString(),
    status: 'sending',
  };

  await executeOptimisticUpdate(set, get, {
    optimisticUpdate: (state) => ({
      ...state,
      messages: new Map(state.messages).set(
        conversationId,
        [...(state.messages.get(conversationId) || []), tempMessage]
      ),
    }),
    apiCall: () => conversationsService.sendMessage(conversationId, content, contactId),
    onSuccess: (state, response) => ({
      ...state,
      messages: new Map(state.messages).set(
        conversationId,
        state.messages.get(conversationId)?.map(m =>
          m.id === tempMessage.id ? response : m
        ) || []
      ),
    }),
    errorMessage: 'Failed to send message',
  });
}
```

#### Example: TasksStore

```typescript
moveTask: async (taskId, newStatus, newOrder) => {
  await executeOptimisticUpdate(set, get, {
    optimisticUpdate: (state) => ({
      ...state,
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, columnOrder: newOrder }
          : task
      ),
    }),
    apiCall: () => tasksService.update(taskId, { status: newStatus, columnOrder: newOrder }),
    onSuccess: (state, response) => ({
      ...state,
      tasks: state.tasks.map(task =>
        task.id === taskId ? response : task
      ),
    }),
    // No success message for drag-drop (too noisy)
    showToast: false,
  });
}
```

### Advanced Patterns

#### Debounced Updates (for search, auto-save)

```typescript
import { createDebouncedOptimisticUpdate } from '@/lib/utils/optimistic-updates';

const debouncedSearch = createDebouncedOptimisticUpdate(
  set,
  get,
  { delay: 300, maxWait: 1000 },
  (query: string) => ({
    optimisticUpdate: (state) => ({ ...state, searchQuery: query }),
    apiCall: () => api.search(query),
    onSuccess: (state, results) => ({ ...state, searchResults: results }),
  })
);

// Use in component
debouncedSearch('search term');
```

#### Update Queue (for ordered operations)

```typescript
import { OptimisticUpdateQueue } from '@/lib/utils/optimistic-updates';

const updateQueue = new OptimisticUpdateQueue(set, get);

// Enqueue multiple updates
await updateQueue.enqueue({
  optimisticUpdate: (state) => ({ ...state, step1: true }),
  apiCall: () => api.step1(),
  onSuccess: (state) => state,
});

await updateQueue.enqueue({
  optimisticUpdate: (state) => ({ ...state, step2: true }),
  apiCall: () => api.step2(),
  onSuccess: (state) => state,
});
```

## Performance Metrics

### Target Metrics

| Metric | Target | Measured By |
|--------|--------|-------------|
| **Prefetch Hit Rate** | > 60% | `prefetchAnalytics.getMetrics().hitRate` |
| **Page Transition Time** | < 100ms | For prefetched routes |
| **Bandwidth Efficiency** | > 70% | Useful prefetches / total prefetches |
| **Cache Memory Usage** | < 50MB | Browser DevTools Memory |

### Viewing Metrics in Dev Mode

Metrics are automatically logged to console every minute in development:

```
📊 Prefetch Analytics
Overall Performance:
  Hit Rate: 65.2%
  Waste Rate: 15.3%
  Avg Time Saved: 450ms
  Bandwidth Efficiency: 82.1%
  Prediction Accuracy: 71.5%

Counts:
  Total Prefetches: 47
  Total Navigations: 32
  Hits: 21
  Misses: 11
  Waste: 7
```

## Network Tab Verification

When prefetching is working correctly, you'll see:

1. **Prefetch Requests**: Look for API calls triggered before navigation
2. **Fast Navigation**: Instant data load on page change
3. **Background Refresh**: Periodic invalidation requests during idle time

## Troubleshooting

### Prefetch Not Working

**Check these:**
1. Is navigation tracking enabled? (Look for `NavigationTracker` in React DevTools)
2. Are there browser console errors?
3. Check bandwidth limit: `prefetchManager.getAnalytics().bandwidthUsed`
4. Verify query keys match between prefetch and component

### High Waste Rate

**Solutions:**
1. Reduce `predictionThreshold` in PrefetchManager config
2. Increase `delay` in `usePrefetchOnHover` (currently 100ms)
3. Review navigation patterns: `prefetchManager.getAnalytics()`

### Memory Issues

**Solutions:**
1. Reduce `gcTime` in React Query config
2. Lower `patternHistorySize` in PrefetchManager
3. Clear cache periodically: `queryClient.clear()`

## Integration Checklist

- [x] React Query client configured
- [x] PrefetchManager initialized in App.tsx
- [x] BackgroundRefresh started in App.tsx
- [x] NavigationTracker mounted in Router
- [x] Sidebar links use `usePrefetchRoute` hook
- [ ] ContactsStore implements optimistic updates (pending)
- [ ] ConversationsStore implements optimistic updates (pending)
- [ ] TasksStore implements optimistic updates (pending)
- [ ] Dashboard QuickActions uses prefetch (pending)
- [ ] ContactsTable row hover prefetch (pending)

## Future Enhancements

1. **Route-level prefetch configuration**
   - Allow routes to specify custom prefetch strategies
   - Per-route bandwidth limits

2. **Machine learning predictions**
   - Use ML model to predict navigation patterns
   - Time-of-day based predictions

3. **Service worker integration**
   - Cache prefetched data in service worker
   - Offline-first approach

4. **A/B testing framework**
   - Test different prefetch strategies
   - Measure impact on user engagement

5. **Admin dashboard**
   - Visual analytics for prefetch performance
   - Real-time monitoring

## Best Practices

1. **Use high priority for main navigation** (Dashboard, Contacts, Tasks)
2. **Use medium priority for secondary routes** (Settings, Analytics)
3. **Use low priority for rarely visited routes**
4. **Don't prefetch on mobile networks** (check `navigator.connection`)
5. **Implement optimistic updates for all mutations**
6. **Test error rollback scenarios**
7. **Monitor metrics regularly** (aim for >60% hit rate)

## Related Files

- `src/lib/query/queryClient.ts` - React Query configuration
- `src/lib/prefetch/PrefetchManager.ts` - Navigation pattern tracking
- `src/lib/prefetch/BackgroundRefresh.ts` - Idle data refresh
- `src/lib/prefetch/analytics.ts` - Performance tracking
- `src/hooks/usePrefetchOnHover.ts` - Hover prefetch hook
- `src/lib/utils/optimistic-updates.ts` - Optimistic update helpers
- `src/App.tsx` - System initialization
- `src/components/layout/Sidebar.tsx` - Integration example

## Support

For issues or questions:
1. Check browser console for errors
2. Review metrics: `prefetchAnalytics.export()`
3. Verify navigation patterns: `prefetchManager.getAnalytics()`
4. Check Sentry for error logs

// Last Modified: 2025-11-24 12:33
/**
 * React.memo Helper Utilities
 *
 * Provides reusable comparison functions and memo wrappers
 * for optimizing component re-renders in React 18.
 */

import { memo, ComponentType } from 'react';

// ==================== Comparison Functions ====================

/**
 * Shallow comparison for props objects
 */
export function shallowPropsAreEqual<P extends object>(
  prevProps: P,
  nextProps: P
): boolean {
  const prevKeys = Object.keys(prevProps) as Array<keyof P>;
  const nextKeys = Object.keys(nextProps) as Array<keyof P>;

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  return prevKeys.every((key) => {
    return Object.is(prevProps[key], nextProps[key]);
  });
}

/**
 * Deep comparison for props objects (use sparingly)
 */
export function deepPropsAreEqual<P extends object>(
  prevProps: P,
  nextProps: P
): boolean {
  return deepEqual(prevProps, nextProps);
}

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

/**
 * Comparison function that ignores specific props
 */
export function createPropsComparison<P extends object>(
  ignoreKeys: Array<keyof P>
): (prevProps: P, nextProps: P) => boolean {
  return (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps).filter(
      (key) => !ignoreKeys.includes(key as keyof P)
    ) as Array<keyof P>;
    const nextKeys = Object.keys(nextProps).filter(
      (key) => !ignoreKeys.includes(key as keyof P)
    ) as Array<keyof P>;

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    return prevKeys.every((key) => {
      return Object.is(prevProps[key], nextProps[key]);
    });
  };
}

/**
 * Comparison function for specific props only
 */
export function createSelectivePropsComparison<P extends object>(
  watchKeys: Array<keyof P>
): (prevProps: P, nextProps: P) => boolean {
  return (prevProps, nextProps) => {
    return watchKeys.every((key) => {
      return Object.is(prevProps[key], nextProps[key]);
    });
  };
}

// ==================== Memo Wrappers ====================

/**
 * Memoizes component with shallow prop comparison
 *
 * @example
 * ```tsx
 * const MemoizedCard = memoShallow(Card);
 * ```
 */
export function memoShallow<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component, shallowPropsAreEqual);
}

/**
 * Memoizes component with deep prop comparison (expensive, use sparingly)
 *
 * @example
 * ```tsx
 * const MemoizedComplexComponent = memoDeep(ComplexComponent);
 * ```
 */
export function memoDeep<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component, deepPropsAreEqual);
}

/**
 * Memoizes component, ignoring specific props
 *
 * @example
 * ```tsx
 * // Component won't re-render when 'onHover' changes
 * const MemoizedButton = memoIgnoring(Button, ['onHover']);
 * ```
 */
export function memoIgnoring<P extends object>(
  Component: ComponentType<P>,
  ignoreKeys: Array<keyof P>
): ComponentType<P> {
  return memo(Component, createPropsComparison(ignoreKeys));
}

/**
 * Memoizes component, only watching specific props
 *
 * @example
 * ```tsx
 * // Component only re-renders when 'data' or 'isLoading' change
 * const MemoizedList = memoWatching(List, ['data', 'isLoading']);
 * ```
 */
export function memoWatching<P extends object>(
  Component: ComponentType<P>,
  watchKeys: Array<keyof P>
): ComponentType<P> {
  return memo(Component, createSelectivePropsComparison(watchKeys));
}

// ==================== Pre-built Memoized Components ====================

/**
 * Common prop patterns for different component types
 */

/**
 * Memoizes a pure presentational component (no callbacks, just data)
 */
export function memoPure<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component);
}

/**
 * Memoizes a list item component (typically needs shallow comparison)
 */
export function memoListItem<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component, shallowPropsAreEqual);
}

/**
 * Memoizes a card/widget component
 */
export function memoCard<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return memo(Component, shallowPropsAreEqual);
}

// ==================== Debugging Helpers ====================

/**
 * Logs when component re-renders despite memo
 *
 * @example
 * ```tsx
 * const MemoizedComponent = memoWithDebug(
 *   MyComponent,
 *   'MyComponent',
 *   shallowPropsAreEqual
 * );
 * ```
 */
export function memoWithDebug<P extends object>(
  Component: ComponentType<P>,
  componentName: string,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): ComponentType<P> {
  const debugAreEqual = (prevProps: P, nextProps: P): boolean => {
    const result = areEqual ? areEqual(prevProps, nextProps) : shallowPropsAreEqual(prevProps, nextProps);

    if (!result) {
      console.log(`[Memo Debug] ${componentName} re-rendering due to prop changes:`, {
        prevProps,
        nextProps,
      });
    }

    return result;
  };

  return memo(Component, debugAreEqual);
}

// ==================== Best Practices Guide ====================

/**
 * ## When to Use React.memo
 *
 * ### ✅ Good Candidates for Memo:
 * 1. **Pure Presentational Components**
 *    - Components that render the same output for the same props
 *    - Example: `<UserCard user={user} />`
 *
 * 2. **List Items**
 *    - Components rendered in arrays/lists
 *    - Example: `items.map(item => <ListItem key={item.id} {...item} />)`
 *
 * 3. **Expensive Renders**
 *    - Components with complex rendering logic
 *    - Components with many child elements
 *
 * 4. **Frequently Re-rendered Parents**
 *    - Child components that don't need to update when parent re-renders
 *
 * ### ❌ Don't Use Memo For:
 * 1. **Components That Always Change**
 *    - Props change on every render anyway
 *
 * 2. **Simple Components**
 *    - Memo overhead > render cost
 *    - Example: `<div>{text}</div>`
 *
 * 3. **Components With Callback Props**
 *    - Unless callbacks are memoized with useCallback
 *
 * 4. **Already Optimized Components**
 *    - Components that rarely re-render
 *
 * ## Usage Examples
 *
 * ### Basic Memo:
 * ```tsx
 * const UserCard = memo(function UserCard({ user }: Props) {
 *   return <div>{user.name}</div>;
 * });
 * ```
 *
 * ### Memo with Custom Comparison:
 * ```tsx
 * const DataTable = memo(
 *   function DataTable({ data, columns }: Props) {
 *     return <table>...</table>;
 *   },
 *   (prev, next) => {
 *     // Only re-render if data changes
 *     return prev.data === next.data;
 *   }
 * );
 * ```
 *
 * ### Using Helper Functions:
 * ```tsx
 * // Ignore callback props that change frequently
 * const Button = memoIgnoring(
 *   function Button({ onClick, label }: Props) {
 *     return <button onClick={onClick}>{label}</button>;
 *   },
 *   ['onClick'] // Don't re-render when onClick changes
 * );
 *
 * // Only watch specific props
 * const StatusBadge = memoWatching(
 *   function StatusBadge({ status, count }: Props) {
 *     return <span>{status} ({count})</span>;
 *   },
 *   ['status'] // Only re-render when status changes, ignore count
 * );
 * ```
 *
 * ## Performance Tips
 *
 * 1. **Combine with useCallback and useMemo:**
 * ```tsx
 * function Parent() {
 *   const handleClick = useCallback(() => { ... }, []);
 *   const data = useMemo(() => processData(), [rawData]);
 *
 *   return <MemoizedChild onClick={handleClick} data={data} />;
 * }
 * ```
 *
 * 2. **Profile Before Optimizing:**
 *    - Use React DevTools Profiler
 *    - Measure actual performance impact
 *
 * 3. **Start with memo(), add custom comparison only if needed:**
 *    - Default shallow comparison is usually sufficient
 *    - Custom comparisons have their own overhead
 */

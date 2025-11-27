// Last Modified: 2025-11-24 16:15
/**
 * Touch Interactions Hook Library
 * Comprehensive gesture detection for mobile-first experiences
 * - useSwipe: Swipe up/down/left/right detection
 * - useLongPress: Long press with customizable duration
 * - usePinch: Pinch to zoom operations
 * - useDoubleTap: Double tap for quick actions
 * - Momentum scrolling helpers
 * - Rubber band scrolling effects
 */

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

// ============================================================================
// Haptic Feedback Utility
// ============================================================================

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[style]);
  }
};

// ============================================================================
// useSwipe Hook
// ============================================================================

export interface SwipeDirection {
  direction: 'up' | 'down' | 'left' | 'right' | null;
  distance: number;
  velocity: number;
}

interface UseSwipeOptions {
  onSwipeUp?: (distance: number) => void;
  onSwipeDown?: (distance: number) => void;
  onSwipeLeft?: (distance: number) => void;
  onSwipeRight?: (distance: number) => void;
  onSwipe?: (direction: SwipeDirection) => void;
  threshold?: number; // Minimum distance to trigger swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity (default: 0.3px/ms)
  hapticFeedback?: boolean;
}

export function useSwipe<T extends HTMLElement = HTMLElement>(
  options: UseSwipeOptions = {}
): RefObject<T> {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onSwipe,
    threshold = 50,
    velocityThreshold = 0.3,
    hapticFeedback = true,
  } = options;

  const elementRef = useRef<T>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const velocity = distance / deltaTime;

      if (distance < threshold || velocity < velocityThreshold) {
        touchStartRef.current = null;
        return;
      }

      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      let direction: SwipeDirection['direction'] = null;

      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
        if (direction === 'right') onSwipeRight?.(Math.abs(deltaX));
        else onSwipeLeft?.(Math.abs(deltaX));
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
        if (direction === 'down') onSwipeDown?.(Math.abs(deltaY));
        else onSwipeUp?.(Math.abs(deltaY));
      }

      if (hapticFeedback && direction) {
        triggerHaptic('light');
      }

      onSwipe?.({ direction, distance, velocity });
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onSwipe, threshold, velocityThreshold, hapticFeedback]);

  return elementRef;
}

// ============================================================================
// useLongPress Hook
// ============================================================================

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  duration?: number; // Default: 500ms
  hapticFeedback?: boolean;
}

export function useLongPress<T extends HTMLElement = HTMLElement>(
  options: UseLongPressOptions
): RefObject<T> {
  const { onLongPress, onClick, duration = 500, hapticFeedback = true } = options;

  const elementRef = useRef<T>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = () => {
      longPressTriggeredRef.current = false;
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        if (hapticFeedback) triggerHaptic('medium');
        onLongPress();
      }, duration);
    };

    const handleTouchEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!longPressTriggeredRef.current && onClick) {
        onClick();
      }
    };

    const handleTouchCancel = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onLongPress, onClick, duration, hapticFeedback]);

  return elementRef;
}

// ============================================================================
// usePinch Hook (Pinch to Zoom)
// ============================================================================

interface UsePinchOptions {
  onPinch?: (scale: number) => void;
  onPinchStart?: () => void;
  onPinchEnd?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
}

export function usePinch<T extends HTMLElement = HTMLElement>(
  options: UsePinchOptions = {}
): RefObject<T> {
  const { onPinch, onPinchStart, onPinchEnd, minScale = 0.5, maxScale = 3 } = options;

  const elementRef = useRef<T>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const currentScaleRef = useRef(1);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx ** 2 + dy ** 2);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
        onPinchStart?.();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistanceRef.current) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        let scale = currentDistance / initialDistanceRef.current;
        scale = Math.max(minScale, Math.min(maxScale, scale));
        currentScaleRef.current = scale;
        onPinch?.(scale);
      }
    };

    const handleTouchEnd = () => {
      if (initialDistanceRef.current !== null) {
        onPinchEnd?.(currentScaleRef.current);
        initialDistanceRef.current = null;
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPinch, onPinchStart, onPinchEnd, minScale, maxScale]);

  return elementRef;
}

// ============================================================================
// useDoubleTap Hook
// ============================================================================

interface UseDoubleTapOptions {
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  delay?: number; // Default: 300ms
  hapticFeedback?: boolean;
}

export function useDoubleTap<T extends HTMLElement = HTMLElement>(
  options: UseDoubleTapOptions
): RefObject<T> {
  const { onDoubleTap, onSingleTap, delay = 300, hapticFeedback = true } = options;

  const elementRef = useRef<T>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchEnd = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        // Double tap detected
        if (tapTimerRef.current) {
          clearTimeout(tapTimerRef.current);
          tapTimerRef.current = null;
        }
        if (hapticFeedback) triggerHaptic('medium');
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        // Potential single tap
        lastTapRef.current = now;
        if (onSingleTap) {
          tapTimerRef.current = setTimeout(() => {
            onSingleTap();
            tapTimerRef.current = null;
          }, delay);
        }
      }
    };

    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onDoubleTap, onSingleTap, delay, hapticFeedback]);

  return elementRef;
}

// ============================================================================
// useMomentumScroll Hook
// ============================================================================

interface UseMomentumScrollOptions {
  friction?: number; // Default: 0.95
  onScroll?: (scrollTop: number) => void;
}

export function useMomentumScroll<T extends HTMLElement = HTMLElement>(
  options: UseMomentumScrollOptions = {}
): RefObject<T> {
  const { friction = 0.95, onScroll } = options;

  const elementRef = useRef<T>(null);
  const velocityRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      lastYRef.current = touch.clientY;
      lastTimeRef.current = Date.now();
      velocityRef.current = 0;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const now = Date.now();
      const deltaY = touch.clientY - lastYRef.current;
      const deltaTime = now - lastTimeRef.current;

      if (deltaTime > 0) {
        velocityRef.current = deltaY / deltaTime;
      }

      lastYRef.current = touch.clientY;
      lastTimeRef.current = now;
    };

    const handleTouchEnd = () => {
      const animate = () => {
        if (!element || Math.abs(velocityRef.current) < 0.1) return;

        velocityRef.current *= friction;
        const scrollDelta = velocityRef.current * 16; // Approximate 60fps
        element.scrollTop -= scrollDelta;

        onScroll?.(element.scrollTop);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [friction, onScroll]);

  return elementRef;
}

// ============================================================================
// usePullToRefresh Hook
// ============================================================================

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Default: 80px
  refreshingComponent?: React.ReactNode;
}

export function usePullToRefresh<T extends HTMLElement = HTMLElement>(
  options: UsePullToRefreshOptions
) {
  const { onRefresh, threshold = 80 } = options;

  const elementRef = useRef<T>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isRefreshing) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (element.scrollTop === 0 && startYRef.current > 0) {
        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startYRef.current);
        // Apply rubber band effect
        const adjustedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(adjustedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        triggerHaptic('medium');
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
      startYRef.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, onRefresh, isRefreshing]);

  return { elementRef, isRefreshing, pullDistance };
}

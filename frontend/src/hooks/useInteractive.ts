// Last Modified: 2025-11-23 17:30
import { useState, useRef, useCallback, useEffect, RefObject, MouseEvent, TouchEvent } from 'react';

// Ripple effect interface
interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * Hook for creating ripple effects on click
 */
export function useRipple<T extends HTMLElement = HTMLButtonElement>() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<T>(null);
  let rippleCounter = 0;

  const addRipple = useCallback((event: MouseEvent<T> | TouchEvent<T>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;

    let x: number, y: number;

    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left - size / 2;
      y = event.touches[0].clientY - rect.top - size / 2;
    } else {
      x = event.clientX - rect.left - size / 2;
      y = event.clientY - rect.top - size / 2;
    }

    const newRipple: Ripple = {
      id: rippleCounter++,
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);

  const cleanupRipples = useCallback(() => {
    setRipples([]);
  }, []);

  return {
    ripples,
    containerRef,
    addRipple,
    cleanupRipples
  };
}

/**
 * Hook for detecting long press events
 */
interface UseLongPressOptions {
  delay?: number;
  preventDefault?: boolean;
  cancelOnMove?: boolean;
  threshold?: number;
}

export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {}
) {
  const {
    delay = 500,
    preventDefault = true,
    cancelOnMove = true,
    threshold = 5
  } = options;

  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startPositionRef = useRef<{ x: number; y: number }>();

  const start = useCallback((event: MouseEvent | TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const { clientX, clientY } = 'touches' in event
      ? event.touches[0]
      : event;

    startPositionRef.current = { x: clientX, y: clientY };

    timeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
      callback();
    }, delay);
  }, [callback, delay, preventDefault]);

  const move = useCallback((event: MouseEvent | TouchEvent) => {
    if (!cancelOnMove || !startPositionRef.current) return;

    const { clientX, clientY } = 'touches' in event
      ? event.touches[0]
      : event;

    const deltaX = Math.abs(clientX - startPositionRef.current.x);
    const deltaY = Math.abs(clientY - startPositionRef.current.y);

    if (deltaX > threshold || deltaY > threshold) {
      cancel();
    }
  }, [cancelOnMove, threshold]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLongPressing(false);
    startPositionRef.current = undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: cancel,
    isLongPressing
  };
}

/**
 * Hook for managing keyboard shortcuts
 */
interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          callback,
          preventDefault = true
        } = shortcut;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrl &&
          event.shiftKey === shift &&
          event.altKey === alt &&
          event.metaKey === meta
        ) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Hook for detecting swipe gestures
 */
interface SwipeConfig {
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean;
}

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  config: SwipeConfig = {}
) {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false
  } = config;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = threshold;

  const onTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
    setTouchEnd(null);
    if ('touches' in e) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (trackMouse) {
      setTouchStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [trackMouse]);

  const onTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    if ('touches' in e) {
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (trackMouse) {
      setTouchEnd({
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [preventDefaultTouchmoveEvent, trackMouse]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe && Math.abs(distanceX) > Math.abs(distanceY)) {
      onSwipe('left');
    } else if (isRightSwipe && Math.abs(distanceX) > Math.abs(distanceY)) {
      onSwipe('right');
    } else if (isUpSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      onSwipe('up');
    } else if (isDownSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      onSwipe('down');
    }
  }, [touchStart, touchEnd, minSwipeDistance, onSwipe]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    ...(trackMouse && {
      onMouseDown: onTouchStart,
      onMouseMove: onTouchMove,
      onMouseUp: onTouchEnd
    })
  };
}

/**
 * Hook for hover intent (delays hover to prevent accidental triggers)
 */
export function useHoverIntent(
  onHoverIntent: () => void,
  onHoverEnd?: () => void,
  delay: number = 300
) {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      onHoverIntent();
    }, delay);
  }, [onHoverIntent, delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(false);
    onHoverEnd?.();
  }, [onHoverEnd]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    isHovered
  };
}

/**
 * Hook for double click/tap detection
 */
export function useDoubleClick(
  onSingleClick: () => void,
  onDoubleClick: () => void,
  delay: number = 300
) {
  const clickCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleClick = useCallback(() => {
    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      timeoutRef.current = setTimeout(() => {
        if (clickCountRef.current === 1) {
          onSingleClick();
        }
        clickCountRef.current = 0;
      }, delay);
    } else if (clickCountRef.current === 2) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onDoubleClick();
      clickCountRef.current = 0;
    }
  }, [onSingleClick, onDoubleClick, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return handleClick;
}

/**
 * Hook for intersection observer (element visibility)
 */
interface UseIntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersection<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionOptions = {}
): [RefObject<T>, boolean, IntersectionObserverEntry | undefined] {
  const {
    threshold = 0,
    rootMargin = '0px',
    triggerOnce = false
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<T>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (triggerOnce && hasTriggeredRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && triggerOnce) {
          hasTriggeredRef.current = true;
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [elementRef, isIntersecting, entry];
}

/**
 * Hook for handling drag and drop
 */
interface UseDragOptions {
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

export function useDrag<T extends HTMLElement = HTMLDivElement>(
  options: UseDragOptions = {}
) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragRef = useRef<T>(null);

  const handleDragStart = useCallback((e: DragEvent) => {
    setIsDragging(true);
    options.onDragStart?.(e);
  }, [options]);

  const handleDragEnd = useCallback((e: DragEvent) => {
    setIsDragging(false);
    options.onDragEnd?.(e);
  }, [options]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    options.onDrop?.(e);
  }, [options]);

  useEffect(() => {
    const element = dragRef.current;
    if (!element) return;

    element.addEventListener('dragstart', handleDragStart as any);
    element.addEventListener('dragend', handleDragEnd as any);
    element.addEventListener('dragover', handleDragOver as any);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop as any);

    return () => {
      element.removeEventListener('dragstart', handleDragStart as any);
      element.removeEventListener('dragend', handleDragEnd as any);
      element.removeEventListener('dragover', handleDragOver as any);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop as any);
    };
  }, [handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop]);

  return {
    dragRef,
    isDragging,
    isDragOver
  };
}
// Last Modified: 2025-11-24 16:15
/**
 * Adaptive Layout System
 * Responsive component swapping and layout management
 * - Breakpoint detection with useMediaQuery
 * - Component swapping (desktop table → mobile cards)
 * - Dynamic font scaling based on viewport
 * - Responsive spacing system
 * - Orientation change handling
 * - Safe area insets for notches
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

// ============================================================================
// Responsive Container with Safe Areas
// ============================================================================

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  applySafePadding?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  applySafePadding = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-4 sm:px-6 lg:px-8', // Responsive padding
        applySafePadding && 'safe-padding', // Custom class for safe areas
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Adaptive Grid - Auto-responsive grid layout
// ============================================================================

interface AdaptiveGridProps {
  children: ReactNode;
  minItemWidth?: string;
  gap?: string;
  className?: string;
}

export function AdaptiveGrid({
  children,
  minItemWidth = '250px',
  gap = '1rem',
  className,
}: AdaptiveGridProps) {
  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Component Swapper - Different components for different screen sizes
// ============================================================================

interface ComponentSwapperProps {
  mobile: ReactNode;
  tablet?: ReactNode;
  desktop: ReactNode;
}

export function ComponentSwapper({ mobile, tablet, desktop }: ComponentSwapperProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isMobile) return <>{mobile}</>;
  if (isTablet && tablet) return <>{tablet}</>;
  if (isDesktop) return <>{desktop}</>;

  return <>{mobile}</>;
}

// ============================================================================
// Responsive Text - Auto-scaling typography
// ============================================================================

interface ResponsiveTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  className?: string;
  scaleWithViewport?: boolean;
}

export function ResponsiveText({
  children,
  as: Component = 'p',
  className,
  scaleWithViewport = true,
}: ResponsiveTextProps) {
  const baseSizes = {
    h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
    h5: 'text-sm sm:text-base md:text-lg lg:text-xl',
    h6: 'text-xs sm:text-sm md:text-base lg:text-lg',
    p: 'text-sm sm:text-base md:text-base lg:text-lg',
  };

  return (
    <Component
      className={cn(scaleWithViewport && baseSizes[Component], className)}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// Orientation Detector - Handle landscape/portrait changes
// ============================================================================

interface OrientationDetectorProps {
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  children: (orientation: 'portrait' | 'landscape') => ReactNode;
}

export function OrientationDetector({ onOrientationChange, children }: OrientationDetectorProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      const newOrientation = window.matchMedia('(orientation: portrait)').matches
        ? 'portrait'
        : 'landscape';
      setOrientation(newOrientation);
      onOrientationChange?.(newOrientation);
    };

    updateOrientation();

    const mediaQuery = window.matchMedia('(orientation: portrait)');
    mediaQuery.addEventListener('change', updateOrientation);

    return () => mediaQuery.removeEventListener('change', updateOrientation);
  }, [onOrientationChange]);

  return <>{children(orientation)}</>;
}

// ============================================================================
// Responsive Spacing - Dynamic gap/padding based on screen
// ============================================================================

interface ResponsiveSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  axis?: 'vertical' | 'horizontal' | 'both';
}

export function ResponsiveSpacer({ size = 'md', axis = 'vertical' }: ResponsiveSpacerProps) {
  const spacing = {
    xs: 'h-2 sm:h-3 md:h-4',
    sm: 'h-4 sm:h-5 md:h-6',
    md: 'h-6 sm:h-8 md:h-10',
    lg: 'h-8 sm:h-10 md:h-12',
    xl: 'h-10 sm:h-12 md:h-16',
  };

  if (axis === 'horizontal') {
    return <div className={spacing[size].replace(/h-/g, 'w-')} />;
  }

  if (axis === 'both') {
    return <div className={`${spacing[size]} ${spacing[size].replace(/h-/g, 'w-')}`} />;
  }

  return <div className={spacing[size]} />;
}

// ============================================================================
// Breakpoint Helper - Show content only at specific breakpoints
// ============================================================================

interface ShowAtProps {
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop';
  children: ReactNode;
}

export function ShowAt({ breakpoint, children }: ShowAtProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const shouldShow = {
    mobile: isMobile,
    tablet: isTablet,
    desktop: isDesktop,
    'mobile-tablet': isMobile || isTablet,
    'tablet-desktop': isTablet || isDesktop,
  }[breakpoint];

  return shouldShow ? <>{children}</> : null;
}

// ============================================================================
// Adaptive Stack - Vertical on mobile, horizontal on desktop
// ============================================================================

interface AdaptiveStackProps {
  children: ReactNode;
  mobileDirection?: 'column' | 'row';
  desktopDirection?: 'column' | 'row';
  gap?: string;
  className?: string;
}

export function AdaptiveStack({
  children,
  mobileDirection = 'column',
  desktopDirection = 'row',
  gap = '1rem',
  className,
}: AdaptiveStackProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div
      className={cn('flex', className)}
      style={{
        flexDirection: isMobile ? mobileDirection : desktopDirection,
        gap,
      }}
    >
      {children}
    </div>
  );
}

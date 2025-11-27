// Last Modified: 2025-11-24 16:15
/**
 * Micro-Interactions Component Library
 * Delightful UI interactions that add personality and feedback
 * - AnimatedButton: Press animations with ripple effects
 * - Card3D: Hover lift with 3D transform
 * - SmoothAccordion: Smooth expansion animations
 * - RippleEffect: Material Design ripple on touch
 * - SkeletonShimmer: Loading skeleton with shimmer animation
 * - LoadingDots: Personality-filled loading indicators
 * - SuccessCheckmark: Animated checkmark for completions
 */

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// ============================================================================
// AnimatedButton - Press animations with scale + shadow
// ============================================================================

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  showRipple?: boolean;
}

export function AnimatedButton({
  children,
  className,
  variant = 'primary',
  showRipple = true,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!showRipple || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    onClick?.(e);
  };

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden rounded-md px-4 py-2 font-medium',
        'transition-all duration-200',
        'active:scale-95 hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        variants[variant],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}

      {/* Ripple effect */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}
    </button>
  );
}

// ============================================================================
// Card3D - Hover lift with 3D transform
// ============================================================================

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number; // 0-1, default: 0.5
}

export function Card3D({ children, className, intensity = 0.5 }: Card3DProps) {
  const [transform, setTransform] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10 * intensity;
    const rotateY = ((x - centerX) / centerX) * 10 * intensity;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`);
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'transition-all duration-300 ease-out',
        'hover:shadow-2xl',
        className
      )}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SmoothAccordion - Smooth expansion animations
// ============================================================================

interface SmoothAccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function SmoothAccordion({
  title,
  children,
  defaultOpen = false,
  className,
}: SmoothAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4',
          'bg-background hover:bg-accent transition-colors',
          'text-left font-medium'
        )}
      >
        <span>{title}</span>
        <svg
          className={cn('w-5 h-5 transition-transform duration-300', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        style={{ height }}
        className="transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div ref={contentRef} className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SkeletonShimmer - Loading skeleton with shimmer animation
// ============================================================================

interface SkeletonShimmerProps {
  className?: string;
  count?: number;
  height?: string;
}

export function SkeletonShimmer({ className, count = 1, height = '1rem' }: SkeletonShimmerProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'relative overflow-hidden rounded-md bg-muted',
            className
          )}
          style={{ height }}
        >
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      ))}
    </>
  );
}

// ============================================================================
// LoadingDots - Personality-filled loading indicators
// ============================================================================

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingDots({ size = 'md', color = 'currentColor' }: LoadingDotsProps) {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn('rounded-full animate-bounce', sizes[size])}
          style={{
            backgroundColor: color,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SuccessCheckmark - Animated checkmark for completions
// ============================================================================

interface SuccessCheckmarkProps {
  size?: number;
  color?: string;
  duration?: number;
}

export function SuccessCheckmark({ size = 64, color = '#52c41a', duration = 600 }: SuccessCheckmarkProps) {
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Circle animation */}
      <svg
        className="absolute inset-0"
        viewBox="0 0 52 52"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="animate-draw-circle"
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke={color}
          strokeWidth="2"
          style={{
            strokeDasharray: 166,
            strokeDashoffset: 166,
            animation: `drawCircle ${duration}ms ease-in-out forwards`,
          }}
        />
        <path
          className="animate-draw-check"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          d="M14 27l7 7 16-16"
          style={{
            strokeDasharray: 48,
            strokeDashoffset: 48,
            animation: `drawCheck ${duration}ms ease-in-out ${duration * 0.4}ms forwards`,
          }}
        />
      </svg>
    </div>
  );
}

// ============================================================================
// PulseIndicator - Pulsing status indicator
// ============================================================================

interface PulseIndicatorProps {
  color?: 'green' | 'red' | 'yellow' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

export function PulseIndicator({ color = 'green', size = 'md' }: PulseIndicatorProps) {
  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="relative inline-flex">
      <div className={cn('rounded-full', colors[color], sizes[size])} />
      <div
        className={cn(
          'absolute inset-0 rounded-full animate-ping',
          colors[color],
          sizes[size]
        )}
        style={{ animationDuration: '2s' }}
      />
    </div>
  );
}

// ============================================================================
// CSS Animations (add to globals.css)
// ============================================================================

/*
@keyframes ripple {
  to {
    width: 500px;
    height: 500px;
    opacity: 0;
    transform: translate(-50%, -50%);
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes drawCircle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drawCheck {
  to {
    stroke-dashoffset: 0;
  }
}
*/

// Last Modified: 2025-11-24 16:58
/**
 * Optimized Image Component with Lazy Loading
 * Features: Blur-up placeholder, responsive images, WebP support, lazy loading
 * Zero Cognitive Load: Automatically optimizes images for performance
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // If true, loads immediately (for above-fold images)
  blurDataURL?: string; // Base64 encoded tiny blur placeholder
  aspectRatio?: string; // e.g., "16/9" or "1/1"
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string; // Responsive sizes attribute
  quality?: number; // 1-100, default 75
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generate a tiny blur placeholder data URL
 * This is a simple gray placeholder - in production you'd generate from actual image
 */
function generateBlurPlaceholder(width: number = 10, height: number = 10): string {
  // Create a tiny SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Optimized Image Component
 * Automatically lazy loads images with blur-up effect
 */
export const OptimizedImage = React.memo<OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  priority = false,
  blurDataURL,
  aspectRatio,
  objectFit = 'cover',
  sizes,
  quality = 75,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Handle load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string): string | undefined => {
    if (!sizes) return undefined;

    // Simple srcset generation - in production you'd have multiple image sizes
    return `${baseSrc}?w=640 640w, ${baseSrc}?w=1024 1024w, ${baseSrc}?w=1920 1920w`;
  };

  // Determine if we should show the actual image
  const shouldLoad = priority || isInView;

  // Calculate aspect ratio padding
  const paddingBottom = aspectRatio
    ? `calc(100% / (${aspectRatio}))`
    : height && width
    ? `${(height / width) * 100}%`
    : undefined;

  const placeholder = blurDataURL || generateBlurPlaceholder();

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
      }}
    >
      {/* Blur placeholder */}
      {!isLoaded && shouldLoad && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full',
            'blur-sm scale-110 transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          style={{ objectFit }}
        />
      )}

      {/* Actual image */}
      {shouldLoad && !hasError && (
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ objectFit }}
          {...props}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400"
          role="img"
          aria-label={alt}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Loading skeleton */}
      {!isInView && !priority && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Avatar variant of OptimizedImage
 * Circular images with specific sizing
 */
export const OptimizedAvatar = React.memo<OptimizedImageProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }>(({
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <OptimizedImage
      {...props}
      className={cn('rounded-full', sizeClasses[size], className)}
      aspectRatio="1/1"
      objectFit="cover"
    />
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

// Last Modified: 2025-11-23 17:30
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Download,
  Share2,
  Heart,
  Maximize2,
  Grid,
  Columns,
  Square,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Filter,
  Tag,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageData {
  id: string;
  src: string;
  thumbnail?: string;
  alt: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    created: Date;
    modified?: Date;
    author?: string;
    location?: { lat: number; lng: number };
  };
  annotations?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    author: string;
    created: Date;
  }>;
}

interface ImageGalleryProps {
  images: ImageData[];
  layout?: 'grid' | 'masonry' | 'carousel' | 'stack' | 'mosaic';
  columns?: number | { xs: number; sm: number; md: number; lg: number; xl: number };
  gap?: number;

  // Features
  features?: {
    zoom?: boolean;
    fullscreen?: boolean;
    download?: boolean;
    share?: boolean;
    favorite?: boolean;
    annotations?: boolean;
    filters?: boolean;
    slideshow?: boolean;
    comparison?: boolean;
    ai_tagging?: boolean;
  };

  // Behavior
  onImageClick?: (image: ImageData, index: number) => void;
  onImageLoad?: (image: ImageData) => void;
  onAnnotationAdd?: (imageId: string, annotation: any) => void;

  // Performance
  lazyLoad?: boolean;
  virtualScroll?: boolean;
  preloadCount?: number;

  // Styling
  imageAspectRatio?: 'square' | '16:9' | '4:3' | 'auto';
  borderRadius?: number;
  showCaptions?: boolean;
  className?: string;
}

// Lazy loading image component
const LazyImage: React.FC<{
  src: string;
  thumbnail?: string;
  alt: string;
  onLoad?: () => void;
  className?: string;
  aspectRatio?: string;
  borderRadius?: number;
}> = ({ src, thumbnail, alt, onLoad, className, aspectRatio, borderRadius }) => {
  const [imageSrc, setImageSrc] = useState(thumbnail || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, inView] = useInView({
    threshold: 0.01,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
    }
  }, [inView, src, onLoad]);

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)} style={{ borderRadius }}>
      {!isLoaded && thumbnail && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
      )}
      <motion.img
        src={imageSrc || thumbnail || '/placeholder.jpg'}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-500',
          !isLoaded && 'blur-sm scale-110'
        )}
        style={{ aspectRatio: aspectRatio || 'auto' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  layout = 'grid',
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 16,
  features = {
    zoom: true,
    fullscreen: true,
    download: true,
    share: false,
    favorite: true,
    annotations: false,
    filters: false,
    slideshow: true,
    comparison: false,
    ai_tagging: false
  },
  onImageClick,
  onImageLoad,
  onAnnotationAdd,
  lazyLoad = true,
  virtualScroll = false,
  preloadCount = 2,
  imageAspectRatio = 'auto',
  borderRadius = 8,
  showCaptions = true,
  className
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<'lightbox' | 'comparison' | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [filter, setFilter] = useState<string>('none');
  const [layoutMode, setLayoutMode] = useState(layout);
  const slideshowTimerRef = useRef<NodeJS.Timeout>();
  const galleryRef = useRef<HTMLDivElement>(null);

  // Aspect ratio classes
  const aspectRatios = {
    'square': '1',
    '16:9': '16/9',
    '4:3': '4/3',
    'auto': 'auto'
  };

  // Calculate columns based on screen size
  const getColumns = () => {
    if (typeof columns === 'number') return columns;
    // This would need actual breakpoint detection
    return columns.md; // Default to medium breakpoint
  };

  // Handle image selection
  const handleImageSelect = useCallback((image: ImageData, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
    setViewMode('lightbox');
    onImageClick?.(image, index);
  }, [onImageClick]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage || viewMode !== 'lightbox') return;

      switch (e.key) {
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        case 'Escape':
          closeViewer();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedIndex, viewMode]);

  // Navigate between images
  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next'
      ? (selectedIndex + 1) % images.length
      : (selectedIndex - 1 + images.length) % images.length;

    setSelectedIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  // Close viewer
  const closeViewer = () => {
    setSelectedImage(null);
    setSelectedIndex(-1);
    setViewMode(null);
    setIsSlideshow(false);
    if (slideshowTimerRef.current) {
      clearInterval(slideshowTimerRef.current);
    }
  };

  // Toggle favorite
  const toggleFavorite = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId);
      } else {
        newFavorites.add(imageId);
      }
      return newFavorites;
    });
  };

  // Start/stop slideshow
  const toggleSlideshow = () => {
    setIsSlideshow(prev => !prev);
  };

  useEffect(() => {
    if (isSlideshow) {
      slideshowTimerRef.current = setInterval(() => {
        navigateImage('next');
      }, 3000);
    } else if (slideshowTimerRef.current) {
      clearInterval(slideshowTimerRef.current);
    }

    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }
    };
  }, [isSlideshow, selectedIndex]);

  // Download image
  const downloadImage = async (image: ImageData) => {
    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.title || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  // Render gallery based on layout
  const renderGallery = () => {
    const columnCount = getColumns();

    switch (layoutMode) {
      case 'masonry':
        return (
          <div
            className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5"
            style={{ columnGap: gap }}
          >
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                className="break-inside-avoid mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {renderImageCard(image, index)}
              </motion.div>
            ))}
          </div>
        );

      case 'carousel':
        return (
          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500" style={{ gap }}>
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderImageCard(image, index)}
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'grid':
      default:
        return (
          <div
            className={cn('grid', {
              'grid-cols-1': columnCount === 1,
              'sm:grid-cols-2': columnCount >= 2,
              'md:grid-cols-3': columnCount >= 3,
              'lg:grid-cols-4': columnCount >= 4,
              'xl:grid-cols-5': columnCount >= 5
            })}
            style={{ gap }}
          >
            <LayoutGroup>
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {renderImageCard(image, index)}
                </motion.div>
              ))}
            </LayoutGroup>
          </div>
        );
    }
  };

  // Render individual image card
  const renderImageCard = (image: ImageData, index: number) => {
    const isFavorited = favorites.has(image.id);

    return (
      <motion.div
        className="relative group cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800"
        style={{ borderRadius }}
        onClick={() => handleImageSelect(image, index)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {lazyLoad ? (
          <LazyImage
            src={image.src}
            thumbnail={image.thumbnail}
            alt={image.alt}
            onLoad={() => onImageLoad?.(image)}
            aspectRatio={aspectRatios[imageAspectRatio]}
            borderRadius={borderRadius}
          />
        ) : (
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover"
            style={{ aspectRatio: aspectRatios[imageAspectRatio] }}
            onLoad={() => onImageLoad?.(image)}
          />
        )}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {showCaptions && (
              <div className="mb-2">
                <h3 className="text-white font-semibold text-sm truncate">
                  {image.title || image.alt}
                </h3>
                {image.description && (
                  <p className="text-white/80 text-xs truncate">
                    {image.description}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {features.favorite && (
                <motion.button
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isFavorited
                      ? "bg-red-500 text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                  onClick={(e) => toggleFavorite(image.id, e)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
                </motion.button>
              )}

              {features.download && (
                <motion.button
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(image);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Download className="h-4 w-4" />
                </motion.button>
              )}

              {features.share && (
                <motion.button
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implement share functionality
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-wrap gap-1">
              {image.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div ref={galleryRef} className={cn('relative', className)}>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "p-2 rounded",
              layoutMode === 'grid' && "bg-primary text-primary-foreground"
            )}
            onClick={() => setLayoutMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            className={cn(
              "p-2 rounded",
              layoutMode === 'masonry' && "bg-primary text-primary-foreground"
            )}
            onClick={() => setLayoutMode('masonry')}
          >
            <Columns className="h-4 w-4" />
          </button>
          <button
            className={cn(
              "p-2 rounded",
              layoutMode === 'carousel' && "bg-primary text-primary-foreground"
            )}
            onClick={() => setLayoutMode('carousel')}
          >
            <Square className="h-4 w-4" />
          </button>
        </div>

        {features.slideshow && (
          <button
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={toggleSlideshow}
          >
            {isSlideshow ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Gallery */}
      {renderGallery()}

      {/* Lightbox viewer */}
      <AnimatePresence>
        {viewMode === 'lightbox' && selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeViewer}
          >
            <TransformWrapper
              initialScale={1}
              initialPositionX={0}
              initialPositionY={0}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <TransformComponent>
                    <img
                      src={selectedImage.src}
                      alt={selectedImage.alt}
                      className="max-w-full max-h-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TransformComponent>

                  {/* Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 rounded-lg">
                    <button
                      className="p-2 text-white hover:bg-white/20 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        zoomIn();
                      }}
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-white hover:bg-white/20 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        zoomOut();
                      }}
                    >
                      <ZoomOut className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-white hover:bg-white/20 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetTransform();
                      }}
                    >
                      <RotateCw className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </TransformWrapper>

            {/* Navigation */}
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('prev');
              }}
            >
              ←
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('next');
              }}
            >
              →
            </button>

            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
              onClick={closeViewer}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ImageGallery.displayName = 'ImageGallery';
// Last Modified: 2025-11-23 17:30
/**
 * AutoSizer Component
 * Automatically sizes children to fill available space
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSizerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
  disableHeight?: boolean;
  disableWidth?: boolean;
  defaultHeight?: number;
  defaultWidth?: number;
  onResize?: (size: { width: number; height: number }) => void;
}

export const AutoSizer: React.FC<AutoSizerProps> = ({
  children,
  className,
  disableHeight = false,
  disableWidth = false,
  defaultHeight = 0,
  defaultWidth = 0,
  onResize,
}) => {
  const [size, setSize] = useState({
    width: defaultWidth,
    height: defaultHeight,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newSize = {
      width: disableWidth ? defaultWidth : rect.width,
      height: disableHeight ? defaultHeight : rect.height,
    };

    if (newSize.width !== size.width || newSize.height !== size.height) {
      setSize(newSize);
      onResize?.(newSize);
    }
  }, [size.width, size.height, disableWidth, disableHeight, defaultWidth, defaultHeight, onResize]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initial size
    updateSize();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateSize);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateSize]);

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }}>
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
};

export default AutoSizer;
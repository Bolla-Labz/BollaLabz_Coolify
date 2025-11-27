// Last Modified: 2025-11-24 16:54
/**
 * Core Web Vitals and Performance Metrics Tracking
 * Monitors LCP, FID, CLS, TTFB and sends data to backend for analysis
 * Zero Cognitive Load: Automatic performance tracking
 */

import { onCLS, onLCP, onTTFB, onFCP, onINP, Metric } from 'web-vitals';

interface PerformanceData {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * Rating thresholds for Core Web Vitals (2025 standards)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
};

/**
 * Determine rating based on metric value and thresholds
 */
function getRating(metricName: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric data to backend analytics endpoint
 */
async function sendToAnalytics(data: PerformanceData): Promise<void> {
  const endpoint = `${import.meta.env.VITE_API_URL || ''}/api/v1/analytics/performance`;

  try {
    // Use sendBeacon for reliability (works even when page is being unloaded)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // Fallback to fetch
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true, // Keep request alive if page is closing
      });
    }
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.debug('Performance metric send failed:', error);
  }
}

/**
 * Store metrics in sessionStorage for debugging
 */
function storeMetric(data: PerformanceData): void {
  try {
    const key = 'perf_metrics';
    const stored = sessionStorage.getItem(key);
    const metrics = stored ? JSON.parse(stored) : [];
    metrics.push(data);

    // Keep only last 50 metrics
    if (metrics.length > 50) {
      metrics.shift();
    }

    sessionStorage.setItem(key, JSON.stringify(metrics));
  } catch (error) {
    // sessionStorage might be full or disabled
    console.debug('Failed to store metric:', error);
  }
}

/**
 * Handle metric callback from web-vitals
 */
function handleMetric(metric: Metric): void {
  const data: PerformanceData = {
    metric: metric.name,
    value: metric.value,
    rating: getRating(metric.name as keyof typeof THRESHOLDS, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Store locally
  storeMetric(data);

  // Send to backend (async, non-blocking)
  sendToAnalytics(data);

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${metric.name}:`, {
      value: `${Math.round(metric.value)}${metric.name === 'CLS' ? '' : 'ms'}`,
      rating: data.rating,
      delta: Math.round(metric.delta),
    });
  }
}

/**
 * Initialize Core Web Vitals monitoring
 * Call this once when the app starts
 */
export function initPerformanceMonitoring(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Core Web Vitals (FID deprecated, using INP instead)
  onLCP(handleMetric);
  onCLS(handleMetric);
  onTTFB(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);

  // Log navigation timing (once per page load)
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const metrics = {
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          tcp: timing.connectEnd - timing.connectStart,
          request: timing.responseStart - timing.requestStart,
          response: timing.responseEnd - timing.responseStart,
          dom: timing.domComplete - timing.domLoading,
          load: timing.loadEventEnd - timing.loadEventStart,
          total: timing.loadEventEnd - timing.navigationStart,
        };

        if (import.meta.env.DEV) {
          console.log('[Performance] Navigation Timing:', metrics);
        }

        // Store in sessionStorage
        sessionStorage.setItem('perf_navigation', JSON.stringify(metrics));
      }, 0);
    });
  }
}

/**
 * Get stored performance metrics from sessionStorage
 */
export function getStoredMetrics(): PerformanceData[] {
  try {
    const stored = sessionStorage.getItem('perf_metrics');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear stored metrics
 */
export function clearStoredMetrics(): void {
  try {
    sessionStorage.removeItem('perf_metrics');
    sessionStorage.removeItem('perf_navigation');
  } catch {
    // Ignore errors
  }
}

/**
 * Mark custom performance timing
 * Useful for measuring specific operations
 */
export function markPerformance(name: string): void {
  if (window.performance && window.performance.mark) {
    window.performance.mark(name);
  }
}

/**
 * Measure time between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string): number | null {
  if (window.performance && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name)[0];
      return measure ? measure.duration : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get current page performance score (0-100)
 * Based on weighted Core Web Vitals
 */
export function getPerformanceScore(): number {
  const metrics = getStoredMetrics();
  if (metrics.length === 0) return 0;

  // Get latest metrics for each type
  const latest: Record<string, PerformanceData> = {};
  metrics.forEach(m => {
    latest[m.metric] = m;
  });

  // Weights (Google PageSpeed Insights 2025 - INP replaces FID)
  const weights = {
    LCP: 0.25,
    INP: 0.25,
    CLS: 0.25,
    TTFB: 0.125,
    FCP: 0.125,
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([metric, weight]) => {
    const data = latest[metric];
    if (data) {
      // Convert rating to score
      const score = data.rating === 'good' ? 100 : data.rating === 'needs-improvement' ? 50 : 0;
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Monitor React re-renders (development only)
 */
export function initRenderMonitoring(): void {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    let renderCount = 0;
    const originalConsoleError = console.error;

    // Intercept React warnings about unnecessary re-renders
    console.error = (...args) => {
      if (args[0]?.includes?.('re-render')) {
        renderCount++;
        console.warn(`[Performance] Unnecessary re-render detected (${renderCount} total)`);
      }
      originalConsoleError(...args);
    };
  }
}

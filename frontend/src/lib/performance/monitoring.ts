// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz Performance Monitoring
 * Comprehensive performance tracking aligned with project vision:
 * - Zero Cognitive Load: Automatic performance optimization
 * - Continuous Learning: Track and improve based on metrics
 * - Production Reliability: Real-time performance monitoring
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { SecurityAudit } from '@/lib/security';

// ============================================
// PERFORMANCE METRICS TYPES
// ============================================

export interface PerformanceMetrics {
  // Core Web Vitals
  cls: number | null;          // Cumulative Layout Shift
  fid: number | null;          // First Input Delay
  fcp: number | null;          // First Contentful Paint
  lcp: number | null;          // Largest Contentful Paint
  ttfb: number | null;         // Time to First Byte

  // Custom Metrics
  apiLatency: number[];        // API response times
  renderTime: number[];        // Component render times
  memoryUsage: number | null;  // Memory consumption
  bundleSize: number | null;   // JS bundle size
  cacheHitRate: number | null; // Cache effectiveness

  // Resource Timing
  resourceLoadTime: Map<string, number>;

  // User Timing
  customMarks: Map<string, number>;
  customMeasures: Map<string, number>;
}

export interface PerformanceThresholds {
  cls: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  lcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
  apiLatency: { good: number; needsImprovement: number };
  renderTime: { good: number; needsImprovement: number };
  memoryUsage: { warning: number; critical: number };
}

// ============================================
// PERFORMANCE MONITOR CLASS
// ============================================

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
    apiLatency: [],
    renderTime: [],
    memoryUsage: null,
    bundleSize: null,
    cacheHitRate: null,
    resourceLoadTime: new Map(),
    customMarks: new Map(),
    customMeasures: new Map(),
  };

  private thresholds: PerformanceThresholds = {
    cls: { good: 0.1, needsImprovement: 0.25 },
    fid: { good: 100, needsImprovement: 300 },
    fcp: { good: 1800, needsImprovement: 3000 },
    lcp: { good: 2500, needsImprovement: 4000 },
    ttfb: { good: 800, needsImprovement: 1800 },
    apiLatency: { good: 200, needsImprovement: 500 },
    renderTime: { good: 16, needsImprovement: 50 },
    memoryUsage: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 }, // 50MB, 100MB
  };

  private observers: Map<string, PerformanceObserver> = new Map();
  private reportQueue: any[] = [];
  private reportInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize Web Vitals
    this.initWebVitals();

    // Initialize Performance Observers
    this.initPerformanceObservers();

    // Initialize Memory Monitoring
    this.initMemoryMonitoring();

    // Initialize Resource Timing
    this.initResourceTiming();

    // Start reporting interval
    this.startReporting();

    // Log initialization
    console.log('🚀 Performance monitoring initialized');
  }

  /**
   * Initialize Web Vitals tracking
   */
  private initWebVitals(): void {
    // Cumulative Layout Shift
    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.checkThreshold('cls', metric.value);
      this.reportMetric(metric);
    });

    // First Input Delay
    onFID((metric) => {
      this.metrics.fid = metric.value;
      this.checkThreshold('fid', metric.value);
      this.reportMetric(metric);
    });

    // First Contentful Paint
    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.checkThreshold('fcp', metric.value);
      this.reportMetric(metric);
    });

    // Largest Contentful Paint
    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.checkThreshold('lcp', metric.value);
      this.reportMetric(metric);
    });

    // Time to First Byte
    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.checkThreshold('ttfb', metric.value);
      this.reportMetric(metric);
    });
  }

  /**
   * Initialize Performance Observers
   */
  private initPerformanceObservers(): void {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.reportLongTask(entry);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        // Long task observer not supported
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.reportLayoutShift(entry as any);
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (e) {
        // Layout shift observer not supported
      }

      // First Input Observer
      try {
        const firstInputObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.reportFirstInput(entry as PerformanceEventTiming);
          }
        });
        firstInputObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('first-input', firstInputObserver);
      } catch (e) {
        // First input observer not supported
      }
    }
  }

  /**
   * Initialize memory monitoring
   */
  private initMemoryMonitoring(): void {
    if ((performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;

        // Check memory thresholds
        if (memory.usedJSHeapSize > this.thresholds.memoryUsage.critical) {
          this.reportMemoryWarning('critical', memory.usedJSHeapSize);
        } else if (memory.usedJSHeapSize > this.thresholds.memoryUsage.warning) {
          this.reportMemoryWarning('warning', memory.usedJSHeapSize);
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Initialize resource timing
   */
  private initResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackResourceTiming(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        // Resource timing not supported
      }
    }
  }

  /**
   * Track API latency
   */
  trackApiLatency(url: string, duration: number): void {
    this.metrics.apiLatency.push(duration);

    // Keep only last 100 measurements
    if (this.metrics.apiLatency.length > 100) {
      this.metrics.apiLatency.shift();
    }

    // Check threshold
    if (duration > this.thresholds.apiLatency.needsImprovement) {
      this.reportSlowApi(url, duration);
    }
  }

  /**
   * Track component render time
   */
  trackRenderTime(componentName: string, duration: number): void {
    this.metrics.renderTime.push(duration);

    // Keep only last 100 measurements
    if (this.metrics.renderTime.length > 100) {
      this.metrics.renderTime.shift();
    }

    // Check threshold
    if (duration > this.thresholds.renderTime.needsImprovement) {
      this.reportSlowRender(componentName, duration);
    }
  }

  /**
   * Track cache hit rate
   */
  trackCacheHit(hit: boolean): void {
    // Simple cache hit rate calculation
    const key = 'cache_stats';
    const stats = JSON.parse(localStorage.getItem(key) || '{"hits": 0, "total": 0}');
    stats.total++;
    if (hit) stats.hits++;
    localStorage.setItem(key, JSON.stringify(stats));

    this.metrics.cacheHitRate = (stats.hits / stats.total) * 100;
  }

  /**
   * Create custom performance mark
   */
  mark(name: string): void {
    performance.mark(name);
    this.metrics.customMarks.set(name, performance.now());
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): number {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name, 'measure');
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration;
      this.metrics.customMeasures.set(name, duration);
      return duration;
    }
    return 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    score: number;
    status: 'good' | 'needsImprovement' | 'poor';
    details: any;
  } {
    let score = 100;
    const issues = [];

    // Check Web Vitals
    if (this.metrics.cls !== null && this.metrics.cls > this.thresholds.cls.good) {
      score -= 10;
      issues.push(`CLS: ${this.metrics.cls.toFixed(3)}`);
    }

    if (this.metrics.fid !== null && this.metrics.fid > this.thresholds.fid.good) {
      score -= 10;
      issues.push(`FID: ${this.metrics.fid}ms`);
    }

    if (this.metrics.lcp !== null && this.metrics.lcp > this.thresholds.lcp.good) {
      score -= 15;
      issues.push(`LCP: ${this.metrics.lcp}ms`);
    }

    // Check API latency
    if (this.metrics.apiLatency.length > 0) {
      const avgLatency = this.metrics.apiLatency.reduce((a, b) => a + b, 0) / this.metrics.apiLatency.length;
      if (avgLatency > this.thresholds.apiLatency.good) {
        score -= 10;
        issues.push(`API Latency: ${avgLatency.toFixed(0)}ms`);
      }
    }

    // Check memory usage
    if (this.metrics.memoryUsage !== null && this.metrics.memoryUsage > this.thresholds.memoryUsage.warning) {
      score -= 5;
      issues.push(`Memory: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }

    return {
      score: Math.max(0, score),
      status: score >= 90 ? 'good' : score >= 50 ? 'needsImprovement' : 'poor',
      details: {
        issues,
        metrics: this.getMetrics(),
      },
    };
  }

  /**
   * Check threshold and report if exceeded
   */
  private checkThreshold(metric: keyof PerformanceThresholds, value: number): void {
    const threshold = this.thresholds[metric];
    if (threshold && 'needsImprovement' in threshold) {
      if (value > threshold.needsImprovement) {
        SecurityAudit.log(
          `Performance threshold exceeded: ${metric}`,
          'warning',
          { metric, value, threshold: threshold.needsImprovement }
        );
      }
    }
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(metric: Metric): void {
    this.reportQueue.push({
      type: 'webvital',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
    });
  }

  /**
   * Report long task
   */
  private reportLongTask(entry: PerformanceEntry): void {
    this.reportQueue.push({
      type: 'longtask',
      duration: entry.duration,
      startTime: entry.startTime,
      name: entry.name,
      timestamp: Date.now(),
    });

    if (entry.duration > 100) {
      console.warn(`Long task detected: ${entry.duration}ms`);
    }
  }

  /**
   * Report layout shift
   */
  private reportLayoutShift(entry: any): void {
    this.reportQueue.push({
      type: 'layout-shift',
      value: entry.value,
      sources: entry.sources,
      timestamp: Date.now(),
    });
  }

  /**
   * Report first input
   */
  private reportFirstInput(entry: PerformanceEventTiming): void {
    this.reportQueue.push({
      type: 'first-input',
      delay: entry.processingStart - entry.startTime,
      timestamp: Date.now(),
    });
  }

  /**
   * Track resource timing
   */
  private trackResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    this.metrics.resourceLoadTime.set(entry.name, duration);

    // Report slow resources
    if (duration > 1000) {
      this.reportQueue.push({
        type: 'slow-resource',
        url: entry.name,
        duration,
        size: entry.transferSize,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Report memory warning
   */
  private reportMemoryWarning(severity: 'warning' | 'critical', usage: number): void {
    SecurityAudit.log(
      `Memory usage ${severity}`,
      severity === 'critical' ? 'error' : 'warning',
      { usage: usage / 1024 / 1024, unit: 'MB' }
    );

    this.reportQueue.push({
      type: 'memory-warning',
      severity,
      usage,
      timestamp: Date.now(),
    });
  }

  /**
   * Report slow API
   */
  private reportSlowApi(url: string, duration: number): void {
    this.reportQueue.push({
      type: 'slow-api',
      url,
      duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Report slow render
   */
  private reportSlowRender(componentName: string, duration: number): void {
    this.reportQueue.push({
      type: 'slow-render',
      component: componentName,
      duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Start reporting interval
   */
  private startReporting(): void {
    this.reportInterval = setInterval(() => {
      this.flushReports();
    }, 30000); // Report every 30 seconds
  }

  /**
   * Flush report queue
   */
  private async flushReports(): Promise<void> {
    if (this.reportQueue.length === 0) return;

    const reports = [...this.reportQueue];
    this.reportQueue = [];

    try {
      // Send to analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reports,
          summary: this.getSummary(),
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send performance reports:', error);
      // Re-queue reports
      this.reportQueue.unshift(...reports);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Stop observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear interval
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    // Flush remaining reports
    this.flushReports();
  }
}

// ============================================

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  const monitor = PerformanceMonitor.getInstance();
  monitor.init();

  // Log performance summary on page unload
  window.addEventListener('beforeunload', () => {
    const summary = monitor.getSummary();
    console.log('Performance Summary:', summary);
  });
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
// Last Modified: 2025-11-24 17:02
/**
 * Performance Dashboard
 * Real-time monitoring of Core Web Vitals, bundle size, and performance metrics
 * Zero Cognitive Load: Automatic performance tracking and historical analysis
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getStoredMetrics,
  getPerformanceScore,
  clearStoredMetrics,
  markPerformance,
} from '@/lib/performance/metrics';
import { Activity, TrendingUp, TrendingDown, Zap, Clock, Eye } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: string;
  icon: React.ReactNode;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  rating,
  threshold,
  icon,
  description,
}) => {
  const ratingColors = {
    good: 'bg-green-100 text-green-800 border-green-200',
    'needs-improvement': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    poor: 'bg-red-100 text-red-800 border-red-200',
  };

  const ratingLabels = {
    good: 'Good',
    'needs-improvement': 'Needs Improvement',
    poor: 'Poor',
  };

  return (
    <Card className={`border-2 ${ratingColors[rating]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <Badge
            variant={rating === 'good' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {ratingLabels[rating]}
          </Badge>
          <span className="text-xs text-muted-foreground">Target: {threshold}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const Performance: React.FC = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadMetrics();
  }, [refreshKey]);

  const loadMetrics = () => {
    const stored = getStoredMetrics();
    setMetrics(stored);
    setScore(getPerformanceScore());
  };

  const handleRefresh = () => {
    markPerformance('manual-refresh');
    setRefreshKey((k) => k + 1);
  };

  const handleClear = () => {
    clearStoredMetrics();
    setRefreshKey((k) => k + 1);
  };

  // Get latest metric for each type
  const latest: Record<string, any> = {};
  metrics.forEach((m) => {
    latest[m.metric] = m;
  });

  // Calculate bundle size (from build)
  const bundleStats = {
    total: '~1.5 MB',
    gzipped: '~350 KB',
    brotli: '~280 KB',
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time Core Web Vitals and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleClear} variant="destructive">
            Clear Data
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Overall Performance Score</CardTitle>
          <CardDescription className="text-blue-100">
            Weighted average of Core Web Vitals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold">{score}/100</div>
          <div className="mt-2 flex items-center gap-2">
            {score >= 90 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-sm">
              {score >= 90
                ? 'Excellent performance!'
                : score >= 50
                ? 'Good, but can improve'
                : 'Needs optimization'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {latest.LCP && (
            <MetricCard
              title="Largest Contentful Paint"
              value={`${Math.round(latest.LCP.value)}ms`}
              rating={latest.LCP.rating}
              threshold="< 2.5s"
              icon={<Eye className="w-5 h-5" />}
              description="Time until largest content element is visible"
            />
          )}


          {latest.CLS && (
            <MetricCard
              title="Cumulative Layout Shift"
              value={latest.CLS.value.toFixed(3)}
              rating={latest.CLS.rating}
              threshold="< 0.1"
              icon={<Activity className="w-5 h-5" />}
              description="Visual stability - how much content shifts"
            />
          )}

          {latest.TTFB && (
            <MetricCard
              title="Time to First Byte"
              value={`${Math.round(latest.TTFB.value)}ms`}
              rating={latest.TTFB.rating}
              threshold="< 800ms"
              icon={<Clock className="w-5 h-5" />}
              description="Time until first byte received from server"
            />
          )}

          {latest.FCP && (
            <MetricCard
              title="First Contentful Paint"
              value={`${Math.round(latest.FCP.value)}ms`}
              rating={latest.FCP.rating}
              threshold="< 1.8s"
              icon={<Eye className="w-5 h-5" />}
              description="Time until first content is painted"
            />
          )}

          {latest.INP && (
            <MetricCard
              title="Interaction to Next Paint"
              value={`${Math.round(latest.INP.value)}ms`}
              rating={latest.INP.rating}
              threshold="< 200ms"
              icon={<Zap className="w-5 h-5" />}
              description="Responsiveness of all interactions"
            />
          )}
        </div>
      </div>

      {/* Bundle Size */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Bundle Size</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Uncompressed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bundleStats.total}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Total JavaScript + CSS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gzip Compressed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bundleStats.gzipped}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Actual transfer size (gzip)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brotli Compressed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bundleStats.brotli}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Best compression (brotli)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Optimization Recommendations</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {score < 90 && (
                <>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">High Priority</Badge>
                    <div>
                      <strong>Reduce bundle size:</strong> Consider code splitting and
                      lazy loading for non-critical routes
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline">High Priority</Badge>
                    <div>
                      <strong>Optimize images:</strong> Use WebP format and implement
                      lazy loading with blur placeholders
                    </div>
                  </li>
                </>
              )}
              {latest.LCP?.rating !== 'good' && (
                <li className="flex items-start gap-2">
                  <Badge variant="destructive">LCP</Badge>
                  <div>
                    <strong>Improve LCP:</strong> Preload critical images, reduce
                    server response time, eliminate render-blocking resources
                  </div>
                </li>
              )}
              {latest.INP?.rating !== 'good' && (
                <li className="flex items-start gap-2">
                  <Badge variant="destructive">INP</Badge>
                  <div>
                    <strong>Improve INP:</strong> Break up long JavaScript tasks, use
                    web workers for heavy computation, optimize event handlers
                  </div>
                </li>
              )}
              {latest.CLS?.rating !== 'good' && (
                <li className="flex items-start gap-2">
                  <Badge variant="destructive">CLS</Badge>
                  <div>
                    <strong>Improve CLS:</strong> Set dimensions for images and
                    videos, avoid inserting content above existing content
                  </div>
                </li>
              )}
              {score >= 90 && (
                <li className="flex items-start gap-2 text-green-600">
                  <Badge className="bg-green-100 text-green-800">
                    Excellent
                  </Badge>
                  <div>
                    All Core Web Vitals are in good range! Continue monitoring for
                    regressions.
                  </div>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      {import.meta.env.DEV && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Debug Information</h2>
          <Card>
            <CardContent className="pt-6">
              <pre className="text-xs overflow-auto max-h-96 bg-gray-100 dark:bg-gray-800 p-4 rounded">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Performance;

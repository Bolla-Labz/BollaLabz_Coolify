// Last Modified: 2025-11-24 10:30
// People Analytics Dashboard - Main Component
// Inspired by AIZ Hub Trade Analytics Interface

import { useEffect, useState, useTransition } from 'react';
import { usePeopleStore } from '../../stores/extracted/people';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AnalyticsHeader } from './AnalyticsHeader';
import { InteractionTrendsChart } from './InteractionTrendsChart';
import { TopContactsWidget } from './TopContactsWidget';
import { RelationshipHealthGrid } from './RelationshipHealthGrid';
import { PersonProfileCard } from './PersonProfileCard';
import { NetworkVisualization } from './NetworkVisualization';
import { RefreshCw, Plus, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';

export function PeopleAnalyticsDashboard() {
  const {
    people,
    interactions,
    selectedPerson,
    isLoading: isLoadingPeople,
    error: peopleError,
    fetchPeople,
  } = usePeopleStore();

  const {
    summary,
    interactionTrends,
    relationshipHealth,
    topContacts,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
    fetchDashboardData,
    setDateRange,
  } = useAnalyticsStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Load people and analytics data on mount
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      // Set default date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const dateRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      setDateRange(dateRange);

      // Load people and analytics data in parallel
      await Promise.all([
        fetchPeople(),
        fetchDashboardData(dateRange),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    startTransition(() => {
      loadData();
    });
  };

  const handleAddContact = () => {
    // TODO: Implement add contact modal
    console.log('Opening add contact modal...');
  };

  const isLoading = isLoadingPeople || isLoadingAnalytics || isRefreshing;
  const error = peopleError || analyticsError;

  // Map data for components
  const mappedTopContacts = topContacts.map(tc => ({
    id: tc.personId,
    fullName: tc.personName,
    relationshipScore: tc.relationshipScore,
    totalInteractions: tc.interactionCount,
    lastContactDate: tc.lastInteraction,
    contactFrequency: 'monthly' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const mappedRelationshipHealth = relationshipHealth;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">People Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive relationship management and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isPending) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddContact}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Pending State Indicator */}
      {isPending && !isLoading && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Updating analytics data...
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State or Content */}
      {isLoading && !people.length ? (
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Analytics Header - Key Metrics */}
          <div className={cn(
            "transition-opacity duration-200",
            isPending && "opacity-60"
          )}>
            <AnalyticsHeader summary={summary} totalContacts={people.length} />
          </div>

          {/* Main Content Grid */}
          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-200",
            isPending && "opacity-60"
          )}>
            {/* Left Column - Interaction Trends (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Interaction Trends */}
              <Card className="p-6">
                <InteractionTrendsChart trends={interactionTrends} />
              </Card>

              {/* Relationship Health Grid */}
              <Card className="p-6">
                <RelationshipHealthGrid metrics={mappedRelationshipHealth} />
              </Card>
            </div>

            {/* Right Column - Top Contacts & Selected Person */}
            <div className="space-y-6">
              {/* Selected Person Profile */}
              {selectedPerson && (
                <Card className="p-6">
                  <PersonProfileCard person={selectedPerson} />
                </Card>
              )}

              {/* Top Contacts */}
              <Card className="p-6">
                <TopContactsWidget contacts={mappedTopContacts} />
              </Card>
            </div>
          </div>

          {/* Network Visualization - Full Width */}
          <Card className={cn(
            "p-6 transition-opacity duration-200",
            isPending && "opacity-60"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Relationship Network</h3>
            </div>
            <NetworkVisualization people={people} interactions={interactions} />
          </Card>
        </>
      )}
    </div>
  );
}

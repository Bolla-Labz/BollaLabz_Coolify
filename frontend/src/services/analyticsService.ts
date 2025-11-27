// Last Modified: 2025-11-23 17:30
import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/types/backend';
import type {
  PeopleAnalyticsSummary,
  InteractionTrend,
  RelationshipHealthMetric,
  TopContact,
  InteractionSummary,
  CommunicationPattern,
} from '@/types/people-analytics';

// Backend API response types
export interface BackendAnalyticsSummary {
  total_contacts: number;
  active_contacts: number;
  average_relationship_score: number;
  total_interactions: number;
  interaction_trends: Array<{
    date: string;
    count: number;
    type: string;
  }>;
  top_relationships: Array<{
    person_id: string;
    person_name: string;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    last_interaction: string;
    days_since_last_contact: number;
    recommendation: string;
  }>;
  communication_patterns: Array<{
    person_id: string;
    preferred_channel: 'call' | 'sms' | 'email' | 'meeting';
    average_response_time: number;
    best_time_to_contact: string;
    communication_frequency: number;
    engagement_score: number;
  }>;
}

export interface BackendInteractionSummary {
  total_interactions: number;
  by_type: Record<string, number>;
  by_sentiment: Record<string, number>;
  average_duration: number;
  top_contacts: Array<{
    person_id: string;
    person_name: string;
    interaction_count: number;
    last_interaction: string;
    relationship_score: number;
  }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  personId?: string;
  interactionType?: string[];
  sentiment?: string[];
}

// Field mapping helpers
const mapBackendSummaryToFrontend = (backendSummary: BackendAnalyticsSummary): PeopleAnalyticsSummary => ({
  totalContacts: backendSummary.total_contacts,
  activeContacts: backendSummary.active_contacts,
  averageRelationshipScore: backendSummary.average_relationship_score,
  totalInteractions: backendSummary.total_interactions,
  interactionTrends: backendSummary.interaction_trends.map((trend) => ({
    date: new Date(trend.date),
    count: trend.count,
    type: trend.type,
  })),
  topRelationships: backendSummary.top_relationships.map((rel) => ({
    personId: rel.person_id,
    personName: rel.person_name,
    score: rel.score,
    trend: rel.trend,
    lastInteraction: new Date(rel.last_interaction),
    daysSinceLastContact: rel.days_since_last_contact,
    recommendation: rel.recommendation,
  })),
  communicationPatterns: backendSummary.communication_patterns.map((pattern) => ({
    personId: pattern.person_id,
    preferredChannel: pattern.preferred_channel,
    averageResponseTime: pattern.average_response_time,
    bestTimeToContact: pattern.best_time_to_contact,
    communicationFrequency: pattern.communication_frequency,
    engagementScore: pattern.engagement_score,
  })),
});

const mapBackendInteractionSummaryToFrontend = (backendSummary: BackendInteractionSummary): InteractionSummary => ({
  totalInteractions: backendSummary.total_interactions,
  byType: backendSummary.by_type,
  bySentiment: backendSummary.by_sentiment,
  averageDuration: backendSummary.average_duration,
  topContacts: backendSummary.top_contacts.map((contact) => ({
    personId: contact.person_id,
    personName: contact.person_name,
    interactionCount: contact.interaction_count,
    lastInteraction: new Date(contact.last_interaction),
    relationshipScore: contact.relationship_score,
  })),
});

class AnalyticsService {
  private baseUrl = '/analytics';

  /**
   * Get comprehensive people analytics summary
   */
  async getPeopleAnalyticsSummary(filters?: AnalyticsFilters): Promise<PeopleAnalyticsSummary> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.personId) params.person_id = filters.personId;
      if (filters.interactionType && filters.interactionType.length > 0) {
        params.interaction_type = filters.interactionType.join(',');
      }
      if (filters.sentiment && filters.sentiment.length > 0) {
        params.sentiment = filters.sentiment.join(',');
      }
    }

    const response = await api.get<ApiResponse<BackendAnalyticsSummary>>(
      `${this.baseUrl}/people-summary`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(
        typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch analytics summary'
      );
    }

    return mapBackendSummaryToFrontend(response.data);
  }

  /**
   * Get interaction trends over time
   */
  async getInteractionTrends(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<InteractionTrend[]> {
    const params = {
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy,
    };

    const response = await api.get<ApiResponse<Array<{ date: string; count: number; type: string }>>>(
      `${this.baseUrl}/interaction-trends`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(
        typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch interaction trends'
      );
    }

    return response.data.map((trend) => ({
      date: new Date(trend.date),
      count: trend.count,
      type: trend.type,
    }));
  }

  /**
   * Get relationship health metrics
   */
  async getRelationshipHealthMetrics(limit?: number): Promise<RelationshipHealthMetric[]> {
    const params: Record<string, any> = {};
    if (limit) params.limit = limit;

    const response = await api.get<ApiResponse<BackendAnalyticsSummary['top_relationships']>>(
      `${this.baseUrl}/relationship-health`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(
        typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch relationship health metrics'
      );
    }

    return response.data.map((rel) => ({
      personId: rel.person_id,
      personName: rel.person_name,
      score: rel.score,
      trend: rel.trend,
      lastInteraction: new Date(rel.last_interaction),
      daysSinceLastContact: rel.days_since_last_contact,
      recommendation: rel.recommendation,
    }));
  }

  /**
   * Get top contacts by interaction count
   */
  async getTopContacts(limit: number = 10, filters?: AnalyticsFilters): Promise<TopContact[]> {
    const params: Record<string, any> = { limit };

    if (filters) {
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.interactionType && filters.interactionType.length > 0) {
        params.interaction_type = filters.interactionType.join(',');
      }
    }

    const response = await api.get<ApiResponse<BackendInteractionSummary['top_contacts']>>(
      `${this.baseUrl}/top-contacts`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(
        typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch top contacts'
      );
    }

    return response.data.map((contact) => ({
      personId: contact.person_id,
      personName: contact.person_name,
      interactionCount: contact.interaction_count,
      lastInteraction: new Date(contact.last_interaction),
      relationshipScore: contact.relationship_score,
    }));
  }

  /**
   * Get interaction summary statistics
   */
  async getInteractionSummary(filters?: AnalyticsFilters): Promise<InteractionSummary> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.personId) params.person_id = filters.personId;
      if (filters.interactionType && filters.interactionType.length > 0) {
        params.interaction_type = filters.interactionType.join(',');
      }
      if (filters.sentiment && filters.sentiment.length > 0) {
        params.sentiment = filters.sentiment.join(',');
      }
    }

    const response = await api.get<ApiResponse<BackendInteractionSummary>>(
      `${this.baseUrl}/interaction-summary`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(
        typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch interaction summary'
      );
    }

    return mapBackendInteractionSummaryToFrontend(response.data);
  }

  /**
   * Get communication patterns for all people or specific person
   */
  async getCommunicationPatterns(personId?: string): Promise<CommunicationPattern[]> {
    const params: Record<string, any> = {};
    if (personId) params.person_id = personId;

    const response = await api.get<ApiResponse<BackendAnalyticsSummary['communication_patterns']>>(
      `${this.baseUrl}/communication-patterns`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(
        typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch communication patterns'
      );
    }

    return response.data.map((pattern) => ({
      personId: pattern.person_id,
      preferredChannel: pattern.preferred_channel,
      averageResponseTime: pattern.average_response_time,
      bestTimeToContact: pattern.best_time_to_contact,
      communicationFrequency: pattern.communication_frequency,
      engagementScore: pattern.engagement_score,
    }));
  }

  /**
   * Get analytics for a specific date range
   */
  async getAnalyticsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<PeopleAnalyticsSummary> {
    return this.getPeopleAnalyticsSummary({ startDate, endDate });
  }

  /**
   * Get analytics dashboard data (aggregated)
   */
  async getDashboardData(dateRange?: { startDate: string; endDate: string }): Promise<{
    summary: PeopleAnalyticsSummary;
    topContacts: TopContact[];
    trends: InteractionTrend[];
  }> {
    const filters = dateRange
      ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
      : undefined;

    const [summary, topContacts, trends] = await Promise.all([
      this.getPeopleAnalyticsSummary(filters),
      this.getTopContacts(10, filters),
      dateRange
        ? this.getInteractionTrends(dateRange.startDate, dateRange.endDate)
        : Promise.resolve([]),
    ]);

    return { summary, topContacts, trends };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

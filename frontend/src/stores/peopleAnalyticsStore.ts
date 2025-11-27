// Last Modified: 2025-11-23 17:30
// People Analytics Store using Zustand

import { create } from 'zustand';
import type {
  PersonExtended,
  InteractionAnalytic,
  RelationshipInsight,
  SocialMediaActivity,
  PeopleAnalyticsSummary,
  InteractionTrend,
  RelationshipHealthMetric,
} from '../types/people-analytics';

interface PeopleAnalyticsState {
  // People
  people: PersonExtended[];
  selectedPerson: PersonExtended | null;
  isLoadingPeople: boolean;

  // Interactions
  interactions: InteractionAnalytic[];
  isLoadingInteractions: boolean;

  // Insights
  insights: RelationshipInsight[];
  isLoadingInsights: boolean;

  // Social Media
  socialActivity: SocialMediaActivity[];
  isLoadingSocialActivity: boolean;

  // Summary
  summary: PeopleAnalyticsSummary | null;

  // Actions - People
  setPeople: (people: PersonExtended[]) => void;
  addPerson: (person: PersonExtended) => void;
  updatePerson: (personId: string, updates: Partial<PersonExtended>) => void;
  removePerson: (personId: string) => void;
  selectPerson: (person: PersonExtended | null) => void;
  setLoadingPeople: (loading: boolean) => void;

  // Actions - Interactions
  setInteractions: (interactions: InteractionAnalytic[]) => void;
  addInteraction: (interaction: InteractionAnalytic) => void;
  setLoadingInteractions: (loading: boolean) => void;

  // Actions - Insights
  setInsights: (insights: RelationshipInsight[]) => void;
  addInsight: (insight: RelationshipInsight) => void;
  dismissInsight: (insightId: string) => void;
  setLoadingInsights: (loading: boolean) => void;

  // Actions - Social Media
  setSocialActivity: (activity: SocialMediaActivity[]) => void;
  addSocialActivity: (activity: SocialMediaActivity) => void;
  setLoadingSocialActivity: (loading: boolean) => void;

  // Actions - Summary
  setSummary: (summary: PeopleAnalyticsSummary) => void;

  // Computed values
  getPersonById: (personId: string) => PersonExtended | null;
  getInteractionsByPerson: (personId: string) => InteractionAnalytic[];
  getInsightsByPerson: (personId: string) => RelationshipInsight[];
  getSocialActivityByPerson: (personId: string) => SocialMediaActivity[];
  getTopContacts: (limit?: number) => PersonExtended[];
  getInteractionTrends: (days?: number) => InteractionTrend[];
  getRelationshipHealth: () => RelationshipHealthMetric[];
}

export const usePeopleAnalyticsStore = create<PeopleAnalyticsState>((set, get) => ({
  // Initial state
  people: [],
  selectedPerson: null,
  isLoadingPeople: false,

  interactions: [],
  isLoadingInteractions: false,

  insights: [],
  isLoadingInsights: false,

  socialActivity: [],
  isLoadingSocialActivity: false,

  summary: null,

  // People actions
  setPeople: (people) => set({ people }),

  addPerson: (person) =>
    set((state) => ({ people: [...state.people, person] })),

  updatePerson: (personId, updates) =>
    set((state) => ({
      people: state.people.map((person) =>
        person.id === personId ? { ...person, ...updates, updatedAt: new Date() } : person
      ),
    })),

  removePerson: (personId) =>
    set((state) => ({
      people: state.people.filter((p) => p.id !== personId),
      selectedPerson:
        state.selectedPerson?.id === personId ? null : state.selectedPerson,
    })),

  selectPerson: (person) => set({ selectedPerson: person }),

  setLoadingPeople: (loading) => set({ isLoadingPeople: loading }),

  // Interaction actions
  setInteractions: (interactions) => set({ interactions }),

  addInteraction: (interaction) =>
    set((state) => ({
      interactions: [interaction, ...state.interactions],
    })),

  setLoadingInteractions: (loading) => set({ isLoadingInteractions: loading }),

  // Insight actions
  setInsights: (insights) => set({ insights }),

  addInsight: (insight) =>
    set((state) => ({ insights: [...state.insights, insight] })),

  dismissInsight: (insightId) =>
    set((state) => ({
      insights: state.insights.map((insight) =>
        insight.id === insightId ? { ...insight, isDismissed: true } : insight
      ),
    })),

  setLoadingInsights: (loading) => set({ isLoadingInsights: loading }),

  // Social Media actions
  setSocialActivity: (activity) => set({ socialActivity: activity }),

  addSocialActivity: (activity) =>
    set((state) => ({
      socialActivity: [activity, ...state.socialActivity],
    })),

  setLoadingSocialActivity: (loading) =>
    set({ isLoadingSocialActivity: loading }),

  // Summary action
  setSummary: (summary) => set({ summary }),

  // Computed values
  getPersonById: (personId) => {
    const state = get();
    return state.people.find((p) => p.id === personId) || null;
  },

  getInteractionsByPerson: (personId) => {
    const state = get();
    return state.interactions.filter((i) => i.personId === personId);
  },

  getInsightsByPerson: (personId) => {
    const state = get();
    return state.insights.filter(
      (i) => i.personId === personId && !i.isDismissed
    );
  },

  getSocialActivityByPerson: (personId) => {
    const state = get();
    return state.socialActivity.filter((a) => a.personId === personId);
  },

  getTopContacts: (limit = 10) => {
    const state = get();
    return [...state.people]
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .slice(0, limit);
  },

  getInteractionTrends: (days = 30) => {
    const state = get();
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    const trendMap = new Map<string, Map<string, number>>();

    state.interactions
      .filter((i) => i.interactionDate >= startDate)
      .forEach((interaction) => {
        const dateKey = interaction.interactionDate.toISOString().split('T')[0];
        const type = interaction.interactionType;

        if (!trendMap.has(dateKey)) {
          trendMap.set(dateKey, new Map());
        }

        const dayMap = trendMap.get(dateKey)!;
        dayMap.set(type, (dayMap.get(type) || 0) + 1);
      });

    const trends: InteractionTrend[] = [];

    Array.from(trendMap.entries()).forEach(([dateKey, typeMap]) => {
      Array.from(typeMap.entries()).forEach(([type, count]) => {
        trends.push({
          date: new Date(dateKey),
          count,
          type,
        });
      });
    });

    return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  getRelationshipHealth: () => {
    const state = get();
    const today = new Date();

    return state.people
      .filter((person) => person.totalInteractions > 0)
      .map((person) => {
        const lastContactDate = person.lastContactDate || new Date(0);
        const daysSince = Math.floor(
          (today.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        let trend: 'improving' | 'stable' | 'declining';
        let recommendation: string;

        if (daysSince <= 7) {
          trend = 'improving';
          recommendation = 'Great! Keep up the regular contact.';
        } else if (daysSince <= 30) {
          trend = 'stable';
          recommendation = 'Consider reaching out soon.';
        } else {
          trend = 'declining';
          recommendation = 'It\'s been a while - reach out today!';
        }

        return {
          personId: person.id,
          personName: person.fullName,
          score: person.relationshipScore,
          trend,
          lastInteraction: lastContactDate,
          daysSinceLastContact: daysSince,
          recommendation,
        };
      })
      .sort((a, b) => b.score - a.score);
  },
}));

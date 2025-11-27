// Last Modified: 2025-11-23 17:30
// People Analytics Types for BollaLabz

export interface PersonExtended {
  id: string;
  contactId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  profileImageUrl?: string;
  bio?: string;
  interests?: string[];
  tags?: string[];
  relationshipScore: number; // 0-100
  lastContactDate?: Date;
  contactFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
  totalInteractions: number;
  dataEnrichedAt?: Date;
  enrichmentSource?: 'firecrawl' | 'manual' | 'api' | 'social';
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionAnalytic {
  id: string;
  personId: string;
  interactionDate: Date;
  interactionType: 'call' | 'sms' | 'email' | 'meeting' | 'social' | 'other';
  durationSeconds?: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics?: string[];
  notes?: string;
  createdAt: Date;
}

export interface RelationshipInsight {
  id: string;
  personId: string;
  insightType: 'recommendation' | 'warning' | 'opportunity' | 'milestone';
  insightText: string;
  confidenceScore: number; // 0-100
  isDismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface SocialMediaActivity {
  id: string;
  personId: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'other';
  activityType: 'post' | 'like' | 'comment' | 'share' | 'mention';
  activityUrl?: string;
  contentPreview?: string;
  activityDate: Date;
  createdAt: Date;
}

// Analytics Dashboard Data
export interface InteractionTrend {
  date: Date;
  count: number;
  type: string;
}

export interface RelationshipHealthMetric {
  personId: string;
  personName: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  lastInteraction: Date;
  daysSinceLastContact: number;
  recommendation: string;
}

export interface NetworkGraphNode {
  id: string;
  name: string;
  group: string; // category or industry
  size: number; // interaction count
  color: string;
}

export interface NetworkGraphLink {
  source: string;
  target: string;
  value: number; // strength of connection
}

export interface NetworkGraphData {
  nodes: NetworkGraphNode[];
  links: NetworkGraphLink[];
}

// Firecrawl Enrichment Types
export interface LinkedInProfile {
  name: string;
  headline?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  about?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string[];
  profileUrl: string;
  imageUrl?: string;
}

export interface ExperienceItem {
  company: string;
  title: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  location?: string;
}

export interface EducationItem {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CompanyInfo {
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  size?: string;
  founded?: number;
  location?: string;
  website?: string;
  logoUrl?: string;
}

export interface EnrichedPersonData {
  name: string;
  email?: string;
  phone?: string;
  company?: CompanyInfo;
  linkedinProfile?: LinkedInProfile;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  webPresence?: WebMention[];
}

export interface WebMention {
  url: string;
  title: string;
  snippet: string;
  date?: Date;
  source: string;
}

// Communication Insights
export interface CommunicationPattern {
  personId: string;
  preferredChannel: 'call' | 'sms' | 'email' | 'meeting';
  averageResponseTime: number; // minutes
  bestTimeToContact: string; // e.g., "weekday mornings"
  communicationFrequency: number; // interactions per month
  engagementScore: number; // 0-100
}

// Analytics Aggregations
export interface TopContact {
  personId: string;
  personName: string;
  interactionCount: number;
  lastInteraction: Date;
  relationshipScore: number;
}

export interface InteractionSummary {
  totalInteractions: number;
  byType: Record<string, number>;
  bySentiment: Record<string, number>;
  averageDuration: number;
  topContacts: TopContact[];
}

export interface PeopleAnalyticsSummary {
  totalContacts: number;
  activeContacts: number; // contacted in last 30 days
  averageRelationshipScore: number;
  totalInteractions: number;
  interactionTrends: InteractionTrend[];
  topRelationships: RelationshipHealthMetric[];
  communicationPatterns: CommunicationPattern[];
}

// Last Modified: 2025-11-23 17:30
import { api } from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/backend';
import type { PersonExtended, InteractionAnalytic } from '@/types/people-analytics';

// Backend API request/response types
export interface BackendPerson {
  id: string;
  contact_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  industry?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  website_url?: string;
  profile_image_url?: string;
  bio?: string;
  interests?: string[];
  tags?: string[];
  relationship_score: number;
  last_contact_date?: string;
  contact_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
  total_interactions: number;
  data_enriched_at?: string;
  enrichment_source?: 'firecrawl' | 'manual' | 'api' | 'social';
  created_at: string;
  updated_at: string;
}

export interface BackendInteraction {
  id: string;
  person_id: string;
  interaction_date: string;
  interaction_type: 'call' | 'sms' | 'email' | 'meeting' | 'social' | 'other';
  duration_seconds?: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics?: string[];
  notes?: string;
  created_at: string;
}

export interface CreatePersonDTO {
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
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
}

export interface UpdatePersonDTO {
  fullName?: string;
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
  relationshipScore?: number;
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
}

export interface CreateInteractionDTO {
  personId: string;
  interactionType: 'call' | 'sms' | 'email' | 'meeting' | 'social' | 'other';
  interactionDate?: string;
  durationSeconds?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics?: string[];
  notes?: string;
}

export interface PeopleFilters {
  search?: string;
  tags?: string[];
  industry?: string;
  minRelationshipScore?: number;
  maxRelationshipScore?: number;
  contactFrequency?: string[];
  page?: number;
  limit?: number;
}

// Field name mapping helpers
const mapBackendPersonToFrontend = (backendPerson: BackendPerson): PersonExtended => ({
  id: backendPerson.id,
  contactId: backendPerson.contact_id,
  fullName: backendPerson.full_name,
  email: backendPerson.email,
  phone: backendPerson.phone,
  company: backendPerson.company,
  jobTitle: backendPerson.job_title,
  industry: backendPerson.industry,
  locationCity: backendPerson.location_city,
  locationState: backendPerson.location_state,
  locationCountry: backendPerson.location_country,
  linkedinUrl: backendPerson.linkedin_url,
  twitterUrl: backendPerson.twitter_url,
  facebookUrl: backendPerson.facebook_url,
  instagramUrl: backendPerson.instagram_url,
  websiteUrl: backendPerson.website_url,
  profileImageUrl: backendPerson.profile_image_url,
  bio: backendPerson.bio,
  interests: backendPerson.interests,
  tags: backendPerson.tags,
  relationshipScore: backendPerson.relationship_score,
  lastContactDate: backendPerson.last_contact_date ? new Date(backendPerson.last_contact_date) : undefined,
  contactFrequency: backendPerson.contact_frequency,
  totalInteractions: backendPerson.total_interactions,
  dataEnrichedAt: backendPerson.data_enriched_at ? new Date(backendPerson.data_enriched_at) : undefined,
  enrichmentSource: backendPerson.enrichment_source,
  createdAt: new Date(backendPerson.created_at),
  updatedAt: new Date(backendPerson.updated_at),
});

const mapBackendInteractionToFrontend = (backendInteraction: BackendInteraction): InteractionAnalytic => ({
  id: backendInteraction.id,
  personId: backendInteraction.person_id,
  interactionDate: new Date(backendInteraction.interaction_date),
  interactionType: backendInteraction.interaction_type,
  durationSeconds: backendInteraction.duration_seconds,
  sentiment: backendInteraction.sentiment,
  topics: backendInteraction.topics,
  notes: backendInteraction.notes,
  createdAt: new Date(backendInteraction.created_at),
});

const mapFrontendPersonToBackend = (person: CreatePersonDTO | UpdatePersonDTO): Record<string, any> => {
  const mapped: Record<string, any> = {};

  if ('fullName' in person && person.fullName !== undefined) mapped.full_name = person.fullName;
  if ('email' in person && person.email !== undefined) mapped.email = person.email;
  if ('phone' in person && person.phone !== undefined) mapped.phone = person.phone;
  if ('company' in person && person.company !== undefined) mapped.company = person.company;
  if ('jobTitle' in person && person.jobTitle !== undefined) mapped.job_title = person.jobTitle;
  if ('industry' in person && person.industry !== undefined) mapped.industry = person.industry;
  if ('locationCity' in person && person.locationCity !== undefined) mapped.location_city = person.locationCity;
  if ('locationState' in person && person.locationState !== undefined) mapped.location_state = person.locationState;
  if ('locationCountry' in person && person.locationCountry !== undefined) mapped.location_country = person.locationCountry;
  if ('linkedinUrl' in person && person.linkedinUrl !== undefined) mapped.linkedin_url = person.linkedinUrl;
  if ('twitterUrl' in person && person.twitterUrl !== undefined) mapped.twitter_url = person.twitterUrl;
  if ('facebookUrl' in person && person.facebookUrl !== undefined) mapped.facebook_url = person.facebookUrl;
  if ('instagramUrl' in person && person.instagramUrl !== undefined) mapped.instagram_url = person.instagramUrl;
  if ('websiteUrl' in person && person.websiteUrl !== undefined) mapped.website_url = person.websiteUrl;
  if ('profileImageUrl' in person && person.profileImageUrl !== undefined) mapped.profile_image_url = person.profileImageUrl;
  if ('bio' in person && person.bio !== undefined) mapped.bio = person.bio;
  if ('interests' in person && person.interests !== undefined) mapped.interests = person.interests;
  if ('tags' in person && person.tags !== undefined) mapped.tags = person.tags;
  if ('relationshipScore' in person && person.relationshipScore !== undefined) mapped.relationship_score = person.relationshipScore;
  if ('contactFrequency' in person && person.contactFrequency !== undefined) mapped.contact_frequency = person.contactFrequency;

  return mapped;
};

class PeopleService {
  private baseUrl = '/people';

  /**
   * Fetch all people with optional filters
   */
  async getPeople(filters?: PeopleFilters): Promise<PersonExtended[]> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (filters.industry) params.industry = filters.industry;
      if (filters.minRelationshipScore !== undefined) params.min_relationship_score = filters.minRelationshipScore;
      if (filters.maxRelationshipScore !== undefined) params.max_relationship_score = filters.maxRelationshipScore;
      if (filters.contactFrequency && filters.contactFrequency.length > 0) params.contact_frequency = filters.contactFrequency.join(',');
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
    }

    const response = await api.get<ApiResponse<BackendPerson[]>>(this.baseUrl, { params });

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch people');
    }

    return response.data.map(mapBackendPersonToFrontend);
  }

  /**
   * Fetch a single person by ID
   */
  async getPersonById(id: string): Promise<PersonExtended> {
    const response = await api.get<ApiResponse<BackendPerson>>(`${this.baseUrl}/${id}`);

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch person');
    }

    return mapBackendPersonToFrontend(response.data);
  }

  /**
   * Create a new person
   */
  async createPerson(data: CreatePersonDTO): Promise<PersonExtended> {
    const backendData = mapFrontendPersonToBackend(data);
    const response = await api.post<ApiResponse<BackendPerson>>(this.baseUrl, backendData);

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to create person');
    }

    return mapBackendPersonToFrontend(response.data);
  }

  /**
   * Update a person
   */
  async updatePerson(id: string, data: UpdatePersonDTO): Promise<PersonExtended> {
    const backendData = mapFrontendPersonToBackend(data);
    const response = await api.put<ApiResponse<BackendPerson>>(`${this.baseUrl}/${id}`, backendData);

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to update person');
    }

    return mapBackendPersonToFrontend(response.data);
  }

  /**
   * Delete a person
   */
  async deletePerson(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);

    if (!response.success) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to delete person');
    }
  }

  /**
   * Get interactions for a person
   */
  async getInteractions(personId: string): Promise<InteractionAnalytic[]> {
    const response = await api.get<ApiResponse<BackendInteraction[]>>(`${this.baseUrl}/${personId}/interactions`);

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch interactions');
    }

    return response.data.map(mapBackendInteractionToFrontend);
  }

  /**
   * Create a new interaction
   */
  async createInteraction(data: CreateInteractionDTO): Promise<InteractionAnalytic> {
    const backendData = {
      person_id: data.personId,
      interaction_type: data.interactionType,
      interaction_date: data.interactionDate || new Date().toISOString(),
      duration_seconds: data.durationSeconds,
      sentiment: data.sentiment || 'neutral',
      topics: data.topics,
      notes: data.notes,
    };

    const response = await api.post<ApiResponse<BackendInteraction>>(
      `/interactions`,
      backendData
    );

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to create interaction');
    }

    return mapBackendInteractionToFrontend(response.data);
  }

  /**
   * Update relationship score
   */
  async updateRelationshipScore(id: string, score: number): Promise<PersonExtended> {
    return this.updatePerson(id, { relationshipScore: score });
  }

  /**
   * Enrich person data using external service (e.g., Firecrawl)
   */
  async enrichPersonData(id: string): Promise<PersonExtended> {
    const response = await api.post<ApiResponse<BackendPerson>>(`${this.baseUrl}/${id}/enrich`);

    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to enrich person data');
    }

    return mapBackendPersonToFrontend(response.data);
  }
}

export const peopleService = new PeopleService();
export default peopleService;

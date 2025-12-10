import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PhoneRecord,
  CallStatus,
  Transcript,
  PaginatedResponse,
  SearchParams,
} from "@repo/types";

// API base URL - in production this would come from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Extended search params for phone records
interface PhoneRecordSearchParams extends SearchParams {
  direction?: "inbound" | "outbound";
  status?: CallStatus;
  contactId?: string;
  dateAfter?: string;
  dateBefore?: string;
}

// Query keys
export const phoneRecordKeys = {
  all: ["phoneRecords"] as const,
  lists: () => [...phoneRecordKeys.all, "list"] as const,
  list: (params: PhoneRecordSearchParams) => [...phoneRecordKeys.lists(), params] as const,
  details: () => [...phoneRecordKeys.all, "detail"] as const,
  detail: (id: string) => [...phoneRecordKeys.details(), id] as const,
  recent: () => [...phoneRecordKeys.all, "recent"] as const,
  transcript: (id: string) => [...phoneRecordKeys.all, "transcript", id] as const,
};

// API functions
async function fetchPhoneRecords(
  params: PhoneRecordSearchParams
): Promise<PaginatedResponse<PhoneRecord>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.q) searchParams.set("q", params.q);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.direction) searchParams.set("direction", params.direction);
  if (params.status) searchParams.set("status", params.status);
  if (params.contactId) searchParams.set("contactId", params.contactId);
  if (params.dateAfter) searchParams.set("dateAfter", params.dateAfter);
  if (params.dateBefore) searchParams.set("dateBefore", params.dateBefore);

  const response = await fetch(`${API_BASE_URL}/phone-records?${searchParams}`);
  if (!response.ok) {
    throw new Error("Failed to fetch phone records");
  }
  return response.json();
}

async function fetchPhoneRecord(id: string): Promise<PhoneRecord> {
  const response = await fetch(`${API_BASE_URL}/phone-records/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch phone record");
  }
  return response.json();
}

async function fetchRecentCalls(limit = 5): Promise<PhoneRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}/phone-records?sortBy=startTime&sortOrder=desc&pageSize=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch recent calls");
  }
  const data: PaginatedResponse<PhoneRecord> = await response.json();
  return data.items;
}

async function fetchTranscript(id: string): Promise<Transcript> {
  const response = await fetch(`${API_BASE_URL}/phone-records/${id}/transcript`);
  if (!response.ok) {
    throw new Error("Failed to fetch transcript");
  }
  return response.json();
}

async function initiateCall(phoneNumber: string, contactId?: string): Promise<PhoneRecord> {
  const response = await fetch(`${API_BASE_URL}/phone-records/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, contactId }),
  });
  if (!response.ok) {
    throw new Error("Failed to initiate call");
  }
  return response.json();
}

async function deletePhoneRecord(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/phone-records/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete phone record");
  }
}

// Query hooks

/**
 * Fetch paginated list of phone records with search and filtering
 */
export function usePhoneRecords(params: PhoneRecordSearchParams = {}) {
  return useQuery({
    queryKey: phoneRecordKeys.list(params),
    queryFn: () => fetchPhoneRecords(params),
  });
}

/**
 * Fetch a single phone record by ID
 */
export function usePhoneRecord(id: string) {
  return useQuery({
    queryKey: phoneRecordKeys.detail(id),
    queryFn: () => fetchPhoneRecord(id),
    enabled: !!id,
  });
}

/**
 * Fetch recent calls (for dashboard widget)
 */
export function useRecentCalls(limit = 5) {
  return useQuery({
    queryKey: phoneRecordKeys.recent(),
    queryFn: () => fetchRecentCalls(limit),
  });
}

/**
 * Fetch transcript for a phone record
 */
export function useTranscript(id: string) {
  return useQuery({
    queryKey: phoneRecordKeys.transcript(id),
    queryFn: () => fetchTranscript(id),
    enabled: !!id,
  });
}

/**
 * Fetch calls for a specific contact
 */
export function useContactCalls(contactId: string) {
  return useQuery({
    queryKey: phoneRecordKeys.list({ contactId }),
    queryFn: () => fetchPhoneRecords({ contactId, sortBy: "startTime", sortOrder: "desc" }),
    enabled: !!contactId,
  });
}

// Mutation hooks

/**
 * Initiate a new phone call
 */
export function useInitiateCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phoneNumber, contactId }: { phoneNumber: string; contactId?: string }) =>
      initiateCall(phoneNumber, contactId),
    onSuccess: () => {
      // Invalidate phone record lists to refetch
      queryClient.invalidateQueries({ queryKey: phoneRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: phoneRecordKeys.recent() });
    },
  });
}

/**
 * Delete a phone record
 */
export function useDeletePhoneRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePhoneRecord,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: phoneRecordKeys.detail(id) });
      queryClient.removeQueries({ queryKey: phoneRecordKeys.transcript(id) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: phoneRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: phoneRecordKeys.recent() });
    },
  });
}

// Utility functions

/**
 * Prefetch a phone record for better UX
 */
export function usePrefetchPhoneRecord() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: phoneRecordKeys.detail(id),
      queryFn: () => fetchPhoneRecord(id),
    });
  };
}

/**
 * Prefetch transcript for better UX
 */
export function usePrefetchTranscript() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: phoneRecordKeys.transcript(id),
      queryFn: () => fetchTranscript(id),
    });
  };
}

// Call statistics hook
interface CallStats {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  totalDuration: number;
  averageDuration: number;
}

export function useCallStats(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: [...phoneRecordKeys.all, "stats", dateRange] as const,
    queryFn: async (): Promise<CallStats> => {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set("dateAfter", dateRange.start);
      if (dateRange?.end) params.set("dateBefore", dateRange.end);

      const response = await fetch(`${API_BASE_URL}/phone-records/stats?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch call stats");
      }
      return response.json();
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import type {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  PaginatedResponse,
  SearchParams,
} from "@repo/types";
import { buildQueryString } from "../lib/api-client";

// API base URL - in production this would come from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Query keys
export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  list: (params: SearchParams) => [...contactKeys.lists(), params] as const,
  details: () => [...contactKeys.all, "detail"] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
  recent: () => [...contactKeys.all, "recent"] as const,
};

// API functions with authentication
async function fetchContacts(
  token: string | null,
  params: SearchParams
): Promise<PaginatedResponse<Contact>> {
  if (!token) throw new Error("Authentication required");

  const queryString = buildQueryString(params);
  const response = await fetch(`${API_BASE_URL}/contacts${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch contacts");
  }
  return response.json();
}

async function fetchContact(token: string | null, id: string): Promise<Contact> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch contact");
  }
  return response.json();
}

async function fetchRecentContacts(token: string | null, limit = 5): Promise<Contact[]> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_BASE_URL}/contacts?sortBy=lastInteraction&sortOrder=desc&pageSize=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch recent contacts");
  }
  const data: PaginatedResponse<Contact> = await response.json();
  return data.items;
}

async function createContact(
  token: string | null,
  input: CreateContactInput
): Promise<Contact> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create contact");
  }
  return response.json();
}

async function updateContact(
  token: string | null,
  input: UpdateContactInput
): Promise<Contact> {
  if (!token) throw new Error("Authentication required");

  const { id, ...data } = input;
  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update contact");
  }
  return response.json();
}

async function deleteContact(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete contact");
  }
}

// Query hooks

/**
 * Fetch paginated list of contacts with search and filtering
 */
export function useContacts(params: SearchParams = {}) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: async () => {
      const token = await getToken();
      return fetchContacts(token, params);
    },
  });
}

/**
 * Fetch a single contact by ID
 */
export function useContact(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      const token = await getToken();
      return fetchContact(token, id);
    },
    enabled: !!id,
  });
}

/**
 * Fetch recent contacts (for dashboard widget)
 */
export function useRecentContacts(limit = 5) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: contactKeys.recent(),
    queryFn: async () => {
      const token = await getToken();
      return fetchRecentContacts(token, limit);
    },
  });
}

// Mutation hooks

/**
 * Create a new contact
 */
export function useCreateContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const token = await getToken();
      return createContact(token, input);
    },
    onSuccess: () => {
      // Invalidate contact lists to refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.recent() });
    },
  });
}

/**
 * Update an existing contact
 */
export function useUpdateContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const token = await getToken();
      return updateContact(token, input);
    },
    onSuccess: (data) => {
      // Update the specific contact in cache
      queryClient.setQueryData(contactKeys.detail(data.id), data);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.recent() });
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return deleteContact(token, id);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contactKeys.detail(id) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.recent() });
    },
  });
}

// Utility functions

/**
 * Prefetch a contact for better UX
 */
export function usePrefetchContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: contactKeys.detail(id),
      queryFn: async () => {
        const token = await getToken();
        return fetchContact(token, id);
      },
    });
  };
}

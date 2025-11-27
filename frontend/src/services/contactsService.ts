// Last Modified: 2025-11-23 17:30
import { apiClient } from '@/lib/api/client';

export interface Contact {
  id: number;
  phone_number: string;
  contact_name: string;
  contact_email?: string;
  conversation_count: number;
  last_contact_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactDTO {
  phoneNumber: string;
  contactName: string;
  contactEmail?: string;
  notes?: string;
}

export interface UpdateContactDTO {
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

export interface ContactsResponse {
  success: boolean;
  data: Contact[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleContactResponse {
  success: boolean;
  data: Contact;
}

class ContactsService {
  private baseUrl = '/v1/contacts';

  async getAll(): Promise<Contact[]> {
    const response = await apiClient.get<ContactsResponse>(this.baseUrl);
    return response.data.data;
  }

  async getById(id: number): Promise<Contact> {
    const response = await apiClient.get<SingleContactResponse>(
      `${this.baseUrl}/${id}`
    );
    return response.data.data;
  }

  async create(data: CreateContactDTO): Promise<Contact> {
    const response = await apiClient.post<SingleContactResponse>(
      this.baseUrl,
      {
        phone_number: data.phoneNumber,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        notes: data.notes,
      }
    );
    return response.data.data;
  }

  async update(id: number, data: UpdateContactDTO): Promise<Contact> {
    const response = await apiClient.put<SingleContactResponse>(
      `${this.baseUrl}/${id}`,
      {
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        notes: data.notes,
      }
    );
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async search(query: string): Promise<Contact[]> {
    const response = await apiClient.get<ContactsResponse>(this.baseUrl, {
      params: { search: query },
    });
    return response.data.data;
  }
}

export const contactsService = new ContactsService();
export default contactsService;

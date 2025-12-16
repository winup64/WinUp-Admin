import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';

export type TestimonialType = 'testimonial' | 'winner';

export interface TestimonialDTO {
  id: string;
  name: string;
  content: string;
  type: TestimonialType;
  is_verified: boolean;
  image_url?: string | null;
  prize?: string | null;
  date?: string | null;
}

export interface ListTestimonialsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TestimonialType;
  is_verified?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrUpdateTestimonialPayload {
  name: string;
  content: string;
  type: TestimonialType;
  is_verified: boolean;
  image_url?: string;
  prize?: string;
  date?: string;
}

export async function listTestimonials(params: ListTestimonialsParams = {}) {
  const response = await apiClient.get<PaginatedResponse<TestimonialDTO>>(
    API_ENDPOINTS.TESTIMONIALS_ADMIN.LIST,
    { params }
  );
  return response.data;
}

export async function getTestimonialById(id: string) {
  const response = await apiClient.get<{ data: TestimonialDTO }>(
    `${API_ENDPOINTS.TESTIMONIALS_ADMIN.GET}/${id}`
  );
  return response.data.data;
}

export async function createTestimonial(payload: CreateOrUpdateTestimonialPayload) {
  const response = await apiClient.post<{ data: TestimonialDTO }>(
    API_ENDPOINTS.TESTIMONIALS_ADMIN.CREATE,
    payload
  );
  return response.data.data;
}

export async function updateTestimonial(id: string, payload: CreateOrUpdateTestimonialPayload) {
  const response = await apiClient.patch<{ data: TestimonialDTO }>(
    `${API_ENDPOINTS.TESTIMONIALS_ADMIN.UPDATE}/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteTestimonial(id: string) {
  const response = await apiClient.delete(
    `${API_ENDPOINTS.TESTIMONIALS_ADMIN.DELETE}/${id}`
  );
  return response.data;
}



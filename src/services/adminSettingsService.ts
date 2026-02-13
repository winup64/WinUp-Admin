import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from '../types/api';

export interface AdminSettings {
  setting_id: string;
  admin_name: string;
  admin_phone?: string;
  admin_email?: string;
  admin_whatsapp?: string;
  business_hours?: string;
  demo_trial_days?: number;
  maintenance_mode?: boolean;
  created_at: string;
  updated_at: string;
}

export type UpdateAdminSettingsRequest = Partial<Pick<AdminSettings,
  'admin_name' | 'admin_phone' | 'admin_email' | 'admin_whatsapp' | 'business_hours' | 'demo_trial_days' | 'maintenance_mode'
>> & { admin_name: string };

export async function getAdminSettings(): Promise<AdminSettings | null> {
  const resp = await apiClient.get<ApiResponse<AdminSettings>>(API_ENDPOINTS.ADMIN_SETTINGS);
  return resp.data?.data ?? null;
}

export async function updateAdminSettings(data: UpdateAdminSettingsRequest): Promise<AdminSettings> {
  const resp = await apiClient.put<ApiResponse<AdminSettings>>(API_ENDPOINTS.ADMIN_SETTINGS, data);
  const result = resp.data?.data;
  if (!result) {
    throw new Error('Respuesta inválida del servidor al actualizar configuración');
  }
  return result;
}



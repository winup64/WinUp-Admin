import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';

// Interfaces para la API de Premios
export interface Reward {
  reward_id: string;
  name: string;
  description: string;
  points_required: number;
  stock: number;
  endDate?: string; // Campo para UI (mapeado desde expiration_date)
  expiration_date?: string | null; // Campo de la API
  status: 'ACTIVE' | 'INACTIVE';
  reward_type: 'digital' | 'fisico' | 'puntos' | 'descuento';
  url_image?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface RewardsListResponse {
  status: number;
  message: string;
  data: Reward[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface RewardsListParams {
  page?: number;
  limit?: number;
  reward_type?: 'fisico' | 'digital' | 'puntos' | 'descuento';
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
}

export interface CreateRewardData {
  name: string;
  description: string;
  points_required: number;
  stock: number;
  reward_type: 'digital' | 'fisico' | 'puntos' | 'descuento';
  url_image?: string;
  status: 'ACTIVE' | 'INACTIVE';
  is_active: boolean;
  expiration_date?: string | null; // Acepta string, null o undefined
}

export interface UpdateRewardData extends Partial<CreateRewardData> {
  reward_id?: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

// Interfaces para Canjes (Redemptions)
export interface Redemption {
  redemption_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  reward_id: string;
  reward_name: string;
  reward_type: 'digital' | 'fisico' | 'puntos' | 'descuento';
  points_spent: number;
  unique_code: string;
  status: 'pending' | 'processing' | 'delivered' | 'used' | 'cancelled';
  redemption_date: string;
  delivery_date?: string | null;
  delivery_instructions?: string | null;
  internal_note?: string | null;
  cancellation_reason?: string | null;
  cancellation_message?: string | null;
  expiration_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RedemptionStats {
  pending: number;
  processing: number;
  delivered: number;
  cancelled: number;
  total: number;
  today_redeemed: number;
  average_processing_time_hours: number;
}

export interface RedemptionsListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'delivered' | 'used' | 'cancelled';
  reward_type?: 'fisico' | 'digital' | 'puntos' | 'descuento';
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface RedemptionsListResponse {
  status: number;
  message: string;
  data: Redemption[];
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    total_items: number;
  };
  timestamp: string;
}

class RewardsService {
  // Obtener lista de premios
  static async getRewardsList(params: RewardsListParams = {}): Promise<RewardsListResponse> {
    try {
      // 1) Intento principal (endpoint configurado)
      const primaryResp = await apiClient.get(
        API_ENDPOINTS.REWARDS_ADMIN?.LIST || '/rewards-admin/rewards',
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 6,
            reward_type: params.reward_type,
            status: params.status,
            search: params.search,
          },
        }
      );
      return RewardsService.normalizeRewardsListResponse(primaryResp.data, params);
    } catch (error: any) {
      // Si es 404, probar rutas alternativas conocidas
      if (error?.response?.status === 404) {
        try {
          // 2) Alternativa admin sin sufijo /rewards
          const altAdminResp = await apiClient.get('/rewards-admin', {
            params: {
              page: params.page || 1,
              limit: params.limit || 6,
              reward_type: params.reward_type,
              status: params.status,
              search: params.search,
            },
          });
          return RewardsService.normalizeRewardsListResponse(altAdminResp.data, params);
        } catch (altErr: any) {
          if (altErr?.response?.status === 404) {
            try {
              // 3) Fallback a endpoint público /rewards
              const publicResp = await apiClient.get(API_ENDPOINTS.REWARDS || '/rewards', {
                params: {
                  page: params.page || 1,
                  limit: params.limit || 6,
                  reward_type: params.reward_type,
                  status: params.status,
                  search: params.search,
                },
              });
              return RewardsService.normalizeRewardsListResponse(publicResp.data, params);
            } catch (publicErr) {
              throw publicErr;
            }
          }
          throw altErr;
        }
      }
      throw error;
    }
  }

  // Mapear un premio individual de la API al formato de UI
  private static mapRewardFromAPI(apiReward: any): Reward {
    return {
      reward_id: apiReward.reward_id,
      name: apiReward.name,
      description: apiReward.description,
      points_required: apiReward.points_required,
      stock: apiReward.stock,
      endDate: apiReward.expiration_date || undefined, // Sin conversión, tal cual viene de la API
      expiration_date: apiReward.expiration_date,
      status: apiReward.status,
      reward_type: apiReward.reward_type,
      url_image: apiReward.url_image,
      is_active: apiReward.is_active,
      created_at: apiReward.created_at,
      updated_at: apiReward.updated_at,
      deleted_at: apiReward.deleted_at,
    };
  }

  // Normalización tolerante de respuesta de lista
  private static normalizeRewardsListResponse(raw: any, params: RewardsListParams): RewardsListResponse {
    // Caso ya normalizado
    if (raw && Array.isArray(raw.data) && typeof raw.total === 'number' && raw.pagination) {
      // Mapear cada premio
      const mappedData = raw.data.map((r: any) => RewardsService.mapRewardFromAPI(r));
      return {
        ...raw,
        data: mappedData,
      } as RewardsListResponse;
    }

    // Caso anidado en data
    if (raw && raw.data && Array.isArray(raw.data.data)) {
      const mappedData = raw.data.data.map((r: any) => RewardsService.mapRewardFromAPI(r));
      return {
        status: typeof raw.status === 'number' ? raw.status : 200,
        message: raw.message || '',
        data: mappedData,
        total: Number(raw.data.total ?? raw.total ?? raw.data.count ?? (raw.data.data?.length || 0)),
        pagination: {
          page: Number(raw.data.pagination?.page ?? params.page ?? 1),
          limit: Number(raw.data.pagination?.limit ?? params.limit ?? 6),
          totalPages: Number(raw.data.pagination?.totalPages ?? raw.data.totalPages ?? 1),
        },
        timestamp: raw.timestamp || new Date().toISOString(),
      };
    }

    // Caso arreglo simple
    if (Array.isArray(raw)) {
      const mappedData = raw.map((r: any) => RewardsService.mapRewardFromAPI(r));
      return {
        status: 200,
        message: '',
        data: mappedData,
        total: raw.length,
        pagination: {
          page: params.page || 1,
          limit: params.limit || (raw.length || 6),
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Caso objeto con data y total sueltos
    if (raw && raw.data && Array.isArray(raw.data)) {
      const mappedData = raw.data.map((r: any) => RewardsService.mapRewardFromAPI(r));
      const total = Number(raw.total ?? raw.count ?? raw.data.length);
      const limit = Number((raw.pagination && raw.pagination.limit) ?? params.limit ?? 6);
      const page = Number((raw.pagination && raw.pagination.page) ?? params.page ?? 1);
      const totalPages = Number((raw.pagination && raw.pagination.totalPages) ?? Math.max(1, Math.ceil(total / (limit || 1))));
      return {
        status: typeof raw.status === 'number' ? raw.status : 200,
        message: raw.message || '',
        data: mappedData,
        total,
        pagination: { page, limit, totalPages },
        timestamp: raw.timestamp || new Date().toISOString(),
      };
    }

    // Último recurso: intentar mapear propiedades conocidas
    const rawData = (raw?.data as any[]) || [];
    const mappedData = Array.isArray(rawData) 
      ? rawData.map((r: any) => RewardsService.mapRewardFromAPI(r))
      : [];
    
    return {
      status: typeof raw?.status === 'number' ? raw.status : 200,
      message: raw?.message || '',
      data: mappedData,
      total: Number(raw?.total ?? raw?.count ?? (Array.isArray(raw?.data) ? raw.data.length : 0)),
      pagination: {
        page: Number(raw?.pagination?.page ?? params.page ?? 1),
        limit: Number(raw?.pagination?.limit ?? params.limit ?? 6),
        totalPages: Number(raw?.pagination?.totalPages ?? 1),
      },
      timestamp: raw?.timestamp || new Date().toISOString(),
    };
  }

  // Obtener premio por ID
  static async getRewardById(rewardId: string): Promise<ApiResponse<Reward>> {
    try {
      const response = await apiClient.get<ApiResponse<Reward>>(
        `${API_ENDPOINTS.REWARDS_ADMIN?.LIST || '/rewards-admin/rewards'}/${rewardId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Crear nuevo premio
  static async createReward(rewardData: CreateRewardData | FormData): Promise<ApiResponse<Reward>> {
    try {
      const url = API_ENDPOINTS.REWARDS_ADMIN?.CREATE || '/rewards-admin/rewards';
      const isForm = typeof FormData !== 'undefined' && rewardData instanceof FormData;
      const response = await apiClient.post<ApiResponse<Reward>>(url, rewardData as any, isForm ? undefined : { headers: { 'Content-Type': 'application/json' } });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Actualizar premio
  static async updateReward(rewardId: string, rewardData: UpdateRewardData | FormData): Promise<ApiResponse<Reward>> {
    try {
      const url = `${API_ENDPOINTS.REWARDS_ADMIN?.UPDATE || '/rewards-admin/reward/update'}/${rewardId}`;
      const isForm = typeof FormData !== 'undefined' && rewardData instanceof FormData;
      const response = await apiClient.patch<ApiResponse<Reward>>(url, rewardData as any, isForm ? undefined : { headers: { 'Content-Type': 'application/json' } });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Eliminar premio
  static async deleteReward(rewardId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `${API_ENDPOINTS.REWARDS_ADMIN?.DELETE || '/rewards-admin/reward/delete'}/${rewardId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // ===== MÉTODOS PARA CANJES (REDEMPTIONS) =====

  // Obtener estadísticas de canjes
  static async getRedemptionStats(): Promise<ApiResponse<RedemptionStats>> {
    try {
      const response = await apiClient.get<ApiResponse<RedemptionStats>>(
        '/user-rewards-admin/dashboard/stats'
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Mapear un canje individual de la API al formato de UI
  private static mapRedemptionFromAPI(apiRedemption: any): Redemption {
    return {
      redemption_id: apiRedemption.user_reward_id,
      user_id: apiRedemption.user_id,
      user_name: apiRedemption.user_full_name || `${apiRedemption.users?.first_name || ''} ${apiRedemption.users?.last_name || ''}`.trim() || apiRedemption.users?.username || 'Usuario',
      user_email: apiRedemption.users?.email || '',
      reward_id: apiRedemption.reward_id,
      reward_name: apiRedemption.rewards?.name || 'Premio',
      reward_type: apiRedemption.rewards?.reward_type || 'digital',
      points_spent: apiRedemption.points_used || 0,
      unique_code: apiRedemption.unique_code || '',
      status: apiRedemption.user_reward_status || 'pending',
      redemption_date: apiRedemption.awarded_at || '',
      delivery_date: apiRedemption.delivered_at || null,
      delivery_instructions: apiRedemption.delivery_instructions || null,
      internal_note: apiRedemption.admin_notes || null,
      cancellation_reason: apiRedemption.cancellation_reason || null,
      cancellation_message: null,
      expiration_date: null,
      created_at: apiRedemption.awarded_at,
      updated_at: apiRedemption.awarded_at,
    };
  }

  // Obtener lista de canjes con filtros
  static async getRedemptionsList(params: RedemptionsListParams = {}): Promise<RedemptionsListResponse> {
    try {
      const response = await apiClient.get('/user-rewards-admin/redeemed-rewards', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          status: params.status,
          reward_type: params.reward_type,
          start_date: params.start_date,
          end_date: params.end_date,
          search: params.search,
        },
      });

      // Normalizar y mapear respuesta
      return RewardsService.normalizeRedemptionsListResponse(response.data, params);
    } catch (error: any) {
      throw error;
    }
  }

  // Normalizar respuesta de lista de canjes
  private static normalizeRedemptionsListResponse(raw: any, params: RedemptionsListParams): RedemptionsListResponse {
    // Caso ya normalizado con data array
    if (raw && Array.isArray(raw.data) && raw.pagination) {
      const mappedData = raw.data.map((item: any) => RewardsService.mapRedemptionFromAPI(item));
      
      return {
        status: raw.status || 200,
        message: raw.message || '',
        data: mappedData,
        pagination: {
          page: Number(raw.pagination.page || params.page || 1),
          limit: Number(raw.pagination.limit || params.limit || 10),
          total_pages: Number(raw.pagination.total_pages || raw.pagination.totalPages || 1),
          total_items: Number(raw.pagination.total_items || raw.total || 0),
        },
        timestamp: raw.timestamp || new Date().toISOString(),
      };
    }

    // Caso anidado en data
    if (raw && raw.data && Array.isArray(raw.data.data)) {
      const mappedData = raw.data.data.map((item: any) => RewardsService.mapRedemptionFromAPI(item));
      
      return {
        status: raw.status || 200,
        message: raw.message || '',
        data: mappedData,
        pagination: {
          page: Number(raw.data.pagination?.page || params.page || 1),
          limit: Number(raw.data.pagination?.limit || params.limit || 10),
          total_pages: Number(raw.data.pagination?.total_pages || raw.data.pagination?.totalPages || 1),
          total_items: Number(raw.data.pagination?.total_items || raw.data.pagination?.total || 0),
        },
        timestamp: raw.timestamp || new Date().toISOString(),
      };
    }

    // Caso arreglo simple
    if (Array.isArray(raw)) {
      const mappedData = raw.map((item: any) => RewardsService.mapRedemptionFromAPI(item));
      
      return {
        status: 200,
        message: '',
        data: mappedData,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total_pages: 1,
          total_items: raw.length,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Fallback
    const rawData = Array.isArray(raw?.data) ? raw.data : [];
    const mappedData = rawData.map((item: any) => RewardsService.mapRedemptionFromAPI(item));
    
    return {
      status: raw?.status || 200,
      message: raw?.message || '',
      data: mappedData,
      pagination: {
        page: Number(raw?.pagination?.page || params.page || 1),
        limit: Number(raw?.pagination?.limit || params.limit || 10),
        total_pages: Number(raw?.pagination?.total_pages || raw?.pagination?.totalPages || 1),
        total_items: Number(raw?.pagination?.total_items || raw?.total || 0),
      },
      timestamp: raw?.timestamp || new Date().toISOString(),
    };
  }

  // Obtener detalles de un canje específico
  static async getRedemptionById(redemptionId: string): Promise<ApiResponse<Redemption>> {
    try {
      const response = await apiClient.get<ApiResponse<Redemption>>(
        `/user-rewards-admin/redeemed-reward/${redemptionId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Marcar canje como "en proceso"
  static async markRedemptionAsProcessing(
    redemptionId: string, 
    data: { admin_note?: string }
  ): Promise<ApiResponse<Redemption>> {
    try {
      const response = await apiClient.patch<ApiResponse<Redemption>>(
        `/user-rewards-admin/redeemed-reward/${redemptionId}/process`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Marcar canje como "entregado"
  static async markRedemptionAsDelivered(
    redemptionId: string,
    data: {
      delivery_instructions: string;
      admin_note?: string;
      send_notification?: boolean;
    }
  ): Promise<ApiResponse<Redemption>> {
    try {
      const response = await apiClient.patch<ApiResponse<Redemption>>(
        `/user-rewards-admin/redeemed-reward/${redemptionId}/deliver`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Cancelar canje
  static async cancelRedemption(
    redemptionId: string,
    data: {
      cancellation_reason: string;
      message_to_user?: string;
      refund_points?: boolean;
      send_notification?: boolean;
    }
  ): Promise<ApiResponse<Redemption>> {
    try {
      const response = await apiClient.patch<ApiResponse<Redemption>>(
        `/user-rewards-admin/redeemed-reward/${redemptionId}/cancel`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Obtener historial de cambios de un canje
  static async getRedemptionHistory(redemptionId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        `/user-rewards-admin/redeemed-reward/${redemptionId}/history`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

export default RewardsService;

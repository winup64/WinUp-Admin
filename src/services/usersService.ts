import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse, AccountUserType } from '../types/api';

// Tipos para la lista de usuarios (basado en la respuesta real de la API)
export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  create_at: string;
  update_at: string;
  expires_at: string | null;
  user_type?: AccountUserType;
  role?: string[];
  avatar?: string;
  total_points?: number;
  earned_points?: number;
  spent_points?: number;
  real_points?: number;
  sale_points?: number;
  demo_points?: number;
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  userType?: AccountUserType;
  user_type?: AccountUserType;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE'; // Backend espera y devuelve en MAYÚSCULAS
}

// Respuesta real de la API
export interface UsersListResponse {
  status: number;
  message: string;
  totalUsers: number;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export class UsersService {
  /**
   * Obtiene la lista de usuarios con paginación y filtros
   * @param params - Parámetros de consulta
   * @returns Promise con la lista paginada de usuarios
   */
  static async getUsersList(params: UsersListParams = {}, signal?: AbortSignal): Promise<UsersListResponse> {
    try {
      const effectiveUserType: AccountUserType | undefined = params.user_type ?? params.userType ?? undefined;
      const response = await apiClient.get<UsersListResponse>(
        API_ENDPOINTS.USERS_ADMIN.LIST,
        {
          params: ((): Record<string, any> => {
            const q: Record<string, any> = {
              page: params.page || 1,
              limit: params.limit || 10,
              userType: effectiveUserType,
              search: params.search,
              status: params.status,
            };
            Object.keys(q).forEach((k) => {
              const v = q[k];
              if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
                delete q[k];
              }
            });
            return q;
          })(),
          signal,
        }
      );

      // Normalizar por tolerancia a distintas formas de payload
      const raw: any = response.data as any;
      if (raw && Array.isArray(raw.data) && raw.pagination) {
        return raw as UsersListResponse;
      }
      if (raw && raw.data && Array.isArray(raw.data.data)) {
        return {
          status: typeof raw.status === 'number' ? raw.status : 200,
          message: raw.message || '',
          totalUsers: Number(raw.data.totalUsers ?? raw.data.total ?? 0),
          data: raw.data.data as User[],
          pagination: {
            page: Number(raw.data.pagination?.page ?? params.page ?? 1),
            limit: Number(raw.data.pagination?.limit ?? params.limit ?? 10),
            totalPages: Number(raw.data.pagination?.totalPages ?? raw.data.totalPages ?? 0),
          },
          timestamp: raw.timestamp || new Date().toISOString(),
        };
      }
      if (Array.isArray(raw)) {
        return {
          status: 200,
          message: '',
          totalUsers: raw.length,
          data: raw as User[],
          pagination: {
            page: params.page || 1,
            limit: params.limit || raw.length || 10,
            totalPages: 1,
          },
          timestamp: new Date().toISOString(),
        };
      }
      return raw as UsersListResponse;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Obtiene un usuario específico por ID
   * @param userId - ID del usuario
   * @returns Promise con los datos del usuario
   */
  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        `${API_ENDPOINTS.USERS_ADMIN.GET}/${userId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Promise con el usuario creado
   */
  static async createUser(userData: any): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post<ApiResponse<User>>(
        API_ENDPOINTS.USERS_ADMIN.CREATE,
        userData
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   * @param userId - ID del usuario
   * @param userData - Datos a actualizar
   * @returns Promise con el usuario actualizado
   */
  static async updateUser(userId: string, userData: any): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.patch<ApiResponse<User>>(
        `${API_ENDPOINTS.USERS_ADMIN.UPDATE}/${userId}`,
        userData
      );
      return response.data;
    } catch (error: any) {
      // Reintento tolerante: algunos backends no aceptan actualizar user_type/role
      if (error?.response?.status === 400) {
        try {
          const { user_type, role, ...safeData } = userData || {};
          const resp = await apiClient.patch<ApiResponse<User>>(
            `${API_ENDPOINTS.USERS_ADMIN.UPDATE}/${userId}`,
            safeData
          );
          return resp.data;
        } catch (err2: any) {
          throw err2;
        }
      }
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param userId - ID del usuario
   * @returns Promise con la respuesta de eliminación
   */
  static async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `${API_ENDPOINTS.USERS_ADMIN.DELETE}/${userId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de puntos de usuarios (DEMO y PREMIUM)
   * @returns Promise con las estadísticas de puntos
   */
  static async getPointsStats(): Promise<{
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
  }> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.USERS_ADMIN.POINTS_STATS
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

export default UsersService;

import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { 
  AdminDashboardStats, 
  AdminUserGrowthItem, 
  AdminUserTypeItem, 
  AdminRecentActivityItem 
} from '../types/api';

/**
 * Servicio para el Dashboard del Administrador
 * 
 * Centraliza todas las llamadas a la API relacionadas con el dashboard.
 * React Query usará estas funciones para obtener y cachear los datos.
 */

export interface DashboardStatsResponse {
  data: AdminDashboardStats;
}

export interface UserGrowthParams {
  year: number;
}

export interface UserTypesParams {
  year: number;
}

export interface RecentActivityParams {
  limit?: number;
}

const DashboardService = {
  /**
   * Obtiene las estadísticas principales del dashboard
   * - Total de usuarios
   * - Trivias activas
   * - Premios disponibles
   * - Sorteos activos
   * - Encuestas completadas
   */
  async getStats(): Promise<AdminDashboardStats> {
    const response = await apiClient.get<DashboardStatsResponse>(
      API_ENDPOINTS.ADMIN.DASHBOARD_STATS
    );
    return response.data.data;
  },

  /**
   * Obtiene el crecimiento de usuarios por mes para un año específico
   * @param year - Año para filtrar (ej: 2024)
   */
  async getUserGrowth(params: UserGrowthParams): Promise<AdminUserGrowthItem[]> {
    const response = await apiClient.get(
      `${API_ENDPOINTS.ADMIN.USER_GROWTH}?year=${params.year}`
    );
    
    // El backend puede devolver datos envueltos o directos
    const items = Array.isArray(response.data?.data) 
      ? response.data.data 
      : response.data;
    
    // Filtrar y limpiar datos inválidos
    const cleaned = Array.isArray(items) 
      ? items.filter(item => item && typeof item.totalUsers === 'number')
      : [];
    
    // Ordenar por mes
    const MONTH_ORDER: Record<string, number> = {
      'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
      'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Setiembre': 9, 'Octubre': 10, 
      'Noviembre': 11, 'Diciembre': 12,
      'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6, 
      'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12,
    };
    
    return cleaned.sort((a, b) => 
      (MONTH_ORDER[a.month] || 99) - (MONTH_ORDER[b.month] || 99)
    );
  },

  /**
   * Obtiene la distribución de tipos de usuario para un año específico
   * @param year - Año para filtrar (ej: 2024)
   */
  async getUserTypes(params: UserTypesParams): Promise<AdminUserTypeItem[]> {
    const response = await apiClient.get(
      `${API_ENDPOINTS.ADMIN.USER_TYPES}?year=${params.year}`
    );
    
    // El backend puede devolver datos envueltos o directos
    const raw = Array.isArray(response.data?.data) 
      ? response.data.data 
      : response.data;
    
    // Filtrar y limpiar datos inválidos
    const cleaned = Array.isArray(raw) 
      ? raw.filter(item => item && typeof item.count === 'number')
      : [];
    
    return cleaned;
  },

  /**
   * Obtiene la actividad reciente del sistema
   * @param limit - Número de actividades a obtener (por defecto 5)
   */
  async getRecentActivity(params: RecentActivityParams = {}): Promise<AdminRecentActivityItem[]> {
    const limit = params.limit || 5;
    const response = await apiClient.get(
      `${API_ENDPOINTS.ADMIN.RECENT_ACTIVITY}?limit=${limit}`
    );
    
    // El backend puede devolver datos envueltos o directos
    const items = Array.isArray(response.data?.data) 
      ? response.data.data 
      : response.data;
    
    // Regex para detectar UUIDs
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    
    // Filtrar y limpiar datos inválidos
    const cleaned = Array.isArray(items) 
      ? items.filter(activity => {
          // Filtrar actividades sin campos requeridos
          if (!activity || !activity.title || !activity.created_at) {
            return false;
          }
          
          // Filtrar actividades que contengan UUIDs en la descripción
          if (activity.description && uuidRegex.test(activity.description)) {
            return false;
          }
          
          return true;
        })
      : [];
    
    return cleaned;
  },
};

export default DashboardService;


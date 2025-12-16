import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { UserStatsRequest, UserStatsApiResponse } from '../types/api';

export interface NewUsersStatisticsResponse {
  status: number;
  message: string;
  data: {
    pointsAvg: number;
    pointsMax: number;
    pointsMin: number;
    countUsers: number;
  };
  timestamp: string;
}

export class UserStatsService {
  /**
   * Obtiene las estadísticas de usuarios
   * @param params - Parámetros para la consulta
   * @returns Promise con las estadísticas de usuarios
   */
  static async getUserStats(params: UserStatsRequest): Promise<UserStatsApiResponse> {
    try {
      const response = await apiClient.get<UserStatsApiResponse>(
        API_ENDPOINTS.USERS_ADMIN.USER_STATS,
        {
          params: {
            role: params.role,
            field: params.field,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de usuarios con puntos reales
   * @returns Promise con las estadísticas de usuarios
   */
  static async getUserRealPointsStats(): Promise<UserStatsApiResponse> {
    return this.getUserStats({
      role: 'USER',
      field: 'real_points',
    });
  }

  /**
   * Obtiene estadísticas de usuarios con puntos demo
   * @returns Promise con las estadísticas de usuarios
   */
  static async getUserDemoPointsStats(): Promise<UserStatsApiResponse> {
    return this.getUserStats({
      role: 'USER',
      field: 'demo_points',
    });
  }

  /**
   * Obtiene estadísticas de usuarios con puntos totales
   * @returns Promise con las estadísticas de usuarios
   */
  static async getUserTotalPointsStats(): Promise<UserStatsApiResponse> {
    return this.getUserStats({
      role: 'USER',
      field: 'total_points',
    });
  }

  /**
   * Nuevo endpoint consolidado de estadísticas de usuarios
   */
  static async getUsersStatistics(): Promise<NewUsersStatisticsResponse> {
    const response = await apiClient.get<NewUsersStatisticsResponse>(
      API_ENDPOINTS.USERS_ADMIN.USERS_STATISTICS
    );
    return response.data;
  }
}

export default UserStatsService;

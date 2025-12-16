import api from '../config/axios';
import { API_ENDPOINTS } from '../config/api';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'promotional' | 'winner' | 'system' | 'reminder';
  isActive: boolean;
  scheduledDate?: string;
  targetAudience: 'all' | 'premium' | 'new_users' | 'inactive_users';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: 'promotional' | 'winner' | 'system' | 'reminder';
  is_active?: boolean;
  scheduled_date?: string;
  target_audience?: 'all' | 'premium' | 'new_users' | 'inactive_users';
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string;
  type?: 'promotional' | 'winner' | 'system' | 'reminder';
  is_active?: boolean;
  scheduled_date?: string;
  target_audience?: 'all' | 'premium' | 'new_users' | 'inactive_users';
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  target_audience?: string;
  is_active?: boolean;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification | Notification[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Mapper para convertir entre formato frontend y backend
const mapToBackend = (notification: Partial<Notification>): CreateNotificationDto | UpdateNotificationDto => {
  return {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    is_active: notification.isActive,
    scheduled_date: notification.scheduledDate,
    target_audience: notification.targetAudience,
  };
};

const mapFromBackend = (backendNotification: any): Notification => {
  // Log para debug
  console.log('Mapping notification from backend:', backendNotification);
  
  if (!backendNotification) {
    console.error('Backend notification is null or undefined');
    throw new Error('Invalid notification data from backend');
  }
  
  const mapped = {
    id: backendNotification.notification_id || 
        backendNotification.id || 
        backendNotification._id ||
        undefined,
    title: backendNotification.title || '',
    message: backendNotification.message || '',
    type: (backendNotification.type || 'promotional') as 'promotional' | 'winner' | 'system' | 'reminder',
    isActive: backendNotification.is_active !== undefined 
      ? Boolean(backendNotification.is_active) 
      : backendNotification.isActive !== undefined 
        ? Boolean(backendNotification.isActive)
        : true,
    scheduledDate: backendNotification.scheduled_date || 
                   backendNotification.scheduledDate || 
                   undefined,
    targetAudience: (backendNotification.target_audience || 
                    backendNotification.targetAudience || 
                    'all') as 'all' | 'premium' | 'new_users' | 'inactive_users',
    createdAt: backendNotification.created_at || 
               backendNotification.createdAt || 
               undefined,
    updatedAt: backendNotification.updated_at || 
               backendNotification.updatedAt || 
               undefined,
  };
  
  console.log('Mapped notification:', mapped);
  return mapped;
};

export const notificationsService = {
  // Obtener todas las notificaciones con filtros
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS_ADMIN.LIST, {
        params: filters,
      });
      
      // Log para debug
      console.log('Notifications API Response:', response.data);
      
      // Manejar diferentes estructuras de respuesta
      const responseData = response.data;
      
      // Si la respuesta tiene success: true
      if (responseData.success) {
        const data = responseData.data;
        
        // Si data es un array, mapear cada elemento
        if (Array.isArray(data)) {
          return {
            success: true,
            data: data.map(mapFromBackend),
            message: responseData.message,
            pagination: responseData.pagination,
          };
        }
        
        // Si data es un objeto único, convertirlo a array
        if (data && typeof data === 'object') {
          return {
            success: true,
            data: [mapFromBackend(data)],
            message: responseData.message,
            pagination: responseData.pagination,
          };
        }
        
        // Si data está vacío o es null, retornar array vacío
        return {
          success: true,
          data: [],
          message: responseData.message,
          pagination: responseData.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
      }
      
      // Si la respuesta no tiene success pero tiene data directamente
      if (responseData.data !== undefined) {
        const data = responseData.data;
        
        if (Array.isArray(data)) {
          return {
            success: true,
            data: data.map(mapFromBackend),
            message: responseData.message,
            pagination: responseData.pagination,
          };
        }
        
        if (data && typeof data === 'object') {
          return {
            success: true,
            data: [mapFromBackend(data)],
            message: responseData.message,
            pagination: responseData.pagination,
          };
        }
      }
      
      throw new Error(responseData.message || 'Error al obtener notificaciones: estructura de respuesta no reconocida');
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al obtener notificaciones';
      throw new Error(errorMessage);
    }
  },

  // Obtener una notificación por ID
  async getNotificationById(id: string): Promise<NotificationResponse> {
    try {
      const response = await api.get(`${API_ENDPOINTS.NOTIFICATIONS_ADMIN.GET}/${id}`);
      
      if (response.data.success) {
        return {
          ...response.data,
          data: mapFromBackend(response.data.data)
        };
      }
      
      throw new Error(response.data.message || 'Error al obtener la notificación');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener la notificación');
    }
  },

  // Crear nueva notificación
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationResponse> {
    try {
      const backendData = mapToBackend(notification) as CreateNotificationDto;
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS_ADMIN.CREATE, backendData);
      
      if (response.data.success) {
        return {
          ...response.data,
          data: mapFromBackend(response.data.data)
        };
      }
      
      throw new Error(response.data.message || 'Error al crear la notificación');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear la notificación');
    }
  },

  // Actualizar notificación existente
  async updateNotification(id: string, notification: Partial<Notification>): Promise<NotificationResponse> {
    try {
      const backendData = mapToBackend(notification) as UpdateNotificationDto;
      const response = await api.patch(`${API_ENDPOINTS.NOTIFICATIONS_ADMIN.UPDATE}/${id}`, backendData);
      
      if (response.data.success) {
        return {
          ...response.data,
          data: mapFromBackend(response.data.data)
        };
      }
      
      throw new Error(response.data.message || 'Error al actualizar la notificación');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar la notificación');
    }
  },

  // Eliminar notificación
  async deleteNotification(id: string): Promise<NotificationResponse> {
    try {
      const response = await api.delete(`${API_ENDPOINTS.NOTIFICATIONS_ADMIN.DELETE}/${id}`);
      
      if (response.data.success) {
        return response.data;
      }
      
      throw new Error(response.data.message || 'Error al eliminar la notificación');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar la notificación');
    }
  },
};

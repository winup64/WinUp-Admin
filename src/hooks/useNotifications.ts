import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService, Notification, NotificationFilters } from '../services/notificationsService';

// Query Keys
export const notificationsKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationsKeys.all, 'list'] as const,
  list: (params: NotificationFilters) => [...notificationsKeys.lists(), params] as const,
  details: () => [...notificationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationsKeys.details(), id] as const,
};

// Hook para obtener lista de notificaciones
export const useNotificationsList = (params: NotificationFilters = {}) => {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsService.getNotifications(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener notificación por ID
export const useNotificationById = (id: string) => {
  return useQuery({
    queryKey: notificationsKeys.detail(id),
    queryFn: () => notificationsService.getNotificationById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook para crear notificación
export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => 
      notificationsService.createNotification(data),
    onSuccess: () => {
      // Invalidar lista de notificaciones
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
  });
};

// Hook para actualizar notificación
export const useUpdateNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Notification> }) => 
      notificationsService.updateNotification(id, data),
    onSuccess: (_, variables) => {
      // Invalidar lista y detalle
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationsKeys.detail(variables.id) });
    },
  });
};

// Hook para eliminar notificación
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      // Invalidar lista de notificaciones
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
  });
};


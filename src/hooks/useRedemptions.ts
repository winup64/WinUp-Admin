import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RewardsService, { 
  RedemptionsListParams,
  Redemption,
  RedemptionStats
} from '../services/rewardsService';
import { useNotifications } from '../contexts/NotificationContext';

// Query key factory
export const redemptionKeys = {
  all: ['redemptions'] as const,
  lists: () => [...redemptionKeys.all, 'list'] as const,
  list: (params: RedemptionsListParams) => [...redemptionKeys.lists(), params] as const,
  details: () => [...redemptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...redemptionKeys.details(), id] as const,
  stats: () => [...redemptionKeys.all, 'stats'] as const,
  history: (id: string) => [...redemptionKeys.all, 'history', id] as const,
};

// Hook para obtener estadísticas
export function useRedemptionStats() {
  return useQuery({
    queryKey: redemptionKeys.stats(),
    queryFn: () => RewardsService.getRedemptionStats(),
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}

// Hook para obtener lista de canjes
export function useRedemptionsList(params: RedemptionsListParams = {}) {
  return useQuery({
    queryKey: redemptionKeys.list(params),
    queryFn: () => RewardsService.getRedemptionsList(params),
    staleTime: 1000 * 30, // 30 segundos
    retry: 2,
  });
}

// Hook para obtener detalle de un canje
export function useRedemptionById(redemptionId: string, enabled = true) {
  return useQuery({
    queryKey: redemptionKeys.detail(redemptionId),
    queryFn: () => RewardsService.getRedemptionById(redemptionId),
    enabled: !!redemptionId && enabled,
    staleTime: 1000 * 30, // 30 segundos
    retry: 2,
  });
}

// Hook para obtener historial de cambios
export function useRedemptionHistory(redemptionId: string, enabled = true) {
  return useQuery({
    queryKey: redemptionKeys.history(redemptionId),
    queryFn: () => RewardsService.getRedemptionHistory(redemptionId),
    enabled: !!redemptionId && enabled,
    staleTime: 1000 * 60, // 1 minuto
    retry: 2,
  });
}

// Hook para marcar como "en proceso"
export function useMarkAsProcessing() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      redemptionId, 
      admin_note 
    }: { 
      redemptionId: string; 
      admin_note?: string;
    }) => RewardsService.markRedemptionAsProcessing(redemptionId, { admin_note }),
    
    onSuccess: (data, variables) => {
      showSuccess(
        'Canje en Proceso',
        'El canje ha sido marcado como "En Proceso"'
      );
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: redemptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.detail(variables.redemptionId) });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.history(variables.redemptionId) });
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar el estado del canje';
      showError('Error', message);
    },
  });
}

// Hook para marcar como "entregado"
export function useMarkAsDelivered() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      redemptionId, 
      delivery_instructions,
      admin_note,
      send_notification = true
    }: { 
      redemptionId: string; 
      delivery_instructions: string;
      admin_note?: string;
      send_notification?: boolean;
    }) => RewardsService.markRedemptionAsDelivered(redemptionId, {
      delivery_instructions,
      admin_note,
      send_notification
    }),
    
    onSuccess: (data, variables) => {
      showSuccess(
        'Canje Entregado',
        `Premio marcado como entregado. ${variables.send_notification ? 'Usuario notificado.' : ''}`
      );
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: redemptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.detail(variables.redemptionId) });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.history(variables.redemptionId) });
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al marcar el canje como entregado';
      showError('Error', message);
    },
  });
}

// Hook para cancelar canje
export function useCancelRedemption() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      redemptionId, 
      cancellation_reason,
      message_to_user,
      refund_points = true,
      send_notification = true
    }: { 
      redemptionId: string; 
      cancellation_reason: string;
      message_to_user?: string;
      refund_points?: boolean;
      send_notification?: boolean;
    }) => RewardsService.cancelRedemption(redemptionId, {
      cancellation_reason,
      message_to_user,
      refund_points,
      send_notification
    }),
    
    onSuccess: (data, variables) => {
      showSuccess(
        'Canje Cancelado',
        `El canje ha sido cancelado. ${variables.refund_points ? 'Puntos devueltos al usuario.' : ''}`
      );
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: redemptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.detail(variables.redemptionId) });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.stats() });
      queryClient.invalidateQueries({ queryKey: redemptionKeys.history(variables.redemptionId) });
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cancelar el canje';
      showError('Error', message);
    },
  });
}


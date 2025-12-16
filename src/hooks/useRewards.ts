import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RewardsService, { RewardsListParams, CreateRewardData, UpdateRewardData } from '../services/rewardsService';

/**
 * Custom Hooks para el módulo de Premios usando React Query
 * 
 * Ventajas:
 * - Caché automático por combinación de filtros
 * - Debounce automático de búsquedas
 * - Cancelación automática de requests
 * - Estados de loading/error manejados
 * - Invalidación automática después de mutations
 */

/**
 * Hook para obtener la lista de premios con paginación y filtros
 * 
 * @param params - Filtros de búsqueda (page, limit, reward_type, status, search)
 * 
 * Caché: 1 minuto
 * Cada combinación de filtros tiene su propio caché
 */
export const useRewardsList = (params: RewardsListParams) => {
  return useQuery({
    queryKey: ['rewards', 'list', params],
    queryFn: () => RewardsService.getRewardsList(params),
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener un premio específico por ID
 * 
 * @param rewardId - ID del premio a obtener
 * 
 * Caché: 2 minutos
 */
export const useRewardById = (rewardId: string | null) => {
  return useQuery({
    queryKey: ['rewards', 'detail', rewardId],
    queryFn: () => RewardsService.getRewardById(rewardId!),
    enabled: !!rewardId, // Solo ejecutar si hay ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para crear un nuevo premio
 * 
 * Invalida automáticamente la lista de premios después de crear
 */
export const useCreateReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rewardData: any) => RewardsService.createReward(rewardData),
    onSuccess: () => {
      // Invalidar todas las listas de premios para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['rewards', 'list'] });
    },
  });
};

/**
 * Hook para actualizar un premio existente
 * 
 * Invalida automáticamente la lista de premios después de actualizar
 */
export const useUpdateReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      RewardsService.updateReward(id, data),
    onSuccess: () => {
      // Invalidar todas las listas de premios para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['rewards', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'detail'] });
    },
  });
};

/**
 * Hook para eliminar un premio
 * 
 * Invalida automáticamente la lista de premios después de eliminar
 */
export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rewardId: string) => RewardsService.deleteReward(rewardId),
    onSuccess: () => {
      // Invalidar todas las listas de premios para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['rewards', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['rewards', 'detail'] });
    },
  });
};


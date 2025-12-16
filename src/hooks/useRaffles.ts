import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RafflesService, { 
  RafflesListParams, 
  CreateRafflePayload, 
  UpdateRafflePayload,
  ApiRaffle 
} from '../services/rafflesService';

/**
 * Custom Hooks para el módulo de Rifas usando React Query
 * 
 * Ventajas:
 * - Caché automático por combinación de filtros
 * - Debounce automático de búsquedas
 * - Cancelación automática de requests
 * - Estados de loading/error manejados
 * - Invalidación automática después de mutations
 */

/**
 * Hook para obtener la lista de rifas con paginación y filtros
 * 
 * @param params - Filtros de búsqueda (page, limit, search, type)
 * 
 * Caché: 1 minuto
 * Cada combinación de filtros tiene su propio caché
 */
export const useRafflesList = (params: RafflesListParams = {}) => {
  return useQuery({
    queryKey: ['raffles', 'list', params],
    queryFn: () => RafflesService.list(params),
    staleTime: 30 * 1000, // 30 segundos - mantener datos en caché
    gcTime: 5 * 60 * 1000, // 5 minutos - mantener en memoria
    refetchOnMount: true, // Siempre refetch al montar
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    placeholderData: (previousData) => previousData, // Mantener datos anteriores mientras carga
  });
};

/**
 * Hook para obtener una rifa específica por ID
 * 
 * @param raffleId - ID de la rifa
 * 
 * Caché: 2 minutos
 */
export const useRaffleById = (raffleId: string | null) => {
  return useQuery({
    queryKey: ['raffles', 'detail', raffleId],
    queryFn: () => RafflesService.getById(raffleId!),
    enabled: !!raffleId, // Solo ejecutar si hay ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener el conteo de participantes de una rifa
 * 
 * @param raffleId - ID de la rifa
 * 
 * Caché: 30 segundos (datos que cambian frecuentemente)
 */
export const useRaffleParticipantsCount = (raffleId: string | null) => {
  return useQuery({
    queryKey: ['raffles', 'participantsCount', raffleId],
    queryFn: () => RafflesService.getParticipantsCount(raffleId!),
    enabled: !!raffleId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener los participantes de una rifa
 * 
 * @param raffleId - ID de la rifa
 * 
 * Caché: 30 segundos
 */
export const useRaffleParticipants = (raffleId: string | null) => {
  return useQuery({
    queryKey: ['raffles', 'participants', raffleId],
    queryFn: () => RafflesService.getParticipants(raffleId!),
    enabled: !!raffleId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener los ganadores de una rifa
 * 
 * @param raffleId - ID de la rifa
 * 
 * Caché: 2 minutos
 */
export const useRaffleWinners = (raffleId: string | null) => {
  return useQuery({
    queryKey: ['raffles', 'winners', raffleId],
    queryFn: () => RafflesService.getWinners(raffleId!),
    enabled: !!raffleId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para crear una nueva rifa
 * 
 * Invalida automáticamente la lista de rifas después de crear
 */
export const useCreateRaffle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (raffleData: CreateRafflePayload) => RafflesService.create(raffleData),
    onSuccess: async () => {
      // Invalidar y refetch todas las listas de rifas para que se actualicen
      await queryClient.invalidateQueries({ queryKey: ['raffles', 'list'] });
      await queryClient.refetchQueries({ queryKey: ['raffles', 'list'] });
    },
  });
};

/**
 * Hook para actualizar una rifa existente
 * 
 * Invalida automáticamente la lista de rifas después de actualizar
 */
export const useUpdateRaffle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRafflePayload }) => 
      RafflesService.update(id, data),
    onSuccess: async (_, variables) => {
      // Invalidar y refetch todas las listas de rifas para que se actualicen
      await queryClient.invalidateQueries({ queryKey: ['raffles', 'list'] });
      await queryClient.refetchQueries({ queryKey: ['raffles', 'list'] });
      // Invalidar la rifa específica
      queryClient.invalidateQueries({ queryKey: ['raffles', 'detail', variables.id] });
      // Invalidar participantes y ganadores si existen
      queryClient.invalidateQueries({ queryKey: ['raffles', 'participantsCount', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['raffles', 'participants', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['raffles', 'winners', variables.id] });
    },
  });
};

/**
 * Hook para eliminar una rifa
 * 
 * Invalida automáticamente la lista de rifas después de eliminar
 */
export const useDeleteRaffle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (raffleId: string) => RafflesService.remove(raffleId),
    onSuccess: async () => {
      // Invalidar y refetch todas las listas de rifas para que se actualicen
      await queryClient.invalidateQueries({ queryKey: ['raffles', 'list'] });
      await queryClient.refetchQueries({ queryKey: ['raffles', 'list'] });
    },
  });
};

/**
 * Hook para realizar el sorteo de una rifa
 * 
 * Invalida automáticamente los datos relacionados después del sorteo
 * 
 * @param raffleId - ID del sorteo
 * @param winners - (Opcional) Array de UUIDs de usuarios ganadores seleccionados por el frontend. Si no se proporciona, el backend hará el sorteo.
 */
export const useDrawRaffle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ raffleId, winners }: { raffleId: string; winners?: string[] }) => 
      RafflesService.draw(raffleId, winners),
    onSuccess: async (_, variables) => {
      const raffleId = variables.raffleId;
      // Invalidar todos los datos relacionados con esta rifa
      queryClient.invalidateQueries({ queryKey: ['raffles', 'detail', raffleId] });
      queryClient.invalidateQueries({ queryKey: ['raffles', 'winners', raffleId] });
      queryClient.invalidateQueries({ queryKey: ['raffles', 'participants', raffleId] });
      queryClient.invalidateQueries({ queryKey: ['raffles', 'participantsCount', raffleId] });
      // Invalidar y refetch la lista general
      await queryClient.invalidateQueries({ queryKey: ['raffles', 'list'] });
      await queryClient.refetchQueries({ queryKey: ['raffles', 'list'] });
    },
  });
};


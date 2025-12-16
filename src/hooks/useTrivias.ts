import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TriviasService, {
  TriviaDTO,
  TriviasListParams as ServiceParams,
  TriviaUpsertPayload,
} from '../services/triviasService';

/**
 * Custom Hooks para el módulo de Trivias usando React Query
 * 
 * Ventajas:
 * - Caché automático por combinación de filtros
 * - Debounce automático de búsquedas
 * - Cancelación automática de requests
 * - Estados de loading/error manejados
 * - Invalidación automática después de mutations
 */

export interface TriviasListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string; // UUID de la categoría
  difficulty?: string; // FACIL, MEDIO, DIFICIL (mayúsculas)
  status?: string; // active, inactive
  activation_type?: string; // manual, programada
}

/**
 * Hook para obtener la lista de trivias con paginación y filtros
 * 
 * @param params - Filtros de búsqueda:
 *   - page: Número de página
 *   - limit: Elementos por página
 *   - search: Búsqueda por texto
 *   - category_id: UUID de la categoría (ej: c0f29735-5413-4e81-bc72-15e0d870d3d6)
 *   - difficulty: FACIL, MEDIO, DIFICIL (mayúsculas)
 *   - status: active, inactive
 *   - activation_type: manual, programada
 * 
 * Caché: 1 minuto
 * Cada combinación de filtros tiene su propio caché
 */
export const useTriviasList = (params: TriviasListParams = {}) => {
  return useQuery({
    queryKey: ['trivias', 'list', params],
    queryFn: ({ signal }) => TriviasService.list(params as ServiceParams, signal),
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener una trivia específica por ID
 * 
 * @param triviaId - ID de la trivia
 * 
 * Caché: 2 minutos
 */
export const useTriviaById = (triviaId: string | null) => {
  return useQuery({
    queryKey: ['trivias', 'detail', triviaId],
    queryFn: ({ signal }) => TriviasService.getById(triviaId!, signal),
    enabled: !!triviaId, // Solo ejecutar si hay ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para crear una nueva trivia
 * 
 * Invalida automáticamente la lista de trivias después de crear
 */
export const useCreateTrivia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (triviaData: TriviaUpsertPayload | FormData) => TriviasService.create(triviaData),
    onSuccess: () => {
      // Invalidar todas las listas de trivias para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['trivias', 'list'] });
    },
  });
};

/**
 * Hook para actualizar una trivia existente
 * 
 * Invalida automáticamente la lista de trivias después de actualizar
 */
export const useUpdateTrivia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TriviaUpsertPayload | FormData }) => 
      TriviasService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar todas las listas de trivias para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['trivias', 'list'] });
      // Invalidar la trivia específica
      queryClient.invalidateQueries({ queryKey: ['trivias', 'detail', variables.id] });
    },
  });
};

/**
 * Hook para eliminar una trivia
 * 
 * Invalida automáticamente la lista de trivias después de eliminar
 */
export const useDeleteTrivia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (triviaId: string) => TriviasService.remove(triviaId),
    onSuccess: () => {
      // Invalidar todas las listas de trivias para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['trivias', 'list'] });
    },
  });
};


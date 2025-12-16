import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CategoriesService, { CategoriesListParams } from '../services/categoriesService';

/**
 * Custom Hooks para el módulo de Categorías usando React Query
 * 
 * Ventajas:
 * - Caché automático por combinación de filtros
 * - Debounce automático de búsquedas
 * - Cancelación automática de requests
 * - Estados de loading/error manejados
 * - Invalidación automática después de mutations
 */

/**
 * Hook para obtener la lista de categorías con paginación y filtros
 * 
 * @param params - Filtros de búsqueda (page, limit, search, status, category_type)
 * 
 * Caché: 1 minuto
 * Cada combinación de filtros tiene su propio caché
 */
export const useCategoriesList = (params: CategoriesListParams) => {
  return useQuery({
    queryKey: ['categories', 'list', params],
    queryFn: () => CategoriesService.getCategoriesList(params),
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener una categoría específica por ID
 * 
 * @param categoryId - ID de la categoría
 * 
 * Caché: 2 minutos
 */
export const useCategoryById = (categoryId: string | null) => {
  return useQuery({
    queryKey: ['categories', 'detail', categoryId],
    queryFn: () => CategoriesService.getCategoryById(categoryId!),
    enabled: !!categoryId, // Solo ejecutar si hay ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para crear una nueva categoría
 * 
 * Invalida automáticamente la lista de categorías después de crear
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryData: Partial<any> | FormData) => {
      return CategoriesService.createCategory(categoryData);
    },
    onSuccess: (data) => {
      // Invalidar todas las listas de categorías para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
    },
    onError: (error: any) => {
      
    },
  });
};

/**
 * Hook para actualizar una categoría existente
 * 
 * Invalida automáticamente la lista de categorías después de actualizar
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => 
      CategoriesService.updateCategory(id, data),
    onSuccess: (_, variables) => {
      // Invalidar todas las listas de categorías para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
      // Invalidar la categoría específica
      queryClient.invalidateQueries({ queryKey: ['categories', 'detail', variables.id] });
    },
  });
};

/**
 * Hook para eliminar una categoría
 * 
 * Invalida automáticamente la lista de categorías después de eliminar
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryId: string) => CategoriesService.deleteCategory(categoryId),
    onSuccess: () => {
      // Invalidar todas las listas de categorías para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['categories', 'list'] });
    },
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UsersService, { UsersListParams } from '../services/usersService';

/**
 * Custom Hooks para el módulo de Usuarios usando React Query
 * 
 * Ventajas:
 * - Caché automático por combinación de filtros
 * - Debounce automático de búsquedas
 * - Cancelación automática de requests
 * - Estados de loading/error manejados
 * - Invalidación automática después de mutations
 */

/**
 * Hook para obtener la lista de usuarios con paginación y filtros
 * 
 * @param params - Filtros de búsqueda (page, limit, search, status, userType)
 * 
 * Caché: 1 minuto
 * Cada combinación de filtros tiene su propio caché
 */
export const useUsersList = (params: UsersListParams) => {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => UsersService.getUsersList(params),
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para obtener las estadísticas de puntos de usuarios
 * 
 * Caché: 2 minutos
 */
export const useUsersPointsStats = () => {
  return useQuery({
    queryKey: ['users', 'pointsStats'],
    queryFn: () => UsersService.getPointsStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
  });
};

/**
 * Hook para crear un nuevo usuario
 * 
 * Invalida automáticamente la lista de usuarios después de crear
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: any) => UsersService.createUser(userData),
    onSuccess: () => {
      // Invalidar todas las listas de usuarios para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'pointsStats'] });
    },
  });
};

/**
 * Hook para actualizar un usuario existente
 * 
 * Invalida automáticamente la lista de usuarios después de actualizar
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      UsersService.updateUser(id, data),
    onSuccess: () => {
      // Invalidar todas las listas de usuarios para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'pointsStats'] });
    },
  });
};

/**
 * Hook para eliminar un usuario
 * 
 * Invalida automáticamente la lista de usuarios después de eliminar
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => UsersService.deleteUser(userId),
    onSuccess: () => {
      // Invalidar todas las listas de usuarios para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'pointsStats'] });
    },
  });
};


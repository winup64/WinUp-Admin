import { useQuery } from '@tanstack/react-query';
import DashboardService, { 
  UserGrowthParams, 
  UserTypesParams, 
  RecentActivityParams 
} from '../services/dashboardService';
import UsersService from '../services/usersService';

/**
 * Custom Hooks para el Dashboard usando React Query
 * 
 * Estos hooks reemplazan todos los useEffect, estados de loading/error,
 * y la lógica manual de caché con LocalStorage.
 * 
 * Ventajas:
 * - Caché automático
 * - Actualización en background
 * - Estados de loading/error manejados automáticamente
 * - Revalidación al volver a la ventana
 * - Sincronización entre pestañas
 */

/**
 * Hook para obtener las estadísticas principales del dashboard
 * 
 * Caché: 1 minuto
 * Se actualiza automáticamente al volver a la ventana
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: DashboardService.getStats,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false, // No refetch si hay datos en caché
  });
};

/**
 * Hook para obtener el crecimiento de usuarios por año
 * 
 * @param year - Año para filtrar
 * @param enabled - Si debe ejecutarse la query (opcional)
 * 
 * Caché: 5 minutos (los datos históricos cambian menos)
 * Se actualiza automáticamente cuando cambia el año
 */
export const useUserGrowth = (params: UserGrowthParams & { enabled?: boolean }) => {
  const { year, enabled = true } = params;
  
  return useQuery({
    queryKey: ['dashboard', 'userGrowth', year],
    queryFn: () => DashboardService.getUserGrowth({ year }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnMount: false,
    enabled,  // Control de carga condicional
  });
};

/**
 * Hook para obtener la distribución de tipos de usuario por año
 * 
 * @param year - Año para filtrar
 * @param enabled - Si debe ejecutarse la query (opcional)
 * 
 * Caché: 5 minutos
 * Se actualiza automáticamente cuando cambia el año
 */
export const useUserTypes = (params: UserTypesParams & { enabled?: boolean }) => {
  const { year, enabled = true } = params;
  
  return useQuery({
    queryKey: ['dashboard', 'userTypes', year],
    queryFn: () => DashboardService.getUserTypes({ year }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnMount: false,
    enabled,  // Control de carga condicional
  });
};

/**
 * Hook para obtener la actividad reciente
 * 
 * @param limit - Número de actividades a obtener (opcional, default 5)
 * @param enabled - Si debe ejecutarse la query (opcional)
 * 
 * Caché: 30 segundos (los datos recientes cambian más frecuentemente)
 */
export const useRecentActivity = (params: RecentActivityParams & { enabled?: boolean } = {}) => {
  const { limit = 5, enabled = true } = params;
  
  return useQuery({
    queryKey: ['dashboard', 'recentActivity', limit],
    queryFn: () => DashboardService.getRecentActivity({ limit }),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnMount: false,
    enabled,  // Control de carga condicional
  });
};

/**
 * Hook para obtener el total de usuarios
 * 
 * Usa el endpoint de lista de usuarios con limit=1 solo para obtener el total.
 * 
 * @param enabled - Si debe ejecutarse la query (opcional)
 * 
 * Caché: 2 minutos
 */
export const useUsersTotal = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params;
  
  return useQuery({
    queryKey: ['dashboard', 'usersTotal'],
    queryFn: async () => {
      const response = await UsersService.getUsersList({ page: 1, limit: 1 });
      return response?.totalUsers ?? 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
    enabled,  // Control de carga condicional
  });
};

/**
 * Hook compuesto que obtiene todos los datos del dashboard
 * 
 * @param year - Año para filtrar gráficos
 * @param recentLimit - Límite de actividades recientes
 * 
 * Útil si quieres cargar todo a la vez y tener un estado global de loading
 */
export const useDashboardData = (year: number, recentLimit: number = 5) => {
  const stats = useDashboardStats();
  const growth = useUserGrowth({ year });
  const types = useUserTypes({ year });
  const recent = useRecentActivity({ limit: recentLimit });
  const usersTotal = useUsersTotal();

  return {
    stats,
    growth,
    types,
    recent,
    usersTotal,
    // Estado global de loading (true si ALGUNO está cargando por primera vez)
    isLoading: stats.isLoading || growth.isLoading || types.isLoading || recent.isLoading,
    // Estado de fetching (true si alguno está actualizando en background)
    isFetching: stats.isFetching || growth.isFetching || types.isFetching || recent.isFetching,
    // Hay error si alguno tiene error
    hasError: stats.error || growth.error || types.error || recent.error,
  };
};


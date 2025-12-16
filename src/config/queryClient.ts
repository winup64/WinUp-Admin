import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración del QueryClient de React Query
 * 
 * Este cliente maneja todo el caché de datos del servidor de forma automática.
 * 
 * Configuraciones importantes:
 * - staleTime: Tiempo que los datos se consideran "frescos" (no se revalidan)
 * - gcTime: Tiempo que los datos permanecen en caché (antes era cacheTime)
 * - refetchOnWindowFocus: Refetch al volver a la ventana
 * - retry: Número de reintentos en caso de error
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos permanecen "frescos" sin necesidad de revalidación
      staleTime: 60 * 1000, // 1 minuto
      
      // Tiempo que los datos permanecen en caché antes de ser eliminados
      gcTime: 5 * 60 * 1000, // 5 minutos
      
      // Refetch solo en window focus si los datos están stale
      refetchOnWindowFocus: 'always',
      
      // Reintentar solo 1 vez
      retry: 1,
      retryDelay: 1000, // 1 segundo entre reintentos
      
      // Refetch al reconectar solo si está stale
      refetchOnReconnect: 'always',
      
      // No refetch en cada mount si hay datos frescos en caché
      refetchOnMount: false,
      
      // Reducir el timeout de red para que no se quede colgado
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
    },
  },
});


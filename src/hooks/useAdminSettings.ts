import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAdminSettings, 
  updateAdminSettings,
  AdminSettings,
  UpdateAdminSettingsRequest
} from '../services/adminSettingsService';

// Query Keys
export const adminSettingsKeys = {
  all: ['adminSettings'] as const,
  current: () => [...adminSettingsKeys.all, 'current'] as const,
};

// Hook para obtener configuración de administrador
export const useAdminSettings = () => {
  return useQuery({
    queryKey: adminSettingsKeys.current(),
    queryFn: () => getAdminSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para actualizar configuración de administrador
export const useUpdateAdminSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateAdminSettingsRequest) => updateAdminSettings(data),
    onSuccess: () => {
      // Invalidar configuración actual
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.current() });
    },
  });
};


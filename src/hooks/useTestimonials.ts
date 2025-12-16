import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listTestimonials, 
  getTestimonialById, 
  createTestimonial, 
  updateTestimonial, 
  deleteTestimonial,
  ListTestimonialsParams,
  CreateOrUpdateTestimonialPayload,
  TestimonialDTO
} from '../services/testimonials';

// Query Keys
export const testimonialsKeys = {
  all: ['testimonials'] as const,
  lists: () => [...testimonialsKeys.all, 'list'] as const,
  list: (params: ListTestimonialsParams) => [...testimonialsKeys.lists(), params] as const,
  details: () => [...testimonialsKeys.all, 'detail'] as const,
  detail: (id: string) => [...testimonialsKeys.details(), id] as const,
};

// Hook para obtener lista de testimonios
export const useTestimonialsList = (params: ListTestimonialsParams = {}) => {
  return useQuery({
    queryKey: testimonialsKeys.list(params),
    queryFn: () => listTestimonials(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener testimonio por ID
export const useTestimonialById = (id: string) => {
  return useQuery({
    queryKey: testimonialsKeys.detail(id),
    queryFn: () => getTestimonialById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook para crear testimonio
export const useCreateTestimonial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrUpdateTestimonialPayload) => createTestimonial(data),
    onSuccess: () => {
      // Invalidar lista de testimonios
      queryClient.invalidateQueries({ queryKey: testimonialsKeys.lists() });
    },
  });
};

// Hook para actualizar testimonio
export const useUpdateTestimonial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOrUpdateTestimonialPayload }) => 
      updateTestimonial(id, data),
    onSuccess: (_, variables) => {
      // Invalidar lista y detalle
      queryClient.invalidateQueries({ queryKey: testimonialsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testimonialsKeys.detail(variables.id) });
    },
  });
};

// Hook para eliminar testimonio
export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteTestimonial(id),
    onSuccess: () => {
      // Invalidar lista de testimonios
      queryClient.invalidateQueries({ queryKey: testimonialsKeys.lists() });
    },
  });
};


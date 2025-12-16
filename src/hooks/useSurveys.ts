import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SurveysService, { 
  SurveysListParams, 
  SurveyCreateRequestPayload, 
  SurveyUpdateRequestPayload,
  Survey
} from '../services/surveysService';

// Query Keys
export const surveysKeys = {
  all: ['surveys'] as const,
  lists: () => [...surveysKeys.all, 'list'] as const,
  list: (params: SurveysListParams) => [...surveysKeys.lists(), params] as const,
  details: () => [...surveysKeys.all, 'detail'] as const,
  detail: (id: string) => [...surveysKeys.details(), id] as const,
};

// Hook para obtener lista de encuestas
export const useSurveysList = (params: SurveysListParams = {}) => {
  return useQuery({
    queryKey: surveysKeys.list(params),
    queryFn: () => SurveysService.getSurveysList(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obtener encuesta por ID
export const useSurveyById = (surveyId: string) => {
  return useQuery({
    queryKey: surveysKeys.detail(surveyId),
    queryFn: () => SurveysService.getSurveyById(surveyId),
    enabled: !!surveyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook para crear encuesta
export const useCreateSurvey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SurveyCreateRequestPayload) => SurveysService.createSurvey(data),
    onSuccess: () => {
      // Invalidar lista de encuestas
      queryClient.invalidateQueries({ queryKey: surveysKeys.lists() });
    },
  });
};

// Hook para actualizar encuesta
export const useUpdateSurvey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SurveyUpdateRequestPayload }) => 
      SurveysService.updateSurvey(id, data),
    onSuccess: (_, variables) => {
      // Invalidar lista y detalle
      queryClient.invalidateQueries({ queryKey: surveysKeys.lists() });
      queryClient.invalidateQueries({ queryKey: surveysKeys.detail(variables.id) });
    },
  });
};

// Hook para eliminar encuesta
export const useDeleteSurvey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => SurveysService.deleteSurvey(id),
    onSuccess: () => {
      // Invalidar lista de encuestas
      queryClient.invalidateQueries({ queryKey: surveysKeys.lists() });
    },
  });
};


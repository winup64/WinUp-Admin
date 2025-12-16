import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { generateId } from '../utils';

const normalizeImageUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.toString().trim();
  if (!trimmed || trimmed.length === 0) return null;
  if (trimmed.startsWith('blob:')) return null;
  return trimmed;
};

// Interfaces para la API de Encuestas
export interface SurveyOption {
  option_id?: string;
  text: string;
  image_url?: string | null;
  imageUrl?: string | null;
  order?: number;
  option_text?: string;
  option_order?: number;
  value?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SurveyQuestion {
  question_id?: string;
  survey_id?: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating';
  required: boolean;
  order: number;
  image_url?: string | null;
  imageUrl?: string | null;
  options?: SurveyOption[];
  created_at?: string;
  updated_at?: string;
}

export interface Survey {
  survey_id?: string;
  title: string;
  description: string;
  image_url?: string | null;
  imageUrl?: string | null;
  is_active: boolean;
  status?: 'active' | 'inactive';
  points_earned?: number | null;
  questions: SurveyQuestion[];
  questions_count?: number;
  total_questions?: number;
  questionCount?: number;
  totalQuestions?: number;
  _count?: { questions?: number };
  created_at?: string;
  updated_at?: string;
}

export interface SurveysListResponse {
  status: number;
  message: string;
  data: Survey[];
  total: number;
  timestamp: string;
}

export interface SurveysListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  is_active?: boolean;
}

export interface CreateSurveyData {
  title: string;
  description: string;
  image_url?: string | null;
  is_active: boolean;
  status?: 'active' | 'inactive';
  points_earned?: number | null;
  questions: SurveyQuestion[];
}

export interface UpdateSurveyData extends Partial<CreateSurveyData> {
  survey_id?: string;
}

export interface SurveySubmissionMediaFiles {
  surveyImage?: File | null;
  questionImages?: Array<File | null>;
}

export interface SurveyCreateRequestPayload {
  dto: CreateSurveyData;
  media?: SurveySubmissionMediaFiles;
}

export interface SurveyUpdateRequestPayload {
  dto: UpdateSurveyData;
  media?: SurveySubmissionMediaFiles;
}

// Interfaces para respuestas de encuestas
export interface SurveyResponseAnswer {
  questionId: string;
  answer: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  answers: SurveyResponseAnswer[];
  completedAt: string;
  isCompleted: boolean;
}

export interface SurveyResponsesListParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  isCompleted?: boolean;
}

export interface SurveyResponsesResponse {
  status: number;
  message: string;
  data: SurveyResponse[];
  total: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface AnalyticsParams {
  page?: number;
  limit?: number;
}

export interface AnalyticsResponse {
  status: number;
  message: string;
  data: {
    totalResponses: number;
    completedResponses: number;
    incompleteResponses: number;
    questionStats: Array<{
      questionId: string;
      questionText: string;
      questionType: 'text' | 'multiple_choice' | 'rating';
      totalAnswers: number;
      distribution?: { [key: string]: number };
      average?: number;
      wordFrequency?: Array<{ text: string; count: number }>;
    }>;
  };
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalQuestions: number;
  };
}

export interface UserSurveyListParams {
  page?: number;
  limit?: number;
  title?: string;
  is_active?: boolean;
}

export interface SurveyOptionResponse {
  option_id: string;
  option_text: string;
  image_url: string | null;
  option_order: number;
}

export interface SurveyQuestionResponse {
  question_id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'rating';
  image_url: string | null;
  required: boolean;
  question_order: number;
  options: SurveyOptionResponse[];
}

export interface UserSurveyDetailResponse {
  survey_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  points_earned: number | null;
  is_active: boolean;
  questions: SurveyQuestionResponse[];
}

export interface SurveyAnswer {
  question_id: string;
  answer_text?: string;
  selected_option_id?: string;
}

export interface SubmitSurveyResponse {
  survey_id: string;
  completed: boolean;
  user_id?: string;
  answers: SurveyAnswer[];
}

class SurveysService {
  private static appendFiles(formData: FormData, files?: Array<File | null>, fieldName?: string) {
    if (!files || !fieldName) return;
    files.forEach((file, idx) => {
      if (file) {
        formData.append(fieldName, file);
      }
    });
  }

  private static buildSurveyFormData(payload: SurveyCreateRequestPayload | SurveyUpdateRequestPayload) {
    const formData = new FormData();
    formData.append('dto', JSON.stringify(payload.dto));

    if (payload.media?.surveyImage) {
      formData.append('image', payload.media.surveyImage);
    }

    SurveysService.appendFiles(formData, payload.media?.questionImages, 'question_images');

    return formData;
  }

  private static readonly DEFAULT_RATING_OPTIONS = ['1', '2', '3', '4', '5'];

  private static mapApiQuestionTypeToClient(type: any): 'text' | 'multiple_choice' | 'rating' {
    if (type === 'text' || type === 'multiple_choice' || type === 'rating') return type;
    switch (String(type)) {
      case 'opcion_multiple':
        return 'multiple_choice';
      case 'respuesta_corta':
        return 'text';
      case 'verdadero_falso':
        return 'multiple_choice';
      case 'ordenamiento':
        return 'multiple_choice';
      default:
        return 'text';
    }
  }
  // Obtener lista de encuestas
  static async getSurveysList(params: SurveysListParams = {}): Promise<SurveysListResponse> {
    try {
      const safeLimit = Math.min(Math.max((params.limit ?? 6), 1), 50);
      const query = ((): Record<string, any> => {
        const q: Record<string, any> = {
          page: params.page || 1,
          limit: safeLimit,
          status: params.status,
          search: params.search,
        is_active: params.is_active,
        };
        Object.keys(q).forEach((k) => {
          const v = q[k];
          if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
            delete q[k];
          }
        });
        return q;
      })();

      let response;
      try {
        const url = API_ENDPOINTS.SURVEYS_ADMIN.LIST;
        response = await apiClient.get(url, { params: query });
      } catch (err: any) {
        // Fallback: si el backend valida estrictamente los params, reintentar sin query
        if (err?.response?.status === 400) {
          
          const url = API_ENDPOINTS.SURVEYS_ADMIN.LIST;
          response = await apiClient.get(url);
        } else {
          throw err;
        }
      }

      // Tolerancia a distintos formatos de respuesta
      const raw: any = response.data;
      
      if (raw && Array.isArray(raw.data)) {
        return raw as SurveysListResponse;
      }
      if (raw && raw.data && Array.isArray(raw.data?.surveys)) {
        return {
          status: typeof raw.status === 'number' ? raw.status : 200,
          message: raw.message || '',
          data: raw.data.surveys as Survey[],
          total: Number(raw.total ?? raw.data.total ?? (raw.data.surveys?.length ?? 0)),
          timestamp: raw.timestamp || new Date().toISOString(),
        } as SurveysListResponse;
      }
      if (Array.isArray(raw)) {
        return {
          status: 200,
          message: '',
          data: raw as Survey[],
          total: (raw as Survey[]).length,
          timestamp: new Date().toISOString(),
        } as SurveysListResponse;
      }
      return raw as SurveysListResponse;
    } catch (error: any) {
      throw error;
    }
  }

  // Obtener encuesta por ID
  static async getSurveyById(surveyId: string): Promise<ApiResponse<Survey & { responses_count?: number }>> {
    try {
      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.GET}/${encodeURIComponent(surveyId)}`;
      const response = await apiClient.get(url);
      const payload: any = response.data;
      const data: Survey = payload?.data?.survey ?? payload?.survey ?? payload?.data ?? payload;
      
      // Extraer responses_count del nivel raíz de la respuesta
      const responsesCount = payload?.responses_count ?? 0;
      
      
      
      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data: {
          ...data,
          responses_count: responsesCount  // Agregar responses_count al objeto data
        } as any,
        timestamp: payload?.timestamp || new Date().toISOString(),
      } as ApiResponse<Survey & { responses_count?: number }>;
    } catch (error: any) {
      throw error;
    }
  }

  // Crear nueva encuesta
  static async createSurvey(payload: SurveyCreateRequestPayload): Promise<ApiResponse<Survey>> {
    try {
      const url = API_ENDPOINTS.SURVEYS_ADMIN.CREATE;
      const formData = SurveysService.buildSurveyFormData(payload);
      const response = await apiClient.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const raw: any = response.data;
      const data: Survey = raw?.data ?? raw;
      
      return {
        status: typeof raw?.status === 'number' ? raw.status : 201,
        message: raw?.message || '',
        data,
        timestamp: raw?.timestamp || new Date().toISOString(),
      } as ApiResponse<Survey>;
    } catch (error: any) {
      throw error;
    }
  }

  // Actualizar encuesta
  static async updateSurvey(surveyId: string, payload: SurveyUpdateRequestPayload): Promise<ApiResponse<Survey>> {
    try {
      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.UPDATE}/${encodeURIComponent(surveyId)}`;
      const formData = SurveysService.buildSurveyFormData(payload);
      const response = await apiClient.patch(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const raw: any = response.data;
      const data: Survey = raw?.data ?? raw;
      
      return {
        status: typeof raw?.status === 'number' ? raw.status : 200,
        message: raw?.message || '',
        data,
        timestamp: raw?.timestamp || new Date().toISOString(),
      } as ApiResponse<Survey>;
    } catch (error: any) {
      throw error;
    }
  }

  // Eliminar encuesta
  static async deleteSurvey(surveyId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.DELETE}/${encodeURIComponent(surveyId)}`;
      const response = await apiClient.delete(url);
      const payload: any = response.data;
      
      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data: { message: payload?.message || 'OK' },
        timestamp: payload?.timestamp || new Date().toISOString(),
      } as ApiResponse<{ message: string }>;
    } catch (error: any) {
      throw error;
    }
  }

  // Función helper para mapear datos del frontend a la API
  static mapSurveyToAPI(survey: any): CreateSurveyData {
    // El backend maneja is_active internamente, usamos status como fuente de verdad
    const status = survey.status || (survey.isActive ? 'active' : 'inactive');
    return {
      title: survey.title,
      description: survey.description,
      image_url: normalizeImageUrl(survey.imageUrl ?? survey.image_url ?? null),
      is_active: true, // Siempre true, el backend lo maneja internamente
      status: status,
      points_earned: survey.pointsEarned !== undefined && survey.pointsEarned !== '' ? Number(survey.pointsEarned) : null,
      questions: survey.questions.map((question: any, index: number) => {
        const order = question.order !== undefined ? question.order : index + 1;
        const base = {
          text: question.text,
          type: question.type,
          required: question.required,
          order,
          image_url: normalizeImageUrl(question.imageUrl ?? (question as any).image_url),
        } as SurveyQuestion;

        if (question.type === 'text') {
          return base;
        }

        const rawOptions = Array.isArray(question.options) ? question.options : [];
        let normalizedOptions = rawOptions
          .map((option: any, optIndex: number) => {
            const text = typeof option === 'string' ? option : option?.text;
            const trimmed = text?.toString().trim();
            if (!trimmed) return null;
            return {
              text: trimmed,
              image_url: null, // Las opciones ya no soportan imágenes
              order: option?.order ?? optIndex + 1,
            };
          })
          .filter(Boolean) as SurveyOption[];

        if (question.type === 'multiple_choice') {
          if (normalizedOptions.length < 2) {
            normalizedOptions = [
              { text: 'Opción 1', image_url: null, order: 1 },
              { text: 'Opción 2', image_url: null, order: 2 },
            ];
          }
        } else if (question.type === 'rating') {
          normalizedOptions = SurveysService.DEFAULT_RATING_OPTIONS.map((value, idx) => ({
            text: value,
            image_url: null,
            order: idx + 1,
          }));
        }

        return {
          ...base,
          options: normalizedOptions.map((opt, idx) => ({
            text: opt.text,
            image_url: null, // Las opciones ya no soportan imágenes - siempre null
            order: opt.order ?? idx + 1,
          })),
        };
      }),
    };
  }

  // Función helper para mapear datos de la API al frontend
  static mapSurveyFromAPI(apiSurvey: Survey & { responses_count?: number; questions_count?: number; total_questions?: number; questionCount?: number }): any {
    // status es la fuente de verdad, is_active siempre es true en el backend
    const status = apiSurvey.status || (apiSurvey.is_active ? 'active' : 'inactive');
    const isActive = status === 'active';
    
    // Capturar el conteo de preguntas del API si está disponible
    const questionsCount = 
      (apiSurvey as any).questions_count ?? 
      (apiSurvey as any).total_questions ?? 
      (apiSurvey as any).questionCount ?? 
      (apiSurvey as any).totalQuestions ??
      (apiSurvey as any)?._count?.questions ??
      null;
    
    return {
      id: apiSurvey.survey_id,
      title: apiSurvey.title,
      description: apiSurvey.description,
      imageUrl: normalizeImageUrl(apiSurvey.image_url ?? apiSurvey.imageUrl ?? null),
      isActive: isActive, // Para compatibilidad con el código existente
      status: status, // Campo real que controla el estado
      pointsEarned: apiSurvey.points_earned !== undefined && apiSurvey.points_earned !== null ? apiSurvey.points_earned : null,
      questions: (apiSurvey.questions || []).map((question, index) => {
        const type = this.mapApiQuestionTypeToClient((question as any).type);
        const mappedOptions =
          (question.options || [])
            .map((option) => ({
              id: option.option_id ?? generateId(),
              text: option.option_text ?? option.text ?? option.value ?? '',
              imageUrl: normalizeImageUrl(option.image_url ?? option.imageUrl ?? null),
              order: option.option_order ?? option.order,
            }))
            .filter((opt) => typeof opt.text === 'string' && opt.text.trim().length > 0) || [];

        const fallbackOptions =
          type === 'rating'
            ? SurveysService.DEFAULT_RATING_OPTIONS.map((value, optIndex) => ({
                id: generateId(),
                text: value,
                imageUrl: null,
                order: optIndex + 1,
              }))
            : [
                { id: generateId(), text: '', imageUrl: null, order: 1 },
                { id: generateId(), text: '', imageUrl: null, order: 2 },
              ];

        return {
          id: question.question_id ?? generateId(),
          text: question.text,
          type,
          required: question.required,
          order: question.order !== undefined ? question.order : index + 1,
          imageUrl: normalizeImageUrl((question as any).image_url ?? (question as any).imageUrl ?? null),
          options:
            type === 'text'
              ? []
              : (mappedOptions.length > 0 ? mappedOptions : fallbackOptions).map((opt, optIndex) => {
                  const optAny = opt as any;
                  return {
                    ...opt,
                    id: optAny.id ?? generateId(),
                    imageUrl: optAny.imageUrl ?? optAny.image_url ?? null,
                    order: optAny.order ?? optIndex + 1,
                  };
                }),
          created_at: question.created_at,
          updated_at: question.updated_at,
        };
      }),
      responses: apiSurvey.responses_count ?? 0, // ✅ Ahora usa responses_count de la API
      // Preservar el conteo de preguntas del API si está disponible
      questions_count: questionsCount,
      total_questions: questionsCount,
      questionCount: questionsCount,
      totalQuestions: questionsCount,
      created_at: apiSurvey.created_at,
      updated_at: apiSurvey.updated_at,
    };
  }

  // Obtener respuestas de una encuesta
  static async getSurveyResponses(surveyId: string, params: SurveyResponsesListParams = {}): Promise<SurveyResponsesResponse> {
    try {
      const query = ((): Record<string, any> => {
        const q: Record<string, any> = {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search,
          from: params.from,
          to: params.to,
          isCompleted: params.isCompleted,
        };
        Object.keys(q).forEach((k) => {
          const v = q[k];
          if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
            delete q[k];
          }
        });
        return q;
      })();

      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.GET}/${encodeURIComponent(surveyId)}/responses`;
      
      const response = await apiClient.get(url, { params: query });
      
      const payload: any = response.data;
      
      
      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data: payload?.data || [],
        total: payload?.total || 0,
        timestamp: payload?.timestamp || new Date().toISOString(),
      } as SurveyResponsesResponse;
    } catch (error: any) {
      throw error;
    }
  }

  // Obtener detalle de una respuesta específica
  static async getSurveyResponseById(surveyId: string, responseId: string): Promise<ApiResponse<SurveyResponse>> {
    try {
      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.GET}/${encodeURIComponent(surveyId)}/responses/${encodeURIComponent(responseId)}`;
      const response = await apiClient.get(url);
      
      const payload: any = response.data;
      
      
      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data: payload?.data || payload,
        timestamp: payload?.timestamp || new Date().toISOString(),
      } as ApiResponse<SurveyResponse>;
    } catch (error: any) {
      throw error;
    }
  }

  // Obtener análisis con paginación (para conectar con backend real)
  static async getSurveyAnalyticsPaginated(surveyId: string, params: AnalyticsParams = {}): Promise<AnalyticsResponse> {
    try {
      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.ANALYTICS}/${encodeURIComponent(surveyId)}/analytics`;
      
      const safeLimit = Math.min(Math.max((params.limit ?? 10), 1), 50);
      const response = await apiClient.get(url, {
        params: {
          page: params.page || 1,
          limit: safeLimit,
        }
      });
      
      const raw: any = response.data;

      // Normalizar la respuesta para tolerar distintos formatos del backend
      const sourceData = raw?.data ?? raw ?? {};

      const totalResponses =
        sourceData.totalResponses ??
        sourceData.total_responses ??
        0;

      const completedResponses =
        sourceData.completedResponses ??
        sourceData.completed_responses ??
        0;

      const incompleteResponses =
        sourceData.incompleteResponses ??
        sourceData.incomplete_responses ??
        0;

      const rawQuestionStats =
        sourceData.questionStats ??
        sourceData.question_stats ??
        [];

      const questionStats = Array.isArray(rawQuestionStats)
        ? rawQuestionStats.map((q: any) => ({
            questionId: q.questionId ?? q.question_id ?? '',
            questionText: q.questionText ?? q.question_text ?? '',
            questionType: SurveysService.mapApiQuestionTypeToClient(
              q.questionType ?? q.question_type
            ),
            totalAnswers: q.totalAnswers ?? q.total_answers ?? 0,
            distribution: q.distribution,
            average: q.average,
            wordFrequency: q.wordFrequency ?? q.word_frequency,
          }))
        : [];

      const rawPagination = raw?.pagination ?? raw?.meta ?? {};

      const pagination = {
        page: rawPagination.page ?? rawPagination.current_page ?? (params.page || 1),
        limit: rawPagination.limit ?? rawPagination.per_page ?? safeLimit,
        totalPages:
          rawPagination.totalPages ??
          rawPagination.total_pages ??
          1,
        totalQuestions:
          rawPagination.totalQuestions ??
          rawPagination.total_questions ??
          questionStats.length,
      };

      const normalized: AnalyticsResponse = {
        status: typeof raw?.status === 'number' ? raw.status : 200,
        message: raw?.message || '',
        data: {
          totalResponses,
          completedResponses,
          incompleteResponses,
          questionStats,
        },
        pagination,
      };

      return normalized;
    } catch (error: any) {
      throw error;
    }
  }

  static async exportSurveyAnalytics(surveyId: string, format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    try {
      const url = `${API_ENDPOINTS.SURVEYS_ADMIN.ANALYTICS_EXPORT}/${encodeURIComponent(surveyId)}/analytics/export`;
      const response = await apiClient.get(url, {
        params: { format },
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error) {
      throw error;
    }
  }

  static async getUserSurveys(params: UserSurveyListParams = {}) {
    try {
      const query = {
        page: params.page || 1,
        limit: params.limit || 10,
        title: params.title,
        is_active: params.is_active ?? true,
      };
      Object.keys(query).forEach((key) => {
        const value = (query as any)[key];
        if (value === undefined || value === null || value === '') {
          delete (query as any)[key];
        }
      });
      const response = await apiClient.get(API_ENDPOINTS.USER_SURVEYS.LIST, { params: query });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getUserSurveyById(surveyId: string): Promise<ApiResponse<UserSurveyDetailResponse>> {
    try {
      const url = `${API_ENDPOINTS.USER_SURVEYS.GET}/${encodeURIComponent(surveyId)}`;
      const response = await apiClient.get(url);
      const payload: any = response.data;
      const data: UserSurveyDetailResponse = payload?.data ?? payload;

      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data,
        timestamp: payload?.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  static async submitSurveyResponses(surveyId: string, body: SubmitSurveyResponse): Promise<ApiResponse<{ message: string }>> {
    try {
      const url = `${API_ENDPOINTS.USER_SURVEYS.RESPONSES}/${encodeURIComponent(surveyId)}/responses`;
      const response = await apiClient.post(url, body);
      const payload: any = response.data;
      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data: payload?.data ?? { message: payload?.message || 'OK' },
        timestamp: payload?.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  static async getUserSurveyResult(surveyId: string): Promise<ApiResponse<any>> {
    try {
      const url = `${API_ENDPOINTS.USER_SURVEYS.RESULT}/${encodeURIComponent(surveyId)}/result`;
      const response = await apiClient.get(url);
      const payload: any = response.data;
      return {
        status: typeof payload?.status === 'number' ? payload.status : 200,
        message: payload?.message || '',
        data: payload?.data ?? payload,
        timestamp: payload?.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  static validateAnswer(question: SurveyQuestionResponse, answer: SurveyAnswer): string | null {
    if (question.question_type === 'text') {
      if (!answer.answer_text || answer.answer_text.trim().length === 0) {
        return 'La respuesta de texto es obligatoria';
      }
      if (answer.answer_text.length > 150) {
        return 'La respuesta no puede exceder 150 caracteres';
      }
      if (answer.selected_option_id) {
        return 'No se permite seleccionar opción en preguntas de texto';
      }
    } else if (question.question_type === 'multiple_choice' || question.question_type === 'rating') {
      if (!answer.selected_option_id) {
        return 'Debes seleccionar una opción válida';
      }
      const optionExists = question.options.some((opt) => opt.option_id === answer.selected_option_id);
      if (!optionExists) {
        return 'La opción seleccionada no es válida';
      }
      if (answer.answer_text) {
        return 'No se permite respuesta de texto en preguntas de opción múltiple o calificación';
      }
    }
    return null;
  }

}

export default SurveysService;

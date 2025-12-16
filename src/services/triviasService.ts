import apiClient from '../config/axios';
import { API_ENDPOINTS, TOKEN_STORAGE_KEYS } from '../config/api';

// Tipos simples basados en el contrato del backend compartido
export interface TriviaOptionDTO {
  texto: string;
  esCorrecta: boolean;
  orden?: number;
  answerId?: string;
}

export interface TriviaQuestionDTO {
  texto: string;
  puntos: number;
  tiempoSegundos?: number;
  imagen?: string;
  opciones: TriviaOptionDTO[];
  id?: string;
}

export interface TriviaOptionPayload {
  texto: string;
  esCorrecta: boolean;
}

export interface TriviaQuestionPayload {
  texto: string;
  puntos: number;
  imagen?: string;
  opciones: TriviaOptionPayload[];
}

export type DificultadDTO = 'FACIL' | 'MEDIO' | 'DIFICIL' | 'facil' | 'medio' | 'dificil';

export interface TriviaDTO {
  id?: string;
  nombre: string;
  categoria: string;
  dificultad: DificultadDTO;
  estado: 'activa' | 'inactiva' | string;
  duracion: number;
  activacion: 'manual' | 'programada' | string;
  fechaActivacion?: string;
  tiempoPorPregunta?: number;
  time_per_question?: number;
  preguntas: TriviaQuestionDTO[];
}

export interface TriviaUpsertPayload {
  nombre: string;
  categoria?: string;
  dificultad: DificultadDTO;
  estado: 'activa' | 'inactiva';
  imagen?: string;
  duracion?: number;
  activacion?: 'manual' | 'programada';
  fechaActivacion?: string;
  preguntas?: TriviaQuestionPayload[];
}

export interface TriviasListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string; // UUID de la categoría (ej: c0f29735-5413-4e81-bc72-15e0d870d3d6)
  difficulty?: string; // FACIL, MEDIO, DIFICIL (mayúsculas)
  status?: string; // active, inactive
  activation_type?: string; // manual, programada
}

export interface ListTriviasResponse {
  status?: number;
  message?: string;
  total?: number;
  data: TriviaDTO[];
  pagination?: { page: number; limit: number; totalPages: number };
}

export class TriviasService {
  private static mapQuestionToApiPayload(question: TriviaQuestionDTO) {
    const timeSeconds =
      question.tiempoSegundos ??
      (question as any)?.tiempo_segundos ??
      (question as any)?.time_seconds ??
      30;
    return {
      question_text: question.texto,
      points: question.puntos,
      time_seconds: timeSeconds,
      image_url: question.imagen,
      options: (question.opciones || []).map((option, idx) => ({
        answer_text: option.texto,
        is_correct: option.esCorrecta,
        answer_order: option.orden ?? option.answerId ?? idx + 1,
      })),
    };
  }

  private static async withRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1,
    maxAttempts: number = 3
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.response?.status;
      const isAbort = error?.name === 'AbortError';
      // No reintentar en abort o en 4xx excepto 429
      if (isAbort || (status && status >= 400 && status !== 429 && status < 500)) {
        throw error;
      }
      if (attempt >= maxAttempts) {
        throw error;
      }
      // Calcular backoff
      let delayMs = 500 * Math.pow(2, attempt - 1); // 500, 1000
      if (status === 429) {
        const retryAfterHeader = error?.response?.headers?.['retry-after'];
        const retryAfterSec = Number(retryAfterHeader);
        if (!Number.isNaN(retryAfterSec) && retryAfterSec > 0) {
          delayMs = Math.min(10000, retryAfterSec * 1000);
        }
      }
      // Pequeño jitter
      delayMs += Math.floor(Math.random() * 150);
      await new Promise((res) => setTimeout(res, delayMs));
      return this.withRetry(fn, attempt + 1, maxAttempts);
    }
  }

  static async list(params?: TriviasListParams, signal?: AbortSignal): Promise<ListTriviasResponse> {
    const exec = async () => {
      const response = await apiClient.get<ListTriviasResponse | TriviaDTO[] | any>(
        API_ENDPOINTS.TRIVIAS_ADMIN.LIST,
        { 
          params,
          signal 
        }
      );
      // Algunos endpoints devuelven { data: [...] }, otros devuelven [ ... ] o { data: { trivias: [...] } }
      const raw = (response as any).data;
      let items: any[] = [];
      if (Array.isArray(raw)) items = raw;
      else if (Array.isArray(raw?.data)) items = raw.data;
      else if (Array.isArray(raw?.data?.trivias)) items = raw.data.trivias;
      else if (Array.isArray(raw?.trivias)) items = raw.trivias;
      // Normalizar para asegurar que cada item tenga 'id'
      const normalized = items.map((it) => ({
        ...it,
        id: it?.id || it?._id || it?.trivia_id || it?.triviaId || it?.uuid,
      }));
      if (Array.isArray(raw)) {
        return { data: normalized } as ListTriviasResponse;
      }
      return { ...(raw || {}), data: normalized } as ListTriviasResponse;
    };
    return this.withRetry(exec);
  }

  static async getById(id: string, signal?: AbortSignal): Promise<TriviaDTO> {
    const exec = async () => {
      const response = await apiClient.get<{ data?: TriviaDTO } | TriviaDTO | any>(
        `${API_ENDPOINTS.TRIVIAS_ADMIN.GET}/${encodeURIComponent(id)}`,
        { signal }
      );
      const payload: any = response.data;
      const obj = payload?.data?.trivia ?? payload?.trivia ?? payload?.data ?? payload;
      return obj;
    };
    return this.withRetry(exec);
  }

  static async create(payload: TriviaUpsertPayload | FormData): Promise<TriviaDTO> {
    const exec = async () => {
      const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
      const body = isForm ? (payload as any) : ({ dto: payload } as any);
      
      // Asegurar que el token se envíe incluso con FormData
      const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
      const headers: any = {};
      
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      
      if (!isForm) {
        headers['Content-Type'] = 'application/json';
      }
      // Con FormData, no establecer Content-Type (axios lo hace automáticamente con el boundary)
      
      const response = await apiClient.post<{ data?: TriviaDTO } | TriviaDTO>(
        API_ENDPOINTS.TRIVIAS_ADMIN.CREATE,
        body,
        { headers }
      );
      const data: any = response.data;
      return data?.data ?? data;
    };
    return this.withRetry(exec);
  }

  static async update(id: string, payload: TriviaUpsertPayload | FormData): Promise<TriviaDTO> {
    const exec = async () => {
      const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
      const body = isForm ? (payload as any) : ({ dto: payload } as any);
      
      // Asegurar que el token se envíe incluso con FormData
      const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
      const headers: any = {};
      
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      
      if (!isForm) {
        headers['Content-Type'] = 'application/json';
      }
      // Con FormData, no establecer Content-Type (axios lo hace automáticamente con el boundary)
      
      const response = await apiClient.patch<{ data?: TriviaDTO } | TriviaDTO | any>(
        `${API_ENDPOINTS.TRIVIAS_ADMIN.UPDATE}/${encodeURIComponent(id)}`,
        body,
        { headers }
      );
      const data: any = response.data;
      const obj = data?.data?.trivia ?? data?.trivia ?? data?.data ?? data;
      return obj;
    };
    return this.withRetry(exec);
  }

  static async createQuestion(triviaId: string, question: TriviaQuestionDTO) {
    const exec = async () => {
      const response = await apiClient.post(
        `${API_ENDPOINTS.TRIVIAS_ADMIN.GET}/${encodeURIComponent(triviaId)}/questions`,
        TriviasService.mapQuestionToApiPayload(question)
      );
      return response.data;
    };
    return this.withRetry(exec);
  }

  static async updateQuestion(triviaId: string, questionId: string, question: TriviaQuestionDTO) {
    const exec = async () => {
      const response = await apiClient.patch(
        `${API_ENDPOINTS.TRIVIAS_ADMIN.GET}/${encodeURIComponent(triviaId)}/questions/${encodeURIComponent(questionId)}`,
        TriviasService.mapQuestionToApiPayload(question)
      );
      return response.data;
    };
    return this.withRetry(exec);
  }

  static async remove(id: string): Promise<{ message?: string } | void> {
    const exec = async () => {
      const response = await apiClient.delete(
        `${API_ENDPOINTS.TRIVIAS_ADMIN.DELETE}/${encodeURIComponent(id)}`
      );
      return response.data;
    };
    return this.withRetry(exec);
  }
}

export default TriviasService;



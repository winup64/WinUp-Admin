// Utilidades para manejo de API

import { ApiErrorResponse, ApiResponse } from '../types/api';

/**
 * Manejar errores de API de forma consistente
 */
export const handleApiError = (error: any): ApiErrorResponse => {
  // Error de red
  if (!error.response) {
    return {
      timestamp: new Date().toISOString(),
      status: 0,
      error: 'Network Error',
      message: 'Error de conexión. Verifica tu conexión a internet.',
      path: error.config?.url || 'unknown',
    };
  }

  // Error de la API
  const { status, data } = error.response;
  
  return {
    timestamp: data?.timestamp || new Date().toISOString(),
    status: status,
    error: data?.error || 'Unknown Error',
    message: data?.message || 'Error desconocido',
    path: data?.path || error.config?.url || 'unknown',
    details: data?.details,
  };
};

/**
 * Extraer mensaje de error amigable
 */
export const getErrorMessage = (error: ApiErrorResponse): string => {
  switch (error.status) {
    case 400:
      return 'Datos inválidos. Verifica la información ingresada.';
    case 401:
      return 'Credenciales inválidas. Verifica tu email y contraseña.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 409:
      return 'Conflicto. El recurso ya existe.';
    case 422:
      return 'Datos de entrada inválidos.';
    case 429:
      return 'Demasiadas solicitudes. Intenta más tarde.';
    case 500:
      return 'Error interno del servidor. Intenta más tarde.';
    case 502:
      return 'Servidor no disponible. Intenta más tarde.';
    case 503:
      return 'Servicio temporalmente no disponible.';
    default:
      return error.message || 'Error desconocido';
  }
};

/**
 * Verificar si es un error de autenticación
 */
export const isAuthError = (error: ApiErrorResponse): boolean => {
  return error.status === 401 || error.status === 403;
};

/**
 * Verificar si es un error de red
 */
export const isNetworkError = (error: ApiErrorResponse): boolean => {
  return error.status === 0;
};

/**
 * Verificar si es un error del servidor
 */
export const isServerError = (error: ApiErrorResponse): boolean => {
  return error.status >= 500;
};

/**
 * Verificar si es un error del cliente
 */
export const isClientError = (error: ApiErrorResponse): boolean => {
  return error.status >= 400 && error.status < 500;
};

/**
 * Crear respuesta de éxito estándar
 */
export const createSuccessResponse = <T>(data: T, message: string = 'Operación exitosa'): ApiResponse<T> => {
  return {
    status: 200,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Crear respuesta de error estándar
 */
export const createErrorResponse = (status: number, message: string, path: string = 'unknown'): ApiErrorResponse => {
  return {
    timestamp: new Date().toISOString(),
    status,
    error: getStatusText(status),
    message,
    path,
  };
};

/**
 * Obtener texto del status HTTP
 */
const getStatusText = (status: number): string => {
  const statusTexts: { [key: number]: string } = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  
  return statusTexts[status] || 'Unknown';
};

/**
 * Retry logic para requests fallidos
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // No reintentar errores de autenticación o del cliente
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

/**
 * Debounce para requests
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle para requests
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Validar email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar contraseña
 */
export const isValidPassword = (password: string): boolean => {
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Formatear fecha para la API
 */
export const formatDateForApi = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parsear fecha de la API
 */
export const parseDateFromApi = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Sanitizar datos para la API
 */
export const sanitizeForApi = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForApi);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = sanitizeForApi(value);
    }
  }
  
  return sanitized;
};

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, API_HEADERS, TOKEN_STORAGE_KEYS, API_ENDPOINTS } from './api';
import { RefreshTokenResponse } from '../types/api';
import { getTokenTimeRemaining } from '../utils/tokens';
import { queryClient } from './queryClient';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_HEADERS,
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.AUTH_TIMEOUT,
  headers: API_HEADERS,
});

const slowOperationClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.RESET_TIMEOUT,
  headers: API_HEADERS,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAuthEndpoint = config.url?.includes('/auth/');

    if (!isAuthEndpoint) {
      try {
        const remainingSeconds = getTokenTimeRemaining();
        const SHOULD_REFRESH_MARGIN_S = 30;
        if (remainingSeconds > 0 && remainingSeconds <= SHOULD_REFRESH_MARGIN_S) {
          if (isRefreshing && refreshPromise) {
            await refreshPromise;
          } else {
            isRefreshing = true;
            refreshPromise = refreshWithRetry();
            try {
              await refreshPromise;
            } catch (_) {
            } finally {
              isRefreshing = false;
              refreshPromise = null;
            }
          }
        }
      } catch (_) {
      }
    }

    if (config.data instanceof FormData) {
      const hdrs: any = config.headers as any;
      if (hdrs && typeof hdrs.delete === 'function') {
        try { hdrs.delete('Content-Type'); } catch (_) {}
        try { hdrs.delete('content-type'); } catch (_) {}
      }
      try { delete hdrs['Content-Type']; } catch (_) {}
      try { delete hdrs['content-type']; } catch (_) {}
    }

    const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

declare module 'axios' {
  export interface InternalAxiosRequestConfig<D = any> {
    metadata?: { startTime?: number };
  }
}

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as RetriableRequest;
    
    const isAuthEndpoint = originalRequest.url?.includes('/auth/') && 
      (originalRequest.url?.includes('/login') || 
       originalRequest.url?.includes('/refresh') || 
       originalRequest.url?.includes('/forgot-password') || 
       originalRequest.url?.includes('/reset-password') ||
       originalRequest.url?.includes('/logout'));
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          const newAccessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          handleRefreshFailure();
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = true;
        refreshPromise = refreshWithRetry();
        
        try {
          await refreshPromise;
          const newAccessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          handleRefreshFailure();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

async function refreshTokens(): Promise<void> {
  const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await refreshClient.post<{ data: RefreshTokenResponse }>(API_ENDPOINTS.AUTH.REFRESH, {
    refreshToken,
  });
  
  const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
  
  if (!accessToken || !newRefreshToken || !expiresIn) {
    throw new Error('Respuesta de refresh inválida: faltan campos requeridos');
  }

  if (typeof expiresIn !== 'number' || expiresIn <= 0) {
    throw new Error('Respuesta de refresh inválida: expiresIn debe ser un número positivo');
  }

  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Token de acceso inválido');
  }

  if (typeof newRefreshToken !== 'string' || newRefreshToken.length === 0) {
    throw new Error('Token de refresh inválido');
  }
  
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + (expiresIn * 1000)).toString());
  } catch (error) {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
    throw new Error('Error al guardar tokens en localStorage');
  }
}

async function refreshWithRetry(maxRetries = 2, baseDelayMs = 500): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      await refreshTokens();
      return;
    } catch (err: any) {
      const status = err?.response?.status;
      const isTransient = !status || (status >= 500 && status < 600);
      if (attempt >= maxRetries || !isTransient) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(res => setTimeout(res, delay));
      attempt++;
    }
  }
}

function handleRefreshFailure(): void {
  // Limpiar tokens y datos del usuario
  localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
  
  // 🔒 SEGURIDAD: Limpiar TODO el caché de React Query
  // Esto elimina todos los datos en memoria al detectar sesión expirada
  queryClient.clear();
  
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

export default apiClient;
export { refreshClient, slowOperationClient };

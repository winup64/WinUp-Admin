// Utilidades para manejo de tokens

import { TOKEN_STORAGE_KEYS } from '../config/api';
import { AuthTokens, AuthUser } from '../types/auth';

/**
 * Guardar tokens en localStorage
 */
export const saveTokens = (tokens: AuthTokens): void => {
  try {
    // Validar tokens antes de guardar
    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new Error('Tokens inválidos para guardar');
    }

    if (typeof tokens.accessToken !== 'string' || tokens.accessToken.length === 0) {
      throw new Error('Token de acceso inválido');
    }

    if (typeof tokens.refreshToken !== 'string' || tokens.refreshToken.length === 0) {
      throw new Error('Token de refresh inválido');
    }

    if (typeof tokens.expiresAt !== 'number' || tokens.expiresAt <= 0) {
      throw new Error('Fecha de expiración inválida');
    }

    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString());
  } catch (error) {
    // Limpiar tokens corruptos
    clearTokens();
    throw error;
  }
};

/**
 * Obtener tokens del localStorage
 */
export const getTokens = (): AuthTokens | null => {
  try {
    const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    const expiresAt = localStorage.getItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);

    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 0, // No se almacena, se calcula
      expiresAt: parseInt(expiresAt),
    };
  } catch (error) {
    return null;
  }
};

/**
 * Limpiar tokens del localStorage
 */
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
  } catch (error) {
    
  }
};

/**
 * Verificar si el token está expirado
 */
export const isTokenExpired = (): boolean => {
  try {
    const expiresAt = localStorage.getItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiresAt) return true;

    const expiryTime = parseInt(expiresAt);
    const currentTime = Date.now();
    
    return currentTime >= expiryTime;
  } catch (error) {
    
    return true;
  }
};

/**
 * Obtener tiempo restante del token en segundos
 */
export const getTokenTimeRemaining = (): number => {
  try {
    const expiresAt = localStorage.getItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiresAt) return 0;

    const expiryTime = parseInt(expiresAt);
    const currentTime = Date.now();
    const remaining = Math.max(0, expiryTime - currentTime);
    
    return Math.floor(remaining / 1000); // Convertir a segundos
  } catch (error) {
    
    return 0;
  }
};

/**
 * Guardar datos del usuario
 */
export const saveUserData = (user: AuthUser): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (error) {
    
  }
};

/**
 * Obtener datos del usuario
 */
export const getUserData = (): AuthUser | null => {
  try {
    const userData = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_DATA);
    if (!userData) return null;

    return JSON.parse(userData);
  } catch (error) {
    
    return null;
  }
};

/**
 * Limpiar datos del usuario
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_DATA);
  } catch (error) {
    
  }
};

/**
 * Verificar si hay una sesión válida
 */
export const hasValidSession = (): boolean => {
  const tokens = getTokens();
  const user = getUserData();
  
  return !!(tokens && user && !isTokenExpired());
};

/**
 * Obtener token de acceso
 */
export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    
    return null;
  }
};

/**
 * Obtener token de refresh
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    
    return null;
  }
};

/**
 * Decodificar JWT (solo para obtener información básica)
 */
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    
    return null;
  }
};

/**
 * Obtener información del token sin decodificar completamente
 */
export const getTokenInfo = (token: string): { exp?: number; iat?: number; sub?: string } | null => {
  try {
    const decoded = decodeJWT(token);
    return {
      exp: decoded.exp,
      iat: decoded.iat,
      sub: decoded.sub,
    };
  } catch (error) {
    
    return null;
  }
};

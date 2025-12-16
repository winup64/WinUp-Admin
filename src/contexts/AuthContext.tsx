import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient, { refreshClient } from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { LoginResponse, RefreshTokenResponse, CleanupTokensApiResponse } from '../types/api';
import { AuthUser, AuthTokens, LoginCredentials, LoginResult } from '../types/auth';
import { handleApiError, getErrorMessage } from '../utils/api';
import { saveTokens, getTokens, clearTokens, saveUserData, getUserData, clearUserData, hasValidSession } from '../utils/tokens';
import { useNotifications } from './NotificationContext';

interface AuthContextType {
  // Estado
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;
  
  // Acciones
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  cleanupTokens: () => Promise<{ success: boolean; deletedCount?: number; error?: string }>;
  updateProfile: (data: Partial<AuthUser>) => void;
  clearError: () => void;
  
  // Utilidades
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isTokenExpired: () => boolean;
  getTokenExpiry: () => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Verificar si hay una sesión válida
    if (hasValidSession()) {
      const userData = getUserData();
      const tokens = getTokens();
      
      if (userData && tokens) {
        setUser(userData);
      } else {
        // Limpiar datos inválidos
        clearTokens();
        clearUserData();
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Llamada a la API real
      const response = await apiClient.post<{ data: LoginResponse }>(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
      });
      
      const { user: userData, accessToken, refreshToken, expiresIn } = response.data.data;
      
      // Validar que el usuario tenga rol ADMIN
      if (userData.role !== 'ADMIN') {
        const errorMessage = 'Acceso denegado. Solo administradores pueden acceder al sistema.';
        setError(errorMessage);
        showError('Acceso denegado', errorMessage);
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Crear objetos de usuario y tokens
      const authUser: AuthUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        lastLogin: new Date().toISOString(),
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };
      
      const authTokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresIn,
        expiresAt: Date.now() + (expiresIn * 1000),
      };
      
      // Guardar en estado y localStorage
      setUser(authUser);
      saveUserData(authUser);
      saveTokens(authTokens);
      
      // Login exitoso
      showSuccess('¡Bienvenido!', `Has iniciado sesión como ${authUser.username}`);
      
      return {
        success: true,
        user: authUser,
        tokens: authTokens,
      };
      
    } catch (error: any) {
      const apiError = handleApiError(error);
      const errorMessage = getErrorMessage(apiError);
      
      setError(errorMessage);
      showError('Error de autenticación', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      
      // Obtener el refresh token antes de limpiar
      const tokens = getTokens();
      
      if (tokens?.refreshToken) {
        
        try {
          // Llamar al endpoint de logout del servidor
          await refreshClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
            refreshToken: tokens.refreshToken,
          });
          
          
        } catch (apiError: any) {
          // Si falla big logout del servidor, continuar con el logout local
          
        }
      }
      
      // Limpiar datos locales independientemente del resultado del servidor
      setUser(null);
      clearTokens();
      clearUserData();
      setError(null);
      
      // 🔒 SEGURIDAD: Limpiar TODO el caché de React Query
      // Esto elimina todos los datos en memoria (sorteos, usuarios, encuestas, etc.)
      // para evitar que el siguiente usuario vea datos en caché del usuario anterior
      queryClient.clear();
      
      // Mostrar notificación de logout exitoso
      showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
      
    } catch (error: any) {
      
      // Aún así, limpiar datos locales
      setUser(null);
      clearTokens();
      clearUserData();
      setError(null);
      
      // 🔒 SEGURIDAD: Limpiar caché incluso si hay error
      queryClient.clear();
      
      showError('Error al cerrar sesión', 'Se cerró la sesión localmente');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const tokens = getTokens();
      if (!tokens?.refreshToken) {
        
        return false;
      }

      
      
      const response = await refreshClient.post<{ data: RefreshTokenResponse }>(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken: tokens.refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
      
      // Validar respuesta del refresh
      if (!accessToken || !newRefreshToken || typeof expiresIn !== 'number') {
        throw new Error('Respuesta de refresh inválida: faltan campos requeridos');
      }

      if (expiresIn <= 0) {
        throw new Error('Respuesta de refresh inválida: expiresIn debe ser un número positivo');
      }

      // Validar tokens antes de guardar
      if (typeof accessToken !== 'string' || accessToken.length === 0) {
        throw new Error('Token de acceso inválido');
      }

      if (typeof newRefreshToken !== 'string' || newRefreshToken.length === 0) {
        throw new Error('Token de refresh inválido');
      }
      
      const newTokens: AuthTokens = {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        expiresAt: Date.now() + (expiresIn * 1000),
      };

      saveTokens(newTokens);
      
      return true;
    } catch (error: any) {
      
      
      // Manejo diferenciado de errores
      if (error.response?.status === 401) {
        
        logout();
      } else if (error.response?.status === 403) {
        
        logout();
      } else if (error.response?.status === 429) {
        
        // No hacer logout por rate limit
      } else if (error.response?.status >= 500) {
        
        // No hacer logout por errores del servidor
      } else {
        
      }
      
      return false;
    }
  };

  const cleanupTokens = async (): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
    try {
      
      const response = await apiClient.post<CleanupTokensApiResponse>(API_ENDPOINTS.AUTH.CLEANUP_TOKENS);
      
      const deletedCount = (response.data as any)?.data?.deletedCount ?? 0;
      
      
      
      showSuccess(
        'Limpieza completada', 
        `Se eliminaron ${deletedCount} tokens revocados y expirados`
      );
      
      return {
        success: true,
        deletedCount
      };
      
    } catch (error: any) {
      
      // Manejo específico de errores
      if (error.response?.status === 401) {
        const errorMessage = 'Token no válido. Por favor, inicia sesión nuevamente.';
        showError('Error de autenticación', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      } else if (error.response?.status === 403) {
        const errorMessage = 'Sin permisos de administrador para realizar esta acción.';
        showError('Acceso denegado', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      } else {
        const errorMessage = getErrorMessage(handleApiError(error));
        showError('Error en limpieza', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    }
  };

  const updateProfile = (data: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      saveUserData(updatedUser);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    // Implementar lógica de permisos según el rol
    if (!user) return false;
    
    switch (user.role) {
      case 'SUPER_ADMIN':
        return true;
      case 'ADMIN':
        return permission !== 'super_admin_only';
      default:
        return false;
    }
  };

  const isTokenExpired = (): boolean => {
    const tokens = getTokens();
    if (!tokens) return true;
    
    return Date.now() >= tokens.expiresAt;
  };

  const getTokenExpiry = (): number | null => {
    const tokens = getTokens();
    return tokens?.expiresAt || null;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isLoggingOut,
    error,
    login,
    logout,
    refreshToken,
    cleanupTokens,
    updateProfile,
    clearError,
    hasRole,
    hasPermission,
    isTokenExpired,
    getTokenExpiry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

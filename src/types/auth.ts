// Tipos específicos de autenticación

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  tokens?: AuthTokens;
  error?: string;
}

export interface AuthContextType {
  // Estado
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<AuthUser>) => void;
  clearError: () => void;
  
  // Utilidades
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isTokenExpired: () => boolean;
  getTokenExpiry: () => number | null;
}

// Tipos para validación de formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Tipos para manejo de sesión
export interface SessionData {
  user: AuthUser;
  tokens: AuthTokens;
  lastActivity: number;
  expiresAt: number;
}

// Tipos para permisos y roles
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Tipos para validación de acceso
export interface AccessControl {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean;
}

// Tipos para auditoría
export interface AuthAudit {
  id: string;
  userId: string;
  action: 'LOGIN' | 'LOGOUT' | 'REFRESH' | 'FAILED_LOGIN';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  details?: any;
}

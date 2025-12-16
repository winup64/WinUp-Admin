// Tipos específicos de la API

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

export interface CleanupTokensResponse {
  deletedCount: number;
}

export interface CleanupTokensApiResponse extends ApiResponse<CleanupTokensResponse> {}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  status: number;
  message: string;
  data: null;
  timestamp: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  status: number;
  message: string;
  data: null;
  timestamp: string;
}

// Dashboard
export interface AdminDashboardStats {
  totalUsers: number;
  activeTrivias: number;
  activeRewards: number;
  activeRaffles: number;
  completedSurveys: number;
}

export interface AdminUserGrowthItem {
  month: string; // Ej: "Enero"
  totalUsers: number;
  activeUsers: number;
}

export type PlanUserType = 'UNASSIGNED' | 'DEMO' | 'PREMIUM' | 'EXPIRED';

export type AccountUserType = PlanUserType | 'ADMIN';

export interface AdminUserTypeItem {
  userType: string; // Ej: "PREMIUM", "DEMO", "EXPIRADO"
  count: number;
  percentage?: number; // opcional según backend
}

export interface AdminRecentActivityItem {
  type: string; // Ej: "NEW_USER", "RAFFLE", etc.
  title: string;
  description: string;
  created_at: string; // ISO string desde backend
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: any;
}

// Tipos para manejo de tokens
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

// Tipos para manejo de estado de API
export interface ApiState {
  isLoading: boolean;
  error: ApiErrorResponse | null;
  lastRequest: string | null;
  retryCount: number;
}

// Tipos para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para filtros
export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Tipos para requests comunes
export interface CreateRequest<T> {
  data: T;
}

export interface UpdateRequest<T> {
  id: string;
  data: Partial<T>;
}

export interface DeleteRequest {
  id: string;
}

export interface BulkDeleteRequest {
  ids: string[];
}

// Tipos para respuestas comunes
export interface CreateResponse<T> {
  data: T;
  message: string;
}

export interface UpdateResponse<T> {
  data: T;
  message: string;
}

export interface DeleteResponse {
  message: string;
}

export interface BulkDeleteResponse {
  deletedCount: number;
  message: string;
}

// Tipos para estadísticas de usuarios
export interface UserStatsRequest {
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  field: 'real_points' | 'demo_points' | 'total_points';
}

export interface UserStatsResponse {
  role: string;
  totalUsers: number;
  points: {
    field: string;
    avg: number;
    max: number;
    min: number;
  };
}

export interface UserStatsApiResponse extends ApiResponse<UserStatsResponse> {}

// Admin Settings
export interface AdminSettings {
  setting_id: string;
  admin_name: string;
  admin_phone?: string;
  admin_email?: string;
  admin_whatsapp?: string;
  business_hours?: string;
  demo_trial_days?: number;
  maintenance_mode?: boolean;
  created_at: string;
  updated_at: string;
}

export type UpdateAdminSettingsRequest = Partial<Pick<AdminSettings,
  'admin_name' | 'admin_phone' | 'admin_email' | 'admin_whatsapp' | 'business_hours' | 'maintenance_mode'
>> & { admin_name: string };
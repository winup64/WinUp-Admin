import apiClient from '../config/axios';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse, AccountUserType } from '../types/api';

// Interfaces para el registro de usuarios

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  address: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  birth_date: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  status: 'ACTIVE' | 'INACTIVE';
  role: 'ADMIN' | 'USER';
  user_type: AccountUserType;
}

export interface RegisterResponse {
  message: string;
}

export class AuthService {
  /**
   * Registra un nuevo usuario
   * @param userData - Datos del usuario a registrar
   * @returns Promise con la respuesta de registro
   */
  static async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

export default AuthService;

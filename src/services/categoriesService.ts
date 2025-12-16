import apiClient from '../config/axios';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import { ApiResponse } from '../types/api';

// Tipos para las categorías (basado en la respuesta real de la API)
export interface Category {
  category_id: string;
  name: string;
  is_active: boolean;
  description: string;
  category_type: string | null;
  color: string;
  status: string;
  image_url: string; // Campo de la API
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  image?: string; // Propiedad opcional para las imágenes generadas/procesadas
}

export interface CategoriesListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  category_type?: string;
  search?: string;
}

// Respuesta real de la API
export interface CategoriesListResponse {
  status: number;
  message: string;
  total: number;
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export class CategoriesService {
  /**
   * Obtiene la lista de categorías con paginación y filtros
   * @param params - Parámetros de consulta
   * @returns Promise con la lista paginada de categorías
   */
  static async getCategoriesList(params: CategoriesListParams = {}): Promise<CategoriesListResponse> {
    try {
      const safeLimit = Math.min(Math.max((params.limit ?? 10), 1), 50);
      const response = await apiClient.get<CategoriesListResponse>(
        API_ENDPOINTS.CATEGORIES_ADMIN.LIST,
        {
          params: {
            page: params.page || 1,
            limit: safeLimit,
            status: params.status,
            category_type: params.category_type,
            search: params.search,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Obtiene una categoría específica por ID
   * @param categoryId - ID de la categoría
   * @returns Promise con los datos de la categoría
   */
  static async getCategoryById(categoryId: string): Promise<ApiResponse<Category>> {
    try {
      const response = await apiClient.get<ApiResponse<Category>>(
        `${API_ENDPOINTS.CATEGORIES_ADMIN.GET}/${categoryId}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Crea una nueva categoría
   * @param categoryData - Datos de la categoría a crear
   * @returns Promise con la categoría creada
   */
  static async createCategory(categoryData: Partial<Category> | FormData): Promise<ApiResponse<Category>> {
    try {
      
      if (categoryData instanceof FormData) {
      } else {
      }
      
      // Si es FormData, dejar que axios establezca automáticamente el Content-Type con boundary
      const config = categoryData instanceof FormData 
        ? {} // No especificar headers para FormData, axios lo hace automáticamente
        : {
            headers: {
              'Content-Type': 'application/json',
            },
          };

      const response = await apiClient.post<ApiResponse<Category>>(
        API_ENDPOINTS.CATEGORIES_ADMIN.CREATE,
        categoryData,
        config
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Actualiza una categoría existente
   * @param categoryId - ID de la categoría
   * @param categoryData - Datos a actualizar
   * @returns Promise con la categoría actualizada
   */
  static async updateCategory(categoryId: string, categoryData: Partial<Category> | FormData): Promise<ApiResponse<Category>> {
    try {
      const url = `${API_ENDPOINTS.CATEGORIES_ADMIN.UPDATE}/${categoryId}`;
      
      // Si es FormData, dejar que axios establezca automáticamente el Content-Type con boundary
      const config = categoryData instanceof FormData 
        ? {} // No especificar headers para FormData, axios lo hace automáticamente
        : {
            headers: {
              'Content-Type': 'application/json',
            },
          };
      
      const response = await apiClient.patch<ApiResponse<Category>>(
        url,
        categoryData,
        config
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Elimina una categoría
   * @param categoryId - ID de la categoría
   * @returns Promise con la respuesta de eliminación
   */
  static async deleteCategory(categoryId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const url = `${API_ENDPOINTS.CATEGORIES_ADMIN.DELETE}/${categoryId}`;
      
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(url);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

export default CategoriesService;

import React, { useState, useMemo } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  CpuChipIcon,
  GlobeAltIcon,
  FilmIcon,
  TrophyIcon,
  ClockIcon,
  PaintBrushIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Category } from '../../services/categoriesService';
import { API_CONFIG } from '../../config/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  useCategoriesList, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '../../hooks/useCategories';

// Interfaz extendida para incluir campos de manejo de imágenes
interface CategoryWithImage extends Category {
  imageUrl?: string | undefined;
  imageChanged?: boolean; // Flag para saber si el usuario cambió la imagen
}

const CategoriesPage: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  
  // Función para mapear iconos
  const getCategoryIcon = (iconName: string) => {
    switch(iconName) {
      case 'cpu': return <CpuChipIcon className="h-5 w-5" />;
      case 'globe': return <GlobeAltIcon className="h-5 w-5" />;
      case 'film': return <FilmIcon className="h-5 w-5" />;
      case 'sports': return <TrophyIcon className="h-5 w-5" />;
      case 'history': return <ClockIcon className="h-5 w-5" />;
      case 'palette': return <PaintBrushIcon className="h-5 w-5" />;
      default: return <GlobeAltIcon className="h-5 w-5" />;
    }
  };

  // Función para obtener el nombre del color - SOLUCIÓN DEFINITIVA
  const getColorName = (colorValue: string) => {
    if (!colorValue) return 'Seleccionar color';
    
    // Buscar el color en la lista
    const foundColor = colorOptions.find(c => c.value === colorValue);
    
    // Devolver el nombre del color si se encuentra
    if (foundColor) {
      return foundColor.name;
    }
    
    // Si no se encuentra, devolver un nombre genérico
    return 'Color personalizado';
  };

  // Estados de UI (formularios y modales)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithImage | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showEditColorDropdown, setShowEditColorDropdown] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [editIconPreview, setEditIconPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Debounce para el término de búsqueda (500ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetear paginación cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // ✨ React Query hooks - Reemplazan useEffect y estados manuales
  const { 
    data: categoriesResponse, 
    isLoading: loading, 
    error: categoriesError,
    refetch: refetchCategories 
  } = useCategoriesList({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm || undefined,
    status: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? 'active' : 'inactive'),
  });

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Extraer datos de la respuesta
  const categories = useMemo(() => {
    if (!categoriesResponse?.data) return [];
    return categoriesResponse.data.map(category => ({
      ...category,
      // Procesar image_url: si es base64 o URL completa, usarla tal cual; si es relativa, concatenar con BASE_URL
      image: category.image_url && typeof category.image_url === 'string'
        ? (category.image_url.startsWith('data:') || category.image_url.startsWith('http://') || category.image_url.startsWith('https://'))
          ? category.image_url // base64 o URL completa
          : `${API_CONFIG.BASE_URL}${category.image_url}` // Ruta relativa
        : undefined,
    }));
  }, [categoriesResponse]);
  
  const apiTotalPages = categoriesResponse?.pagination?.totalPages || 0;
  // Solo mostrar error si NO es un 404 (404 significa que no hay resultados)
  const error = (categoriesError && (categoriesError as any)?.response?.status !== 404) 
    ? 'Error al cargar las categorías. Por favor, inténtalo de nuevo.' 
    : null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showError('Archivo Inválido', 'Por favor selecciona solo archivos de imagen');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Archivo Muy Grande', 'La imagen debe ser menor a 5MB');
        return;
      }

      

      // Generar base64 para enviar a la API (igual que testimonios)
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        
        
        if (isEdit && editingCategory) {
          setEditIconPreview(imageUrl);
          setEditingCategory({
            ...editingCategory,
            imageUrl: imageUrl,
            imageChanged: true
          });
        } else {
          setIconPreview(imageUrl);
          setNewCategory({
            ...newCategory,
            imageUrl: imageUrl
          });
        }
      };
      
      reader.onerror = (error) => {
        showError('Error', 'No se pudo leer la imagen seleccionada');
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (isEdit: boolean = false) => {
    if (isEdit && editingCategory) {
      setEditIconPreview(null);
      setEditingCategory({
        ...editingCategory,
        imageUrl: undefined,
        imageChanged: true // Marca que la imagen cambió (fue eliminada)
      });
    } else {
      setIconPreview(null);
      setNewCategory({
        ...newCategory,
        imageUrl: undefined
      });
    }
  };

  const resetCreateCategoryForm = () => {
    setNewCategory({ name: '', description: '', color: '#3B82F6', is_active: true, status: 'active', imageUrl: undefined });
    setIconPreview(null);
    setShowColorDropdown(false);
    if (fileInputRef.current) {
      try { fileInputRef.current.value = ''; } catch {}
    }
  };

  const openCreateModal = () => {
    resetCreateCategoryForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    resetCreateCategoryForm();
    setShowCreateModal(false);
  };
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true,
    status: 'active',
    imageUrl: undefined as string | undefined,
  });

  const colorOptions = useMemo(() => [
    // Colores de la API (ordenados por frecuencia de uso)
    { name: 'Naranja/rojo', value: '#FF5733' }, // Más usado en la API
    { name: 'Verde', value: '#10B981' }, // Verde estándar
    { name: 'Amarillo', value: '#F59E0B' }, // Amarillo estándar
    // Colores del backend (material-like)
    { name: 'Naranja', value: '#FF9800' },
    { name: 'Púrpura', value: '#9C27B0' },
    { name: 'Verde', value: '#4CAF50' },
    { name: 'Azul', value: '#2196F3' },
    { name: 'Naranja Oscuro', value: '#FF5722' },
    { name: 'Verde oscuro', value: '#228B22' }, // Geografía
    { name: 'Rosa', value: '#FF69B4' }, // Entretenimiento
    { name: 'Rojo tomate', value: '#FF6347' }, // Deportes
    { name: 'Verde azulado', value: '#20B2AA' }, // Tecnología
    { name: 'Marrón', value: '#8B4513' }, // Historia
    { name: 'Púrpura', value: '#9370DB' }, // Arte
    { name: 'Azul', value: '#4169E1' }, // Ciencias
    
    // Colores adicionales del frontend
    { name: 'Azul estándar', value: '#3B82F6' },
    { name: 'Naranja estándar', value: '#F97316' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Rojo Oscuro', value: '#DC2626' },
    { name: 'Púrpura Oscuro', value: '#7C3AED' },
    { name: 'Rosa Oscuro', value: '#DB2777' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Indigo Oscuro', value: '#4F46E5' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Teal Oscuro', value: '#0D9488' },
    { name: 'Cian', value: '#06B6D4' },
    { name: 'Cian Oscuro', value: '#0891B2' },
    { name: 'Verde Lima', value: '#84CC16' },
    { name: 'Verde Oscuro', value: '#65A30D' },
    { name: 'Gris', value: '#6B7280' },
    { name: 'Gris Oscuro', value: '#4B5563' },
  ], []);

  const handleEditCategory = (category: Category) => {
    // Resetear el preview antes de abrir el modal
    setEditIconPreview(null);
    
    setEditingCategory({
      ...category,
      imageUrl: undefined, // Se maneja con editIconPreview o con category.image_url
      imageChanged: false // Inicialmente no ha cambiado
    });
    setShowEditModal(true);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string, color?: string, status?: string) => {
    setDeletingCategory({
      // Ensamblar un objeto mínimo para mostrar en el modal
      category_id: categoryId,
      name: categoryName,
      color: color as any,
      status: status as any,
    } as Category);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory?.category_id) return;
    
    try {
      const categoryName = deletingCategory.name;
      await deleteMutation.mutateAsync(deletingCategory.category_id);
      
      showSuccess(
        'Categoría Eliminada',
        `${categoryName} ha sido eliminada exitosamente.`
      );
      
      // Cerrar modal
      setShowDeleteModal(false);
      setDeletingCategory(null);
    } catch (error: any) {
      
      // Función para traducir mensajes de error del backend a español
      const translateErrorMessage = (message: string): string => {
        const translations: Record<string, string> = {
          'Category already exists': 'La categoría ya existe',
          'Category not found': 'Categoría no encontrada',
          'Invalid category': 'Categoría inválida',
          'Cannot delete category': 'No se puede eliminar la categoría',
          'Category has related data': 'La categoría tiene datos relacionados',
          'Constraint violation': 'No se puede eliminar. La categoría tiene datos relacionados.',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Acceso prohibido',
          'Not found': 'No encontrado',
          'Internal server error': 'Error interno del servidor',
          'Bad request': 'Solicitud incorrecta',
        };
        
        // Buscar traducción exacta
        if (translations[message]) return translations[message];
        
        // Buscar traducción parcial
        for (const [key, value] of Object.entries(translations)) {
          if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
          }
        }
        
        return message;
      };
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        const translatedMessage = backendMessage 
          ? translateErrorMessage(backendMessage)
          : 'No se puede eliminar la categoría. Puede tener datos relacionados.';
        showError('No se puede eliminar', translatedMessage);
      } else if (error.response?.status === 401) {
        showError(
          'Sesión Expirada',
          'Token no válido o no proporcionado. Por favor, inicia sesión nuevamente.'
        );
      } else if (error.response?.status === 403) {
        showError(
          'Sin Permisos',
          'Sin permisos de administrador para realizar esta acción.'
        );
      } else if (error.response?.status === 404) {
        showError(
          'Categoría No Encontrada',
          'La categoría que intentas eliminar no existe.'
        );
      } else {
        const backendMessage = error.response?.data?.message || error.message;
        const translatedMessage = backendMessage 
          ? translateErrorMessage(backendMessage)
          : 'Error al eliminar la categoría';
        showError('Error de Eliminación', translatedMessage);
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.description) {
      showError(
        'Campos Requeridos',
        'Por favor completa todos los campos obligatorios'
      );
      return;
    }

    try {
      // Construir payload JSON (igual que testimonios)
      const payload = {
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        is_active: newCategory.is_active,
        status: newCategory.status,
        category_type: 'trivia_category',
        image: newCategory.imageUrl || undefined, // Enviar base64 igual que testimonios
      };

      
      if (payload.image) {
        
      }

      const result = await createMutation.mutateAsync(payload as any);

      showSuccess(
        'Categoría Creada',
        `${newCategory.name} ha sido creada exitosamente.`
      );
      
      // Cerrar modal y resetear formulario
      setShowCreateModal(false);
      setNewCategory({ name: '', description: '', color: '#3B82F6', is_active: true, status: 'active', imageUrl: undefined });
      setIconPreview(null);
    } catch (error: any) {
      
      // Función para traducir mensajes de error del backend a español
      const translateErrorMessage = (message: string): string => {
        const translations: Record<string, string> = {
          'Category already exists': 'La categoría ya existe',
          'Category not found': 'Categoría no encontrada',
          'Invalid category': 'Categoría inválida',
          'Name is required': 'El nombre es requerido',
          'Description is required': 'La descripción es requerida',
          'Invalid color': 'Color inválido',
          'Validation failed': 'Error de validación',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Acceso prohibido',
          'Internal server error': 'Error interno del servidor',
          'Bad request': 'Solicitud incorrecta',
        };
        
        // Buscar traducción exacta
        if (translations[message]) return translations[message];
        
        // Buscar traducción parcial
        for (const [key, value] of Object.entries(translations)) {
          if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
          }
        }
        
        return message;
      };
      
      // Manejar errores específicos
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        let translatedMessage = 'Los datos proporcionados no son válidos. Verifica la información.';
        
        if (Array.isArray(backendMessage)) {
          translatedMessage = backendMessage.map(msg => translateErrorMessage(msg)).join('\n');
        } else if (backendMessage) {
          translatedMessage = translateErrorMessage(backendMessage);
        }
        
        showError('Datos Inválidos', translatedMessage);
      } else if (error.response?.status === 409) {
        const backendMessage = error.response?.data?.message || 'Ya existe una categoría con este nombre.';
        showError('Categoría Existente', translateErrorMessage(backendMessage));
      } else {
        const backendMessage = error.response?.data?.message || error.message;
        const translatedMessage = backendMessage ? translateErrorMessage(backendMessage) : 'Error al crear la categoría';
        showError('Error de Creación', translatedMessage);
      }
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (!editingCategory.name || !editingCategory.description) {
      showError(
        'Campos Requeridos',
        'Por favor completa todos los campos obligatorios'
      );
      return;
    }

    try {
      // Construir payload JSON (igual que testimonios)
      const payload: any = {
        name: editingCategory.name,
        description: editingCategory.description,
        color: editingCategory.color,
        status: editingCategory.status,
        category_type: editingCategory.category_type || 'trivia_category',
        is_active: editingCategory.is_active,
      };

      // Solo incluir el campo image si el usuario cambió la imagen
      if (editingCategory.imageChanged && editingCategory.imageUrl) {
        payload.image = editingCategory.imageUrl; // Enviar base64 igual que testimonios
      }

      

      await updateMutation.mutateAsync({
        id: editingCategory.category_id,
        data: payload
      });

      showSuccess(
        'Categoría Actualizada',
        `${editingCategory.name} ha sido actualizada exitosamente.`
      );
      
      // Cerrar modal
      setShowEditModal(false);
      setEditingCategory(null);
      setEditIconPreview(null);
    } catch (error: any) {
      
      // Función para traducir mensajes de error del backend a español
      const translateErrorMessage = (message: string): string => {
        const translations: Record<string, string> = {
          'Category already exists': 'La categoría ya existe',
          'Category not found': 'Categoría no encontrada',
          'Invalid category': 'Categoría inválida',
          'Name is required': 'El nombre es requerido',
          'Description is required': 'La descripción es requerida',
          'Invalid color': 'Color inválido',
          'Validation failed': 'Error de validación',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Acceso prohibido',
          'Not found': 'No encontrado',
          'Internal server error': 'Error interno del servidor',
          'Bad request': 'Solicitud incorrecta',
        };
        
        // Buscar traducción exacta
        if (translations[message]) return translations[message];
        
        // Buscar traducción parcial
        for (const [key, value] of Object.entries(translations)) {
          if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
          }
        }
        
        return message;
      };
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        let translatedMessage = 'Los datos proporcionados no son válidos. Verifica la información.';
        
        if (Array.isArray(backendMessage)) {
          translatedMessage = backendMessage.map(msg => translateErrorMessage(msg)).join('\n');
        } else if (backendMessage) {
          translatedMessage = translateErrorMessage(backendMessage);
        }
        
        showError('Datos Inválidos', translatedMessage);
      } else if (error.response?.status === 401) {
      showError(
          'Sesión Expirada',
          'Token no válido o no proporcionado. Por favor, inicia sesión nuevamente.'
        );
      } else if (error.response?.status === 403) {
        showError(
          'Sin Permisos',
          'Sin permisos de administrador para realizar esta acción.'
        );
      } else if (error.response?.status === 404) {
        showError(
          'Categoría No Encontrada',
          'La categoría que intentas actualizar no existe.'
        );
      } else {
        const backendMessage = error.response?.data?.message || error.message;
        const translatedMessage = backendMessage 
          ? translateErrorMessage(backendMessage)
          : 'Error al actualizar la categoría';
        showError('Error de Actualización', translatedMessage);
      }
    }
  };

  // Componente reutilizable para subida de imágenes
  const ImageUploadSection = ({ 
    imageUrl, 
    onImageUpload, 
    onRemoveImage, 
    fileInputRef, 
    title = "Imagen de la Categoría" 
  }: {
    imageUrl?: string | undefined;
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    title?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
      
      {imageUrl ? (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            title="Eliminar imagen"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div 
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Haz clic para subir una imagen</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (máx. 5MB)</p>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="hidden"
      />
      
      {/* Mostrar botón apropiado según si hay imagen o no */}
      {imageUrl ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 btn-secondary w-full"
        >
          Cambiar Imagen
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 btn-secondary w-full"
        >
          Seleccionar Imagen
        </button>
      )}
    </div>
  );

  // Los filtros y paginación ahora se manejan en la API
  // No necesitamos filtrar localmente ya que la API devuelve los datos filtrados

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Gestión de Categorías</h1>
          <p className="text-gray-600 ">Administra las categorías de preguntas</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Categoría
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={clearFilters}
              className="btn-secondary flex items-center w-full justify-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Loading state - Skeleton Cards */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={`skeleton-${idx}`} className="card p-6">
              <div className="animate-pulse space-y-4">
                {/* Imagen skeleton */}
                <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                
                {/* Título y badge skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                
                {/* Descripción skeleton */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
                
                {/* Botones skeleton */}
                <div className="flex justify-end space-x-2 pt-2">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={() => refetchCategories()}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories grid */}
      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
          <div key={category.category_id} className="card p-6">
            <div className="mb-4">
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Si falla la imagen, mostrar un placeholder
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full flex items-center justify-center ${category.image ? 'hidden' : ''}`}
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <div className="text-4xl text-gray-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <div className="ml-2 text-gray-500 ">
                  {getCategoryIcon(category.image_url)}
                </div>
              </div>
              <span className={`badge ${category.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {category.status === 'active' ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{category.description}</p>
            <div className="flex justify-end">
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditCategory(category)}
                  className="text-warning-600 hover:text-warning-900 text-sm flex items-center"
                  title="Editar categoría"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category.category_id, category.name, category.color, category.status)}
                  className="text-danger-600 hover:text-danger-900 text-sm flex items-center"
                  title="Eliminar categoría"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Mensaje cuando no hay categorías */}
      {!loading && !error && categories.length === 0 && (
        <div className="card p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
            <p className="text-gray-500 mb-4">
              {debouncedSearchTerm || statusFilter !== 'all'
                ? 'No se encontraron categorías con los filtros aplicados.'
                : 'Comienza creando tu primera categoría.'}
            </p>
            {!debouncedSearchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Primera Categoría
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white ">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">¿Eliminar Categoría?</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.
                  </p>
                  {/* Información al estilo UsersPage */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 flex-none" style={{ backgroundColor: (deletingCategory.color || '#3B82F6') + '33' }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: deletingCategory.color || '#3B82F6' }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 ">{deletingCategory.name}</div>
                        <div className="text-sm text-gray-500 ">Estado: {deletingCategory.status === 'active' ? 'Activa' : deletingCategory.status === 'inactive' ? 'Inactiva' : (deletingCategory.status || '—')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 px-4 py-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingCategory(null); }}
                  className="btn-secondary flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  disabled={deleteMutation.isPending}
                  className={`flex items-center justify-center text-white font-medium py-2 px-4 rounded-md text-sm flex-1 transition-colors ${
                    deleteMutation.isPending ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paginación */}
      {!loading && !error && apiTotalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 :bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {/* Números de página */}
          <div className="flex space-x-1">
            {Array.from({ length: apiTotalPages }, (_, i) => i + 1).map((page) => {
              // Mostrar solo algunas páginas para evitar sobrecarga
              if (
                page === 1 || 
                page === apiTotalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 :bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 || 
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 py-2 text-gray-500 ">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(apiTotalPages, currentPage + 1))}
            disabled={currentPage === apiTotalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 :bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de creación de categoría */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white ">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Crear Nueva Categoría</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 :text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                {/* Primera fila: Nombre, Color, Estado */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="input-field mt-1"
                      placeholder="Nombre de la categoría"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                        className="w-full input-field pr-10 text-left flex items-center justify-between"
                      >
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300 mr-3"
                          style={{ backgroundColor: newCategory.color }}
                        ></div>
                        <span>{colorOptions.find(c => c.value === newCategory.color)?.name || 'Seleccionar color'}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showColorDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setNewCategory({ ...newCategory, color: color.value });
                              setShowColorDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                          >
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300 mr-3"
                              style={{ backgroundColor: color.value }}
                            ></div>
                            <span>{color.name}</span>
                            {newCategory.color === color.value && (
                              <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={newCategory.status}
                      onChange={(e) => setNewCategory({ ...newCategory, status: e.target.value })}
                      className="input-field mt-1"
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                </div>
                
                {/* Segunda fila: Descripción (ancho completo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                    placeholder="Descripción de la categoría"
                  />
                </div>
                
                {/* Tercera fila: Imagen (ancho completo) */}
                <ImageUploadSection
                  imageUrl={iconPreview || undefined}
                  onImageUpload={(e) => handleImageUpload(e, false)}
                  onRemoveImage={() => removeImage(false)}
                  fileInputRef={fileInputRef}
                />
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateCategory}
                    className="btn-primary flex items-center justify-center flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Crear Categoría
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeCreateModal}
                    className="btn-secondary flex-1"
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de categoría */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white ">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Categoría</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 :text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                {/* Primera fila: Nombre, Color, Estado (igual a crear) */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="input-field mt-1"
                      placeholder="Nombre de la categoría"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setShowEditColorDropdown(!showEditColorDropdown)}
                        className="w-full input-field pr-10 text-left flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300 mr-3"
                            style={{ backgroundColor: editingCategory.color }}
                          ></div>
                          <span>{getColorName(editingCategory.color)}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showEditColorDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {!colorOptions.find(c => c.value === editingCategory.color) && editingCategory.color && (
                            <button
                              key="current-color"
                              type="button"
                              onClick={() => {
                                setEditingCategory({ ...editingCategory, color: editingCategory.color });
                                setShowEditColorDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center bg-blue-50"
                            >
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300 mr-3"
                                style={{ backgroundColor: editingCategory.color }}
                              ></div>
                              <span className="text-blue-700 font-medium">Color actual</span>
                              <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                setEditingCategory({ ...editingCategory, color: color.value });
                                setShowEditColorDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center"
                            >
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300 mr-3"
                                style={{ backgroundColor: color.value }}
                              ></div>
                              <span>{color.name}</span>
                              {editingCategory.color === color.value && (
                                <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={editingCategory.status}
                      onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value })}
                      className="input-field mt-1"
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                </div>
                
                {/* Segunda fila: Descripción (ancho completo) - igual a crear */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                    placeholder="Descripción de la categoría"
                  />
                </div>

                {/* Tercera fila: Imagen (ancho completo) - igual a crear */}
                <ImageUploadSection
                  imageUrl={editIconPreview || editingCategory.image || (editingCategory.image_url && typeof editingCategory.image_url === 'string'
                    ? (editingCategory.image_url.startsWith('data:') || editingCategory.image_url.startsWith('http://') || editingCategory.image_url.startsWith('https://'))
                      ? editingCategory.image_url // base64 o URL completa
                      : `${API_CONFIG.BASE_URL}${editingCategory.image_url}` // Ruta relativa
                    : undefined)}
                  onImageUpload={(e) => handleImageUpload(e, true)}
                  onRemoveImage={() => removeImage(true)}
                  fileInputRef={editFileInputRef}
                />
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateCategory}
                    className="btn-primary flex items-center justify-center flex-1"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar'
                    )}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;

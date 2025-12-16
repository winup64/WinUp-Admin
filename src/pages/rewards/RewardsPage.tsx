import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, GiftIcon, PencilIcon, TrashIcon, XMarkIcon, PhotoIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Reward } from '../../services/rewardsService';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  useRewardsList, 
  useCreateReward, 
  useUpdateReward, 
  useDeleteReward 
} from '../../hooks/useRewards';
import RedemptionsTab from '../../components/rewards/RedemptionsTab';

interface RewardWithFile extends Reward {
  imageFile?: File | undefined;
  noExpiration?: boolean; // Checkbox para indicar que no tiene fecha de expiración
}

const RewardsPage: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  
  // Estado para tabs
  const [activeTab, setActiveTab] = useState<'premios' | 'canjes'>('premios');
  
  // Estados de paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [rewardTypeFilter, setRewardTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de UI (modales)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardWithFile | null>(null);
  const [deletingReward, setDeletingReward] = useState<Reward | null>(null);
  
  // Estados de inputs de texto para evitar auto-poner 0 al borrar
  const [newStockInput, setNewStockInput] = useState<string>('');
  const [editStockInput, setEditStockInput] = useState<string>('');
  
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    points_required: 1000,
    stock: 1,
    endDate: '',
    noExpiration: false, // Checkbox para indicar que no tiene fecha de expiración
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    reward_type: 'digital' as 'digital' | 'fisico' | 'puntos' | 'descuento',
    url_image: '' as string | undefined,
    is_active: true,
    imageFile: undefined as File | undefined,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // ✨ React Query hooks - Reemplazan useEffect y estados manuales
  const { 
    data: rewardsResponse, 
    isLoading: isLoadingRewards, 
    error: rewardsError 
  } = useRewardsList({
    page: currentPage,
    limit: itemsPerPage,
    reward_type: rewardTypeFilter !== 'all' ? (rewardTypeFilter as 'fisico' | 'digital' | 'puntos' | 'descuento') : undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'ACTIVE' | 'INACTIVE') : undefined,
    search: searchTerm || undefined,
  });

  // Mutations
  const createMutation = useCreateReward();
  const updateMutation = useUpdateReward();
  const deleteMutation = useDeleteReward();

  // Extraer datos de la respuesta
  const rewards = rewardsResponse?.data || [];
  const apiTotalPages = rewardsResponse?.pagination?.totalPages || 0;

  // Sync del input de edición cuando se abre modal
  useEffect(() => {
    if (showEditModal && editingReward) {
      setEditStockInput(
        typeof editingReward.stock === 'number' && isFinite(editingReward.stock)
          ? String(editingReward.stock)
          : ''
      );
    }
  }, [showEditModal, editingReward]);

  const handleEditReward = (reward: Reward) => {
    // Convertir la fecha de formato ISO a formato datetime-local (hora local, NO UTC)
    let formattedEndDate = '';
    if (reward.endDate) {
      try {
        const date = new Date(reward.endDate);
        if (!isNaN(date.getTime())) {
          // Convertir a hora local para que coincida con lo que se muestra en el card
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          // Formato YYYY-MM-DDTHH:mm en hora local
          formattedEndDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
      } catch (e) {
        console.error('Error al convertir fecha:', e);
      }
    }
    
    setEditingReward({
      ...reward as RewardWithFile,
      endDate: formattedEndDate,
      noExpiration: !formattedEndDate // Si no hay fecha, marcar checkbox
    });
    setShowEditModal(true);
  };

  const handleDeleteReward = (reward: Reward) => {
    setDeletingReward(reward);
    setShowDeleteModal(true);
  };

  const confirmDeleteReward = async () => {
    if (!deletingReward) return;
    
    try {
      await deleteMutation.mutateAsync(deletingReward.reward_id);
      
      showSuccess(
        'Premio Eliminado',
        `${deletingReward.name} ha sido eliminado exitosamente.`
      );
      
      // Cerrar modal
      setShowDeleteModal(false);
      setDeletingReward(null);
    } catch (error: any) {
      console.error('Error al eliminar premio:', error);
      
      // Manejo de errores
      if (error.response?.status === 400) {
        showError('No se puede eliminar', 'El premio puede tener datos relacionados.');
      } else if (error.response?.status === 401) {
        showError('Sesión Expirada', 'Token no válido. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        showError('Sin Permisos', 'No tienes permisos para realizar esta acción.');
      } else if (error.response?.status === 404) {
        showError('Premio No Encontrado', 'El premio que intentas eliminar no existe.');
      } else {
        showError('Error al Eliminar', 'Error al eliminar el premio. Por favor, inténtalo de nuevo.');
      }
    }
  };

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

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        if (isEdit && editingReward) {
          setEditingReward({
            ...editingReward,
            imageFile: file,
            url_image: imageUrl
          });
        } else {
          setNewReward({
            ...newReward,
            imageFile: file,
            url_image: imageUrl
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (isEdit: boolean = false) => {
    if (isEdit && editingReward) {
      setEditingReward({
        ...editingReward,
        imageFile: undefined,
        url_image: undefined
      });
    } else {
      setNewReward({
        ...newReward,
        imageFile: undefined,
        url_image: undefined
      });
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.name || !newReward.description) {
      showError('Campos Requeridos', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // Construir fecha ISO 8601 válida o null si no hay fecha
      let expirationDateISO: string | null = null;
      
      if (newReward.endDate && newReward.endDate.trim() !== '' && !newReward.noExpiration) {
        try {
          // El input datetime-local da formato: "2025-10-16T10:59"
          // Necesitamos convertirlo a ISO 8601 completo: "2025-10-16T10:59:00.000Z"
          const date = new Date(newReward.endDate);
          
          if (!isNaN(date.getTime())) {
            expirationDateISO = date.toISOString();
          } else {
          }
        } catch (e) {
        }
      } else {
      }

      // Si hay archivo, enviar FormData (multipart). Si no, JSON.
      if (newReward.imageFile) {
        const form = new FormData();
        form.append('name', newReward.name);
        form.append('description', newReward.description);
        form.append('points_required', String(newReward.points_required));
        form.append('stock', String(newReward.stock));
        form.append('reward_type', newReward.reward_type);
        form.append('status', newReward.status);
        form.append('is_active', String(!!newReward.is_active));
        if (expirationDateISO !== null && expirationDateISO !== undefined) form.append('expiration_date', expirationDateISO);
        form.append('image', newReward.imageFile);
        await createMutation.mutateAsync(form);
      } else {
        const payload = {
          name: newReward.name,
          description: newReward.description,
          points_required: newReward.points_required,
          stock: newReward.stock,
          reward_type: newReward.reward_type,
          status: newReward.status,
          is_active: newReward.is_active,
          url_image: (newReward.url_image && !newReward.url_image.startsWith('blob:')) 
            ? newReward.url_image 
            : undefined,
          expiration_date: expirationDateISO, // null si no hay fecha
        };
        await createMutation.mutateAsync(payload);
      }

      showSuccess(
        'Premio Creado',
        `${newReward.name} ha sido creado exitosamente.`
      );
      
      setShowCreateModal(false);
      setNewReward({ 
        name: '', 
        description: '', 
        points_required: 1000, 
        stock: 1, 
        endDate: '', 
        noExpiration: false,
        status: 'ACTIVE',
        reward_type: 'digital',
        url_image: undefined,
        is_active: true,
        imageFile: undefined
      });
      setNewStockInput('');
    } catch (error: any) {
      
      // Manejo de errores
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        showError('Datos Inválidos', backendMessage || 'Los datos proporcionados no son válidos.');
      } else if (error.response?.status === 409) {
        showError('Premio Existente', 'Ya existe un premio con ese nombre.');
      } else {
        showError('Error al Crear', 'Error al crear el premio. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleUpdateReward = async () => {
    if (!editingReward) return;

    if (!editingReward.name || !editingReward.description) {
      showError('Campos Requeridos', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // Construir fecha ISO 8601 válida o null si no hay fecha
      let expirationDateISO: string | null = null;
      
      if (editingReward.endDate && editingReward.endDate.trim() !== '' && !editingReward.noExpiration) {
        try {
          // El input datetime-local da formato: "2025-10-16T10:59"
          // Necesitamos convertirlo a ISO 8601 completo: "2025-10-16T10:59:00.000Z"
          const date = new Date(editingReward.endDate);
          
          if (!isNaN(date.getTime())) {
            expirationDateISO = date.toISOString();
          } else {
          }
        } catch (e) {
        }
      } else {
      }

      if (editingReward.imageFile) {
        const form = new FormData();
        form.append('name', editingReward.name);
        form.append('description', editingReward.description);
        if (typeof editingReward.points_required === 'number') form.append('points_required', String(editingReward.points_required));
        if (typeof editingReward.stock === 'number') form.append('stock', String(editingReward.stock));
        if (editingReward.reward_type) form.append('reward_type', editingReward.reward_type);
        if (editingReward.status) form.append('status', editingReward.status);
        form.append('is_active', String(!!editingReward.is_active));
        if (expirationDateISO !== null && expirationDateISO !== undefined) form.append('expiration_date', expirationDateISO);
        form.append('image', editingReward.imageFile);
        await updateMutation.mutateAsync({ id: editingReward.reward_id, data: form });
      } else {
        const updateData = {
          name: editingReward.name,
          description: editingReward.description,
          points_required: editingReward.points_required,
          stock: editingReward.stock,
          reward_type: editingReward.reward_type,
          status: editingReward.status,
          is_active: editingReward.is_active || true,
          url_image: (editingReward.url_image && !editingReward.url_image.startsWith('blob:')) 
            ? editingReward.url_image 
            : undefined,
          expiration_date: expirationDateISO, // null si no hay fecha
        };
        await updateMutation.mutateAsync({ id: editingReward.reward_id, data: updateData });
      }

      showSuccess(
        'Premio Actualizado',
        `${editingReward.name} ha sido actualizado exitosamente.`
      );
      
      setShowEditModal(false);
      setEditingReward(null);
    } catch (error: any) {
      
      // Manejo de errores
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        showError('Datos Inválidos', backendMessage || 'Los datos proporcionados no son válidos.');
      } else if (error.response?.status === 401) {
        showError('Sesión Expirada', 'Token no válido. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        showError('Sin Permisos', 'No tienes permisos para realizar esta acción.');
      } else if (error.response?.status === 404) {
        showError('Premio No Encontrado', 'El premio que intentas actualizar no existe.');
      } else {
        showError('Error al Actualizar', 'Error al actualizar el premio. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fisico':
        return 'Físico';
      case 'digital':
        return 'Digital';
      case 'puntos':
        return 'Puntos';
      case 'descuento':
        return 'Descuento';
      default:
        return type;
    }
  };

  const ImageUploadSection = ({ 
    imageUrl, 
    onImageUpload, 
    onRemoveImage, 
    fileInputRef, 
    title = "Imagen del Premio" 
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
            className="w-full h-48 object-cover rounded-lg border border-gray-200 "
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
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 :bg-gray-700"
          onClick={() => fileInputRef.current?.click()}
        >
          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 ">Haz clic para subir una imagen</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Premios</h1>
          <p className="text-gray-600">Administra el catálogo de premios y canjes</p>
        </div>
        {activeTab === 'premios' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Premio
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('premios')}
            className={`${
              activeTab === 'premios'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <GiftIcon className="h-5 w-5 mr-2" />
            Premios Disponibles
          </button>
          <button
            onClick={() => setActiveTab('canjes')}
            className={`${
              activeTab === 'canjes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            Historial de Canjes
          </button>
        </nav>
      </div>

      {/* Contenido según el tab activo */}
      {activeTab === 'canjes' ? (
        <RedemptionsTab />
      ) : (
        <div className="space-y-6">
          {/* Filtros */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar premios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <select
              value={rewardTypeFilter}
              onChange={(e) => setRewardTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos los tipos</option>
              <option value="digital">Digital</option>
              <option value="fisico">Físico</option>
              <option value="puntos">Puntos</option>
              <option value="descuento">Descuento</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de premios */}
      {isLoadingRewards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={`skeleton-reward-${idx}`} className="card p-6">
              <div className="animate-pulse space-y-4">
                {/* Imagen del premio skeleton */}
                <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
                
                {/* Icono + Título skeleton */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                
                {/* Info (Tipo, Puntos, Stock, Fecha) skeleton */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                
                {/* Badge + Botones skeleton */}
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div key={reward.reward_id} className="card p-6">
              {reward.url_image && (
                <div className="mb-4">
                  <img 
                    src={reward.url_image} 
                    alt={reward.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center mb-4">
                <GiftIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{reward.name}</h3>
                  <p className="text-sm text-gray-500 ">{reward.description}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {reward.reward_type && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 ">Tipo de premio:</span>
                    <span className="text-sm font-medium text-gray-900 ">{getTypeLabel(reward.reward_type)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 ">Puntos requeridos:</span>
                  <span className="text-sm font-medium text-gray-900 ">{reward.points_required.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 ">Stock disponible:</span>
                  <span className="text-sm font-medium text-gray-900 ">{reward.stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 ">Fecha fin:</span>
                  <span className="text-sm font-medium text-gray-900 ">
                    {reward.endDate 
                      ? new Date(reward.endDate).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Sin expiración'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className={`badge ${reward.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                  {reward.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditReward(reward)}
                    className="text-warning-600 hover:text-warning-900 text-sm flex items-center"
                    title="Editar premio"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteReward(reward)}
                    className="text-danger-600 hover:text-danger-900 text-sm flex items-center"
                    title="Eliminar premio"
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

      {/* Mensaje cuando no hay premios */}
      {!isLoadingRewards && rewards.length === 0 && (
        <div className="card p-12">
          <div className="text-center">
            {(rewardsError && (rewardsError as any)?.response?.status !== 404) ? (
              <div className="text-red-600">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los premios</h3>
                <p className="text-sm text-gray-500">
                  Ocurrió un problema al conectar con el servidor. Por favor, intenta de nuevo.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay premios</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || rewardTypeFilter !== 'all' || statusFilter !== 'all'
                    ? 'No se encontraron premios con los filtros aplicados.'
                    : 'Comienza creando tu primer premio.'}
                </p>
                {!searchTerm && rewardTypeFilter === 'all' && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Primer Premio
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paginación */}
      {!isLoadingRewards && apiTotalPages > 1 && (
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

      {/* Modal de creación de premio */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Premio</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 :text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Premio</label>
                  <input
                    type="text"
                    value={newReward.name}
                    onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Ej: Gift Card $50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                    placeholder="Descripción detallada del premio"
                  />
                </div>
                {/* Puntos y Stock en 2 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Puntos Requeridos</label>
                    <input
                      type="number"
                      value={newReward.points_required || ''}
                      onChange={(e) => setNewReward({ ...newReward, points_required: parseInt(e.target.value) || 0 })}
                      className="input-field mt-1"
                      placeholder="Ej: 1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newStockInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setNewStockInput(raw);
                        if (raw !== '') {
                          const num = parseInt(raw, 10);
                          setNewReward({ ...newReward, stock: isNaN(num) ? 0 : Math.max(0, num) });
                        }
                      }}
                      onBlur={() => {
                        if (newStockInput === '') {
                          setNewReward({ ...newReward, stock: 0 });
                        } else {
                          // Normalizar para remover ceros a la izquierda
                          const normalized = String(parseInt(newStockInput, 10));
                          setNewStockInput(normalized);
                        }
                      }}
                      className="input-field mt-1"
                    />
                  </div>
                </div>

                {/* Fecha de Finalización en su propia fila */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora de Finalización</label>
                  
                  {/* Checkbox para indicar sin expiración */}
                  <div className="flex items-center mt-2 mb-2">
                    <input
                      type="checkbox"
                      id="newRewardNoExpiration"
                      checked={newReward.noExpiration}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setNewReward({ 
                          ...newReward, 
                          noExpiration: isChecked,
                          endDate: isChecked ? '' : newReward.endDate
                        });
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="newRewardNoExpiration" className="ml-2 text-sm text-gray-700">
                      Sin fecha de expiración
                    </label>
                  </div>

                  {/* Campo de fecha */}
                  <input
                    type="datetime-local"
                    value={newReward.endDate}
                    onChange={(e) => setNewReward({ ...newReward, endDate: e.target.value })}
                    className="input-field"
                    min={new Date().toISOString().slice(0, 16)}
                    disabled={newReward.noExpiration}
                  />
                  
                  {!newReward.noExpiration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Opcional: Define cuándo expira este premio
                    </p>
                  )}
                  {newReward.noExpiration && (
                    <p className="text-xs text-success-600 mt-1">
                      ✓ Este premio no expirará
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Premio</label>
                    <select
                      value={newReward.reward_type}
                      onChange={(e) => setNewReward({ ...newReward, reward_type: e.target.value as 'fisico' | 'digital' | 'puntos' | 'descuento' })}
                      className="input-field mt-1"
                    >
                      <option value="digital">Digital</option>
                      <option value="fisico">Físico</option>
                      <option value="puntos">Puntos</option>
                      <option value="descuento">Descuento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={newReward.status}
                      onChange={(e) => setNewReward({ ...newReward, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="input-field mt-1"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <ImageUploadSection
                  imageUrl={newReward.url_image}
                  onImageUpload={(e) => handleImageUpload(e, false)}
                  onRemoveImage={() => removeImage(false)}
                  fileInputRef={fileInputRef}
                />

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateReward}
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
                      'Crear Premio'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de premio */}
      {showEditModal && editingReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Premio</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 :text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Premio</label>
                  <input
                    type="text"
                    value={editingReward.name}
                    onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={editingReward.description}
                    onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                  />
                </div>
                {/* Puntos y Stock en 2 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Puntos Requeridos</label>
                    <input
                      type="number"
                      value={editingReward.points_required || ''}
                      onChange={(e) => setEditingReward({ ...editingReward, points_required: parseInt(e.target.value) || 0 })}
                      className="input-field mt-1"
                      placeholder="Ej: 1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editStockInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setEditStockInput(raw);
                        if (raw !== '') {
                          const num = parseInt(raw, 10);
                          setEditingReward({ ...editingReward, stock: isNaN(num) ? 0 : Math.max(0, num) });
                        }
                      }}
                      onBlur={() => {
                        if (editStockInput === '') {
                          setEditingReward({ ...editingReward, stock: 0 });
                        } else {
                          const normalized = String(parseInt(editStockInput, 10));
                          setEditStockInput(normalized);
                        }
                      }}
                      className="input-field mt-1"
                    />
                  </div>
                </div>

                {/* Fecha de Finalización en su propia fila */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora de Finalización</label>
                  
                  {/* Checkbox para indicar sin expiración */}
                  <div className="flex items-center mt-2 mb-2">
                    <input
                      type="checkbox"
                      id="editRewardNoExpiration"
                      checked={editingReward.noExpiration || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setEditingReward({ 
                          ...editingReward, 
                          noExpiration: isChecked,
                          endDate: isChecked ? '' : editingReward.endDate
                        });
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editRewardNoExpiration" className="ml-2 text-sm text-gray-700">
                      Sin fecha de expiración
                    </label>
                  </div>

                  {/* Campo de fecha */}
                  <input
                    type="datetime-local"
                    value={editingReward.endDate || ''}
                    onChange={(e) => setEditingReward({ ...editingReward, endDate: e.target.value })}
                    className="input-field"
                    disabled={editingReward.noExpiration || false}
                  />
                  
                  {!editingReward.noExpiration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Opcional: Define cuándo expira este premio
                    </p>
                  )}
                  {editingReward.noExpiration && (
                    <p className="text-xs text-success-600 mt-1">
                      ✓ Este premio no expirará
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Premio</label>
                    <select
                      value={editingReward.reward_type || 'digital'}
                      onChange={(e) => setEditingReward({ ...editingReward, reward_type: e.target.value as 'fisico' | 'digital' | 'puntos' | 'descuento' })}
                      className="input-field mt-1"
                    >
                      <option value="digital">Digital</option>
                      <option value="fisico">Físico</option>
                      <option value="puntos">Puntos</option>
                      <option value="descuento">Descuento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={editingReward.status || 'ACTIVE'}
                      onChange={(e) => setEditingReward({ ...editingReward, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="input-field mt-1"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <ImageUploadSection
                  imageUrl={editingReward.url_image}
                  onImageUpload={(e) => handleImageUpload(e, true)}
                  onRemoveImage={() => removeImage(true)}
                  fileInputRef={editFileInputRef}
                />

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateReward}
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
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Eliminar Premio?
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que quieres eliminar este premio? Esta acción no se puede deshacer.
                  </p>
                  
                  {/* Información del premio a eliminar */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shrink-0 flex-none">
                        <GiftIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 ">
                          {deletingReward.name}
                        </div>
                        <div className="text-sm text-gray-500 ">{deletingReward.description}</div>
                        <div className="text-xs text-gray-400">
                          {getTypeLabel(deletingReward.reward_type)} • {deletingReward.points_required.toLocaleString()} pts
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 px-4 py-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingReward(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteReward}
                  disabled={deleteMutation.isPending}
                  className={`flex items-center justify-center text-white font-medium py-2 px-4 rounded-md text-sm flex-1 transition-colors ${
                    deleteMutation.isPending 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
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
        </div>
      )}
    </div>
  );
};

export default RewardsPage;

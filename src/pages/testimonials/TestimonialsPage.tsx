import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PlusIcon, ChatBubbleLeftRightIcon, PencilIcon, TrashIcon, XMarkIcon, PhotoIcon, TrophyIcon, MagnifyingGlassIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { listTestimonials, createTestimonial, updateTestimonial as updateTestimonialApi, deleteTestimonial as deleteTestimonialApi, TestimonialDTO } from '../../services/testimonials';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  useTestimonialsList, 
  useCreateTestimonial, 
  useUpdateTestimonial, 
  useDeleteTestimonial 
} from '../../hooks/useTestimonials';

interface Testimonial {
  id: string;
  name: string;
  content: string;
  type: 'testimonial' | 'winner';
  isVerified: boolean;
  imageUrl?: string | undefined;
  imageFile?: File | undefined;
  prize?: string;
  date?: string;
}

// Funciones helper - Definidas antes del componente para evitar problemas de hoisting
const formatDateForInput = (value: string) => {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const mapFromDTO = (dto: TestimonialDTO): Testimonial => ({
  id: (dto as any).id ?? (dto as any)._id ?? (dto as any).uuid ?? (dto as any).testimonial_id,
  name: dto.name,
  content: dto.content,
  type: dto.type,
  isVerified: dto.is_verified,
  imageUrl: dto.image_url || undefined,
  prize: dto.prize || undefined,
  date: dto.date ? formatDateForInput(dto.date) : undefined,
});

const TestimonialsPage: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'testimonial' | 'winner'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  // Debounce para el término de búsqueda (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType, filterVerified]);

  // ✨ React Query hooks - Reemplazan localStorage y carga manual
  const { 
    data: testimonialsResponse, 
    isLoading: loading, 
    error: testimonialsError 
  } = useTestimonialsList({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm || undefined,
    type: filterType !== 'all' ? filterType : undefined,
    is_verified: filterVerified === 'verified' ? true : filterVerified === 'unverified' ? false : undefined,
  });

  // Mutations
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  // Extraer datos de la respuesta
  const testimonials = useMemo(() => {
    if (!testimonialsResponse?.data) return [];
    return testimonialsResponse.data.map(mapFromDTO).filter((x) => !!x.id);
  }, [testimonialsResponse]);

  const totalTestimonials = testimonialsResponse?.total || 0;
  const totalPages = Math.ceil(totalTestimonials / itemsPerPage);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    content: '',
    type: 'testimonial' as 'testimonial' | 'winner',
    isVerified: true,
    imageUrl: '' as string | undefined,
    imageFile: undefined as File | undefined,
    prize: '',
    date: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setShowEditModal(true);
  };


  // Estado y handlers para eliminación con modal de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<Testimonial | null>(null);

  const handleDeleteTestimonial = (testimonial: Testimonial) => {
    setDeletingTestimonial(testimonial);
    setShowDeleteModal(true);
  };

  const confirmDeleteTestimonial = async () => {
    if (!deletingTestimonial) return;
    try {
      await deleteMutation.mutateAsync(deletingTestimonial.id);
      showSuccess(`${deletingTestimonial.type === 'winner' ? 'Ganador' : 'Testimonio'} Eliminado`, `${deletingTestimonial.type === 'winner' ? 'Ganador' : 'Testimonio'} eliminado exitosamente`);
      setShowDeleteModal(false);
      setDeletingTestimonial(null);
    } catch (e: any) {
      showError('Error al eliminar', 'No se pudo eliminar. Intenta nuevamente.');
      setShowDeleteModal(false);
      setDeletingTestimonial(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        if (isEdit && editingTestimonial) {
          setEditingTestimonial({
            ...editingTestimonial,
            imageFile: file,
            imageUrl: imageUrl
          });
        } else {
          setNewTestimonial({
            ...newTestimonial,
            imageFile: file,
            imageUrl: imageUrl
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (isEdit: boolean = false) => {
    if (isEdit && editingTestimonial) {
      setEditingTestimonial({
        ...editingTestimonial,
        imageFile: undefined,
        imageUrl: undefined
      });
    } else {
      setNewTestimonial({
        ...newTestimonial,
        imageFile: undefined,
        imageUrl: undefined
      });
    }
  };

  const handleCreateTestimonial = async () => {
    if (!newTestimonial.name || !newTestimonial.content) {
      alert('Por favor completa el nombre y contenido');
      return;
    }

    if (newTestimonial.type === 'winner' && !newTestimonial.prize) {
      alert('Por favor especifica el premio ganado');
      return;
    }

	try {
	  await createMutation.mutateAsync({
	    name: newTestimonial.name,
	    content: newTestimonial.content,
	    type: newTestimonial.type,
	    is_verified: newTestimonial.isVerified,
	    image_url: newTestimonial.imageUrl || undefined,
	    prize: newTestimonial.type === 'winner' ? newTestimonial.prize : undefined,
	    date: newTestimonial.type === 'winner' ? newTestimonial.date : undefined,
	  } as any);
	  
	  setShowCreateModal(false);
	  setNewTestimonial({ 
	    name: '', 
	    content: '', 
	    type: 'testimonial', 
	    isVerified: true,
	    imageUrl: undefined,
	    imageFile: undefined,
	    prize: '',
	    date: '',
	  });
	  showSuccess(`${newTestimonial.type === 'winner' ? 'Ganador' : 'Testimonio'} Creado`, `${newTestimonial.type === 'winner' ? 'Ganador' : 'Testimonio'} creado exitosamente`);
	} catch (e: any) {
	  showError('Error al crear', 'No se pudo crear. Revisa los datos e intenta nuevamente.');
	}
  };

  const handleUpdateTestimonial = async () => {
    if (!editingTestimonial) return;

    if (!editingTestimonial.name || !editingTestimonial.content) {
      alert('Por favor completa el nombre y contenido');
      return;
    }

    if (editingTestimonial.type === 'winner' && !editingTestimonial.prize) {
      alert('Por favor especifica el premio ganado');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingTestimonial.id,
        data: {
          name: editingTestimonial.name,
          content: editingTestimonial.content,
          type: editingTestimonial.type,
          is_verified: editingTestimonial.isVerified,
          image_url: editingTestimonial.imageUrl || undefined,
          prize: editingTestimonial.type === 'winner' ? editingTestimonial.prize : undefined,
          date: editingTestimonial.type === 'winner' ? editingTestimonial.date : undefined,
        } as any
      });
      
      setShowEditModal(false);
      setEditingTestimonial(null);
      showSuccess(`${editingTestimonial.type === 'winner' ? 'Ganador' : 'Testimonio'} Actualizado`, `${editingTestimonial.type === 'winner' ? 'Ganador' : 'Testimonio'} actualizado exitosamente`);
    } catch (e: any) {
      showError('Error al actualizar', 'No se pudo actualizar. Intenta nuevamente.');
    }
  };

  const ImageUploadSection = ({ 
    imageUrl, 
    onImageUpload, 
    onRemoveImage, 
    fileInputRef, 
    title = "Foto del Usuario" 
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
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 "
          onClick={() => fileInputRef.current?.click()}
        >
          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 ">Haz clic para subir una foto</p>
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
          Cambiar Foto
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 btn-secondary w-full"
        >
          Seleccionar Foto
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Testimonios y Ganadores</h1>
          <p className="text-gray-600">Administra testimonios y ganadores para credibilidad</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Contenido
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar testimonios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'testimonial' | 'winner')}
              className="input-field"
            >
              <option value="all">Todos los tipos</option>
              <option value="testimonial">Testimonios</option>
              <option value="winner">Ganadores</option>
            </select>
          </div>
          <div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as 'all' | 'verified' | 'unverified')}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="verified">Verificados</option>
              <option value="unverified">No verificados</option>
            </select>
          </div>
          <div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterVerified('all');
                setCurrentPage(1);
              }}
              className="btn-secondary flex items-center w-full justify-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-1/3 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingTestimonial(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                ¿Seguro que deseas eliminar {deletingTestimonial?.type === 'winner' ? 'al ganador' : 'el testimonio'} "{deletingTestimonial?.name}"?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmDeleteTestimonial}
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
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingTestimonial(null); }}
                  className="btn-secondary flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de testimonios */}
      {!loading && !testimonialsError && testimonials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
          <div key={item.id || `${item.name}-${index}`} className="card p-6">
            {item.imageUrl && (
              <div className="mb-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex items-center mb-4">
              {item.type === 'winner' ? (
                <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
              ) : (
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600 mr-3" />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                <span className={`badge ${item.type === 'winner' ? 'badge-success' : 'badge-info'}`}>
                  {item.type === 'winner' ? 'Ganador' : 'Testimonio'}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{item.content}</p>
            {item.type === 'winner' && item.prize && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">🏆 Premio: {item.prize}</p>
                {item.date && (
                  <p className="text-xs text-yellow-600 mt-1">Ganado el: {item.date}</p>
                )}
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className={`badge ${item.isVerified ? 'badge-success' : 'badge-warning'}`}>
                {item.isVerified ? 'Verificado' : 'Pendiente'}
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditTestimonial(item)}
                  className="text-warning-600 hover:text-warning-900 text-sm flex items-center"
                  title="Editar"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteTestimonial(item)}
                  className="text-danger-600 hover:text-danger-900 text-sm flex items-center"
                  title="Eliminar"
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

      {/* Mensaje cuando no hay testimonios */}
      {!loading && !testimonialsError && testimonials.length === 0 && (
        <div className="card p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay testimonios</h3>
            <p className="text-gray-500 mb-4">
              {debouncedSearchTerm || filterType !== 'all' || filterVerified !== 'all'
                ? 'No se encontraron testimonios con los filtros aplicados.'
                : 'Comienza creando tu primer testimonio.'}
            </p>
            {!debouncedSearchTerm && filterType === 'all' && filterVerified === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Primer Testimonio
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Contenido</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={newTestimonial.type}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, type: e.target.value as 'testimonial' | 'winner' })}
                    className="input-field mt-1"
                  >
                    <option value="testimonial">Testimonio</option>
                    <option value="winner">Ganador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contenido</label>
                  <textarea
                    value={newTestimonial.content}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                    placeholder="Testimonio o descripción del premio ganado"
                  />
                </div>
                {newTestimonial.type === 'winner' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Premio Ganado</label>
                      <input
                        type="text"
                        value={newTestimonial.prize}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, prize: e.target.value })}
                        className="input-field mt-1"
                        placeholder="Ej: iPhone 15 Pro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Ganancia</label>
                      <input
                        type="date"
                        value={newTestimonial.date}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, date: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                  </>
                )}
                
                <ImageUploadSection
                  imageUrl={newTestimonial.imageUrl}
                  onImageUpload={(e) => handleImageUpload(e, false)}
                  onRemoveImage={() => removeImage(false)}
                  fileInputRef={fileInputRef}
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={newTestimonial.isVerified}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, isVerified: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-700">
                    Verificado
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateTestimonial}
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
                      'Crear'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
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

      {/* Modal de edición */}
      {showEditModal && editingTestimonial && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Contenido</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={editingTestimonial.name}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={editingTestimonial.type}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, type: e.target.value as 'testimonial' | 'winner' })}
                    className="input-field mt-1"
                  >
                    <option value="testimonial">Testimonio</option>
                    <option value="winner">Ganador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contenido</label>
                  <textarea
                    value={editingTestimonial.content}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                    className="input-field mt-1"
                    rows={3}
                  />
                </div>
                {editingTestimonial.type === 'winner' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Premio Ganado</label>
                      <input
                        type="text"
                        value={editingTestimonial.prize || ''}
                        onChange={(e) => setEditingTestimonial({ ...editingTestimonial, prize: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Ganancia</label>
                      <input
                        type="date"
                        value={editingTestimonial.date || ''}
                        onChange={(e) => setEditingTestimonial({ ...editingTestimonial, date: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                  </>
                )}
                
                <ImageUploadSection
                  imageUrl={editingTestimonial.imageUrl}
                  onImageUpload={(e) => handleImageUpload(e, true)}
                  onRemoveImage={() => removeImage(true)}
                  fileInputRef={editFileInputRef}
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsVerified"
                    checked={editingTestimonial.isVerified}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, isVerified: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsVerified" className="ml-2 block text-sm text-gray-700">
                    Verificado
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateTestimonial}
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

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {/* Números de página */}
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Mostrar solo algunas páginas para evitar sobrecarga
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                  <span key={page} className="px-2 py-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default TestimonialsPage;

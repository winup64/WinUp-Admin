import React, { useState, useEffect, useMemo } from 'react';
import { PlusIcon, BellIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { notificationsService, Notification } from '../../services/notificationsService';
import { 
  useNotificationsList, 
  useCreateNotification, 
  useUpdateNotification, 
  useDeleteNotification 
} from '../../hooks/useNotifications';

const NotificationsPage: React.FC = () => {
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'promotional' | 'winner' | 'system' | 'reminder'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterAudience, setFilterAudience] = useState<'all' | 'premium' | 'new_users' | 'inactive_users'>('all');

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
  }, [debouncedSearchTerm, filterType, filterStatus, filterAudience]);

  // ✨ React Query hooks - Reemplazan localStorage y carga manual
  const { 
    data: notificationsResponse, 
    isLoading: loading, 
    error: notificationsError 
  } = useNotificationsList({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm || undefined,
    type: filterType !== 'all' ? filterType : undefined,
    is_active: filterStatus !== 'all' ? (filterStatus === 'active') : undefined,
    target_audience: filterAudience !== 'all' ? filterAudience : undefined,
  });

  // Mutations
  const createMutation = useCreateNotification();
  const updateMutation = useUpdateNotification();
  const deleteMutation = useDeleteNotification();

  // Extraer datos de la respuesta
  const notifications = useMemo(() => {
    if (!notificationsResponse) {
      return [];
    }
    
    if (!notificationsResponse.data) {
      return [];
    }
    
    const data = notificationsResponse.data;
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data && typeof data === 'object') {
      return [data];
    }
    
    return [];
  }, [notificationsResponse]);

  const totalPages = notificationsResponse?.pagination?.totalPages || 0;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState<Notification | null>(null);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'promotional' as 'promotional' | 'winner' | 'system' | 'reminder',
    isActive: true,
    scheduledDate: '',
    targetAudience: 'all' as 'all' | 'premium' | 'new_users' | 'inactive_users',
  });

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setShowEditModal(true);
  };

  const openDeleteModal = (notification: Notification) => {
    setDeletingNotification(notification);
    setShowDeleteModal(true);
  };

  const confirmDeleteNotification = async () => {
    if (!deletingNotification || !deletingNotification.id) return;
    try {
      await deleteMutation.mutateAsync(deletingNotification.id);
      setShowDeleteModal(false);
      setDeletingNotification(null);
      alert('Notificación eliminada exitosamente');
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la notificación');
      setShowDeleteModal(false);
      setDeletingNotification(null);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Por favor completa el título y mensaje');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        isActive: newNotification.isActive,
        scheduledDate: newNotification.scheduledDate || undefined,
        targetAudience: newNotification.targetAudience,
      });

      setShowCreateModal(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'promotional',
        isActive: true,
        scheduledDate: '',
        targetAudience: 'all',
      });
      
      alert('Notificación creada exitosamente');
    } catch (err: any) {
      alert(err.message || 'Error al crear la notificación');
    }
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification || !editingNotification.id) return;

    if (!editingNotification.title || !editingNotification.message) {
      alert('Por favor completa el título y mensaje');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingNotification.id,
        data: {
          title: editingNotification.title,
          message: editingNotification.message,
          type: editingNotification.type,
          isActive: editingNotification.isActive,
          scheduledDate: editingNotification.scheduledDate,
          targetAudience: editingNotification.targetAudience,
        }
      });

      setShowEditModal(false);
      setEditingNotification(null);
      alert('Notificación actualizada exitosamente');
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la notificación');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'promotional': return 'Promocional';
      case 'winner': return 'Ganador';
      case 'system': return 'Sistema';
      case 'reminder': return 'Recordatorio';
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'promotional': return 'badge-info';
      case 'winner': return 'badge-success';
      case 'system': return 'badge-warning';
      case 'reminder': return 'badge-primary';
      default: return 'badge-info';
    }
  };

  const getTargetAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'Todos';
      case 'premium': return 'Premium';
      case 'new_users': return 'Nuevos';
      case 'inactive_users': return 'Inactivos';
      default: return audience;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Gestión de Notificaciones</h1>
          <p className="text-gray-600">Administra las notificaciones push e in-app</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Notificación
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Todos los tipos</option>
              <option value="promotional">Promocional</option>
              <option value="winner">Ganador</option>
              <option value="system">Sistema</option>
              <option value="reminder">Recordatorio</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
          <div>
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value as any)}
              className="input-field"
            >
              <option value="all">Todas las audiencias</option>
              <option value="premium">Premium</option>
              <option value="new_users">Nuevos</option>
              <option value="inactive_users">Inactivos</option>
            </select>
          </div>
          <div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
                setFilterAudience('all');
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

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Cargando notificaciones...</div>
        </div>
      )}

      {notificationsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {notificationsError.message || 'Error al cargar las notificaciones'}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer">Detalles técnicos</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(notificationsError, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {!loading && !notificationsError && notifications.length === 0 && (
        <div className="card p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <BellIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterAudience !== 'all'
                ? 'No se encontraron notificaciones con los filtros aplicados.'
                : 'Comienza creando tu primera notificación.'}
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && filterAudience === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Primera Notificación
            </button>
            )}
          </div>
        </div>
      )}

      {!loading && !notificationsError && notifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notifications.map((notification) => {
            // Log para debug
            if (!notification.id) {
              console.warn('Notification without ID:', notification);
            }
            return (
            <div key={notification.id || Math.random()} className="card p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                <span className={`badge ${getTypeBadge(notification.type)}`}>
                  {getTypeLabel(notification.type)}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-3">{notification.message}</p>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 ">
                {getTargetAudienceLabel(notification.targetAudience || 'all')}
              </span>
              <span className={`badge ${notification.isActive ? 'badge-success' : 'badge-danger'}`}>
                {notification.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              {notification.scheduledDate && (
                <span className="text-xs text-gray-400">
                  {new Date(notification.scheduledDate).toLocaleDateString('es-ES')}
                </span>
              )}
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditNotification(notification)}
                  className="text-warning-600 hover:text-warning-900 text-sm flex items-center"
                  title="Editar"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button 
                  onClick={() => openDeleteModal(notification)}
                  className="text-danger-600 hover:text-danger-900 text-sm flex items-center"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
          );
          })}
        </div>
      )}

      {/* Debug info - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && !loading && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong>
          <div>Total notifications: {notifications.length}</div>
          <div>Current page: {currentPage}</div>
          <div>Total pages: {totalPages}</div>
          <div>Has data: {notificationsResponse?.data ? 'Yes' : 'No'}</div>
          {notificationsResponse && (
            <details className="mt-2">
              <summary className="cursor-pointer">Response data</summary>
              <pre className="mt-2 overflow-auto max-h-40">
                {JSON.stringify(notificationsResponse, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Crear Nueva Notificación</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Título de la notificación"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="input-field mt-1"
                    rows={4}
                    placeholder="Mensaje de la notificación"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      className="input-field mt-1"
                    >
                      <option value="promotional">Promocional</option>
                      <option value="winner">Ganador</option>
                      <option value="system">Sistema</option>
                      <option value="reminder">Recordatorio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Audiencia</label>
                    <select
                      value={newNotification.targetAudience}
                      onChange={(e) => setNewNotification({ ...newNotification, targetAudience: e.target.value as any })}
                      className="input-field mt-1"
                    >
                      <option value="all">Todos los usuarios</option>
                      <option value="premium">Usuarios Premium</option>
                      <option value="new_users">Usuarios Nuevos</option>
                      <option value="inactive_users">Usuarios Inactivos</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora Programada (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={newNotification.scheduledDate}
                    onChange={(e) => setNewNotification({ ...newNotification, scheduledDate: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newNotification.isActive}
                    onChange={(e) => setNewNotification({ ...newNotification, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Notificación Activa
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateNotification}
                    disabled={createMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creando...
                      </span>
                    ) : (
                      'Crear'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={createMutation.isPending}
                    className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {showEditModal && editingNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Notificación</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    value={editingNotification.title}
                    onChange={(e) => setEditingNotification({ ...editingNotification, title: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    value={editingNotification.message}
                    onChange={(e) => setEditingNotification({ ...editingNotification, message: e.target.value })}
                    className="input-field mt-1"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={editingNotification.type}
                      onChange={(e) => setEditingNotification({ ...editingNotification, type: e.target.value as any })}
                      className="input-field mt-1"
                    >
                      <option value="promotional">Promocional</option>
                      <option value="winner">Ganador</option>
                      <option value="system">Sistema</option>
                      <option value="reminder">Recordatorio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Audiencia</label>
                    <select
                      value={editingNotification.targetAudience || 'all'}
                      onChange={(e) => setEditingNotification({ ...editingNotification, targetAudience: e.target.value as any })}
                      className="input-field mt-1"
                    >
                      <option value="all">Todos los usuarios</option>
                      <option value="premium">Usuarios Premium</option>
                      <option value="new_users">Usuarios Nuevos</option>
                      <option value="inactive_users">Usuarios Inactivos</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha y Hora Programada (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={editingNotification.scheduledDate || ''}
                    onChange={(e) => setEditingNotification({ ...editingNotification, scheduledDate: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editingNotification.isActive}
                    onChange={(e) => setEditingNotification({ ...editingNotification, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                    Notificación Activa
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateNotification}
                    disabled={updateMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Actualizando...
                      </span>
                    ) : (
                      'Actualizar'
                    )}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={updateMutation.isPending}
                    className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && deletingNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-1/3 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingNotification(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                ¿Seguro que deseas eliminar la notificación "{deletingNotification.title}"?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmDeleteNotification}
                  className="btn-danger flex-1"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingNotification(null); }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
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

export default NotificationsPage;

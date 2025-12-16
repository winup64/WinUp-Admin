import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  GiftIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  useRedemptionStats, 
  useRedemptionsList,
  useMarkAsProcessing,
  useMarkAsDelivered,
  useCancelRedemption
} from '../../hooks/useRedemptions';
import type { Redemption } from '../../services/rewardsService';

const RedemptionsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para modales
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);

  // Estados para los formularios
  const [adminNote, setAdminNote] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [cancellationReason, setCancellationReason] = useState('');
  const [messageToUser, setMessageToUser] = useState('');
  const [refundPoints, setRefundPoints] = useState(true);

  // React Query hooks
  const { data: statsData, isLoading: isLoadingStats } = useRedemptionStats();
  const { 
    data: redemptionsData, 
    isLoading: isLoadingRedemptions
  } = useRedemptionsList({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    search: searchTerm || undefined,
  });

  
  // Mutations para gestión de canjes
  const markProcessingMutation = useMarkAsProcessing();
  const markDeliveredMutation = useMarkAsDelivered();
  const cancelMutation = useCancelRedemption();

  // Extraer datos de las respuestas
  const redemptions = redemptionsData?.data || [];
  const stats = statsData?.data || {
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
    total: 0,
    today_redeemed: 0,
    average_processing_time_hours: 0
  };
  const totalPages = redemptionsData?.pagination?.total_pages || 1;

  // DATOS DE DEMOSTRACIÓN (ELIMINADOS - Ahora viene del backend)
  /*
  const mockRedemptions: Redemption[] = [
    {
      redemption_id: 'r1',
      user_id: 'u1',
      userName: 'Juan Pérez',
      userEmail: 'juan@email.com',
      reward_id: 'rw1',
      rewardName: 'Entrada Cinépolis',
      rewardType: 'fisico',
      pointsSpent: 500,
      uniqueCode: 'CINE2024-12345',
      status: 'pending',
      redemptionDate: '2025-10-20T10:30:00Z',
      expirationDate: '2025-10-30T23:59:59Z',
      statusHistory: [
        { status: 'pending', date: '2025-10-20T10:30:00Z' }
      ]
    },
    {
      redemption_id: 'r2',
      user_id: 'u2',
      userName: 'María González',
      userEmail: 'maria@email.com',
      reward_id: 'rw2',
      rewardName: 'Combo KFC',
      rewardType: 'fisico',
      pointsSpent: 800,
      uniqueCode: 'KFC2024-67890',
      status: 'processing',
      redemptionDate: '2025-10-19T15:45:00Z',
      expirationDate: '2025-10-29T23:59:59Z',
      internalNote: 'Coordinando con KFC...',
      statusHistory: [
        { status: 'pending', date: '2025-10-19T15:45:00Z' },
        { status: 'processing', date: '2025-10-19T16:00:00Z', note: 'Coordinando con KFC...' }
      ]
    },
    {
      redemption_id: 'r3',
      user_id: 'u3',
      userName: 'Carlos Ruiz',
      userEmail: 'carlos@email.com',
      reward_id: 'rw3',
      rewardName: 'Código Steam $10',
      rewardType: 'digital',
      pointsSpent: 1000,
      uniqueCode: 'STEAM2024-ABCDE',
      status: 'delivered',
      redemptionDate: '2025-10-18T09:20:00Z',
      deliveryDate: '2025-10-18T10:00:00Z',
      deliveryInstructions: 'Código de Steam enviado por email.',
      statusHistory: [
        { status: 'pending', date: '2025-10-18T09:20:00Z' },
        { status: 'processing', date: '2025-10-18T09:30:00Z' },
        { status: 'delivered', date: '2025-10-18T10:00:00Z', note: 'Código enviado por email' }
      ]
    },
    {
      redemption_id: 'r4',
      user_id: 'u4',
      userName: 'Ana Martínez',
      userEmail: 'ana@email.com',
      reward_id: 'rw4',
      rewardName: 'Gift Card Amazon $20',
      rewardType: 'digital',
      pointsSpent: 2000,
      uniqueCode: 'AMZN2024-XYZ12',
      status: 'used',
      redemptionDate: '2025-10-17T14:15:00Z',
      deliveryDate: '2025-10-17T15:00:00Z',
      deliveryInstructions: 'Gift Card enviada por email.',
      statusHistory: [
        { status: 'pending', date: '2025-10-17T14:15:00Z' },
        { status: 'processing', date: '2025-10-17T14:30:00Z' },
        { status: 'delivered', date: '2025-10-17T15:00:00Z' },
        { status: 'used', date: '2025-10-17T18:00:00Z', note: 'Usuario marcó como usado' }
      ]
    },
    {
      redemption_id: 'r5',
      user_id: 'u5',
      userName: 'Luis Torres',
      userEmail: 'luis@email.com',
      reward_id: 'rw5',
      rewardName: 'Pizza Dominos',
      rewardType: 'fisico',
      pointsSpent: 600,
      uniqueCode: 'PIZZA2024-98765',
      status: 'cancelled',
      redemptionDate: '2025-10-16T11:00:00Z',
      cancellationReason: 'Premio agotado',
      statusHistory: [
        { status: 'pending', date: '2025-10-16T11:00:00Z' },
        { status: 'cancelled', date: '2025-10-16T12:00:00Z', note: 'Premio agotado - Puntos devueltos' }
      ]
    }
  ];
  */

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { label: string; className: string; icon: any } } = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      processing: { label: 'Procesando', className: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      used: { label: 'Usado', className: 'bg-purple-100 text-purple-800', icon: GiftIcon },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: XMarkIcon }
    };
    
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    alert('📥 Exportando canjes a Excel...\n(Funcionalidad de demostración)');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`✅ Código ${code} copiado al portapapeles`);
  };

  // Funciones para abrir modales
  const openDetailsModal = (redemption: Redemption) => {
    setSelectedRedemption(redemption);
    setShowDetailsModal(true);
  };

  const openProcessingModal = (redemption: Redemption) => {
    setSelectedRedemption(redemption);
    setAdminNote('');
    setShowProcessingModal(true);
  };

  const openDeliveredModal = (redemption: Redemption) => {
    setSelectedRedemption(redemption);
    setDeliveryInstructions(`¡Felicidades ${redemption.user_name}! 🎉\n\nTu premio ha sido entregado exitosamente:\n🎁 ${redemption.reward_name}\n\nCódigo de canje: ${redemption.unique_code}\n\n¡Esperamos que disfrutes mucho tu premio!\nGracias por participar en nuestro programa de recompensas.\n\n¡Que tengas una excelente experiencia! ✨`);
    setSendNotification(true);
    setShowDeliveredModal(true);
  };

  const openCancelModal = (redemption: Redemption) => {
    setSelectedRedemption(redemption);
    setCancellationReason('');
    setMessageToUser('');
    setRefundPoints(true);
    setShowCancelModal(true);
  };

  // Funciones para procesar acciones con API real
  const handleMarkAsProcessing = async () => {
    if (!selectedRedemption) return;
    
    try {
      await markProcessingMutation.mutateAsync({
        redemptionId: selectedRedemption.redemption_id,
        admin_note: adminNote || undefined
      });
      
      setShowProcessingModal(false);
      setSelectedRedemption(null);
      setAdminNote('');
    } catch (error) {
      // El error ya se maneja en el hook
      
    }
  };

  const handleMarkAsDelivered = async () => {
    if (!selectedRedemption || !deliveryInstructions.trim()) return;
    
    try {
      await markDeliveredMutation.mutateAsync({
        redemptionId: selectedRedemption.redemption_id,
        delivery_instructions: deliveryInstructions,
        admin_note: adminNote || undefined,
        send_notification: sendNotification
      });
      
      setShowDeliveredModal(false);
      setSelectedRedemption(null);
      setDeliveryInstructions('');
      setAdminNote('');
    } catch (error) {
      // El error ya se maneja en el hook
      
    }
  };

  const handleCancelRedemption = async () => {
    if (!selectedRedemption || !cancellationReason) return;
    
    try {
      await cancelMutation.mutateAsync({
        redemptionId: selectedRedemption.redemption_id,
        cancellation_reason: cancellationReason,
        message_to_user: messageToUser || undefined,
        refund_points: refundPoints,
        send_notification: true
      });
      
      setShowCancelModal(false);
      setSelectedRedemption(null);
      setCancellationReason('');
      setMessageToUser('');
    } catch (error) {
      // El error ya se maneja en el hook
      
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Historial de Canjes</h2>
          <p className="text-sm text-gray-500">Lista de premios canjeados por los usuarios</p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-secondary flex items-center text-sm"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Exportar
        </button>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-900">Pendientes</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <ClockIcon className="h-6 w-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-900">Procesando</p>
              <p className="text-xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <ClockIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-900">Entregados</p>
              <p className="text-xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>

         <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-xs font-medium text-gray-900">Total</p>
               <p className="text-xl font-bold text-gray-600">{stats.total}</p>
             </div>
             <GiftIcon className="h-6 w-6 text-gray-600" />
           </div>
         </div>

        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-900">Cancelados</p>
              <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XMarkIcon className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros Simples */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, código o premio..."
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
              <option value="pending">Pendientes</option>
              <option value="processing">Procesando</option>
              <option value="delivered">Entregados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
          <div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="btn-secondary w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Canjes - Tabla Compacta */}
      {isLoadingRedemptions || isLoadingStats ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando canjes...</p>
        </div>
      ) : redemptions.length === 0 ? (
        <div className="card p-12 text-center">
          <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay canjes</h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' || searchTerm 
              ? 'No se encontraron canjes con los filtros aplicados.'
              : 'Cuando los usuarios canjeen premios, aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Premio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Puntos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {redemptions.map((redemption) => (
              <tr key={redemption.redemption_id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <UserGroupIcon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{redemption.user_name}</p>
                      <p className="text-xs text-gray-500">{redemption.user_email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{redemption.reward_name}</p>
                    <p className="text-xs text-gray-500">
                      {redemption.reward_type === 'digital' ? '💻 Digital' : '📦 Físico'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {redemption.unique_code}
                    </code>
                    <button
                      onClick={() => copyCode(redemption.unique_code)}
                      className="text-primary-600 hover:text-primary-800 text-xs"
                      title="Copiar código"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-primary-600">
                    -{redemption.points_spent}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs text-gray-900">{formatDate(redemption.redemption_date)}</p>
                  {redemption.delivery_date && (
                    <p className="text-xs text-green-600">
                      Entregado: {formatDate(redemption.delivery_date)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(redemption.status)}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => openDetailsModal(redemption)}
                      className="text-primary-600 hover:text-primary-800 text-xs flex items-center"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver
                    </button>
                    
                    {redemption.status === 'pending' && (
                      <button
                        onClick={() => openProcessingModal(redemption)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                        title="Marcar en proceso"
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Procesar
                      </button>
                    )}
                    
                    {(redemption.status === 'pending' || redemption.status === 'processing') && (
                      <>
                        <button
                          onClick={() => openDeliveredModal(redemption)}
                          className="text-green-600 hover:text-green-800 text-xs flex items-center"
                          title="Marcar como entregado"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Entregar
                        </button>
                        
                        <button
                          onClick={() => openCancelModal(redemption)}
                          className="text-red-600 hover:text-red-800 text-xs flex items-center"
                          title="Cancelar canje"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Paginación */}
      {!isLoadingRedemptions && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            ))}
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

      {/* MODAL: Ver Detalles */}
      {showDetailsModal && selectedRedemption && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Detalle del Canje</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información del Usuario */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Información del Usuario
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Nombre:</span>
                    <p className="text-blue-900">{selectedRedemption.user_name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email:</span>
                    <p className="text-blue-900">{selectedRedemption.user_email}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">ID Usuario:</span>
                    <p className="text-blue-900 font-mono text-xs">{selectedRedemption.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Información del Premio */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                  <GiftIcon className="h-5 w-5 mr-2" />
                  Información del Premio
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-purple-700 font-medium">Premio:</span>
                    <p className="text-purple-900">{selectedRedemption.reward_name}</p>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Tipo:</span>
                    <p className="text-purple-900">
                      {selectedRedemption.reward_type === 'digital' ? '💻 Digital' : '📦 Físico'}
                    </p>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Puntos gastados:</span>
                    <p className="text-purple-900 font-bold">{selectedRedemption.points_spent}</p>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Código único:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs font-mono bg-purple-100 px-2 py-1 rounded text-purple-900">
                        {selectedRedemption.unique_code}
                      </code>
                      <button
                        onClick={() => copyCode(selectedRedemption.unique_code)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Canje */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Información del Canje
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700 font-medium">Fecha de canje:</span>
                    <p className="text-gray-900">{formatDate(selectedRedemption.redemption_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-700 font-medium">Estado actual:</span>
                    <p className="mt-1">{getStatusBadge(selectedRedemption.status)}</p>
                  </div>
                  {selectedRedemption.delivery_date && (
                    <div>
                      <span className="text-gray-700 font-medium">Fecha de entrega:</span>
                      <p className="text-gray-900">{formatDate(selectedRedemption.delivery_date)}</p>
                    </div>
                  )}
                  {selectedRedemption.expiration_date && (
                    <div>
                      <span className="text-gray-700 font-medium">Fecha de expiración:</span>
                      <p className="text-gray-900">{formatDate(selectedRedemption.expiration_date)}</p>
                    </div>
                  )}
                </div>

                {selectedRedemption.internal_note && (
                  <div className="mt-3">
                    <span className="text-gray-700 font-medium">Nota interna:</span>
                    <p className="text-gray-900 bg-yellow-50 p-2 rounded mt-1 text-sm">
                      {selectedRedemption.internal_note}
                    </p>
                  </div>
                )}

                {selectedRedemption.delivery_instructions && (
                  <div className="mt-3">
                    <span className="text-gray-700 font-medium">Instrucciones de entrega:</span>
                    <p className="text-gray-900 bg-green-50 p-2 rounded mt-1 text-sm">
                      {selectedRedemption.delivery_instructions}
                    </p>
                  </div>
                )}

                {selectedRedemption.cancellation_reason && (
                  <div className="mt-3">
                    <span className="text-gray-700 font-medium">Motivo de cancelación:</span>
                    <p className="text-red-900 bg-red-50 p-2 rounded mt-1 text-sm">
                      {selectedRedemption.cancellation_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Historial de Estados - Pendiente de implementar con API de historial */}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {(selectedRedemption.status === 'pending' || selectedRedemption.status === 'processing') && (
                <>
                  {selectedRedemption.status === 'pending' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openProcessingModal(selectedRedemption);
                      }}
                      className="btn-secondary flex items-center"
                    >
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Marcar en Proceso
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openDeliveredModal(selectedRedemption);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Marcar como Entregado
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Marcar como EN PROCESO */}
      {showProcessingModal && selectedRedemption && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Marcar como EN PROCESO</h3>
              <button
                onClick={() => setShowProcessingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Estás marcando este canje como "En Proceso". Puedes agregar una nota interna para tu referencia.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-900">{selectedRedemption.reward_name}</p>
                <p className="text-xs text-blue-700">Usuario: {selectedRedemption.user_name}</p>
                <p className="text-xs text-blue-700">Código: {selectedRedemption.unique_code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota del administrador (opcional):
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Ej: Contactando al ganador para confirmar entrega. Seguimiento en 24 horas..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Esta nota es privada, solo los administradores la verán.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowProcessingModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkAsProcessing}
                disabled={markProcessingMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex-1 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {markProcessingMutation.isPending ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Marcar como ENTREGADO */}
      {showDeliveredModal && selectedRedemption && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">✅ Marcar como ENTREGADO</h3>
              <button
                onClick={() => setShowDeliveredModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                El premio será marcado como entregado. Agrega las instrucciones para que el usuario sepa cómo recibirlo.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-green-900">{selectedRedemption.reward_name}</p>
                <p className="text-xs text-green-700">Usuario: {selectedRedemption.user_name}</p>
                <p className="text-xs text-green-700">Email: {selectedRedemption.user_email}</p>
                <p className="text-xs text-green-700">Código: {selectedRedemption.unique_code}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones para el usuario: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="input-field"
                  rows={5}
                  placeholder="Personaliza el mensaje de entrega para el usuario..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enviar notificación push</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeliveredModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkAsDelivered}
                disabled={!deliveryInstructions.trim() || markDeliveredMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex-1 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {markDeliveredMutation.isPending ? 'Procesando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAR CANJE */}
      {showCancelModal && selectedRedemption && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
                CANCELAR CANJE
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Esta acción cancelará el canje y puede devolver los puntos al usuario.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-red-900">{selectedRedemption.reward_name}</p>
                <p className="text-xs text-red-700">Usuario: {selectedRedemption.user_name}</p>
                <p className="text-xs text-red-700">Email: {selectedRedemption.user_email}</p>
                <p className="text-xs text-red-700 font-bold">
                  Puntos a devolver: {selectedRedemption.points_spent}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de cancelación: <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="input-field"
                >
                  <option value="">Seleccionar motivo...</option>
                  <option value="Premio agotado">Premio agotado</option>
                  <option value="Error del sistema">Error del sistema</option>
                  <option value="Solicitud del usuario">Solicitud del usuario</option>
                  <option value="No se puede cumplir">No se puede cumplir con la entrega</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje para el usuario (opcional):
                </label>
                <textarea
                  value={messageToUser}
                  onChange={(e) => setMessageToUser(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder={`Lo sentimos, este premio se agotó.\nTus ${selectedRedemption.points_spent} puntos han sido devueltos a tu cuenta.`}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={refundPoints}
                    onChange={(e) => setRefundPoints(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                  />
                  <span className="ml-2 text-sm text-yellow-900">
                    <strong>Devolver puntos al usuario automáticamente</strong>
                    <br />
                    <span className="text-xs">
                      Se devolverán {selectedRedemption.points_spent} puntos a {selectedRedemption.user_name}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary flex-1"
              >
                Volver
              </button>
              <button
                onClick={handleCancelRedemption}
                disabled={!cancellationReason || cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? 'Procesando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedemptionsTab;


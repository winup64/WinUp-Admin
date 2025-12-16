import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon, PhoneIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { WeeklyRaffle, RaffleWinner } from '../../types';

interface PaymentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: WeeklyRaffle;
  onUpdatePayment: (winnerId: string, paymentStatus: string, paymentMethod?: string) => void;
}

const PaymentManagementModal: React.FC<PaymentManagementModalProps> = ({
  isOpen,
  onClose,
  raffle,
  onUpdatePayment
}) => {
  const [editingWinner, setEditingWinner] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'verifying':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Pagado';
      case 'processing':
        return 'Procesando';
      case 'verifying':
        return 'Verificando';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'whatsapp':
        return <PhoneIcon className="h-4 w-4 text-green-600" />;
      case 'bank_transfer':
        return <BanknotesIcon className="h-4 w-4 text-blue-600" />;
      case 'crypto':
        return <CurrencyDollarIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMethodText = (method?: string) => {
    switch (method) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'bank_transfer':
        return 'Transferencia Bancaria';
      case 'crypto':
        return 'Criptomoneda';
      case 'gift_card':
        return 'Tarjeta de Regalo';
      case 'points':
        return 'Puntos';
      default:
        return 'Sin método';
    }
  };

  const handleStatusChange = (winnerId: string, newStatus: string) => {
    onUpdatePayment(winnerId, newStatus);
    setEditingWinner(null);
  };

  const handleMethodChange = (winnerId: string, method: string) => {
    // Al seleccionar un método, automáticamente marcar como pagado
    onUpdatePayment(winnerId, 'completed', method);
    setEditingWinner(null);
    setSelectedPaymentMethod('');
  };

  const totalWinners = raffle.winners.length;
  const paidWinners = raffle.winners.filter(w => w.paymentStatus === 'completed').length;
  const pendingWinners = totalWinners - paidWinners;
  const totalAmount = raffle.winners.reduce((sum, winner) => sum + winner.prizeAmount, 0);
  const paidAmount = raffle.winners
    .filter(w => w.paymentStatus === 'completed')
    .reduce((sum, winner) => sum + winner.prizeAmount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center space-x-3">
            <CurrencyDollarIcon className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-semibold">Gestión de Pagos</h2>
              <p className="text-green-100">{raffle.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-green-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Ganadores</p>
                  <p className="text-lg font-semibold text-blue-600">{totalWinners}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Pagados</p>
                  <p className="text-lg font-semibold text-green-600">{paidWinners}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-lg font-semibold text-yellow-600">{pendingWinners}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-lg font-semibold text-purple-600">${paidAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Ganadores */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lista de Ganadores ({totalWinners})
            </h3>
            
            {raffle.winners.map((winner, index) => (
              <div key={winner.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                        {winner.position}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {winner.name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {winner.email}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${winner.prizeAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {winner.prizePercentage}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Estado de Pago */}
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(winner.paymentStatus)}`}>
                        {getStatusText(winner.paymentStatus)}
                      </span>
                      
                      {editingWinner === winner.id ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleMethodChange(winner.id, 'whatsapp')}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 flex items-center space-x-1"
                          >
                            <PhoneIcon className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => handleMethodChange(winner.id, 'bank_transfer')}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center space-x-1"
                          >
                            <BanknotesIcon className="h-3 w-3" />
                            <span>Banco</span>
                          </button>
                          <button
                            onClick={() => setEditingWinner(null)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : winner.paymentStatus === 'completed' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          ✅ Visto
                        </span>
                      ) : (
                        <button
                          onClick={() => setEditingWinner(winner.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          Método de Pago
                        </button>
                      )}
                    </div>
                    
                    {/* Método de Pago */}
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(winner.paymentMethod)}
                      <span className="text-xs text-gray-600">
                        {getMethodText(winner.paymentMethod)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <div className="text-sm text-gray-500">
              Progreso: {paidWinners}/{totalWinners} pagos completados
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  // Marcar todos como pagados
                  raffle.winners.forEach(winner => {
                    if (winner.paymentStatus !== 'completed') {
                      onUpdatePayment(winner.id, 'completed', 'whatsapp');
                    }
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Marcar Todos como Pagados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagementModal;
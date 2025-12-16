import React from 'react';
import { XMarkIcon, TrophyIcon, GiftIcon, UserIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { ProductRaffle, RaffleWinner } from '../../types';

interface ProductRaffleResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: ProductRaffle;
  winner: RaffleWinner;
}

const ProductRaffleResultsModal: React.FC<ProductRaffleResultsModalProps> = ({
  isOpen,
  onClose,
  raffle,
  winner
}) => {
  const [showContactInfo, setShowContactInfo] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-semibold">Resultados del Sorteo</h2>
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

        <div className="p-6 space-y-6">
          {/* Información del Sorteo */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border-2 border-amber-200">
            {/* Imagen del producto */}
            {raffle.imageUrl && (
              <div className="mb-6">
                <img 
                  src={raffle.imageUrl} 
                  alt={raffle.product}
                  className="w-full h-64 object-cover rounded-xl shadow-lg"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-3 mb-6">
              <GiftIcon className="h-8 w-8 text-amber-600" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{raffle.product}</h3>
                <p className="text-gray-600 mt-1">{raffle.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-md border-2 border-blue-200 text-center">
                <div className="flex items-center justify-center mb-2">
                  <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Participantes</p>
                </div>
                <p className="font-black text-blue-600 text-3xl">
                  {raffle.currentParticipants}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md border-2 border-purple-200 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CalendarIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fecha Sorteo</p>
                </div>
                <p className="font-black text-purple-600 text-xl">
                  {new Date(raffle.drawDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Ganador */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Felicitaciones al Ganador!
              </h3>
              
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
                <div className="flex items-center justify-center mb-4">
                  {winner.profileImage ? (
                    <img
                      src={winner.profileImage}
                      alt={winner.name}
                      className="h-16 w-16 rounded-full object-cover border-4 border-yellow-400"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {winner.name}
                </h4>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    <span>{winner.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Ganador el {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Premio */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-lg border border-green-300 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  🎁 Premio Ganado
                </h4>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Producto:</p>
                  <p className="font-semibold text-gray-900 text-lg">
                    {raffle.product}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Contacto del Ganador */}
          {showContactInfo && (
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
              <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                📞 Información de Contacto del Ganador
              </h4>
              <div className="bg-white p-5 rounded-lg shadow-md space-y-3">
                <div className="flex items-center space-x-3 pb-3 border-b">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">{winner.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 pb-3 border-b">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Correo Electrónico</p>
                    <p className="font-semibold text-blue-600">{winner.email}</p>
                  </div>
                </div>
                {winner.phone && (
                  <div className="flex items-center space-x-3 pb-3 border-b">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                      <p className="font-semibold text-green-600">{winner.phone}</p>
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                  <p className="text-sm text-amber-800">
                    <span className="font-bold">📌 Nota:</span> Contacta al ganador para coordinar la entrega del premio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-center space-x-4 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Cerrar
            </button>
            <button
              onClick={() => setShowContactInfo(!showContactInfo)}
              className={`px-6 py-2 text-white rounded-lg transition-colors font-semibold ${
                showContactInfo 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {showContactInfo ? '🔼 Ocultar Información' : '📞 Ver Información de Contacto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRaffleResultsModal;

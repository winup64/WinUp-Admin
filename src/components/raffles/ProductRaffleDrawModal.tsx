import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, TrophyIcon, GiftIcon } from '@heroicons/react/24/outline';
import { ProductRaffle, RaffleParticipant, RaffleWinner } from '../../types';
import RafflesService from '../../services/rafflesService';
import VerticalSelector from './VerticalSelector';

interface ProductRaffleDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: ProductRaffle;
  onComplete: (winner: RaffleWinner) => void;
}

const ProductRaffleDrawModal: React.FC<ProductRaffleDrawModalProps> = ({
  isOpen,
  onClose,
  raffle,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'preparation' | 'drawing' | 'complete'>('preparation');
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(12);
  const [participants, setParticipants] = useState<Array<{ id: string; userId: string; ticketNumber: number; name: string }>>([]);
  const rollerInterval = useRef<number | null>(null);
  const settleTimeout = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await RafflesService.getParticipants(raffle.id);
        if (!mounted) return;
        setParticipants(list.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          ticketNumber: p.ticketNumber,
          name: String(p.name ?? 'Usuario'),
        })));
      } catch (e) {
        if (mounted) setParticipants([]);
      }
    })();
    return () => {
      mounted = false;
      if (rollerInterval.current) window.clearInterval(rollerInterval.current);
      if (settleTimeout.current) window.clearTimeout(settleTimeout.current);
    };
  }, [raffle.id]);

  // Datos simulados para testing/visualización
  const mockParticipants = [
    "Juan Pérez Martínez",
    "María García López",
    "Carlos Rodríguez Silva",
    "Ana Martínez González",
    "Pedro Sánchez Ramírez",
    "Laura Torres Mendoza",
    "Miguel Ángel Ruiz",
    "Sofía Ramírez Castro",
    "Diego Fernández Mora",
    "Valentina López Cruz",
    "Andrés Gómez Vargas",
    "Camila Díaz Rojas",
    "Sebastián Herrera Ortiz",
    "Isabella Morales Vega",
    "Mateo Castro Delgado",
    "Lucía Navarro Jiménez",
    "Daniel Romero Aguilar",
    "Emma Gutiérrez Paredes",
    "Santiago Flores Medina",
    "Olivia Chávez Salazar"
  ];

  const participantNames = participants.length > 0
    ? participants.map(p => String(p.name ?? 'Usuario'))
    : mockParticipants; // Usar datos simulados si no hay participantes reales

  useEffect(() => {
    if (isAutoDrawing && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAutoDrawing, timeRemaining]);

  const startAutoDraw = () => {
    if (!participantNames.length) return;
    setCurrentStep('drawing');
    setSelectedWinner('');
    setIsAutoDrawing(true);
    setTimeRemaining(12);
    setIsSpinning(true);

    // Velocidad inicial ágil (120ms entre nombres)
    let currentSpeed = 120;
    
    rollerInterval.current = window.setInterval(() => {
      setSelectedWinner(prev => {
        const idx = Math.floor(Math.random() * participantNames.length);
        return participantNames[idx];
      });
    }, currentSpeed);

    // Ralentizar gradualmente
    const speedAdjuster = window.setInterval(() => {
      currentSpeed = Math.min(currentSpeed + 20, 350); // Ralentizar hasta 350ms
      if (rollerInterval.current) {
        window.clearInterval(rollerInterval.current);
        rollerInterval.current = window.setInterval(() => {
          setSelectedWinner(prev => {
            const idx = Math.floor(Math.random() * participantNames.length);
            return participantNames[idx];
          });
        }, currentSpeed);
      }
    }, 1000); // Cada segundo ajustar velocidad

    const timerId = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          window.clearInterval(speedAdjuster);
          if (rollerInterval.current) {
            window.clearInterval(rollerInterval.current);
            rollerInterval.current = null;
          }
          settleTimeout.current = window.setTimeout(() => {
            void completeDraw();
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeDraw = async () => {
    if (!participantNames.length) {
      setIsSpinning(false);
      setIsAutoDrawing(false);
      return;
    }

    try {
      // Disparar sorteo en backend (persiste ganadores en BD)
      try {
        await RafflesService.draw(raffle.id);
      } catch (err) {
        // Si ya fue sorteado u otro error controlado, continuamos a leer ganadores persistidos
      }

      // Leer ganadores persistidos
      const winners = await RafflesService.getWinners(raffle.id);
      const top = winners.find((w: any) => Number(w.position) === 1) || winners[0];
      if (top) {
        const winnerName = String(top.name || 'Usuario');
        setSelectedWinner(winnerName);
        const newWinner: RaffleWinner = {
          id: String(top.winner_id || `winner-${Date.now()}`),
          name: winnerName,
          email: String(top.email || ''),
          phone: top.phone ? String(top.phone) : undefined,
          position: Number(top.position || 1),
          prizePercentage: Number(top.prize_percentage ?? 100),
          prizeAmount: Number(top.prize_amount ?? raffle.productValue),
          drawDate: String(top.awarded_at || new Date().toISOString()),
          isPaid: false,
          paymentStatus: 'pending',
        };
        setCurrentStep('complete');
        onComplete(newWinner);
      } else {
        // Fallback visual si por alguna razón no hay ganadores
        const finalIdx = Math.floor(Math.random() * participantNames.length);
        const name = String(participantNames[finalIdx] ?? 'Usuario');
        setSelectedWinner(name);
        setCurrentStep('complete');
        onComplete({
          id: `winner-${Date.now()}`,
          name,
          email: '',
          phone: undefined,
          position: 1,
          prizePercentage: 100,
          prizeAmount: raffle.productValue,
          drawDate: new Date().toISOString(),
          isPaid: false,
          paymentStatus: 'pending',
        });
      }
    } catch (e) {
    } finally {
      setIsSpinning(false);
      setIsAutoDrawing(false);
    }
  };

  const confirmResults = () => {
    if (selectedWinner) {
      void completeDraw();
    }
  };

  const resetDraw = () => {
    setCurrentStep('preparation');
    setSelectedWinner('');
    setIsSpinning(false);
    setIsAutoDrawing(false);
    setTimeRemaining(12);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
          <div className="flex items-center space-x-3">
            <GiftIcon className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-semibold">Sorteo de Producto</h2>
              <p className="text-amber-100">{raffle.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-amber-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {currentStep === 'preparation' && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                {raffle.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={raffle.imageUrl} 
                      alt={raffle.name}
                      className="w-full h-48 object-cover rounded-lg mx-auto shadow-md"
                    />
                  </div>
                )}
                <TrophyIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {raffle.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {raffle.description}
                </p>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-center">
                    <span className="text-gray-500 text-sm">Participantes:</span>
                    <p className="font-semibold text-lg text-gray-900">
                      {participants.length > 0 ? participants.length : participantNames.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={startAutoDraw}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🎲 Iniciar Sorteo Automático
                </button>
                
                <p className="text-sm text-gray-500">
                  Se seleccionará automáticamente 1 ganador de {participants.length > 0 ? participants.length : participantNames.length} participantes
                </p>
              </div>
            </div>
          )}

          {currentStep === 'drawing' && (
            <div className="text-center space-y-6">
              <div className="p-8">
                <h3 className="text-3xl font-black text-amber-900 mb-8">
                  🎲 ¡SORTEANDO GANADOR!
                </h3>
                
                <div className="max-w-2xl mx-auto">
                  <VerticalSelector
                    items={participantNames}
                    selectedItem={selectedWinner}
                    onSelect={setSelectedWinner}
                    isSpinning={isSpinning}
                    timeRemaining={timeRemaining}
                  />
                </div>

                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={resetDraw}
                    className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-lg shadow-lg"
                  >
                    🔄 Reiniciar Sorteo
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-8 p-8">
              <div className="text-8xl mb-6 animate-bounce">🎉</div>
              
              <h3 className="text-4xl font-black text-amber-900 mb-4">
                ¡SORTEO COMPLETADO!
              </h3>

              {selectedWinner && (
                <div className="max-w-2xl mx-auto bg-gradient-to-br from-yellow-100 via-yellow-50 to-orange-100 p-8 rounded-3xl border-4 border-amber-500 shadow-2xl">
                  <div className="text-6xl mb-4 animate-pulse">🏆</div>
                  
                  <h4 className="text-2xl font-bold text-amber-800 mb-6">
                    GANADOR SELECCIONADO
                  </h4>
                  
                  <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-amber-400 mb-6">
                    <p className="text-4xl font-black text-amber-900 mb-2">
                      {selectedWinner}
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Producto Ganado:</p>
                    <p className="text-2xl font-bold text-gray-900">{raffle.product}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={resetDraw}
                  className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold text-lg shadow-lg"
                >
                  🔄 Nuevo Sorteo
                </button>
                <button
                  onClick={confirmResults}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
                >
                  ✅ Confirmar Resultados
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRaffleDrawModal;

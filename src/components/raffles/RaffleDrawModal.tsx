import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlayIcon, CheckCircleIcon, TrophyIcon } from '@heroicons/react/24/outline';
import VerticalSelector from './VerticalSelector';
import './raffle-animations.css';
import { WeeklyRaffle, RaffleParticipant, RaffleWinner, PrizeDistribution, MonthlyRaffle } from '../../types';
import RafflesService from '../../services/rafflesService';
import { 
  getEligibleParticipants, 
  updateParticipantExclusion, 
  updateWeeklyRaffleExclusions,
  calculateExclusionPeriod 
} from '../../utils/raffleExclusions';

interface RaffleDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: WeeklyRaffle | null;
  monthlyRaffle?: MonthlyRaffle | null;
  onComplete: (winners: RaffleWinner[]) => void;
}

const RaffleDrawModal: React.FC<RaffleDrawModalProps> = ({
  isOpen,
  onClose,
  raffle,
  monthlyRaffle,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'preparation' | 'drawing' | 'complete'>('preparation');
  const [currentPosition, setCurrentPosition] = useState<number>(1); // Posición actual que se está sorteando
  const [allWinners, setAllWinners] = useState<Array<{ position: number; name: string }>>([]); // Todos los ganadores seleccionados
  const [currentWinner, setCurrentWinner] = useState<string>(''); // Ganador actual en la ruleta
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(12);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Array<{ id: string; userId: string; ticketNumber: number; name: string }>>([]);
  const [totalWinnersCount, setTotalWinnersCount] = useState<number>(3);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const rollerInterval = useRef<number | null>(null);
  const settleTimeout = useRef<number | null>(null);

  // Cargar participantes reales desde la API
  useEffect(() => {
    let mounted = true;
    if (raffle && isOpen) {
      setIsLoadingParticipants(true);
      (async () => {
        try {
          const list = await RafflesService.getParticipants(raffle.id);
          if (!mounted) return;
          
          const loadedParticipants = list.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            ticketNumber: p.ticketNumber,
            name: String(p.name ?? 'Usuario'),
          }));
          
          setParticipants(loadedParticipants);
          
          // Si hay participantes reales, usarlos; si no, usar los del sorteo
          if (loadedParticipants.length > 0) {
            // Convertir a RaffleParticipant para usar getEligibleParticipants
            const raffleParticipants: RaffleParticipant[] = loadedParticipants.map(p => ({
              id: p.id,
              name: p.name,
              email: '',
              points: 0,
              participationLevel: 'bronze',
              joinedAt: new Date().toISOString(),
              profileImage: undefined,
              status: 'registered',
              multiplier: 1,
              activityScore: 50,
              loyaltyPoints: 10,
              exclusionStatus: {
                isExcluded: false,
                excludedFromRaffles: []
              }
            }));
            
            if (monthlyRaffle) {
              const eligibleParticipants = getEligibleParticipants(
                raffleParticipants,
                raffle,
                monthlyRaffle
              );
              const names = eligibleParticipants.map(p => p.name);
              setParticipantNames(names);
            } else {
              const names = raffleParticipants.map(p => p.name);
              setParticipantNames(names);
            }
          } else if (raffle.participants && raffle.participants.length > 0) {
            // Usar participantes del sorteo si no hay en la API
            if (monthlyRaffle) {
              const eligibleParticipants = getEligibleParticipants(
                raffle.participants,
                raffle,
                monthlyRaffle
              );
              const names = eligibleParticipants.map(p => p.name);
              setParticipantNames(names);
            } else {
              const names = raffle.participants.map(p => p.name);
              setParticipantNames(names);
            }
          } else {
            // Si no hay participantes, usar la cantidad actual del sorteo
            const currentCount = raffle.currentParticipants || 0;
            if (currentCount > 0) {
              const defaultUsers = Array.from({ length: currentCount }, (_, i) => `Usuario ${i + 1}`);
              setParticipantNames(defaultUsers);
            } else {
              setParticipantNames([]);
            }
          }
        } catch (e) {
          if (mounted) {
            // Fallback: usar participantes del sorteo o cantidad actual
      if (raffle.participants && raffle.participants.length > 0) {
              if (monthlyRaffle) {
        const eligibleParticipants = getEligibleParticipants(
          raffle.participants, 
          raffle, 
          monthlyRaffle
        );
        const names = eligibleParticipants.map(p => p.name);
        setParticipantNames(names);
      } else {
                const names = raffle.participants.map(p => p.name);
                setParticipantNames(names);
              }
            } else {
              const currentCount = raffle.currentParticipants || 0;
              if (currentCount > 0) {
                const defaultUsers = Array.from({ length: currentCount }, (_, i) => `Usuario ${i + 1}`);
        setParticipantNames(defaultUsers);
              } else {
                setParticipantNames([]);
              }
            }
          }
        } finally {
          if (mounted) setIsLoadingParticipants(false);
        }
      })();
      
      return () => {
        mounted = false;
        if (rollerInterval.current) window.clearInterval(rollerInterval.current);
        if (settleTimeout.current) window.clearTimeout(settleTimeout.current);
      };
    }
  }, [raffle, monthlyRaffle, isOpen]);

  // Ajustar total de ganadores cuando cambien los participantes
  useEffect(() => {
    if (raffle) {
      const winnersCount = raffle.winnersCount && raffle.winnersCount >= 3 ? raffle.winnersCount : 10;
      // Ajustar a la cantidad real de participantes si es menor
      const actualParticipants = participantNames.length > 0 
        ? participantNames.length 
        : (raffle.currentParticipants || 0);
      const adjustedWinnersCount = Math.min(winnersCount, actualParticipants);
      setTotalWinnersCount(adjustedWinnersCount >= 3 ? adjustedWinnersCount : Math.min(3, actualParticipants));
    }
  }, [participantNames.length, raffle]);

  // Calcular distribución de premios
  const calculatePrizeDistribution = (participants: RaffleParticipant[], distribution: PrizeDistribution) => {
    const totalFund = raffle?.totalFund || 0;
    
    const firstPlaceAmount = (totalFund * distribution.specificPositions.firstPlace) / 100;
    const secondPlaceAmount = (totalFund * distribution.specificPositions.secondPlace) / 100;
    const thirdPlaceAmount = (totalFund * distribution.specificPositions.thirdPlace) / 100;
    
    const rangeAmounts = distribution.prizeRanges.map(range => {
      const amountPerParticipant = (totalFund * range.percentage) / 100;
      return {
        range,
        amount: amountPerParticipant,
        percentage: range.percentage
      };
    });

    return {
      firstPlaceAmount,
      secondPlaceAmount,
      thirdPlaceAmount,
      rangeAmounts
    };
  };

  // Obtener participantes disponibles (excluyendo ganadores ya seleccionados)
  const getAvailableParticipants = (excludeWinners: Array<{ position: number; name: string }> = allWinners): string[] => {
    const selectedNames = excludeWinners.map(w => w.name);
    return participantNames.filter(name => !selectedNames.includes(name));
  };

  // Obtener premio para una posición
  const getPrizeForPosition = (position: number): number => {
    if (!raffle) return 0;
    const distribution = calculatePrizeDistribution(raffle.participants || [], raffle.prizeDistribution);
    
    if (position === 1) return distribution.firstPlaceAmount;
    if (position === 2) return distribution.secondPlaceAmount;
    if (position === 3) return distribution.thirdPlaceAmount;
    
    // Para posiciones 4+, usar el porcentaje del rango
    if (distribution.rangeAmounts.length > 0) {
      return distribution.rangeAmounts[0].amount;
    }
    
    return 0;
  };

  // Iniciar sorteo automático secuencial
  const startAutoDraw = () => {
    setCurrentStep('drawing');
    setCurrentPosition(1);
    setAllWinners([]);
    setCurrentWinner('');
    setIsAutoDrawing(true);
    startNextDraw(1);
  };

  // Iniciar sorteo para una posición específica
  const startNextDraw = (position: number, currentWinners: Array<{ position: number; name: string }> = allWinners) => {
    const available = getAvailableParticipants(currentWinners);
    if (available.length === 0) {
      completeAllDrawsWithWinners(currentWinners);
      return;
    }

    setCurrentPosition(position);
    setCurrentWinner('');
    setIsSpinning(true);
    setTimeRemaining(12);

    // Velocidad inicial
    let currentSpeed = 120;
    
    rollerInterval.current = window.setInterval(() => {
      setCurrentWinner(prev => {
        const idx = Math.floor(Math.random() * available.length);
        return available[idx];
      });
    }, currentSpeed);

    // Ralentizar gradualmente
    const speedAdjuster = window.setInterval(() => {
      currentSpeed = Math.min(currentSpeed + 20, 350);
      if (rollerInterval.current) {
        window.clearInterval(rollerInterval.current);
        rollerInterval.current = window.setInterval(() => {
          setCurrentWinner(prev => {
            const idx = Math.floor(Math.random() * available.length);
            return available[idx];
          });
        }, currentSpeed);
      }
          }, 1000);
          
    // Timer para detener
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
            completeCurrentDraw(position);
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Completar sorteo de la posición actual
  const completeCurrentDraw = (position: number) => {
    // Usar el estado actual de ganadores
    setAllWinners(prev => {
      const available = getAvailableParticipants(prev);
      if (available.length === 0) {
        completeAllDrawsWithWinners(prev);
        return prev;
      }

      // Seleccionar ganador final
      const finalIdx = Math.floor(Math.random() * available.length);
      const winnerName = available[finalIdx];
      
      setCurrentWinner(winnerName);
      setIsSpinning(false);
      
      const updated = [...prev, { position, name: winnerName }];
      
      // Esperar 2 segundos antes de pasar al siguiente
      setTimeout(() => {
        if (position < totalWinnersCount) {
          startNextDraw(position + 1, updated);
        } else {
          // Usar el estado actualizado para completar
          completeAllDrawsWithWinners(updated);
        }
      }, 2000);
      
      return updated;
    });
  };

  // Completar todos los sorteos con lista de ganadores
  const completeAllDrawsWithWinners = (winnersList: Array<{ position: number; name: string }>) => {
    setIsSpinning(false);
    setIsAutoDrawing(false);
    setTimeRemaining(0);
    
    // Convertir a RaffleWinner[]
    if (!raffle) return;

    const distribution = calculatePrizeDistribution(raffle.participants || [], raffle.prizeDistribution);
    const newWinners: RaffleWinner[] = [];

    winnersList.forEach(({ position, name }) => {
      // Buscar en participantes cargados desde la API primero (prioridad)
      let participantData = participants.find(p => p.name === name);
      
      // Si no está en participantes cargados, buscar en participantes del sorteo
      let participant: RaffleParticipant | undefined;
      if (participantData) {
        // Usar el participante cargado desde la API (tiene el ID real)
          participant = {
          id: participantData.userId || participantData.id, // user_id real
          name: participantData.name,
          email: '', // El email no viene en getParticipants, se puede obtener después si es necesario
            points: 100,
            participationLevel: 'bronze',
            joinedAt: new Date().toISOString(),
            profileImage: undefined,
            status: 'registered',
            multiplier: 1,
            activityScore: 50,
            loyaltyPoints: 10,
            exclusionStatus: {
              isExcluded: false,
              excludedFromRaffles: []
            }
          };
      } else {
        participant = raffle.participants?.find(p => p.name === name);
      }
      
      // Si aún no se encuentra, crear uno temporal (último recurso)
        if (!participant) {
          participant = {
          id: `temp-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name,
          email: '',
            points: 100,
            participationLevel: 'bronze',
            joinedAt: new Date().toISOString(),
            profileImage: undefined,
            status: 'registered',
            multiplier: 1,
            activityScore: 50,
            loyaltyPoints: 10,
            exclusionStatus: {
              isExcluded: false,
              excludedFromRaffles: []
            }
          };
        }

      const prizeAmount = getPrizeForPosition(position);
      let prizePercentage = 0;
      
      if (position === 1) prizePercentage = raffle.prizeDistribution.specificPositions.firstPlace;
      else if (position === 2) prizePercentage = raffle.prizeDistribution.specificPositions.secondPlace;
      else if (position === 3) prizePercentage = raffle.prizeDistribution.specificPositions.thirdPlace;
      else if (distribution.rangeAmounts.length > 0) prizePercentage = distribution.rangeAmounts[0].percentage;

        newWinners.push({
          id: participant.id,
          name: participant.name,
          email: participant.email,
            position,
        prizeAmount,
        prizePercentage,
        drawDate: raffle.drawDate || new Date().toISOString(),
          isPaid: false,
          paymentStatus: 'pending',
          profileImage: participant.profileImage
          });
    });

    setTimeout(() => {
      setCurrentStep('complete');
    }, 500);
  };

  // Completar todos los sorteos (fallback)
  const completeAllDraws = () => {
    completeAllDrawsWithWinners(allWinners);
  };

  // Confirmar resultados
  const confirmResults = () => {
    if (!raffle) return;
    
    const distribution = calculatePrizeDistribution(raffle.participants || [], raffle.prizeDistribution);
      const newWinners: RaffleWinner[] = [];
      
    allWinners.forEach(({ position, name }) => {
      // Buscar en participantes cargados desde la API primero (prioridad)
      let participantData = participants.find(p => p.name === name);
      
      // Si no está en participantes cargados, buscar en participantes del sorteo
      let participant: RaffleParticipant | undefined;
      if (participantData) {
        // Usar el participante cargado desde la API (tiene el ID real)
        participant = {
          id: participantData.userId || participantData.id, // user_id real
          name: participantData.name,
          email: '', // El email no viene en getParticipants, se puede obtener después si es necesario
          points: 100,
          participationLevel: 'bronze',
          joinedAt: new Date().toISOString(),
          profileImage: undefined,
          status: 'registered',
          multiplier: 1,
          activityScore: 50,
          loyaltyPoints: 10,
          exclusionStatus: {
            isExcluded: false,
            excludedFromRaffles: []
          }
        };
      } else {
        participant = raffle.participants?.find(p => p.name === name);
      }
      
      // Si aún no se encuentra, crear uno temporal (último recurso)
      if (!participant) {
        participant = {
          id: `temp-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name,
          email: '',
          points: 100,
          participationLevel: 'bronze',
          joinedAt: new Date().toISOString(),
          profileImage: undefined,
          status: 'registered',
          multiplier: 1,
          activityScore: 50,
          loyaltyPoints: 10,
          exclusionStatus: {
            isExcluded: false,
            excludedFromRaffles: []
          }
        };
      }

      const prizeAmount = getPrizeForPosition(position);
      let prizePercentage = 0;
      
      if (position === 1) prizePercentage = raffle.prizeDistribution.specificPositions.firstPlace;
      else if (position === 2) prizePercentage = raffle.prizeDistribution.specificPositions.secondPlace;
      else if (position === 3) prizePercentage = raffle.prizeDistribution.specificPositions.thirdPlace;
      else if (distribution.rangeAmounts.length > 0) prizePercentage = distribution.rangeAmounts[0].percentage;

        newWinners.push({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        position,
        prizeAmount,
        prizePercentage,
        drawDate: raffle.drawDate || new Date().toISOString(),
          isPaid: false,
          paymentStatus: 'pending',
        profileImage: participant.profileImage
        });
      });
      
    onComplete(newWinners);
    onClose();
  };

  // Resetear sorteo
  const resetDraw = () => {
    if (rollerInterval.current) {
      window.clearInterval(rollerInterval.current);
      rollerInterval.current = null;
    }
    if (settleTimeout.current) {
      window.clearTimeout(settleTimeout.current);
      settleTimeout.current = null;
    }
    setCurrentStep('preparation');
    setCurrentPosition(1);
    setAllWinners([]);
    setCurrentWinner('');
    setIsSpinning(false);
    setIsAutoDrawing(false);
    setTimeRemaining(12);
  };

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (rollerInterval.current) {
        window.clearInterval(rollerInterval.current);
      }
      if (settleTimeout.current) {
        window.clearTimeout(settleTimeout.current);
      }
    };
  }, []);

  if (!isOpen || !raffle) return null;

  const distribution = calculatePrizeDistribution(raffle.participants, raffle.prizeDistribution);
  const availableParticipants = getAvailableParticipants();
  const currentPrize = getPrizeForPosition(currentPosition);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="h-8 w-8" />
              <div>
              <h2 className="text-xl font-semibold">Sorteo Semanal</h2>
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
              {isLoadingParticipants ? (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                  <div className="animate-pulse">
                    <div className="h-16 w-16 bg-yellow-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                      </div>
              ) : (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                  <TrophyIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {raffle.name}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Fondo Total: <span className="font-semibold text-green-600">${raffle.totalFund.toFixed(2)} USD</span>
                  </p>
                  {raffle.drawDate && (
                    <p className="text-gray-600 mb-4 text-sm">
                      Fecha del Sorteo: <span className="font-semibold text-blue-600">
                        {new Date(raffle.drawDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-center">
                      <span className="text-gray-500 text-sm">Participantes Actuales:</span>
                      <p className="font-semibold text-lg text-gray-900">
                        {participantNames.length > 0 
                          ? participantNames.length 
                          : (raffle.currentParticipants || 0)}
                      </p>
                      {raffle.maxParticipants > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Máximo: {raffle.maxParticipants}
                        </p>
                      )}
                    </div>
                    </div>
                    </div>
                  )}

              <div className="space-y-4">
                    <button
                      onClick={startAutoDraw}
                      disabled={isLoadingParticipants || participantNames.length === 0}
                      className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        isLoadingParticipants || participantNames.length === 0
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700'
                      }`}
                    >
                      {isLoadingParticipants ? '⏳ Cargando participantes...' : '🎲 Iniciar Sorteo Automático'}
                    </button>
                
                {participantNames.length === 0 && !isLoadingParticipants && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      ⚠️ No hay participantes disponibles para este sorteo. Verifica la fecha del sorteo y los participantes registrados.
                    </p>
              </div>
            )}

                {participantNames.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Se seleccionarán {totalWinnersCount} ganadores paso a paso de {participantNames.length} participantes
                  </p>
                        )}
                      </div>
                        </div>
            )}

            {currentStep === 'drawing' && (
            <div className="text-center space-y-6">
              <div className="p-8">
                <h3 className="text-3xl font-black text-amber-900 mb-4">
                  🎲 ¡SORTEANDO {currentPosition === 1 ? '1ER' : currentPosition === 2 ? '2DO' : currentPosition === 3 ? '3ER' : `${currentPosition}°`} LUGAR!
                </h3>
                
                {/* Información de la posición actual */}
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border-2 border-amber-300">
                  <p className="text-lg font-bold text-amber-900">
                    {currentPosition === 1 ? '🥇 1er Lugar' : currentPosition === 2 ? '🥈 2do Lugar' : currentPosition === 3 ? '🥉 3er Lugar' : `🏅 ${currentPosition}° Lugar`}
                  </p>
                  <p className="text-2xl font-black text-green-600 mt-2">
                    ${currentPrize.toFixed(2)} USD
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Progreso: {currentPosition} / {totalWinnersCount} ganadores
                      </p>
                    </div>

                {/* Ruleta dorada */}
                <div className="max-w-2xl mx-auto">
                    <VerticalSelector
                    items={availableParticipants}
                    selectedItem={currentWinner}
                    onSelect={setCurrentWinner}
                    isSpinning={isSpinning}
                    timeRemaining={timeRemaining}
                  />
                  </div>

                {/* Ganadores ya seleccionados */}
                {allWinners.length > 0 && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Ganadores Seleccionados:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {allWinners.map((winner, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : '🏅'} {winner.name}
                            </span>
                      ))}
                        </div>
                      </div>
                    )}
                  
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

              {/* Resumen de ganadores */}
              <div className="max-w-2xl mx-auto bg-gradient-to-br from-yellow-100 via-yellow-50 to-orange-100 p-8 rounded-3xl border-4 border-amber-500 shadow-2xl">
                <h4 className="text-2xl font-bold text-amber-800 mb-6">
                  🏆 Ganadores Seleccionados
                </h4>
                
                <div className="space-y-3">
                  {allWinners.map((winner, idx) => {
                    const prize = getPrizeForPosition(winner.position);
                    return (
                      <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-400">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                            <span className="text-3xl">
                              {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : '🏅'}
                              </span>
                            <div>
                              <p className="text-lg font-bold text-gray-900">
                                {winner.position === 1 ? '1er Lugar' : winner.position === 2 ? '2do Lugar' : winner.position === 3 ? '3er Lugar' : `${winner.position}° Lugar`}
                              </p>
                              <p className="text-xl font-black text-amber-900">
                                {winner.name}
                              </p>
                              </div>
                            </div>
                            <div className="text-right">
                            <p className="text-2xl font-black text-green-600">
                              ${prize.toFixed(2)}
                            </p>
                              </div>
                            </div>
                          </div>
                    );
                  })}
                        </div>
                </div>

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

export default RaffleDrawModal;

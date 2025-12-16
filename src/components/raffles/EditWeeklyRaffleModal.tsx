import React, { useEffect, useState } from 'react';
import { XMarkIcon, CalendarIcon, ChartBarIcon, CurrencyDollarIcon, UsersIcon, CheckCircleIcon, DocumentTextIcon, CalculatorIcon, ExclamationTriangleIcon, LightBulbIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { WeeklyRaffle, MonthlyRaffle } from '../../types';

interface EditWeeklyRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: WeeklyRaffle | null;
  monthlyRaffle?: MonthlyRaffle | null;
  onSave: (updated: WeeklyRaffle) => Promise<void> | void;
}

const EditWeeklyRaffleModal: React.FC<EditWeeklyRaffleModalProps> = ({ 
  isOpen, 
  onClose, 
  raffle, 
  monthlyRaffle,
  onSave 
}) => {
  const [winnersCount, setWinnersCount] = useState<number>(1);
  const [top1, setTop1] = useState<number>(30);
  const [top2, setTop2] = useState<number>(20);
  const [top3, setTop3] = useState<number>(15);
  const [pointsRequired, setPointsRequired] = useState<number>(0);
  const [registrationStartDate, setRegistrationStartDate] = useState<string>('');
  const [registrationEndDate, setRegistrationEndDate] = useState<string>('');
  const [drawDate, setDrawDate] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dateValidationMessage, setDateValidationMessage] = useState<string>('');
  const [backendError, setBackendError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!raffle) return;
    const maxParticipants = raffle.maxParticipants || raffle.currentParticipants || 1;
    const initialWinners = Math.min(Math.max(1, raffle.winnersCount ?? 1), maxParticipants);
    setWinnersCount(initialWinners);
    setTop1(raffle.prizeDistribution.specificPositions.firstPlace);
    setTop2(raffle.prizeDistribution.specificPositions.secondPlace);
    setTop3(raffle.prizeDistribution.specificPositions.thirdPlace);
    setPointsRequired(raffle.pointsRequired ?? 0);
    setRegistrationStartDate(isoToLocalInputValue(raffle.registrationStartDate));
    setRegistrationEndDate(isoToLocalInputValue(raffle.registrationEndDate));
    setDrawDate(isoToLocalInputValue(raffle.drawDate));
    // Cargar imagen existente si existe, de lo contrario resetear
    if (raffle.imageUrl) {
      setImagePreview(raffle.imageUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setDateValidationMessage('');
    setBackendError('');
    setIsSaving(false);
  }, [raffle, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDateValidationMessage(getDateValidationMessage());
    setBackendError('');
  }, [registrationStartDate, registrationEndDate, drawDate, isOpen]);

  const sumTop = top1 + top2 + top3;
  const rangeEnd = winnersCount;
  const remainingPct = Math.max(0, 100 - sumTop);
  const otherWinnersCount = Math.max(0, winnersCount - 3);
  const perPersonPct = otherWinnersCount > 0 ? remainingPct / otherWinnersCount : 0;
  const totalDistribution = sumTop + (otherWinnersCount * perPersonPct);

  const nowLocal = () => {
    const n = new Date();
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
  };

  const MINUTE_IN_MS = 60 * 1000;

  const parseDateInput = (value?: string): { year: number; month: number; day: number } | null => {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, y, m, d] = match;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }
    return { year, month, day };
  };

  const buildUtcDate = (
    dateValue?: string,
    time: { hours: number; minutes: number; seconds: number } = { hours: 0, minutes: 0, seconds: 0 }
  ): Date | null => {
    const parts = parseDateInput(dateValue);
    if (!parts) return null;
    const { year, month, day } = parts;
    const { hours, minutes, seconds } = time;
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, 0));
    return Number.isNaN(utcDate.getTime()) ? null : utcDate;
  };

  const isoToLocalInputValue = (iso?: string | null): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    // Usar métodos UTC para evitar problemas de timezone
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateValidationMessage = () => {
    if (!registrationStartDate || !registrationEndDate || !drawDate) {
      return 'Para sorteos semanales, las fechas de inicio de registro, fin de registro y sorteo son obligatorias';
    }

    const startDate = buildUtcDate(registrationStartDate, { hours: 0, minutes: 0, seconds: 0 });
    const endDate = buildUtcDate(registrationEndDate, { hours: 23, minutes: 59, seconds: 0 });
    const drawDateValue = buildUtcDate(drawDate, { hours: 0, minutes: 0, seconds: 0 });

    if (!startDate || !endDate || !drawDateValue) {
      return 'Las fechas ingresadas no son válidas';
    }

    if (startDate.getTime() > endDate.getTime()) {
      return 'La fecha de fin de registro debe ser mayor o igual a la fecha de inicio.';
    }

    if (endDate.getTime() >= drawDateValue.getTime()) {
      return 'La fecha de fin de registro debe ser anterior a la fecha de sorteo. La fecha de sorteo debe ser mayor a inicio y fin de registro';
    }

    if (drawDateValue.getTime() - endDate.getTime() < MINUTE_IN_MS) {
      return 'Debe haber al menos 1 minuto de diferencia entre la fecha de fin de registro y la fecha de sorteo';
    }

    return '';
  };

  const buildIsoString = (
    value?: string,
    time: { hours: number; minutes: number; seconds: number } = { hours: 0, minutes: 0, seconds: 0 }
  ): string | null => {
    const date = buildUtcDate(value, time);
    return date ? date.toISOString() : null;
  };

  const handleSave = async () => {
    if (!raffle) return;

    if (!Number.isFinite(winnersCount) || winnersCount < 1) {
      alert('El número de ganadores debe ser al menos 1');
      return;
    }
    if (sumTop > 100) {
      alert('La suma de Top 3 no puede superar 100%');
      return;
    }
    if (winnersCount > 3 && remainingPct <= 0) {
      alert(`Debes asignar porcentaje para el rango 4..${3 + winnersCount} (por persona)`);
      return;
    }

    const maxAllowed = raffle.maxParticipants || raffle.currentParticipants || 0;
    if (maxAllowed && winnersCount > maxAllowed) {
      alert(`El número de ganadores (${winnersCount}) no puede ser mayor al número de participantes (${maxAllowed}).`);
      return;
    }

    const dateErrorMessage = getDateValidationMessage();
    if (dateErrorMessage) {
      setDateValidationMessage(dateErrorMessage);
      alert(dateErrorMessage);
      return;
    }

    const registrationStartIso = buildIsoString(registrationStartDate, { hours: 0, minutes: 0, seconds: 0 });
    const registrationEndIso = buildIsoString(registrationEndDate, { hours: 23, minutes: 59, seconds: 0 });
    const drawIso = buildIsoString(drawDate, { hours: 0, minutes: 0, seconds: 0 });

    if (!registrationStartIso || !registrationEndIso || !drawIso) {
      const message = 'Las fechas ingresadas no son válidas';
      setDateValidationMessage(message);
      alert(message);
      return;
    }

    const updated: WeeklyRaffle & { imageFile?: File } = {
      ...raffle,
      winnersCount: winnersCount,
      pointsRequired: pointsRequired,
      registrationStartDate: registrationStartIso,
      registrationEndDate: registrationEndIso,
      drawDate: drawIso,
      prizeDistribution: {
        specificPositions: {
          firstPlace: top1,
          secondPlace: top2,
          thirdPlace: top3,
        },
        prizeRanges: otherWinnersCount > 0 ? [
          {
            id: 'range1',
            startPosition: 4,
            endPosition: winnersCount,
            percentage: perPersonPct,
          }
        ] : [],
      },
      updatedAt: new Date().toISOString(),
      ...(imageFile && { imageFile }),
    };

    try {
      setIsSaving(true);
      setBackendError('');
      await onSave(updated);
      onClose();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo actualizar el sorteo semanal. Inténtalo nuevamente.';
      setBackendError(backendMessage);
      alert(backendMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !raffle) return null;

  const weekFund = raffle.totalFund || raffle.fund || 0;
  const dateFieldHasError = Boolean(dateValidationMessage || backendError);
  const dateInputBaseClass =
    'w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2';
  const dateInputClass = dateFieldHasError
    ? `${dateInputBaseClass} border-red-500 focus:ring-red-500 focus:border-red-500`
    : dateInputBaseClass;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white/95 backdrop-blur rounded-2xl shadow-2xl w-full max-w-[92vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-t-2xl shadow-md sticky top-0 z-10">
            <h3 className="text-base sm:text-lg font-semibold">
              Editar Sorteo Semanal
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-6 space-y-6 overflow-y-auto flex-1">
            {/* Información del sorteo */}
            {monthlyRaffle && (
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-5 sm:p-6 rounded-xl border-2 border-green-300 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full shadow-md">
                    <ChartBarIcon className="h-5 w-5 text-gray-700" />
                  </div>
                  <span>Información del Sorteo</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📝</span>
                      <span className="text-xs font-semibold text-green-700 uppercase">Nombre</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{raffle.name}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">Fondo Semanal</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">${weekFund.toFixed(2)}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">Semana</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">Semana {raffle.weekNumber || raffle.week}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <UsersIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">Participantes</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{raffle.maxParticipants}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuración de ganadores y Top 3 */}
            <div className="rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900">Ganadores y Distribución</h4>
                <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                  <LightBulbIcon className="h-4 w-4 text-gray-500" />
                  <span>Configuración de premios</span>
                </div>
              </div>
              
              {/* Indicaciones principales */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="font-medium flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
                    <span>Indicaciones para configurar los premios:</span>
                  </div>
                  <ul className="text-xs space-y-1 ml-6 list-disc">
                    <li>El <strong>número de ganadores</strong> debe ajustarse al total de participantes disponibles para la semana</li>
                    <li>Los <strong>primeros 3 puestos</strong> reciben porcentajes específicos del fondo total</li>
                    <li>Los <strong>ganadores del 4° puesto en adelante</strong> se reparten el porcentaje restante equitativamente</li>
                    <li>La suma de los primeros 3 puestos <strong>no debe superar el 100%</strong></li>
                    <li>Si hay más de 3 ganadores, el porcentaje restante se divide entre todos los demás</li>
                  </ul>
                </div>
              </div>

              {/* Configuración de premios - Tarjeta unificada */}
              <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-yellow-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  {/* Panel: Número de ganadores */}
                  <div className="flex flex-col justify-start space-y-2">
                    <div className="mb-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-gray-600" />
                        <span>Número de ganadores</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={raffle.maxParticipants || raffle.currentParticipants || undefined}
                      value={winnersCount}
                      onChange={(e) => {
                        const maxAllowed = raffle.maxParticipants || raffle.currentParticipants || Infinity;
                        const next = Math.max(1, Number(e.target.value || 1));
                        setWinnersCount(Math.min(next, maxAllowed));
                      }}
                      className="w-full border-2 border-blue-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-bold py-2 px-1 pr-6 bg-white"
                      title="Número total de ganadores que recibirán premios"
                      style={{ textAlign: 'center' }}
                    />
                    <div className="text-xs text-gray-600 bg-white/70 rounded-lg p-2">
                      Límite según participantes configurados: {raffle.maxParticipants || raffle.currentParticipants || '—'}
                    </div>
                  </div>

                  {/* Panel: Podio 1°, 2°, 3° */}
                  <div className="flex flex-col justify-start space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <span className="flex items-center gap-2">
                        <span>🏆</span>
                        <span>Distribución del Podio</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🥇</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={top1}
                            onChange={(e) => setTop1(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                            className="w-full border-2 border-yellow-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-bold py-2 px-1 pr-6 bg-white"
                            style={{ textAlign: 'center' }}
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🥈</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={top2}
                            onChange={(e) => setTop2(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                            className="w-full border-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-bold py-2 px-1 pr-6 bg-white"
                            style={{ textAlign: 'center' }}
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🥉</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={top3}
                            onChange={(e) => setTop3(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                            className="w-full border-2 border-orange-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-bold py-2 px-1 pr-6 bg-white"
                            style={{ textAlign: 'center' }}
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ejemplo de cálculo */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <div className="font-medium flex items-center gap-2 mb-2">
                    <CalculatorIcon className="h-5 w-5 text-gray-600" />
                    <span>Ejemplo práctico de distribución:</span>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="bg-white p-2 rounded border border-green-200">
                      <div className="font-medium text-green-900 mb-1">
                        Fondo total del sorteo semanal: ${weekFund.toFixed(0)}
                      </div>
                      <div className="font-medium text-green-900 mb-1">
                        🏆 Distribución para {winnersCount} {winnersCount === 1 ? 'ganador' : 'ganadores'}:
                      </div>
                      <div className="space-y-1 ml-2">
                        <div className="flex justify-between">
                          <span>🥇 1° lugar:</span>
                          <span className="font-medium">${(weekFund * top1 / 100).toFixed(2)} ({top1}%)</span>
                        </div>
                        {winnersCount >= 2 && (
                          <div className="flex justify-between">
                            <span>🥈 2° lugar:</span>
                            <span className="font-medium">${(weekFund * top2 / 100).toFixed(2)} ({top2}%)</span>
                          </div>
                        )}
                        {winnersCount >= 3 && (
                          <div className="flex justify-between">
                            <span>🥉 3° lugar:</span>
                            <span className="font-medium">${(weekFund * top3 / 100).toFixed(2)} ({top3}%)</span>
                          </div>
                        )}
                        {winnersCount > 3 && (
                          <div className="border-t border-green-200 pt-1 mt-1">
                            <div className="flex justify-between">
                              <span>🏆 Ganadores 4°-{rangeEnd}°:</span>
                              <span className="font-medium">${(weekFund * perPersonPct / 100).toFixed(2)} cada uno</span>
                            </div>
                            <div className="text-xs text-green-600 ml-2">
                              ({perPersonPct.toFixed(1)}% del fondo semanal cada uno)
                            </div>
                          </div>
                        )}
                        {winnersCount === 3 && (
                          <div className="text-xs text-green-700 mt-1">Sin otros ganadores (solo podio).</div>
                        )}
                        <div className="mt-2 pt-1 border-t border-green-200 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Total distribuido:</span>
                            <span className="font-medium">${(weekFund * totalDistribution / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de distribución */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ChartBarIcon className="h-5 w-5 text-gray-600" />
                  <h5 className="font-semibold text-gray-800">Resumen de Distribución de Premios</h5>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Podio */}
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🏆</span>
                      <span className="font-medium text-gray-700 text-sm">Podio (1°, 2°, 3°)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total asignado:</span>
                      <span className={`font-bold text-lg ${sumTop > 100 ? 'text-red-600' : 'text-green-600'}`}>
                        {sumTop.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {top1}% + {top2}% + {top3}%
                    </div>
                  </div>

                  {/* Otros ganadores */}
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-700 text-sm">
                        Otros Ganadores {winnersCount > 3 ? `(4° al ${rangeEnd}°)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total de asignación:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {winnersCount > 3 ? `${remainingPct.toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {winnersCount > 3 ? `${perPersonPct.toFixed(1)}% por persona` : 'Solo podio'}
                    </div>
                  </div>
                </div>

                {/* Estado de validación */}
                <div className="mt-4">
                  {sumTop > 100 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        <span className="font-medium">Error en la configuración</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        El podio ({sumTop.toFixed(1)}%) supera el 100% del fondo disponible.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Distribución válida</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Podio: {sumTop.toFixed(1)}% | Resto: {remainingPct.toFixed(1)}% | Total: {totalDistribution.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <LightBulbIcon className="h-4 w-4 text-gray-500" />
                        <span>El resto se distribuye automáticamente entre los {winnersCount > 3 ? (winnersCount - 3) + ' ganadores' : '0 ganadores'} del 4° al {winnersCount}° lugar</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200">
              <h4 className="text-md font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
                <span>Fechas del Sorteo</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Puntos requeridos</label>
                  <input
                    type="number"
                    min={0}
                    value={pointsRequired}
                    onChange={(e) => setPointsRequired(Math.max(0, Number(e.target.value || 0)))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Inicio registro</label>
                  <input
                    type="date"
                    value={registrationStartDate}
                    min={nowLocal().slice(0,10)}
                    onChange={(e) => {
                      setRegistrationStartDate(e.target.value);
                    }}
                    className={dateInputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Fin registro</label>
                  <input
                    type="date"
                    value={registrationEndDate}
                    min={registrationStartDate || nowLocal().slice(0,10)}
                    onChange={(e) => {
                      setRegistrationEndDate(e.target.value);
                    }}
                    className={dateInputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Fecha sorteo</label>
                  <input
                    type="date"
                    value={drawDate}
                    min={registrationEndDate || registrationStartDate || nowLocal().slice(0,10)}
                    onChange={(e) => {
                      setDrawDate(e.target.value);
                    }}
                    className={dateInputClass}
                  />
                </div>
              </div>
              {(dateValidationMessage || backendError) && (
                <div className="mt-2 text-xs text-red-600">
                  {backendError || dateValidationMessage}
                </div>
              )}
            </div>

            {/* Imagen opcional */}
            <div className="rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen para el sorteo semanal (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                id="weekly-raffle-image-input"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setImagePreview(String(ev.target?.result || ''));
                    reader.readAsDataURL(file);
                  } else {
                    // Si no hay archivo seleccionado, volver a la imagen existente si existe
                    setImagePreview(raffle?.imageUrl || null);
                  }
                }}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img src={imagePreview} alt="preview" className="h-28 sm:h-32 w-auto rounded-lg object-cover border shadow" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      // Limpiar el input de archivo
                      const input = document.getElementById('weekly-raffle-image-input') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Eliminar imagen"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-0 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSaving
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 text-sm font-medium rounded-md shadow flex items-center justify-center gap-2 ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'text-white bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditWeeklyRaffleModal;

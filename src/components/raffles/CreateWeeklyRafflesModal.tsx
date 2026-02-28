import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ChartBarIcon, CurrencyDollarIcon, UsersIcon, CheckCircleIcon, DocumentTextIcon, CalculatorIcon, ExclamationTriangleIcon, LightBulbIcon, ClipboardDocumentListIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { MonthlyRaffle, WeeklyRaffle } from '../../types';

interface CreateWeeklyRafflesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weeklyRaffles: WeeklyRaffle[]) => Promise<void> | void;
  monthlyRaffles: MonthlyRaffle[];
}

const CreateWeeklyRafflesModal: React.FC<CreateWeeklyRafflesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  monthlyRaffles
}) => {
  const [selectedMonthly, setSelectedMonthly] = useState<MonthlyRaffle | null>(null);
  const [weeksToCreate, setWeeksToCreate] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pointsRequired] = useState<number>(0);
  const [pointsByWeek, setPointsByWeek] = useState<Record<number, number>>({});
  const [datesByWeek, setDatesByWeek] = useState<Record<number, {
    regStartDate?: string;
    regEndDate?: string;
    drawDate?: string;
  }>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [useSplitPickers] = useState(true);
  // Configuración de ganadores y Top 3
  const [winnersCount, setWinnersCount] = useState<number>(1);
  const [maxParticipantsSelectedWeeks, setMaxParticipantsSelectedWeeks] = useState<number | null>(null);
  const [top1, setTop1] = useState<number>(30);
  const [top2, setTop2] = useState<number>(20);
  const [top3, setTop3] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpiar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedMonthly(null);
      setWeeksToCreate([]);
      setImageFile(null);
      setImagePreview(null);
      setPointsByWeek({});
      setDatesByWeek({});
      setValidationErrors({});
      setWinnersCount(1);
      setMaxParticipantsSelectedWeeks(null);
      setTop1(30);
      setTop2(20);
      setTop3(15);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const sumTop = top1 + top2 + top3;
  const rangeEnd = winnersCount;
  const remainingPct = Math.max(0, 100 - sumTop);
  const otherWinnersCount = Math.max(0, winnersCount - 3);
  const perPersonPct = otherWinnersCount > 0 ? remainingPct / otherWinnersCount : 0;
  const totalDistribution = sumTop + (otherWinnersCount * perPersonPct);

  // Calcular límite máximo basado en los participantes configurados por semana
  useEffect(() => {
    if (!selectedMonthly) {
      setMaxParticipantsSelectedWeeks(null);
      return;
    }
    const saturdays = getSaturdayDates(selectedMonthly.month, selectedMonthly.year);
    const totalWeeks = saturdays.length;
    const candidateWeeks = (weeksToCreate && weeksToCreate.length > 0)
      ? weeksToCreate
      : Array.from({ length: totalWeeks }, (_, i) => i + 1);
    const participantsList = candidateWeeks
      .map((w) => Number((selectedMonthly.participantDistribution as any)[`week${w}`] ?? 0))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (participantsList.length === 0) {
      setMaxParticipantsSelectedWeeks(null);
      return;
    }
    const minParticipants = Math.min(...participantsList);
    const suggestion = Math.max(1, minParticipants);
    setMaxParticipantsSelectedWeeks(minParticipants);
    setWinnersCount((prev) => {
      if (!Number.isFinite(prev) || prev > minParticipants) {
        return suggestion;
      }
      return prev;
    });
  }, [selectedMonthly, weeksToCreate]);

  // Calcular TODOS los sábados para el mes (4 o 5 según corresponda)
  const getSaturdayDates = (month: number, year: number) => {
    const dates: Date[] = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let d = new Date(firstDay);
    while (d.getDay() !== 6) {
      d.setDate(d.getDate() + 1);
    }

    while (d <= lastDay) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    
    return dates;
  };

  // Calcular semanas faltantes
  useEffect(() => {
    if (selectedMonthly) {
      const existingWeeks = selectedMonthly.weeklyRaffles.map(w => w.week);
      const saturdayDates = getSaturdayDates(selectedMonthly.month, selectedMonthly.year);
      const allWeeks = Array.from({ length: saturdayDates.length }, (_, i) => i + 1);
      const missingWeeks = allWeeks.filter(week => !existingWeeks.includes(week));
      
      const availableWeeks = missingWeeks.filter(week => {
        const weekParticipants = (selectedMonthly.participantDistribution as any)[`week${week}`] ?? 0;
        return weekParticipants > 0;
      });
      
      if (availableWeeks.length > 0) {
        setWeeksToCreate([availableWeeks[0]]);
      } else {
        setWeeksToCreate([]);
      }
    }
  }, [selectedMonthly]);

  // Sincronizar selección con cambios del padre
  useEffect(() => {
    if (!selectedMonthly) return;
    const latest = monthlyRaffles.find(m => m.id === selectedMonthly.id);
    if (latest && latest !== selectedMonthly) {
      setSelectedMonthly(latest);
      const existingWeeks = latest.weeklyRaffles.map(w => w.week);
      const saturdayDates = getSaturdayDates(latest.month, latest.year);
      const allWeeks = Array.from({ length: saturdayDates.length }, (_, i) => i + 1);
      const missingWeeks = allWeeks.filter(week => !existingWeeks.includes(week));
      setWeeksToCreate(prev => prev.filter(week => missingWeeks.includes(week)));
    }
  }, [monthlyRaffles, selectedMonthly]);

  const nowLocal = () => {
    const n = new Date();
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
  };

  const toISOFromDate = (d?: string, time: string = '00:00', fallback?: string) => {
    if (d) return `${d}T${time}`;
    return fallback || '';
  };

  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr + 'T00:00');
    d.setDate(d.getDate() + days);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };

  const validateWeekDates = (week: number) => {
    const d = datesByWeek[week] || {} as any;
    const err: string[] = [];
    const todayStr = nowLocal().slice(0, 10);
    const today = new Date(`${todayStr}T00:00`);
    const rs = d.regStartDate ? new Date(`${d.regStartDate}T00:00`) : undefined;
    const re = d.regEndDate ? new Date(`${d.regEndDate}T00:00`) : undefined;
    const dr = d.drawDate ? new Date(`${d.drawDate}T00:00`) : undefined;
    if (!rs || !re || !dr) return '';
    if (rs < today) err.push('Inicio de registro no puede ser anterior a hoy');
    if (re < rs) err.push('Fin de registro debe ser mayor o igual al inicio');
    if (dr <= re || dr <= rs) err.push('Fecha de sorteo debe ser mayor a inicio y fin de registro');
    return err.join('. ');
  };

  const handleCreateWeeklyRaffles = async () => {
    if (!selectedMonthly || weeksToCreate.length === 0) {
      alert('Selecciona un sorteo mensual y al menos una semana para crear.');
      return;
    }

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

    const invalidWeeks = weeksToCreate.filter(week => {
      const weekParticipants = (selectedMonthly.participantDistribution as any)[`week${week}`] ?? 0;
      return winnersCount > weekParticipants;
    });

    if (invalidWeeks.length > 0) {
      alert(`El número de ganadores (${winnersCount}) no puede ser mayor al número de participantes en las semanas: ${invalidWeeks.join(', ')}. Ajusta la distribución de participantes o reduce el número de ganadores.`);
      return;
    }

    const newErrors: Record<number, string> = {};
    weeksToCreate.forEach((week) => {
      const msg = validateWeekDates(week);
      if (msg) newErrors[week] = msg;
    });
    setValidationErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert('Corrige las fechas inválidas antes de crear.');
      return;
    }

    const weeklyRaffles: any[] = [];
    const saturdayDates = getSaturdayDates(selectedMonthly.month, selectedMonthly.year);

    for (const week of weeksToCreate) {
      const fundPct = (selectedMonthly.weeklyDistribution as any)[`week${week}`];
      const participants = (selectedMonthly.participantDistribution as any)[`week${week}`];
      if (typeof fundPct !== 'number' || typeof participants !== 'number') {
        alert(`La semana ${week} no tiene configuración en el sorteo mensual (fondo o participantes). Actualiza el sorteo mensual para incluir semana ${week}.`);
        return;
      }
      if (participants === 0) {
        alert(`La semana ${week} no dispone de participantes. Configura participantes en el sorteo mensual o desmarca la semana.`);
        return;
      }
    }

    weeksToCreate.forEach(week => {
      const fundPct = (selectedMonthly.weeklyDistribution as any)[`week${week}`] as number;
      const weekFund = (selectedMonthly.totalFund * fundPct) / 100;
      const weekParticipants = (selectedMonthly.participantDistribution as any)[`week${week}`] as number;
      const saturdayDate = saturdayDates[week - 1];
      const weekPointsRequired = Number(pointsByWeek[week] ?? pointsRequired ?? 0);
      const picked = datesByWeek[week] || {};
      const regStartIso = toISOFromDate(picked.regStartDate, '00:00') || new Date(saturdayDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
      const regEndIso = toISOFromDate(picked.regEndDate, '23:59') || new Date(saturdayDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const drawIso = toISOFromDate(picked.drawDate, '00:00') || saturdayDate.toISOString();
      
      // 🚨 AJUSTE CRÍTICO: Asegurar que maxParticipants >= winnersCount
      const adjustedMaxParticipants = Math.max(weekParticipants, winnersCount);
      const adjustedWinnersCount = Math.min(winnersCount, weekParticipants);
      
      const weeklyRaffle: any = {
        id: `weekly-${selectedMonthly.id}-${week}`,
        name: `${selectedMonthly.name} - Semana ${week}`,
        description: `Sorteo semanal ${week} del ${selectedMonthly.name}`,
        raffle_type: 'weekly',
        week: week,
        weekNumber: week,
        week_number: week,
        month: selectedMonthly.month,
        year: selectedMonthly.year,
        monthly_raffle_id: selectedMonthly.id,
        fund: weekFund,
        totalFund: weekFund,
        pointsRequired: weekPointsRequired,
        maxParticipants: adjustedMaxParticipants,
        currentParticipants: 0,
        winnersCount: adjustedWinnersCount,
        prizeDistribution: {
          firstPlace: top1,
          secondPlace: top2,
          thirdPlace: top3,
          ranges: adjustedWinnersCount > 3 ? [
            { start: 4, end: adjustedWinnersCount, percentage: Number(perPersonPct.toFixed(4)) }
          ] : [],
        },
        drawDate: drawIso,
        registrationStartDate: regStartIso,
        registrationEndDate: regEndIso,
        isActive: week === 1,
        isCompleted: false,
        isRegistrationOpen: week === 1,
        isDrawn: false,
        imageFile: imageFile || undefined,
      };
      
      weeklyRaffles.push(weeklyRaffle);
    });

    const attachImage = imageFile || undefined;
    const weeklyWithImage = weeklyRaffles.map(w => ({ ...w, imageFile: attachImage } as any));
    try {
      setIsSubmitting(true);
      await onSave(weeklyWithImage as any);
      onClose();
    } catch (error) {
      console.error('Error al crear sorteo semanal', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white/95 backdrop-blur rounded-2xl shadow-2xl w-full max-w-[92vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] flex flex-col">
           <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-t-2xl shadow-md sticky top-0 z-10">
            <h3 className="text-base sm:text-lg font-semibold">
              Crear Sorteos Semanales
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-6 space-y-6 overflow-y-auto flex-1">
            {/* Seleccionar Sorteo Mensual */}
            <div className="rounded-xl border-2 border-primary-200 p-4 sm:p-5 shadow-md bg-gradient-to-br from-white to-primary-50">
              <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-gray-600" />
                <span>Seleccionar Sorteo Mensual</span>
              </label>
              <select
                value={selectedMonthly?.id || ''}
                onChange={(e) => {
                  const monthly = monthlyRaffles.find(m => m.id === e.target.value);
                  setSelectedMonthly(monthly || null);
                }}
                className="w-full border-2 border-primary-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 px-4 py-3 text-base font-medium bg-white transition-all hover:border-primary-400"
              >
                <option value="">Selecciona un sorteo mensual</option>
                {monthlyRaffles.map(monthly => (
                  <option key={monthly.id} value={monthly.id}>
                    {monthly.name} - {monthly.month}/{monthly.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Información del sorteo seleccionado */}
            {selectedMonthly && (
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-5 sm:p-6 rounded-xl border-2 border-green-300 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full shadow-md">
                    <ChartBarIcon className="h-5 w-5 text-gray-700" />
                  </div>
                  <span>Información del Sorteo Mensual</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📝</span>
                      <span className="text-xs font-semibold text-green-700 uppercase">Nombre</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{selectedMonthly.name}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">Fondo Total</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">${selectedMonthly.totalFund.toFixed(2)}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">Mes/Año</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{selectedMonthly.month}/{selectedMonthly.year}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">Semanas Creadas</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{selectedMonthly.weeklyRaffles.length}/4 semanas</div>
                  </div>
                </div>
              </div>
            )}

            {/* Mostrar semanas faltantes */}
            {selectedMonthly && (
              <div className="rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm bg-white">
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-600" />
              <span>Selecciona la Semana a Crear</span>
            </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  {(() => {
                    const saturdayCount = getSaturdayDates(selectedMonthly.month, selectedMonthly.year).length;
                    return Array.from({ length: saturdayCount }, (_, i) => i + 1);
                  })().map(week => {
                    const exists = selectedMonthly.weeklyRaffles.some(w => w.week === week);
                    const isSelected = weeksToCreate.includes(week);
                    const weekPctA = (selectedMonthly.weeklyDistribution as any)[`week${week}`] ?? 0;
                    const weekFund = (selectedMonthly.totalFund * weekPctA) / 100;        
                    const weekParticipants = (selectedMonthly.participantDistribution as any)[`week${week}`] ?? 0;
                    const isDisabled = weekParticipants === 0;
                    
                    const saturdayDates = getSaturdayDates(selectedMonthly.month, selectedMonthly.year);
                    const saturdayDate = saturdayDates[week - 1];
                    const formattedDate = saturdayDate.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    });
                    
                    return (
                      <div
                        key={week}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          exists
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-70'
                            : isDisabled
                            ? 'bg-red-50 border-red-300 cursor-not-allowed opacity-70'
                            : isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-sm scale-[1.02] cursor-pointer'
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!exists && !isDisabled) {
                            setWeeksToCreate(prev => (prev.includes(week) ? [] : [week]));
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className={`text-base sm:text-lg font-semibold ${
                            exists ? 'text-gray-500' : isDisabled ? 'text-red-500' : isSelected ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            Semana {week}
                          </div>
                          {exists ? (
                            <div className="text-xs text-gray-500 mt-1">Ya existe</div>
                          ) : isDisabled ? (
                            <div className="text-xs text-red-500 mt-1 space-y-1">
                              <div className="font-medium flex items-center gap-1">
                                <XCircleIcon className="h-4 w-4 text-red-500" />
                                <span>No disponible</span>
                              </div>
                              <div>Participantes: 0</div>
                              <div className="text-xs">Configurar participantes primero</div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                              <div className="font-medium text-blue-600">
                                {formattedDate}
                              </div>
                              <div>Fondo: ${weekFund.toFixed(0)}</div>
                              <div>Participantes: {weekParticipants}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instrucciones */}
            {!selectedMonthly && (
              <div className="rounded-xl border-2 border-blue-300 p-5 sm:p-6 shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full shadow-md">
                    <DocumentTextIcon className="h-7 w-7 text-gray-700" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Instrucciones para Crear Sorteos Semanales</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-3">
                  <ol className="space-y-3">
                    <li className="flex gap-3 items-start">
                      <span className="flex items-center justify-center min-w-[28px] h-7 bg-blue-500 text-white rounded-full text-xs font-bold">1</span>
                      <div className="pt-1">
                        <strong className="text-blue-700">Selecciona el sorteo mensual base</strong>
                        <p className="text-xs text-gray-600 mt-1">Usa el menú desplegable superior para elegir el sorteo mensual principal. Este sorteo ya debe existir y contiene la configuración de fondos y participantes.</p>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex items-center justify-center min-w-[28px] h-7 bg-indigo-500 text-white rounded-full text-xs font-bold">2</span>
                      <div className="pt-1">
                        <strong className="text-indigo-700">Elige la semana a crear</strong>
                        <p className="text-xs text-gray-600 mt-1">Aparecerán las semanas disponibles del mes (semana 1, 2, 3, 4). Solo puedes crear una semana a la vez. Las semanas ya creadas aparecerán marcadas como "Ya existe".</p>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex items-center justify-center min-w-[28px] h-7 bg-purple-500 text-white rounded-full text-xs font-bold">3</span>
                      <div className="pt-1">
                        <strong className="text-purple-700">Configura ganadores y distribución</strong>
                        <p className="text-xs text-gray-600 mt-1">Define cuántos ganadores habrá y qué porcentaje del fondo recibirá cada posición del podio (1°, 2°, 3°). El resto se distribuye automáticamente entre los demás ganadores.</p>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex items-center justify-center min-w-[28px] h-7 bg-pink-500 text-white rounded-full text-xs font-bold">4</span>
                      <div className="pt-1">
                        <strong className="text-pink-700">Establece las fechas importantes</strong>
                        <p className="text-xs text-gray-600 mt-1">Define cuándo inicia y termina el registro de participantes, y la fecha del sorteo. Asegúrate de que las fechas sean lógicas (el sorteo debe ser después del cierre de registro).</p>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex items-center justify-center min-w-[28px] h-7 bg-green-500 text-white rounded-full text-xs font-bold">5</span>
                      <div className="pt-1">
                        <strong className="text-green-700">Opcionalmente, agrega una imagen</strong>
                        <p className="text-xs text-gray-600 mt-1">Puedes subir una imagen promocional para el sorteo semanal. Este paso es opcional pero ayuda a hacer más atractivo el sorteo.</p>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex items-center justify-center min-w-[28px] h-7 bg-orange-500 text-white rounded-full text-xs font-bold">6</span>
                      <div className="pt-1">
                        <strong className="text-orange-700">Guarda y repite para otras semanas</strong>
                        <p className="text-xs text-gray-600 mt-1">Haz clic en "Crear 1 Sorteo Semanal" para guardar. Una vez creado, el modal se mantendrá abierto para que puedas crear las siguientes semanas del mes.</p>
                      </div>
                    </li>
                  </ol>
                  <div className="mt-5 p-4 bg-white rounded-xl border-2 border-yellow-300 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800 mb-1">¿Por qué una semana a la vez?</p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          El sistema permite crear solo <strong>un sorteo semanal por vez</strong> para que puedas configurar cuidadosamente cada semana con sus fechas y detalles específicos. Esto te da mayor control y evita errores. Una vez que crees una semana, podrás crear inmediatamente la siguiente sin cerrar este modal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuración de ganadores y Top 3 */}
            {selectedMonthly && weeksToCreate.length > 0 && (
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
                    <li>El <strong>número de ganadores</strong> debe ser al menos 1 y nunca superar los participantes configurados</li>
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
                      max={maxParticipantsSelectedWeeks ?? undefined}
                       value={winnersCount}
                      onChange={(e) => setWinnersCount(Math.max(1, Number(e.target.value || 1)))}
                       className="w-full border-2 border-blue-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-lg font-bold py-2 px-1 pr-6 bg-white"
                       title="Número total de ganadores que recibirán premios"
                       style={{ textAlign: 'center' }}
                     />
                     <div className="flex items-center justify-between gap-2 text-xs bg-white/70 rounded-lg p-2">
                      <span className="text-gray-600">Límite según participantes: {maxParticipantsSelectedWeeks ?? '—'}</span>
                       <button
                         type="button"
                        disabled={!maxParticipantsSelectedWeeks || winnersCount === maxParticipantsSelectedWeeks}
                         onClick={() => {
                          if (maxParticipantsSelectedWeeks != null) {
                            setWinnersCount(Math.max(1, maxParticipantsSelectedWeeks));
                          }
                         }}
                         className={`px-3 py-1 rounded-md text-xs font-medium ${
                          !maxParticipantsSelectedWeeks || winnersCount === maxParticipantsSelectedWeeks
                             ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                             : 'bg-blue-600 text-white hover:bg-blue-700'
                         }`}
                       >
                         Aplicar
                       </button>
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
                        Fondo total del sorteo mensual: ${selectedMonthly?.totalFund.toFixed(0) || 1000}
                      </div>
                      <div className="text-gray-600 mb-2">
                        Fondo de la semana seleccionada: ${(() => {
                          if (!selectedMonthly || weeksToCreate.length === 0) return 1000;
                          const firstWeek = weeksToCreate[0];
                          const weekPct = (selectedMonthly.weeklyDistribution as any)[`week${firstWeek}`] ?? 25;
                          return ((selectedMonthly.totalFund * weekPct) / 100).toFixed(0);
                        })()} ({(selectedMonthly?.weeklyDistribution as any)[`week${weeksToCreate[0] || 1}`] || 25}% del total)
                      </div>
                      <div className="font-medium text-green-900 mb-1">
                        🏆 Distribución para {winnersCount} {winnersCount === 1 ? 'ganador' : 'ganadores'}:
                      </div>
                      <div className="space-y-1 ml-2">
                        {(() => {
                          if (!selectedMonthly || weeksToCreate.length === 0) return null;
                          
                          const firstWeek = weeksToCreate[0];
                          const weekPct = (selectedMonthly.weeklyDistribution as any)[`week${firstWeek}`] ?? 25;
                          const weekFund = (selectedMonthly.totalFund * weekPct) / 100;
                          
                          const exactPrizes: number[] = [];
                          
                          exactPrizes.push(weekFund * top1 / 100);
                          exactPrizes.push(weekFund * top2 / 100);
                          exactPrizes.push(weekFund * top3 / 100);
                          
                          if (winnersCount > 3) {
                            const otherPrize = weekFund * perPersonPct / 100;
                            const otherCount = winnersCount - 3;
                            
                            for (let i = 0; i < otherCount; i++) {
                              exactPrizes.push(otherPrize);
                            }
                          }
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>🥇 1° lugar:</span>
                                <span className="font-medium">${exactPrizes[0].toFixed(2)} ({top1}%)</span>
                              </div>
                              {winnersCount >= 2 && (
                                <div className="flex justify-between">
                                  <span>🥈 2° lugar:</span>
                                  <span className="font-medium">${exactPrizes[1].toFixed(2)} ({top2}%)</span>
                                </div>
                              )}
                              {winnersCount >= 3 && (
                                <div className="flex justify-between">
                                  <span>🥉 3° lugar:</span>
                                  <span className="font-medium">${exactPrizes[2].toFixed(2)} ({top3}%)</span>
                                </div>
                              )}
                              {winnersCount > 3 && (
                                <div className="border-t border-green-200 pt-1 mt-1">
                                  <div className="flex justify-between">
                                    <span>🏆 Ganadores 4°-{rangeEnd}°:</span>
                                    <span className="font-medium">${exactPrizes[3].toFixed(2)} cada uno</span>
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
                                  <span className="font-medium">${exactPrizes.reduce((a, b) => a + b, 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
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
            )}

            {/* Resumen de fechas de sorteos a crear */}
            {selectedMonthly && weeksToCreate.length > 0 && (
              <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200">
                <h4 className="text-md font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                  <span>Fechas de los Sorteos a Crear</span>
                </h4>
                 <div className="space-y-3">
                   {weeksToCreate
                     .filter(week => {
                       const weekParticipantsB = (selectedMonthly.participantDistribution as any)[`week${week}`] ?? 0;
                       return weekParticipantsB > 0;
                     })
                     .map(week => {
                     const saturdayDates = getSaturdayDates(selectedMonthly.month, selectedMonthly.year);
                     const saturdayDate = saturdayDates[week - 1];
                     
                     const customDrawDate = datesByWeek[week]?.drawDate;
                     const displayDate = customDrawDate ? new Date(customDrawDate + 'T00:00') : saturdayDate;
                     const formattedDate = displayDate.toLocaleDateString('es-ES', {
                       weekday: 'long',
                       day: 'numeric',
                       month: 'long',
                       year: 'numeric'
                     });
                     
                     const weekPctB = (selectedMonthly.weeklyDistribution as any)[`week${week}`] ?? 0;
                     const weekFund = (selectedMonthly.totalFund * weekPctB) / 100;        
                     const weekParticipantsB = (selectedMonthly.participantDistribution as any)[`week${week}`] ?? 0;
                    
                    return (
                      <div
                        key={week}
                        className={`flex flex-col lg:flex-row lg:items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-blue-100 shadow-sm overflow-hidden ${weekParticipantsB === 0 ? 'opacity-60' : ''}`}
                        aria-disabled={weekParticipantsB === 0}
                      >
                        <div className="flex items-center space-x-3 mb-3 lg:mb-0">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {week}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Semana {week}</div>
                            <div className="text-xs sm:text-sm text-blue-600">{formattedDate}</div>
                          </div>
                        </div>
                        <div className="w-full">
                          <div className="text-right lg:text-left mb-3">
                            <div className="text-sm font-medium text-gray-900">${weekFund.toFixed(0)}</div>
                            <div className="text-xs text-gray-500">Fondo</div>
                          </div>
                          <div className="text-right lg:text-left mb-3 -mt-2 flex items-center gap-2">
                            <div className={`text-xs font-medium ${weekParticipantsB === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                              Participantes: {weekParticipantsB === 0 ? 'No disponible' : weekParticipantsB}
                            </div>
                            {weekParticipantsB === 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-medium">No disponible</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-2">
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-600 mb-2 text-center">Puntos requeridos</label>
                              <input
                                type="number"
                                min={0}
                                value={pointsByWeek[week] ?? pointsRequired}
                                onChange={(e) => {
                                  const v = Math.max(0, Number(e.target.value || 0));
                                  setPointsByWeek(prev => ({ ...prev, [week]: v }));
                                }}
                                className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2 ${weekParticipantsB === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={weekParticipantsB === 0}
                                placeholder="0"
                              />
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-600 mb-2 text-center">Inicio registro</label>
                              {useSplitPickers ? (
                                <input
                                  type="date"
                                  value={datesByWeek[week]?.regStartDate || ''}
                                  min={nowLocal().slice(0,10)}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setDatesByWeek(prev => ({ ...prev, [week]: { ...(prev[week]||{}), regStartDate: v } }));
                                    const msg = validateWeekDates(week);
                                    setValidationErrors(prev => ({ ...prev, [week]: msg }));
                                  }}
                                  className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2 ${weekParticipantsB === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  disabled={weekParticipantsB === 0}
                                />
                              ) : null}
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-xs font-medium text-gray-600 mb-2 text-center">Fin registro</label>
                              {useSplitPickers ? (
                                <input
                                  type="date"
                                  value={datesByWeek[week]?.regEndDate || ''}
                                  min={(datesByWeek[week]?.regStartDate || nowLocal().slice(0,10))}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setDatesByWeek(prev => ({ ...prev, [week]: { ...(prev[week]||{}), regEndDate: v } }));
                                    const msg = validateWeekDates(week);
                                    setValidationErrors(prev => ({ ...prev, [week]: msg }));
                                  }}
                                  className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2 ${weekParticipantsB === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  disabled={weekParticipantsB === 0}
                                />
                              ) : null}
                            </div>
                             <div className="flex flex-col">
                               <label className="block text-xs font-medium text-gray-600 mb-2 text-center">Fecha sorteo</label>
                              {useSplitPickers ? (
                                <input
                                  type="date"
                                   value={datesByWeek[week]?.drawDate || saturdayDate.toISOString().slice(0, 10)}
                                  min={addDays((datesByWeek[week]?.regEndDate || datesByWeek[week]?.regStartDate || nowLocal().slice(0,10)), 1)}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setDatesByWeek(prev => ({ ...prev, [week]: { ...(prev[week]||{}), drawDate: v } }));
                                    const msg = validateWeekDates(week);
                                    setValidationErrors(prev => ({ ...prev, [week]: msg }));
                                  }}
                                    className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2 ${weekParticipantsB === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    disabled={weekParticipantsB === 0}
                                />
                              ) : null}
                             </div>
                            </div>
                            {validationErrors[week] && (
                            <div className="mt-2 text-xs text-red-600">{validationErrors[week]}</div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Imagen opcional */}
            {selectedMonthly && weeksToCreate.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen para el sorteo semanal (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setImagePreview(String(ev.target?.result || ''));
                    reader.readAsDataURL(file);
                  } else {
                    setImagePreview(null);
                  }
                }}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="preview" className="h-28 sm:h-32 w-auto rounded-lg object-cover border shadow" />
                </div>
              )}
              </div>
            )}

            {/* Botones */}
            <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-0 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSubmitting
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateWeeklyRaffles}
                disabled={
                  isSubmitting ||
                  !selectedMonthly ||
                  weeksToCreate.length === 0 ||
                  weeksToCreate.some(w => Boolean(validationErrors[w]))
                }
                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow ${
                  !isSubmitting &&
                  selectedMonthly &&
                  weeksToCreate.length > 0 &&
                  !weeksToCreate.some(w => Boolean(validationErrors[w]))
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
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
                    <span>Creando...</span>
                  </span>
                ) : (
                  'Crear 1 Sorteo Semanal'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWeeklyRafflesModal;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { MonthlyRaffle, WeeklyRaffle } from '../../types';
import { generateId } from '../../utils';

interface MonthlyRaffleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (monthlyRaffle: MonthlyRaffle) => Promise<void>;
  monthlyRaffle?: MonthlyRaffle | null;
  totalPremiumUsers?: number;
  isLoading?: boolean;
}

const MonthlyRaffleFormModal: React.FC<MonthlyRaffleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  monthlyRaffle,
  totalPremiumUsers = 0,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalFund: 0,
    fundPercentage: 60, // Porcentaje de las mensualidades
    weeklyDistribution: {
      week1: 25,
      week2: 25,
      week3: 25,
      week4: 25
    },
    participantDistribution: {
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0
    },
    winnerExclusionSettings: {
      enabled: false,
      exclusionPeriod: 'next_month' as 'next_week' | 'next_month' | 'custom_weeks' | 'custom_months',
      customPeriod: 1
    }
  });

  // Ya no necesitamos distribución de premios en el sorteo mensual

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalParticipants, setTotalParticipants] = useState<number>(100);
  const [participantInputType, setParticipantInputType] = useState<'subscribed' | 'manual'>('subscribed');

  // Generar nombre único automáticamente
  const generateUniqueName = (month: number, year: number) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `Sorteo ${monthNames[month - 1]} ${year}`;
  };

  // 🔧 Distribución inteligente de participantes basada en semanas con fondos
  const distributeParticipantsBasedOnFunds = useCallback((
    totalParticipants: number,
    weeklyDistribution: any,
    saturdayCount: number
  ) => {
    // Identificar semanas activas (con fondos > 0)
    const activeWeeks: number[] = [];
    for (let i = 1; i <= saturdayCount; i++) {
      const weekKey = `week${i}` as keyof typeof weeklyDistribution;
      if (weeklyDistribution[weekKey] > 0) {
        activeWeeks.push(i);
      }
    }

    // Si no hay semanas activas, retornar todo en 0
    if (activeWeeks.length === 0) {
      const distribution: any = {};
      for (let i = 1; i <= saturdayCount; i++) {
        distribution[`week${i}`] = 0;
      }
      return distribution;
    }

    // Distribuir participantes solo entre las semanas activas
    const participantsPerWeek = Math.floor(totalParticipants / activeWeeks.length);
    const remaining = totalParticipants % activeWeeks.length;

    const distribution: any = {};
    
    // Inicializar todas las semanas en 0
    for (let i = 1; i <= saturdayCount; i++) {
      distribution[`week${i}`] = 0;
    }
    
    // Asignar participantes solo a las semanas activas
    activeWeeks.forEach((weekNumber, index) => {
      distribution[`week${weekNumber}`] = participantsPerWeek + (index < remaining ? 1 : 0);
    });

    return distribution;
  }, []);

  // Calcular TODOS los sábados del mes (4 o 5)
  const getSaturdayDates = (month: number, year: number) => {
    const dates: Date[] = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    let d = new Date(firstDay);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    while (d <= lastDay) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    return dates;
  };

  // No necesitamos cargar usuarios PREMIUM desde API separada
  // El valor se pasa como prop desde RafflesPage

  // 🔄 Recalcular distribución de participantes cuando cambian los FONDOS (weeklyDistribution)
  useEffect(() => {
    // Solo recalcular si el modal está abierto y no estamos editando
    if (!isOpen || monthlyRaffle) return;
    
    const currentParticipants = participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants;
    
    // Solo calcular si hay participantes
    if (currentParticipants <= 0) return;
    
    const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
    
    // 🔧 Usar distribución inteligente basada en fondos
    const newDistribution = distributeParticipantsBasedOnFunds(
      currentParticipants,
      formData.weeklyDistribution,
      saturdayCount
    );
    
    setFormData(prev => ({
      ...prev,
      participantDistribution: newDistribution
    }));
  }, [
    isOpen, 
    monthlyRaffle, 
    participantInputType, 
    totalPremiumUsers, 
    totalParticipants,
    formData.month,
    formData.year,
    // ⚠️ Dependencias individuales para detectar cambios en weeklyDistribution
    formData.weeklyDistribution.week1,
    formData.weeklyDistribution.week2,
    formData.weeklyDistribution.week3,
    formData.weeklyDistribution.week4,
    (formData.weeklyDistribution as any).week5,
    distributeParticipantsBasedOnFunds
  ]);

  // Recalcular distribución cuando cambie el tipo de entrada de participantes (SOLO en modo creación)
  useEffect(() => {
    // Solo recalcular si estamos en modo creación (no edición)
    if (!monthlyRaffle) {
        const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
      
      if (participantInputType === 'subscribed' && totalPremiumUsers > 0) {
        // 🔧 Usar distribución inteligente basada en fondos
        const newDistribution = distributeParticipantsBasedOnFunds(
          totalPremiumUsers,
          formData.weeklyDistribution,
          saturdayCount
        );
        
        setFormData(prev => ({
          ...prev,
          participantDistribution: newDistribution
        }));
      } else if (participantInputType === 'manual' && totalParticipants > 0) {
        // 🔧 Usar distribución inteligente basada en fondos
        const newDistribution = distributeParticipantsBasedOnFunds(
          totalParticipants,
          formData.weeklyDistribution,
          saturdayCount
        );
        
        setFormData(prev => ({
          ...prev,
          participantDistribution: newDistribution
        }));
      }
    }
  }, [
    participantInputType, 
    totalPremiumUsers, 
    totalParticipants, 
    monthlyRaffle, 
    formData.month, 
    formData.year,
    // ⚠️ Dependencias individuales para detectar cambios
    formData.weeklyDistribution.week1,
    formData.weeklyDistribution.week2,
    formData.weeklyDistribution.week3,
    formData.weeklyDistribution.week4,
    (formData.weeklyDistribution as any).week5,
    distributeParticipantsBasedOnFunds
  ]);

  // Calcular distribución inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen && !monthlyRaffle) {
      // Calcular distribución basada en totalPremiumUsers (modo suscritos por defecto)
      if (totalPremiumUsers > 0) {
        const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
        
        // 🔧 Usar distribución inteligente basada en fondos
        const newDistribution = distributeParticipantsBasedOnFunds(
          totalPremiumUsers,
          formData.weeklyDistribution,
          saturdayCount
        );
        
        setFormData(prev => ({
          ...prev,
          participantDistribution: newDistribution
        }));
      } else {
        // Si no hay participantes, mostrar 0 en todas las semanas
        setFormData(prev => ({
          ...prev,
          participantDistribution: {
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
            week5: 0
          }
        }));
      }
    }
  }, [
    isOpen, 
    totalPremiumUsers, 
    monthlyRaffle, 
    formData.month, 
    formData.year,
    // ⚠️ Dependencias individuales para detectar cambios
    formData.weeklyDistribution.week1,
    formData.weeklyDistribution.week2,
    formData.weeklyDistribution.week3,
    formData.weeklyDistribution.week4,
    (formData.weeklyDistribution as any).week5,
    distributeParticipantsBasedOnFunds
  ]);

  // 🔧 Recalcular distribución en MODO EDICIÓN cuando cambian los fondos
  useEffect(() => {
    // Solo ejecutar en modo EDICIÓN
    if (!isOpen || !monthlyRaffle) return;
    
    // Calcular total de participantes de todas las semanas
    const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
    const totalParticipantsInDistribution = Array.from({ length: saturdayCount }, (_, i) => i + 1)
      .reduce((sum, week) => {
        const weekKey = `week${week}` as keyof typeof formData.participantDistribution;
        return sum + ((formData.participantDistribution as any)[weekKey] || 0);
      }, 0);
    
    // Si no hay participantes, no recalcular
    if (totalParticipantsInDistribution === 0) return;
    
    // 🔧 Usar distribución inteligente basada en fondos
    const newDistribution = distributeParticipantsBasedOnFunds(
      totalParticipantsInDistribution,
      formData.weeklyDistribution,
      saturdayCount
    );
    
    setFormData(prev => ({
      ...prev,
      participantDistribution: newDistribution
    }));
  }, [
    isOpen,
    monthlyRaffle,
    formData.month,
    formData.year,
    // ⚠️ Dependencias individuales para detectar cambios en weeklyDistribution
    formData.weeklyDistribution.week1,
    formData.weeklyDistribution.week2,
    formData.weeklyDistribution.week3,
    formData.weeklyDistribution.week4,
    (formData.weeklyDistribution as any).week5,
    distributeParticipantsBasedOnFunds
  ]);

  // Resetear formulario cuando se abre el modal para crear nuevo sorteo
  useEffect(() => {
    if (isOpen && !monthlyRaffle) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Calcular distribución semanal automática según número de sábados
      const saturdayCount = getSaturdayDates(currentMonth, currentYear).length;
      const equalPercentage = Math.floor(100 / saturdayCount);
      const remaining = 100 % saturdayCount;
      
      const weeklyDistribution: any = {};
      for (let i = 1; i <= saturdayCount; i++) {
        weeklyDistribution[`week${i}`] = equalPercentage + (i <= remaining ? 1 : 0);
      }
      
      // Inicializar participantDistribution con 0 para todas las semanas
      const participantDistribution: any = {};
      for (let i = 1; i <= saturdayCount; i++) {
        participantDistribution[`week${i}`] = 0;
      }
      
      // Resetear formulario para nuevo sorteo
      setFormData({
        name: '',
        month: currentMonth,
        year: currentYear,
        totalFund: 0,       
        fundPercentage: 60, 
        weeklyDistribution,
        participantDistribution,
        winnerExclusionSettings: {
          enabled: false,
          exclusionPeriod: 'next_month',
          customPeriod: 1
        }
      });
    }
  }, [isOpen, monthlyRaffle]);

  // Recalcular distribución cuando cambie mes o año (solo en modo creación)
  useEffect(() => {
    if (!monthlyRaffle && isOpen) {
      const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
      const equalPercentage = Math.floor(100 / saturdayCount);
      const remaining = 100 % saturdayCount;
      
      const weeklyDistribution: any = {};
      for (let i = 1; i <= saturdayCount; i++) {
        weeklyDistribution[`week${i}`] = equalPercentage + (i <= remaining ? 1 : 0);
      }
      
      setFormData(prev => ({
        ...prev,
        weeklyDistribution
      }));
    }
  }, [formData.month, formData.year, monthlyRaffle, isOpen]);

  // Cargar datos si se está editando
  useEffect(() => {
    if (monthlyRaffle) {
      setFormData({
        name: monthlyRaffle.name,
        month: monthlyRaffle.month,
        year: monthlyRaffle.year,
        totalFund: monthlyRaffle.totalFund,
        fundPercentage: 60, 
        weeklyDistribution: monthlyRaffle.weeklyDistribution,     
        participantDistribution: monthlyRaffle.participantDistribution,
        winnerExclusionSettings: monthlyRaffle.winnerExclusionSettings || {
          enabled: false,
          exclusionPeriod: 'next_month',
          customPeriod: 1
        }
      });
    }
  }, [monthlyRaffle]);

  // Validar distribuciones en tiempo real
  const validateDistributions = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Validar distribución semanal dinámicamente (4 o 5 semanas)
    const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
    const weeks = Array.from({ length: saturdayCount }, (_, i) => i + 1);
    const weeklyTotal = weeks.reduce((sum, week) => {
      return sum + ((formData.weeklyDistribution as any)[`week${week}`] ?? 0);
    }, 0);
    
    if (weeklyTotal !== 100) {
      newErrors.weeklyDistribution = 'La distribución semanal debe sumar exactamente 100%';
    }

    // Validar que si hay 5 semanas, week5 no esté en 0 si las otras semanas suman menos de 100
    if (saturdayCount === 5) {
      const week5Pct = (formData.weeklyDistribution as any).week5 ?? 0;
      const first4WeeksTotal = formData.weeklyDistribution.week1 + 
                              formData.weeklyDistribution.week2 + 
                              formData.weeklyDistribution.week3 + 
                              formData.weeklyDistribution.week4;
      
      if (week5Pct === 0 && first4WeeksTotal < 100) {
        newErrors.weeklyDistribution = 'Si el mes tiene 5 sábados, debe configurar la Semana 5 o ajustar las primeras 4 semanas para sumar 100%';
      }
    }

    // Validar distribución de participantes
    const participantTotal = weeks.reduce((sum, week) => {
      const value = (formData.participantDistribution as any)[`week${week}`];
      const numValue = Number(value) || 0;
      return sum + numValue;
    }, 0);
    
    const expectedTotal = participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants;
    
    // Solo agregar error si realmente no coinciden (usar comparación estricta)
    if (Math.abs(participantTotal - expectedTotal) > 0.01) {
      newErrors.participantDistribution = `La distribución de participantes debe sumar exactamente ${expectedTotal} ${participantInputType === 'subscribed' ? '(total de suscriptores)' : ''}`;
    }

    // Reemplazar errores completamente (no mezclar con previos)
    setErrors(newErrors);
  }, [formData.weeklyDistribution, formData.participantDistribution, participantInputType, totalPremiumUsers, totalParticipants, formData.month, formData.year]);

  // Validar distribuciones cuando cambien
  useEffect(() => {
    validateDistributions();
  }, [validateDistributions]);

  // Validar formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // El nombre se genera automáticamente si está vacío

    if (formData.totalFund <= 0) {
      newErrors.totalFund = 'El fondo debe ser mayor a 0';
    }

    if (participantInputType === 'manual') {
      if (totalParticipants <= 0) {
        newErrors.totalParticipants = 'El total de participantes debe ser mayor a 0';
      } else if (totalParticipants > totalPremiumUsers) {
        newErrors.totalParticipants = `El número no puede superar los ${totalPremiumUsers} suscriptores disponibles`;
      }
    }

    // Validar distribución semanal
    const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
    const weeks = Array.from({ length: saturdayCount }, (_, i) => i + 1);
    const weeklyTotal = weeks.reduce((sum, week) => {
      return sum + ((formData.weeklyDistribution as any)[`week${week}`] ?? 0);
    }, 0);
    
    if (weeklyTotal !== 100) {
      newErrors.weeklyDistribution = 'La distribución semanal debe sumar exactamente 100%';
    }

    // Validar distribución de participantes
    const participantTotal = weeks.reduce((sum, week) => {
      const value = (formData.participantDistribution as any)[`week${week}`];
      const numValue = Number(value) || 0;
      return sum + numValue;
    }, 0);
    
    const expectedTotal = participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants;
    
    // Solo agregar error si realmente no coinciden (usar tolerancia para evitar problemas de precisión)
    if (Math.abs(participantTotal - expectedTotal) > 0.01) {
      newErrors.participantDistribution = `La distribución de participantes debe sumar exactamente ${expectedTotal} ${participantInputType === 'subscribed' ? '(total de suscriptores)' : ''}`;
    }

    // No actualizamos el estado de errors aquí, solo retornamos si es válido
    return Object.keys(newErrors).length === 0;
  };

  // Validar participantes en tiempo real
  const validateParticipants = (value: number): string | null => {
    if (participantInputType === 'manual') {
      if (value <= 0) {
        return 'El total de participantes debe ser mayor a 0';
      } else if (value > totalPremiumUsers) {
        return `El número no puede superar los ${totalPremiumUsers} suscriptores disponibles`;
      }
    }
    return null;
  };

  // Ya no necesitamos auto completar para distribución de premios

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar si hay errores para deshabilitar el botón
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Por favor corrige los errores antes de guardar');
      return;
    }

    setIsSubmitting(true);

    // Los sorteos semanales se crearán después con el botón "Crear"

    // Generar nombre único si no se proporciona
    const raffleName = formData.name.trim() || generateUniqueName(formData.month, formData.year);
    
    // Crear sorteos semanales con fechas automáticas
    const weeklyRafflesWithDates: WeeklyRaffle[] = [];
    const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
    for (let week = 1; week <= saturdayCount; week++) {
      const weekFund = (formData.totalFund * (formData.weeklyDistribution as any)[`week${week}`]) / 100;
      const saturdayDate = getSaturdayDates(formData.month, formData.year)[week - 1];
      
      const weeklyRaffle: WeeklyRaffle = {
        id: generateId(),
        name: `${raffleName} - Semana ${week}`,
        description: `Sorteo semanal ${week} del ${raffleName}`,
        week: week,
        weekNumber: week,
        month: formData.month,
        year: formData.year,
        monthlyRaffleId: monthlyRaffle?.id || generateId(),
        fund: weekFund,
        totalFund: weekFund,
        maxParticipants: 100,
        currentParticipants: 0,
        participants: [],
        winners: [],
        prizeDistribution: {
          specificPositions: {
            firstPlace: 30,
            secondPlace: 20,
            thirdPlace: 15,
          },
          prizeRanges: [
            {
              id: 'range1',
              startPosition: 4,
              endPosition: 10,
              percentage: 20
            }
          ],
        },
        drawDate: saturdayDate.toISOString(),
        startDate: new Date(saturdayDate.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 días antes del sábado
        endDate: saturdayDate,
        registrationStartDate: new Date(saturdayDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        registrationEndDate: new Date(saturdayDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: week === 1,
        isCompleted: false,
        isRegistrationOpen: week === 1,
        isDrawn: false,
        excludedParticipants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      weeklyRafflesWithDates.push(weeklyRaffle);
    }

    const newMonthlyRaffle: MonthlyRaffle = {
      id: monthlyRaffle?.id || generateId(),
      name: raffleName,
      month: formData.month,
      year: formData.year,
      totalFund: formData.totalFund,
      weeklyRaffles: weeklyRafflesWithDates,
      participants: [],
      weeklyDistribution: formData.weeklyDistribution,
      participantDistribution: formData.participantDistribution,
      winnerExclusionSettings: formData.winnerExclusionSettings,
      isActive: true,
      createdAt: monthlyRaffle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(newMonthlyRaffle);
      onClose();
  } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular total de distribución semanal (incluye semana 5 si se usa)
  const weeklyTotal = (formData.weeklyDistribution.week1 || 0) + 
                     (formData.weeklyDistribution.week2 || 0) + 
                     (formData.weeklyDistribution.week3 || 0) + 
                     (formData.weeklyDistribution.week4 || 0) +
                     ((formData.weeklyDistribution as any).week5 || 0);

  // Ya no calculamos distribución de premios en el sorteo mensual

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {monthlyRaffle ? 'Editar Sorteo Mensual' : 'Crear Sorteo Mensual'}
              </h3>
              <p className="text-sm text-gray-500">
                Configura el sorteo mensual y sus sorteos semanales
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Resumen de errores */}
            {hasErrors && (
              <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-4 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">
                      Hay {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'error' : 'errores'} que debes corregir:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {Object.entries(errors).map(([key, value]) => (
                        <li key={key}><strong>{key === 'weeklyDistribution' ? 'Distribución Semanal' : key === 'participantDistribution' ? 'Distribución de Participantes' : key === 'totalFund' ? 'Fondo Total' : key === 'totalParticipants' ? 'Total Participantes' : key}:</strong> {value}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Sorteo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder={generateUniqueName(formData.month, formData.year)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name || 'El nombre se generará automáticamente si lo dejas vacío'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fondo Total (USD) *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.totalFund === 0 ? '' : formData.totalFund}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, totalFund: 0 }));
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setFormData(prev => ({ ...prev, totalFund: numValue }));
                        }
                      }
                    }}
                    className="w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1500.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.totalFund && <p className="text-red-600 text-xs mt-1">{errors.totalFund}</p>}
              </div>
            </div>

            {/* Mes y Año */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  min="2024"
                  max="2030"
                />
              </div>
            </div>

            {/* Distribución semanal (4 o 5 semanas según el mes) */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Distribución Semanal</h4>
              <p className="text-sm text-gray-600 mb-4">
                Define qué porcentaje del fondo total se asignará a cada semana del mes. 
                La suma debe ser 100%. Si el mes tiene 5 sábados, podrás configurar una semana 5.
              </p>
              {(() => {
                const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
                const weeks = Array.from({ length: saturdayCount }, (_, i) => i + 1);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {weeks.map(week => {
                  const weekPercentage = (formData.weeklyDistribution as any)[`week${week}`] ?? 0;
                  const weekAmount = (formData.totalFund * weekPercentage) / 100;
                  
                  return (
                    <div key={week} className="bg-gray-50 p-4 rounded-lg">
                       <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                         Semana {week} (%)
                       </label>
                       <div className="text-xs text-gray-500 mb-2 text-center">
                         {(() => {
                           const saturdayDates = getSaturdayDates(formData.month, formData.year);
                           const saturdayDate = saturdayDates[week - 1];
                           if (saturdayDate) {
                             return `Sorteo ${saturdayDate.toLocaleDateString('es-ES', { 
                               day: '2-digit', 
                               month: '2-digit',
                               year: 'numeric'
                             })}`;
                           }
                           return '';
                         })()}
                       </div>
                      <input
                        type="number"
                        value={weekPercentage}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          weeklyDistribution: {
                            ...prev.weeklyDistribution,
                            [`week${week}`]: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2 text-center"
                        min="0"
                        max="100"
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">${weekAmount.toLocaleString('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-xs text-gray-500 ml-1">({weekPercentage}%)</span>
                      </div>
                    </div>
                  );
                    })}
                  </div>
                );
              })()}
              <div className="mt-2">
                <div className={`text-sm font-medium ${weeklyTotal === 100 ? 'text-gray-800' : 'text-red-600'}`}>
                  Total: {weeklyTotal}% (${formData.totalFund.toLocaleString('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </div>
                <div className="text-xs mt-1">
                  {weeklyTotal === 100 ? (
                    <span className="text-green-600 font-medium">✓ Distribución completa (100%)</span>
                  ) : weeklyTotal > 100 ? (
                    <span className="text-red-600 font-medium">Excede el 100% (sobra {weeklyTotal - 100}%)</span>
                  ) : (
                    <span className="text-red-600 font-medium">Falta {100 - weeklyTotal}% para completar</span>
                  )}
                </div>
                {errors.weeklyDistribution && <p className="text-red-600 text-xs mt-1">{errors.weeklyDistribution}</p>}
              </div>
            </div>

            {/* Total de Participantes */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Total de Participantes</h4>
              <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                {/* Opciones de entrada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Entrada
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="participantInputType"
                        value="subscribed"
                        checked={participantInputType === 'subscribed'}
                        onChange={(e) => setParticipantInputType(e.target.value as 'subscribed' | 'manual')}
                        className="mr-2"
                      />
                      <span className="text-sm">Total de Participantes Suscritos</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="participantInputType"
                        value="manual"
                        checked={participantInputType === 'manual'}
                        onChange={(e) => setParticipantInputType(e.target.value as 'subscribed' | 'manual')}
                        className="mr-2"
                      />
                      <span className="text-sm">Número</span>
                    </label>
                  </div>
                </div>

                {/* Mostrar opción seleccionada */}
                {participantInputType === 'subscribed' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total de Suscriptores
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {totalPremiumUsers} suscriptores activos
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Se usarán todos los suscriptores disponibles
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Participantes
                    </label>
                    <input
                      type="number"
                      value={totalParticipants === 0 ? '' : totalParticipants}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setTotalParticipants(0);
                          setErrors(prev => ({ ...prev, totalParticipants: '' }));
                        } else {
                          // Solo aceptar números enteros
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && value === numValue.toString() && numValue >= 1) {
                            setTotalParticipants(numValue);
                            // Validar y mostrar error si excede el máximo
                            const errorMessage = validateParticipants(numValue);
                            if (errorMessage) {
                              setErrors(prev => ({ ...prev, totalParticipants: errorMessage }));
                            } else {
                              setErrors(prev => ({ ...prev, totalParticipants: '' }));
                            }
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Validar al salir del campo
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value)) {
                          const errorMessage = validateParticipants(value);
                          setErrors(prev => ({ ...prev, totalParticipants: errorMessage || '' }));
                        } else if (e.target.value !== '') {
                          // Si hay un valor pero no es un número válido
                          setErrors(prev => ({ ...prev, totalParticipants: 'Debe ser un número entero válido' }));
                        }
                      }}
                      className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                        errors.totalParticipants ? 'border-red-500' : ''
                      }`}
                      min="1"
                      step="1"
                      max={totalPremiumUsers}
                      placeholder={`Máximo: ${totalPremiumUsers}`}
                      onKeyDown={(e) => {
                        // Prevenir caracteres no numéricos excepto Backspace, Delete, Tab, Escape, Enter, Arrow keys
                        if (!/[\d]/.test(e.key) && 
                            !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key) &&
                            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) &&
                            !(e.ctrlKey || e.metaKey) && // Permitir Ctrl/Cmd+C, Ctrl/Cmd+V, etc.
                            !e.shiftKey) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors.totalParticipants && <p className="text-red-600 text-xs mt-1">{errors.totalParticipants}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: {totalPremiumUsers} suscriptores disponibles
                    </p>
                  </div>
                )}

                {/* Información de distribución */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">
                    Los participantes se dividirán automáticamente en {getSaturdayDates(formData.month, formData.year).length} semanas
                  </p>
                </div>
              </div>
            </div>

            {/* Distribución de Participantes por Semana */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Distribución Automática por Semana
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Total: {participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants} participantes)
                </span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {(() => {
                  const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
                  const weeks = Array.from({ length: saturdayCount }, (_, i) => i + 1);
                  return weeks.map(week => (
                    <div key={week} className="bg-gray-50 p-4 rounded-lg">
                       <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                         Semana {week} - Participantes
                       </label>
                       <div className="text-xs text-gray-500 mb-2 text-center">
                         {(() => {
                           const saturdayDates = getSaturdayDates(formData.month, formData.year);
                           const saturdayDate = saturdayDates[week - 1];
                           if (saturdayDate) {
                             return `Sorteo ${saturdayDate.toLocaleDateString('es-ES', { 
                               day: '2-digit', 
                               month: '2-digit',
                               year: 'numeric'
                             })}`;
                           }
                           return '';
                         })()}
                       </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={(formData.participantDistribution as any)?.[`week${week}`] === 0 ? '' : (formData.participantDistribution as any)?.[`week${week}`] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setFormData(prev => ({
                              ...prev,
                              participantDistribution: {
                                ...prev.participantDistribution,
                                [`week${week}`]: 0
                              }
                            }));
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue) && value === numValue.toString() && numValue >= 0) {
                              setFormData(prev => ({
                                ...prev,
                                participantDistribution: {
                                  ...prev.participantDistribution,
                                  [`week${week}`]: numValue
                                }
                              }));
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setFormData(prev => ({
                              ...prev,
                              participantDistribution: {
                                ...prev.participantDistribution,
                                [`week${week}`]: 0
                              }
                            }));
                          }
                        }}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 px-3 py-2 text-center"
                        placeholder="0"
                        onKeyDown={(e) => {
                          if (!/[\d]/.test(e.key) && 
                              !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key) &&
                              !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) &&
                              !(e.ctrlKey || e.metaKey) &&
                              !e.shiftKey) {
                            e.preventDefault();
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Calculado automáticamente (editable)
                      </p>
                    </div>
                  ));
                })()}
              </div>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-700">
                    <strong>Distribución de Participantes:</strong> Los campos son editables pero se calculan automáticamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const currentParticipants = participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants;
                      if (currentParticipants <= 0) return;
                      const saturdayCount = getSaturdayDates(formData.month, formData.year).length;
                      const participantsPerWeek = Math.floor(currentParticipants / saturdayCount);
                      const remaining = currentParticipants % saturdayCount;
                      setFormData(prev => ({
                        ...prev,
                        participantDistribution: {
                          week1: participantsPerWeek + (remaining > 0 ? 1 : 0),
                          week2: participantsPerWeek + (remaining > 1 ? 1 : 0),
                          week3: participantsPerWeek + (remaining > 2 ? 1 : 0),
                          week4: participantsPerWeek + (remaining > 3 ? 1 : 0),
                          week5: saturdayCount === 5 ? (participantsPerWeek + (remaining > 4 ? 1 : 0)) : 0
                        }
                      }));
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Recalcular Distribución</span>
                  </button>
                </div>
                <div className={`text-sm font-medium ${
                  Object.values(formData.participantDistribution || {}).reduce((a, b) => a + b, 0) === (participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  <strong>Verificación:</strong> Total actual: {Object.values(formData.participantDistribution || {}).reduce((a, b) => a + b, 0)} / Total esperado: {participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants}
                  {Object.values(formData.participantDistribution || {}).reduce((a, b) => a + b, 0) === (participantInputType === 'subscribed' ? totalPremiumUsers : totalParticipants) ? ' ✓' : ' ✗'}
                </div>
              </div>
              {errors.participantDistribution && (
                <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg">
                  <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                    <span>{errors.participantDistribution}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Configuración de Exclusión de Ganadores */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <h4 className="text-lg font-medium text-gray-800 mb-3">
                Configuración de Exclusión de Ganadores
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exclusionEnabled"
                    checked={formData.winnerExclusionSettings.enabled}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      winnerExclusionSettings: {
                        ...prev.winnerExclusionSettings,
                        enabled: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="exclusionEnabled" className="ml-2 text-sm font-medium text-gray-700">
                    Excluir ganadores de futuros sorteos
                  </label>
                </div>
                
                {formData.winnerExclusionSettings.enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Período de exclusión:
                      </label>
                      <select
                        value={formData.winnerExclusionSettings.exclusionPeriod}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          winnerExclusionSettings: {
                            ...prev.winnerExclusionSettings,
                            exclusionPeriod: e.target.value as any
                          }
                        }))}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="next_week">Hasta el próximo sorteo semanal</option>
                        <option value="next_month">Hasta el próximo mes</option>
                        <option value="custom_weeks">Semanas personalizadas</option>
                        <option value="custom_months">Meses personalizados</option>
                      </select>
                    </div>
                    
                    {(formData.winnerExclusionSettings.exclusionPeriod === 'custom_weeks' || 
                      formData.winnerExclusionSettings.exclusionPeriod === 'custom_months') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad:
                        </label>
                        <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.winnerExclusionSettings.customPeriod}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            winnerExclusionSettings: {
                              ...prev.winnerExclusionSettings,
                              customPeriod: parseInt(e.target.value) || 1
                            }
                          }))}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          placeholder="1"
                        />
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {formData.winnerExclusionSettings.exclusionPeriod === 'custom_weeks' ? 'semana(s)' : 'mes(es)'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">
                        <strong>Explicación:</strong> Los ganadores de cada sorteo semanal serán excluidos automáticamente 
                        de futuros sorteos según el período configurado. Esto asegura una distribución más equitativa de premios.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLoading 
                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasErrors}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isSubmitting || hasErrors
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-700'
                } flex items-center space-x-2`}
                title={hasErrors ? 'Corrige los errores antes de guardar' : ''}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : hasErrors ? (
                  <span>❌ Hay errores en el formulario</span>
                ) : (
                  <span>{monthlyRaffle ? 'Actualizar' : 'Crear'} Sorteo</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRaffleFormModal;

import { RaffleParticipant, WeeklyRaffle, MonthlyRaffle, RaffleWinner } from '../types';

/**
 * Calcula la fecha de expiración de exclusión basada en la configuración
 */
export const calculateExclusionPeriod = (
  exclusionSettings: {
    exclusionPeriod: 'next_week' | 'next_month' | 'custom_weeks' | 'custom_months';
    customPeriod: number;
  }
): Date => {
  const now = new Date();
  
  switch (exclusionSettings.exclusionPeriod) {
    case 'next_week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'next_month':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    case 'custom_weeks':
      return new Date(now.getTime() + exclusionSettings.customPeriod * 7 * 24 * 60 * 60 * 1000);
    case 'custom_months':
      return new Date(now.getFullYear(), now.getMonth() + exclusionSettings.customPeriod, now.getDate());
    default:
      return now;
  }
};

/**
 * Obtiene participantes elegibles para un sorteo (excluye a los que están en período de exclusión)
 */
export const getEligibleParticipants = (
  allParticipants: RaffleParticipant[],
  currentRaffle: WeeklyRaffle,
  monthlyRaffle: MonthlyRaffle
): RaffleParticipant[] => {
  
  // Si la exclusión no está habilitada, retornar todos los participantes
  if (!monthlyRaffle.winnerExclusionSettings.enabled) {
    return allParticipants;
  }
  
  const now = new Date();
  
  return allParticipants.filter(participant => {
    // Verificar si está explícitamente excluido de este sorteo
    if (currentRaffle.excludedParticipants.includes(participant.id)) {
      return false;
    }
    
    // Verificar si está en período de exclusión
    if (participant.exclusionStatus.isExcluded && participant.exclusionStatus.excludedUntil) {
      const excludedUntil = new Date(participant.exclusionStatus.excludedUntil);
      return now > excludedUntil;
    }
    
    return true;
  });
};

/**
 * Actualiza el estado de exclusión de un participante después de ganar
 */
export const updateParticipantExclusion = (
  participant: RaffleParticipant,
  exclusionSettings: {
    exclusionPeriod: 'next_week' | 'next_month' | 'custom_weeks' | 'custom_months';
    customPeriod: number;
  }
): RaffleParticipant => {
  const excludedUntil = calculateExclusionPeriod(exclusionSettings);
  
  return {
    ...participant,
    exclusionStatus: {
      isExcluded: true,
      excludedUntil: excludedUntil.toISOString(),
      reason: 'winner',
      excludedFromRaffles: [...participant.exclusionStatus.excludedFromRaffles]
    }
  };
};

/**
 * Actualiza la lista de participantes excluidos en un sorteo semanal
 */
export const updateWeeklyRaffleExclusions = (
  raffle: WeeklyRaffle,
  winnerIds: string[]
): WeeklyRaffle => {
  return {
    ...raffle,
    excludedParticipants: [...raffle.excludedParticipants, ...winnerIds]
  };
};

/**
 * Verifica si un participante puede participar en un sorteo
 */
export const canParticipantEnter = (
  participant: RaffleParticipant,
  raffle: WeeklyRaffle
): boolean => {
  // Verificar si está explícitamente excluido de este sorteo
  if (raffle.excludedParticipants.includes(participant.id)) {
    return false;
  }
  
  // Verificar si está en período de exclusión
  if (participant.exclusionStatus.isExcluded && participant.exclusionStatus.excludedUntil) {
    const now = new Date();
    const excludedUntil = new Date(participant.exclusionStatus.excludedUntil);
    return now > excludedUntil;
  }
  
  return true;
};

/**
 * Obtiene la descripción del período de exclusión para mostrar en la UI
 */
export const getExclusionPeriodDescription = (
  exclusionSettings: {
    exclusionPeriod: 'next_week' | 'next_month' | 'custom_weeks' | 'custom_months';
    customPeriod: number;
  }
): string => {
  switch (exclusionSettings.exclusionPeriod) {
    case 'next_week':
      return 'Hasta el próximo sorteo semanal';
    case 'next_month':
      return 'Hasta el próximo mes';
    case 'custom_weeks':
      return `Por ${exclusionSettings.customPeriod} semana${exclusionSettings.customPeriod > 1 ? 's' : ''}`;
    case 'custom_months':
      return `Por ${exclusionSettings.customPeriod} mes${exclusionSettings.customPeriod > 1 ? 'es' : ''}`;
    default:
      return 'Sin exclusión';
  }
};

/**
 * Obtiene el número de participantes excluidos para un sorteo
 */
export const getExcludedParticipantsCount = (
  raffle: WeeklyRaffle,
  allParticipants: RaffleParticipant[]
): number => {
  const now = new Date();
  
  return raffle.excludedParticipants.filter(participantId => {
    const participant = allParticipants.find(p => p.id === participantId);
    if (!participant) return false;
    
    // Verificar si la exclusión aún está vigente
    if (participant.exclusionStatus.isExcluded && participant.exclusionStatus.excludedUntil) {
      const excludedUntil = new Date(participant.exclusionStatus.excludedUntil);
      return now <= excludedUntil;
    }
    
    return true;
  }).length;
};

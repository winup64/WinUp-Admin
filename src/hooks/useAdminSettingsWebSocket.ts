import { useEffect, useRef } from 'react';
import { useSocketContext } from '../contexts/SocketContext';
import { useNotifications } from '../contexts/NotificationContext';

export interface AdminSettingsUpdatedPayload {
  setting_id?: string;
  admin_name?: string;
  admin_phone?: string;
  admin_email?: string;
  admin_whatsapp?: string;
  business_hours?: string;
  demo_trial_days?: number;
  maintenance_mode?: boolean;
  updated_at?: string;
  action?: 'updated';
  [key: string]: any;
}

export interface DemoTrialDaysChangedPayload {
  demo_trial_days: number;
  updated_at?: string;
}

export interface ContactInfoUpdatedPayload {
  admin_name?: string;
  admin_phone?: string;
  admin_email?: string;
  admin_whatsapp?: string;
  business_hours?: string;
  updated_at?: string;
}

interface AdminSettingsWebSocketHandlers {
  onSettingsUpdated?: (payload: AdminSettingsUpdatedPayload) => void;
  onDemoTrialDaysChanged?: (payload: DemoTrialDaysChangedPayload) => void;
  onContactInfoUpdated?: (payload: ContactInfoUpdatedPayload) => void;
  listen?: boolean;
  skipNotifications?: boolean; // Para evitar notificaciones cuando el cambio es propio
  lastUpdateTimestamp?: string; // Timestamp de la última actualización propia
}

// Función helper para detectar qué campo cambió realmente
const detectChangedField = (
  payload: AdminSettingsUpdatedPayload,
  previousData?: AdminSettingsUpdatedPayload
): string | null => {
  if (!previousData) return null;

  const fieldsToCheck = [
    'maintenance_mode',
    'demo_trial_days',
    'admin_name',
    'admin_phone',
    'admin_email',
    'admin_whatsapp',
    'business_hours',
  ];

  for (const field of fieldsToCheck) {
    const newValue = payload[field];
    const oldValue = previousData[field];
    
    if (newValue !== undefined && newValue !== oldValue) {
      return field;
    }
  }

  return null;
};

// Función helper para verificar si es un cambio de contacto
const isContactInfoChange = (changedField: string | null): boolean => {
  return changedField === 'admin_name' ||
         changedField === 'admin_phone' ||
         changedField === 'admin_email' ||
         changedField === 'admin_whatsapp' ||
         changedField === 'business_hours';
};

export const useAdminSettingsWebSocket = ({
  onSettingsUpdated,
  onDemoTrialDaysChanged,
  onContactInfoUpdated,
  listen = true,
  skipNotifications = false,
  lastUpdateTimestamp,
}: AdminSettingsWebSocketHandlers = {}) => {
  const { socket } = useSocketContext();
  const { showInfo } = useNotifications();
  const previousDataRef = useRef<AdminSettingsUpdatedPayload | null>(null);
  const lastOwnUpdateRef = useRef<string | null>(lastUpdateTimestamp || null);

  // Actualizar referencia cuando cambia lastUpdateTimestamp
  useEffect(() => {
    if (lastUpdateTimestamp) {
      lastOwnUpdateRef.current = lastUpdateTimestamp;
    }
  }, [lastUpdateTimestamp]);

  useEffect(() => {
    if (!socket || !listen) return;

    const handleSettingsUpdated = (payload: AdminSettingsUpdatedPayload) => {
      // Verificar si es un cambio propio (mismo timestamp o skipNotifications activo)
      const isOwnChange = skipNotifications || 
        (payload.updated_at && lastOwnUpdateRef.current && 
         payload.updated_at === lastOwnUpdateRef.current);

      // Detectar qué campo realmente cambió (solo si hay datos previos)
      const changedField = previousDataRef.current 
        ? detectChangedField(payload, previousDataRef.current)
        : null;
      
      // Si no hay datos previos, es la primera carga, no mostrar notificación
      const isFirstLoad = !previousDataRef.current;
      
      // Actualizar referencia
      previousDataRef.current = payload;

      // Ejecutar callback siempre (para sincronizar datos)
      onSettingsUpdated?.(payload);

      // Solo mostrar notificación si:
      // 1. NO es un cambio propio
      // 2. NO es la primera carga
      // 3. Hay un campo que realmente cambió
      if (!isOwnChange && !isFirstLoad && changedField) {
        if (changedField === 'maintenance_mode') {
          const isActive = payload.maintenance_mode === true;
          showInfo(
            isActive ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado',
            isActive 
              ? 'Otro administrador activó el modo mantenimiento.'
              : 'Otro administrador desactivó el modo mantenimiento.'
          );
        } else if (changedField === 'demo_trial_days') {
          // Este se maneja en handleDemoDaysChanged
          // No mostrar aquí para evitar duplicados
        } else if (isContactInfoChange(changedField)) {
          // Este se maneja en handleContactInfoUpdated
          // No mostrar aquí para evitar duplicados
        } else {
          // Cambio genérico
          showInfo('Configuración actualizada', 'Otro administrador realizó cambios en la configuración.');
        }
      }
    };

    const handleDemoDaysChanged = (payload: DemoTrialDaysChangedPayload) => {
      // Verificar si es un cambio propio
      const isOwnChange = skipNotifications || 
        (payload.updated_at && lastOwnUpdateRef.current && 
         payload.updated_at === lastOwnUpdateRef.current);

      onDemoTrialDaysChanged?.(payload);
      
      // Solo mostrar notificación si NO es un cambio propio
      if (!isOwnChange) {
        showInfo('Días de prueba actualizados', `Otro administrador cambió los días de prueba a ${payload.demo_trial_days} días.`);
      }
    };

    const handleContactInfoUpdated = (payload: ContactInfoUpdatedPayload) => {
      // Verificar si es un cambio propio
      const isOwnChange = skipNotifications || 
        (payload.updated_at && lastOwnUpdateRef.current && 
         payload.updated_at === lastOwnUpdateRef.current);

      onContactInfoUpdated?.(payload);
      
      // Solo mostrar notificación si NO es un cambio propio
      if (!isOwnChange) {
        showInfo('Contacto actualizado', 'Otro administrador modificó la información de contacto.');
      }
    };

    socket.on('admin:settings:updated', handleSettingsUpdated);
    socket.on('demo:trial_days:changed', handleDemoDaysChanged);
    socket.on('contact:info:updated', handleContactInfoUpdated);

    return () => {
      socket.off('admin:settings:updated', handleSettingsUpdated);
      socket.off('demo:trial_days:changed', handleDemoDaysChanged);
      socket.off('contact:info:updated', handleContactInfoUpdated);
    };
  }, [
    socket,
    listen,
    onSettingsUpdated,
    onDemoTrialDaysChanged,
    onContactInfoUpdated,
    showInfo,
    skipNotifications,
    lastUpdateTimestamp,
  ]);
};


import React, { useCallback, useEffect, useState } from 'react';
import { Cog6ToothIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../contexts/NotificationContext';
import { adminSettingsKeys, useAdminSettings, useUpdateAdminSettings } from '../../hooks/useAdminSettings';
import { useAdminSettingsWebSocket } from '../../hooks/useAdminSettingsWebSocket';
import type { AdminSettings } from '../../services/adminSettingsService';
import type { AdminSettingsUpdatedPayload, ContactInfoUpdatedPayload, DemoTrialDaysChangedPayload } from '../../hooks/useAdminSettingsWebSocket';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

const DAY_DEFINITIONS: { key: DayKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Lunes', short: 'Lun' },
  { key: 'tue', label: 'Martes', short: 'Mar' },
  { key: 'wed', label: 'Miércoles', short: 'Mie' },
  { key: 'thu', label: 'Jueves', short: 'Jue' },
  { key: 'fri', label: 'Viernes', short: 'Vie' },
  { key: 'sat', label: 'Sábado', short: 'Sab' },
  { key: 'sun', label: 'Domingo', short: 'Dom' },
];

const KEY_TO_SHORT: Record<DayKey, string> = DAY_DEFINITIONS.reduce((acc, day) => {
  acc[day.key] = day.short;
  return acc;
}, {} as Record<DayKey, string>);

const SHORT_TO_KEY: Record<string, DayKey> = DAY_DEFINITIONS.reduce((acc, day) => {
  acc[day.short] = day.key;
  return acc;
}, {} as Record<string, DayKey>);

const DEFAULT_SCHEDULE: Record<DayKey, DaySchedule> = {
  mon: { enabled: false, open: '09:00', close: '18:00' },
  tue: { enabled: false, open: '09:00', close: '18:00' },
  wed: { enabled: false, open: '09:00', close: '18:00' },
  thu: { enabled: false, open: '09:00', close: '18:00' },
  fri: { enabled: false, open: '09:00', close: '18:00' },
  sat: { enabled: false, open: '10:00', close: '14:00' },
  sun: { enabled: false, open: '10:00', close: '14:00' },
};

const cloneDefaultSchedule = (): Record<DayKey, DaySchedule> => {
  const clone: Record<DayKey, DaySchedule> = {} as Record<DayKey, DaySchedule>;
  DAY_DEFINITIONS.forEach(({ key }) => {
    clone[key] = { ...DEFAULT_SCHEDULE[key] };
  });
  return clone;
};

const parseBusinessHours = (input?: string): Record<DayKey, DaySchedule> => {
  const parsed = cloneDefaultSchedule();
  if (!input || typeof input !== 'string') return parsed;

  const parts = input.split('|').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [label, timeRange] = part.split(/\s+/);
    const key = SHORT_TO_KEY[label];
    if (!key) continue;
    if (!timeRange || /cerrado/i.test(timeRange)) {
      parsed[key] = { ...parsed[key], enabled: false };
      continue;
    }
    const [open, close] = timeRange.split('-');
    if (/^\d{2}:\d{2}$/.test(open || '') && /^\d{2}:\d{2}$/.test(close || '')) {
      parsed[key] = { enabled: true, open, close };
    }
  }
  return parsed;
};

const formatBusinessHours = (schedule: Record<DayKey, DaySchedule>): string => {
  return DAY_DEFINITIONS
    .map(({ key, short }) =>
      schedule[key].enabled ? `${short} ${schedule[key].open}-${schedule[key].close}` : `${short} Cerrado`
    )
    .join('|');
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    demoDays: 7,
    enableRewards: true,
    enableSurveys: true,
    enableNotifications: true,
    maintenanceMode: false,
  });
  
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState<boolean | null>(null);
  const [lastOwnUpdateTimestamp, setLastOwnUpdateTimestamp] = useState<string | null>(null);
  const [isOwnUpdate, setIsOwnUpdate] = useState(false);
  
  const { showSuccess, showError } = useNotifications();

  // ✨ React Query hooks - Reemplazan carga manual
  const { data: adminSettingsData, isLoading: isLoadingAdmin } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();
  const queryClient = useQueryClient();

  // Estado para datos del administrador
  const [adminForm, setAdminForm] = useState({
    admin_name: '',
    admin_phone: '',
    admin_email: '',
    admin_whatsapp: '',
    business_hours: '',
  });

  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(() => cloneDefaultSchedule());

  const applyAdminSettingsPayload = useCallback(
    (payload?: AdminSettingsUpdatedPayload | ContactInfoUpdatedPayload) => {
      if (!payload) return;

      setAdminForm((prev) => ({
        admin_name: payload.admin_name ?? prev.admin_name,
        admin_phone: payload.admin_phone ?? prev.admin_phone,
        admin_email: payload.admin_email ?? prev.admin_email,
        admin_whatsapp: payload.admin_whatsapp ?? prev.admin_whatsapp,
        business_hours: payload.business_hours ?? prev.business_hours,
      }));

      if (payload.business_hours) {
        setSchedule(parseBusinessHours(payload.business_hours));
      }

      if ('demo_trial_days' in payload && typeof payload.demo_trial_days === 'number') {
        setSettings((prevSettings) => ({
          ...prevSettings,
          demoDays: payload.demo_trial_days ?? prevSettings.demoDays,
        }));
      }

      // Sincronizar maintenance_mode desde WebSocket
      if ('maintenance_mode' in payload && typeof payload.maintenance_mode === 'boolean') {
        setSettings((prevSettings) => ({
          ...prevSettings,
          maintenanceMode: payload.maintenance_mode ?? false,
        }));
      }

      queryClient.setQueryData(adminSettingsKeys.current(), (prev: AdminSettings | null | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          admin_name: payload.admin_name ?? prev.admin_name,
          admin_phone: payload.admin_phone ?? prev.admin_phone,
          admin_email: payload.admin_email ?? prev.admin_email,
          admin_whatsapp: payload.admin_whatsapp ?? prev.admin_whatsapp,
          business_hours: payload.business_hours ?? prev.business_hours,
          demo_trial_days:
            'demo_trial_days' in payload && typeof payload.demo_trial_days === 'number'
              ? payload.demo_trial_days
              : prev.demo_trial_days,
          maintenance_mode:
            'maintenance_mode' in payload && typeof payload.maintenance_mode === 'boolean'
              ? payload.maintenance_mode
              : prev.maintenance_mode,
          updated_at: payload.updated_at ?? prev.updated_at,
        };
      });
    },
    [queryClient]
  );

  const handleDemoTrialDaysChanged = useCallback(
    (payload?: DemoTrialDaysChangedPayload) => {
      if (!payload || typeof payload.demo_trial_days !== 'number') return;

      setSettings((prevSettings) => ({ ...prevSettings, demoDays: payload.demo_trial_days }));
      queryClient.setQueryData(adminSettingsKeys.current(), (prev: AdminSettings | null | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          demo_trial_days: payload.demo_trial_days,
          updated_at: payload.updated_at ?? prev.updated_at,
        };
      });
    },
    [queryClient]
  );

  useAdminSettingsWebSocket({
    onSettingsUpdated: applyAdminSettingsPayload,
    onDemoTrialDaysChanged: handleDemoTrialDaysChanged,
    onContactInfoUpdated: applyAdminSettingsPayload,
    skipNotifications: isOwnUpdate,
    lastUpdateTimestamp: lastOwnUpdateTimestamp || undefined,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Sincronizar datos de React Query con estado local
  useEffect(() => {
    if (adminSettingsData) {
      setAdminForm({
        admin_name: adminSettingsData.admin_name || '',
        admin_phone: adminSettingsData.admin_phone || '',
        admin_email: adminSettingsData.admin_email || '',
        admin_whatsapp: adminSettingsData.admin_whatsapp || '',
        business_hours: adminSettingsData.business_hours || '',
      });
      setSchedule(parseBusinessHours(adminSettingsData.business_hours));
      if (typeof adminSettingsData.demo_trial_days === 'number') {
        setSettings((prev) => ({
          ...prev,
          demoDays: adminSettingsData.demo_trial_days ?? prev.demoDays,
        }));
      }
      // Sincronizar maintenance_mode con el backend
      if (typeof adminSettingsData.maintenance_mode === 'boolean') {
        setSettings((prev) => ({
          ...prev,
          maintenanceMode: adminSettingsData.maintenance_mode ?? false,
        }));
      }
    }
  }, [adminSettingsData]);

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMaintenanceToggle = (newValue: boolean) => {
    // Si es para desactivar, actualizar directamente sin confirmación
    if (!newValue) {
      confirmMaintenanceChange(newValue);
      return;
    }

    // Si es para activar, mostrar modal de confirmación
    setPendingMaintenanceValue(newValue);
    setShowMaintenanceModal(true);
  };

  const confirmMaintenanceChange = async (newValue: boolean) => {
    setShowMaintenanceModal(false);

    // Verificar que hay configuración de administrador
    if (!adminSettingsData?.admin_name) {
      showError('Error', 'Primero debe configurar los datos del administrador.');
      return;
    }

    // Marcar como actualización propia para evitar notificaciones duplicadas
    setIsOwnUpdate(true);
    const updateTimestamp = new Date().toISOString();
    setLastOwnUpdateTimestamp(updateTimestamp);

    try {
      const payload = {
        admin_name: adminSettingsData.admin_name,
        admin_phone: adminSettingsData.admin_phone,
        admin_email: adminSettingsData.admin_email,
        admin_whatsapp: adminSettingsData.admin_whatsapp,
        business_hours: adminSettingsData.business_hours,
        demo_trial_days: adminSettingsData.demo_trial_days,
        maintenance_mode: newValue,
      };

      const result = await updateMutation.mutateAsync(payload);
      
      // Actualizar timestamp con el del servidor si está disponible
      if (result?.updated_at) {
        setLastOwnUpdateTimestamp(result.updated_at);
      }
      
      showSuccess(
        newValue ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado',
        newValue
          ? 'Los usuarios no podrán iniciar sesión hasta que lo desactives.'
          : 'Los usuarios ya pueden acceder normalmente.'
      );
      
      // Resetear flag después de un breve delay para permitir que el WebSocket procese
      setTimeout(() => {
        setIsOwnUpdate(false);
      }, 2000);
    } catch (err: any) {
      setIsOwnUpdate(false);
      const backendMsg = err?.response?.data?.message || err?.message || 'No se pudo actualizar el modo mantenimiento.';
      showError('Error al guardar', Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg);
    } finally {
      setPendingMaintenanceValue(null);
    }
  };

  const handleSaveAdmin = async () => {
    if (!adminForm.admin_name || adminForm.admin_name.trim().length === 0) {
      showError('Datos del Administrador', 'El nombre del administrador es obligatorio.');
      return;
    }
    
    if (!settings.demoDays || settings.demoDays < 1 || settings.demoDays > 365) {
      showError('Días de prueba', 'Los días de prueba deben estar entre 1 y 365.');
      return;
    }
    
    // Marcar como actualización propia para evitar notificaciones duplicadas
    setIsOwnUpdate(true);
    const updateTimestamp = new Date().toISOString();
    setLastOwnUpdateTimestamp(updateTimestamp);
    
    try {
      const payload = {
        admin_name: adminForm.admin_name.trim(),
        admin_phone: adminForm.admin_phone.trim() ? adminForm.admin_phone.trim() : undefined,
        admin_email: adminForm.admin_email.trim() ? adminForm.admin_email.trim() : undefined,
        admin_whatsapp: adminForm.admin_whatsapp.trim() ? adminForm.admin_whatsapp.trim() : undefined,
        business_hours: formatBusinessHours(schedule) || undefined,
        demo_trial_days: settings.demoDays,
      };
      const result = await updateMutation.mutateAsync(payload);
      
      // Actualizar timestamp con el del servidor si está disponible
      if (result?.updated_at) {
        setLastOwnUpdateTimestamp(result.updated_at);
      }
      
      showSuccess('Datos guardados', 'La información del administrador y los días de prueba se actualizaron correctamente.');
      
      // Resetear flag después de un breve delay
      setTimeout(() => {
        setIsOwnUpdate(false);
      }, 2000);
    } catch (err: any) {
      setIsOwnUpdate(false);
      const backendMsg = err?.response?.data?.message || err?.message || 'No se pudo actualizar la información.';
      showError('Error al guardar', Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 ">Configuración del Sistema</h1>
        <p className="text-gray-600">Administra la configuración general de la aplicación</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos del Administrador */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center mb-4">
            <Cog6ToothIcon className="h-6 w-6 text-primary-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Datos del Administrador</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                name="admin_name"
                type="text"
                value={adminForm.admin_name}
                onChange={handleAdminInputChange}
                className="input-field"
                placeholder="Ej. Juan Pérez"
                disabled={isLoadingAdmin}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  name="admin_phone"
                  type="tel"
                  value={adminForm.admin_phone}
                  onChange={handleAdminInputChange}
                  className="input-field"
                  placeholder="+1234567890"
                  disabled={isLoadingAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                <input
                  name="admin_whatsapp"
                  type="tel"
                  value={adminForm.admin_whatsapp}
                  onChange={handleAdminInputChange}
                  className="input-field"
                  placeholder="+1234567890"
                  disabled={isLoadingAdmin}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
              <input
                name="admin_email"
                type="email"
                value={adminForm.admin_email}
                onChange={handleAdminInputChange}
                className="input-field"
                placeholder="admin@empresa.com"
                disabled={isLoadingAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de prueba gratuita
              </label>
              <input
                type="number"
                value={settings.demoDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (value >= 1 && value <= 365) {
                    handleSettingChange('demoDays', value);
                  }
                }}
                className="input-field"
                min="1"
                max="365"
                placeholder="Entre 1 y 365 días"
                disabled={isLoadingAdmin}
              />
              <p className="text-xs text-gray-500 mt-1">
                Rango permitido: 1 a 365 días
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Horario de atención</label>
              <div className="space-y-3">
                {DAY_DEFINITIONS.map((d) => (
                  <div key={d.key} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <div className="flex items-center">
                        <input
                          id={`day-${d.key}`}
                          type="checkbox"
                          checked={schedule[d.key].enabled}
                          onChange={(e) => setSchedule(prev => ({ ...prev, [d.key]: { ...prev[d.key], enabled: e.target.checked } }))}
                          className="mr-2"
                          disabled={isLoadingAdmin}
                        />
                        <label htmlFor={`day-${d.key}`} className="text-sm text-gray-700">{d.label}</label>
                      </div>
                    </div>
                    <div className="sm:col-span-3 grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        value={schedule[d.key].open}
                        onChange={(e) => setSchedule(prev => ({ ...prev, [d.key]: { ...prev[d.key], open: e.target.value } }))}
                        className="input-field"
                        disabled={isLoadingAdmin || !schedule[d.key].enabled}
                      />
                      <input
                        type="time"
                        value={schedule[d.key].close}
                        onChange={(e) => setSchedule(prev => ({ ...prev, [d.key]: { ...prev[d.key], close: e.target.value } }))}
                        className="input-field"
                        disabled={isLoadingAdmin || !schedule[d.key].enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveAdmin}
                disabled={updateMutation.isPending || isLoadingAdmin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>Guardar</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modo Mantenimiento */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Cog6ToothIcon className="h-6 w-6 text-warning-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Modo Mantenimiento</h3>
              {settings.maintenanceMode && (
                <span className="ml-3 px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 text-warning-800">
                  ACTIVO
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {settings.maintenanceMode ? 'Desactivar Modo Mantenimiento' : 'Activar Modo Mantenimiento'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {settings.maintenanceMode
                      ? 'Los usuarios no pueden iniciar sesión. Solo administradores tienen acceso.'
                      : 'Al activar, los usuarios no podrán iniciar sesión hasta que lo desactives.'}
                  </p>
                </div>
                <button
                  onClick={() => handleMaintenanceToggle(!settings.maintenanceMode)}
                  disabled={updateMutation.isPending || isLoadingAdmin || !adminSettingsData?.admin_name}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    settings.maintenanceMode ? 'bg-warning-600' : 'bg-gray-200'
                  }`}
                  title={
                    !adminSettingsData?.admin_name
                      ? 'Primero debe configurar los datos del administrador'
                      : settings.maintenanceMode
                      ? 'Desactivar modo mantenimiento'
                      : 'Activar modo mantenimiento'
                  }
                >
                  {updateMutation.isPending ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  )}
                </button>
              </div>
              
              {settings.maintenanceMode && (
                <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-warning-800">La aplicación está en mantenimiento</h4>
                      <p className="mt-1 text-sm text-warning-700">
                        Los usuarios no podrán iniciar sesión hasta que desactives este modo. Solo los administradores pueden acceder.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Cuando está activo, bloquea el acceso de todos los usuarios excepto administradores.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de modo mantenimiento */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-warning-100 rounded-full mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Activar Modo Mantenimiento?
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que deseas activar el modo mantenimiento?
                  </p>
                  
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-warning-800 mb-1">
                            Los usuarios no podrán iniciar sesión
                          </p>
                          <p className="text-xs text-warning-700">
                            Todos los usuarios quedarán bloqueados hasta que desactives este modo.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start pt-2 border-t border-warning-200">
                        <Cog6ToothIcon className="h-5 w-5 text-warning-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-warning-800 mb-1">
                            Solo administradores tendrán acceso
                          </p>
                          <p className="text-xs text-warning-700">
                            Los administradores podrán seguir accediendo normalmente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 px-4 py-3">
                <button
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setPendingMaintenanceValue(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => pendingMaintenanceValue !== null && confirmMaintenanceChange(pendingMaintenanceValue)}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-warning-600 text-white rounded-md hover:bg-warning-700 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Activando...
                    </span>
                  ) : (
                    'Sí, Activar Modo Mantenimiento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

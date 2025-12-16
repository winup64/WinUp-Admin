import React, { useState } from 'react';
import RafflesService from '../../services/rafflesService';
import type { WeeklyRaffle } from '../../types';

interface Props {
  isOpen: boolean;
  raffle: WeeklyRaffle;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

const WeeklyRaffleEditModal: React.FC<Props> = ({ isOpen, raffle, onClose, onSaved }) => {
  const [name, setName] = useState(raffle.name);
  const [description, setDescription] = useState(raffle.description || '');
  const [pointsRequired, setPointsRequired] = useState<number>(raffle.pointsRequired ?? 0);
  const [maxParticipants, setMaxParticipants] = useState<number>(raffle.maxParticipants ?? 0);
  const [registrationStartDate, setRegistrationStartDate] = useState<string>(raffle.registrationStartDate || '');
  const [registrationEndDate, setRegistrationEndDate] = useState<string>(raffle.registrationEndDate || '');
  const [drawDate, setDrawDate] = useState<string>(raffle.drawDate || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toIsoOrUndefined = (d?: string) => {
    if (!d) return undefined;
    const date = new Date(d);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = {
        raffle_type: 'weekly',
        name,
        description,
        points_required: Number(pointsRequired) || 0,
        max_participants: Number(maxParticipants) || 0,
        registration_start_date: toIsoOrUndefined(registrationStartDate),
        registration_end_date: toIsoOrUndefined(registrationEndDate),
        draw_date: toIsoOrUndefined(drawDate),
      };
      await RafflesService.update(raffle.id, payload);
      await onSaved();
    } catch (_) {
      // opcional: notificación de error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Editar Sorteo Semanal</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Puntos Requeridos</label>
                <input type="number" min={0} value={pointsRequired} onChange={(e) => setPointsRequired(Number(e.target.value))} className="mt-1 w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Máx. Participantes</label>
                <input type="number" min={0} value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} className="mt-1 w-full border rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Inicio Registro</label>
                <input type="datetime-local" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fin Registro</label>
                <input type="datetime-local" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha del Sorteo</label>
              <input type="datetime-local" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyRaffleEditModal;

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Pregunta, PreguntaForm, OpcionPregunta } from '../../types';
import { generateId } from '../../utils';
import {
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { API_CONFIG } from '../../config/api';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pregunta: Pregunta) => void;
  pregunta?: Pregunta | null;
  triviaId: string;
  triviaNombre: string;
}

const ensureAbsoluteUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  const base = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
  if (!base) return value;
  const path = value.replace(/^\/+/, '');
  return `${base}/${path}`;
};

const normalizeMediaValue = (value: File | string | undefined): File | string | undefined => {
  if (!value) return undefined;
  if (value instanceof File) return value;
  return ensureAbsoluteUrl(value) || value;
};

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pregunta,
  triviaId,
  triviaNombre
}) => {
  const { showSuccess, showError } = useNotifications();
  const [formData, setFormData] = useState<PreguntaForm>({
    texto: '',
    opciones: [
      { id: generateId(), texto: '', esCorrecta: false },
      { id: generateId(), texto: '', esCorrecta: false }
    ],
    respuestaCorrecta: 0,
    puntos: 10,
    tiempoSegundos: 60
  });

  useEffect(() => {
    if (pregunta) {
      setFormData({
        texto: pregunta.texto,
        imagen: normalizeMediaValue(pregunta.imagen),
        opciones: [...pregunta.opciones],
        respuestaCorrecta: pregunta.respuestaCorrecta,
        puntos: pregunta.puntos,
        tiempoSegundos: pregunta.tiempoSegundos ?? 60
      });
    } else {
      setFormData({
        texto: '',
        imagen: undefined,
        opciones: [
          { id: generateId(), texto: '', esCorrecta: false },
          { id: generateId(), texto: '', esCorrecta: false }
        ],
        respuestaCorrecta: 0,
        puntos: 10,
        tiempoSegundos: 60
      });
    }
  }, [pregunta]);

  const handleInputChange = (field: keyof PreguntaForm, value: string | number | File | undefined) => {
    const normalizedValue =
      field === 'imagen'
        ? normalizeMediaValue(value as File | string | undefined)
        : value;
    setFormData(prev => ({
      ...prev,
      [field]: normalizedValue,
    }));
  };

  const handleOptionChange = (optionIndex: number, field: keyof OpcionPregunta, value: string | boolean | File | undefined) => {
    const newOptions = [...formData.opciones];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      opciones: newOptions
    }));
  };

  const addOption = () => {
    if (formData.opciones.length < 6) {
      const newOption: OpcionPregunta = {
        id: generateId(),
        texto: '',
        esCorrecta: false
      };
      setFormData(prev => ({
        ...prev,
        opciones: [...prev.opciones, newOption]
      }));
    }
  };

  const removeOption = (optionIndex: number) => {
    if (formData.opciones.length > 2) {
      const newOptions = formData.opciones.filter((_, index) => index !== optionIndex);
      setFormData(prev => ({
        ...prev,
        opciones: newOptions
      }));
    }
  };

  const handleSave = () => {
    if (!formData.texto.trim()) {
      showError('Error', 'El texto de la pregunta es requerido');
      return;
    }

    if (formData.opciones.length < 2) {
      showError('Error', 'Debe haber al menos 2 opciones');
      return;
    }

    if (formData.opciones.some(option => !option.texto.trim())) {
      showError('Error', 'Todas las opciones deben tener texto');
      return;
    }

    if (!formData.opciones.some(option => option.esCorrecta)) {
      showError('Error', 'Debe haber al menos una respuesta correcta');
      return;
    }

    if (formData.puntos <= 0) {
      showError('Error', 'Los puntos deben ser mayores a 0');
      return;
    }

    if (!formData.tiempoSegundos || formData.tiempoSegundos <= 0) {
      showError('Error', 'El tiempo debe ser mayor a 0 segundos');
      return;
    }

    const nuevaPregunta: Pregunta = {
      id: pregunta?.id || generateId(),
      texto: formData.texto,
      imagen: formData.imagen,
      opciones: formData.opciones,
      puntos: formData.puntos,
      respuestaCorrecta: formData.respuestaCorrecta,
      tiempoSegundos: formData.tiempoSegundos,
      remoteId: pregunta?.remoteId
    };

    onSave(nuevaPregunta);
    showSuccess('Éxito', 'Pregunta guardada correctamente');
  };

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
                {pregunta ? 'Editar Pregunta' : 'Nueva Pregunta'}
              </h3>
              <p className="text-sm text-gray-500">
                Trivia: {triviaNombre}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Texto de la pregunta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pregunta *
              </label>
              <textarea
                value={formData.texto}
                onChange={(e) => handleInputChange('texto', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="¿Cuál es la capital de Francia?"
              />
            </div>

            {/* Imagen de la pregunta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de la Pregunta (opcional)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange('imagen', file);
                    }
                  }}
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.imagen && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('imagen', undefined)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              {formData.imagen && (
                <div className="mt-2">
                  <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-200">
                    <img
                      src={formData.imagen instanceof File ? URL.createObjectURL(formData.imagen) : (ensureAbsoluteUrl(formData.imagen) || formData.imagen)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.imagen instanceof File ? formData.imagen.name : 'Imagen cargada'}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntos *
                </label>
                <input
                  type="number"
                  value={formData.puntos}
                  onChange={(e) => handleInputChange('puntos', parseInt(e.target.value) || 0)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo límite *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      value={Math.floor((formData.tiempoSegundos ?? 60) / 60)}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0;
                        const currentSeconds = formData.tiempoSegundos ?? 60;
                        const secondsPart = currentSeconds % 60;
                        const totalSeconds = Math.max(minutes, 0) * 60 + secondsPart;
                        handleInputChange('tiempoSegundos', totalSeconds);
                      }}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Minutos</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={(formData.tiempoSegundos ?? 60) % 60}
                      onChange={(e) => {
                        const seconds = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 59);
                        const currentSeconds = formData.tiempoSegundos ?? 60;
                        const minutesPart = Math.floor(currentSeconds / 60);
                        const totalSeconds = (minutesPart * 60) + seconds;
                        handleInputChange('tiempoSegundos', totalSeconds);
                      }}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      max="59"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Segundos</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Total: {formData.tiempoSegundos ?? 60} segundos
                </p>
              </div>
            </div>

            {/* Opciones */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Opciones de Respuesta ({formData.opciones.length}/6)
                </h4>
                {formData.opciones.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Agregar opción
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {formData.opciones.map((opcion, index) => (
                  <div key={opcion.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={opcion.texto}
                        onChange={(e) => handleOptionChange(index, 'texto', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                      />
                      
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={opcion.esCorrecta}
                          onChange={(e) => handleOptionChange(index, 'esCorrecta', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Correcta</span>
                      </label>
                      
                      {formData.opciones.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;

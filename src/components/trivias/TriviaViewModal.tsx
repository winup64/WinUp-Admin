import React from 'react';
import { Trivia } from '../../types';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { API_CONFIG } from '../../config/api';

interface TriviaViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trivia: Trivia | null;
}

const ensureAbsoluteUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  const base = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
  if (!base) return value;
  const path = value.replace(/^\/+/, '');
  return `${base}/${path}`;
};

const TriviaViewModal: React.FC<TriviaViewModalProps> = ({
  isOpen,
  onClose,
  trivia
}) => {
  if (!isOpen || !trivia) return null;

  const getDifficultyColor = (dificultad: string) => {
    switch (dificultad) {
      case 'facil': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'dificil': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (dificultad: string) => {
    switch (dificultad) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Medio';
      case 'dificil': return 'Difícil';
      default: return dificultad;
    }
  };

  const extractImageValue = (
    value: any,
    depth: number = 0,
    visited: Set<any> = new Set()
  ): File | string | undefined => {
    if (!value || depth > 6) return undefined;
    if (value instanceof File) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value !== 'object') return undefined;

    if (visited.has(value)) return undefined;
    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const resolved = extractImageValue(item, depth + 1, visited);
        if (resolved) return resolved;
      }
      return undefined;
    }

    const possibleKeys = [
      'url',
      'secure_url',
      'secureUrl',
      'location',
      'Location',
      'path',
      'src',
      'href',
      'value',
      'data',
      'image',
      'imageUrl',
      'image_url',
      'media',
      'mediaUrl',
      'media_url',
      'attributes',
      'file',
      'original',
      'preview',
      'asset',
    ];
    for (const key of possibleKeys) {
      if (value && value[key] != null) {
        const resolved = extractImageValue(value[key], depth + 1, visited);
        if (resolved) return resolved;
      }
    }

    for (const key of Object.keys(value)) {
      if (possibleKeys.includes(key)) continue;
      const resolved = extractImageValue(value[key], depth + 1, visited);
      if (resolved) return resolved;
    }

    return undefined;
  };

  const getTriviaImageValue = (currentTrivia: Trivia): File | string | undefined => {
    const base: any = currentTrivia;
    return (
      extractImageValue(currentTrivia.imagen) ??
      extractImageValue(base?.imagenUrl) ??
      extractImageValue(base?.imagen_url) ??
      extractImageValue(base?.image) ??
      extractImageValue(base?.imageUrl) ??
      extractImageValue(base?.image_url) ??
      extractImageValue(base?.mediaUrl) ??
      extractImageValue(base?.media_url)
    );
  };

  const getQuestionImageValue = (pregunta: any): File | string | undefined => {
    return (
      extractImageValue(pregunta?.imagen) ??
      extractImageValue(pregunta?.image) ??
      extractImageValue(pregunta?.imagenUrl) ??
      extractImageValue(pregunta?.imagen_url) ??
      extractImageValue(pregunta?.imageUrl) ??
      extractImageValue(pregunta?.image_url) ??
      extractImageValue(pregunta?.mediaUrl) ??
      extractImageValue(pregunta?.media_url)
    );
  };

  const getImageSrc = (image?: File | string): string | undefined => {
    if (!image) return undefined;
    if (image instanceof File) {
      return URL.createObjectURL(image);
    }
    return ensureAbsoluteUrl(image) || image;
  };

  const triviaImageValue = getTriviaImageValue(trivia);
  const triviaImageSrc = getImageSrc(triviaImageValue);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">
                {trivia.nombre}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(trivia.dificultad)}`}>
                {getDifficultyLabel(trivia.dificultad)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                trivia.estado === 'activa' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {trivia.estado === 'activa' ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Categoría</h4>
                <p className="text-sm text-gray-600">{trivia.categoria}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Puntos</h4>
                <p className="text-sm text-gray-600">{trivia.puntos}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preguntas</h4>
                <p className="text-sm text-gray-600">{trivia.totalPreguntas ?? trivia.preguntas.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tiempo / Pregunta</h4>
                <p className="text-sm text-gray-600">
                  {trivia.tiempoPorPregunta ? `${trivia.tiempoPorPregunta} seg` : '—'}
                </p>
              </div>
            </div>

            {/* Imagen si existe */}
            {triviaImageSrc && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Imagen</h4>
                <img
                  src={triviaImageSrc}
                  alt={trivia.nombre}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Lista de preguntas */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Preguntas ({trivia.totalPreguntas ?? trivia.preguntas.length})
              </h4>
              
              {trivia.preguntas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay preguntas en esta trivia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trivia.preguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            Pregunta {index + 1}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-900 mb-3 font-medium">
                        {pregunta.texto}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                        <span>
                          <span className="font-semibold text-gray-700">Puntos:</span> {pregunta.puntos}
                        </span>
                        <span>
                          <span className="font-semibold text-gray-700">Tiempo:</span>{' '}
                          {pregunta.tiempoSegundos ? `${pregunta.tiempoSegundos} seg` : '—'}
                        </span>
                      </div>
                      
                      {(() => {
                        const questionImageValue = getQuestionImageValue(pregunta);
                        const questionImageSrc = getImageSrc(questionImageValue);
                        if (!questionImageSrc) return null;
                        return (
                          <figure className="mb-3">
                            <div className="w-full md:w-64 h-48 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                              <img
                                src={questionImageSrc}
                                alt="Imagen de la pregunta"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <figcaption className="mt-1 text-xs text-gray-500">
                              Imagen adjunta
                            </figcaption>
                          </figure>
                        );
                      })()}

                      <div className="space-y-2">
                        {pregunta.opciones.map((opcion, opcionIndex) => (
                          <div
                            key={opcionIndex}
                            className={`flex items-center space-x-2 p-2 rounded-md ${
                              opcion.esCorrecta
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            {opcion.esCorrecta ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-gray-400" />
                            )}
                            <div className="flex-1">
                              <span className={`text-sm ${
                                opcion.esCorrecta
                                  ? 'text-green-800 font-medium'
                                  : 'text-gray-600'
                              }`}>
                                {opcion.texto}
                              </span>
                            </div>
                            {opcion.esCorrecta && (
                              <span className="text-xs text-green-600 font-medium">
                                (Correcta)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriviaViewModal;

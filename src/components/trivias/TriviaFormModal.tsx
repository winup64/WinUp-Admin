import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Trivia, TriviaForm, Pregunta, OpcionPregunta } from '../../types';
import { generateId } from '../../utils';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ImportQuestionsModal from './ImportQuestionsModal';
import CategoriesService, { Category } from '../../services/categoriesService';
import { API_CONFIG } from '../../config/api';

interface TriviaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (triviaData: TriviaForm, preguntas: Pregunta[], premios: any[], participantes: any[]) => void;
  trivia?: Trivia;
  existingTrivias?: Trivia[];
}

const TriviaFormModal: React.FC<TriviaFormModalProps> = ({ isOpen, onClose, onSave, trivia, existingTrivias = [] }) => {
  const { showError, showSuccess } = useNotifications();
  
  const [formData, setFormData] = useState<TriviaForm>({
    nombre: '',
    categoria: '',
    dificultad: 'facil',
    puntos: 10,
    imagen: undefined,
    estado: 'activa',
    activacion: 'manual',
    duracion: 5
  });
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string | undefined>();
  
  
  // Calcular puntos y tiempos automáticamente
  const puntosTotales = preguntas.reduce((total, pregunta) => total + pregunta.puntos, 0);
  const totalTiempoSegundos = preguntas.reduce(
    (total, pregunta) => total + (pregunta.tiempoSegundos ?? 60),
    0
  );
  const tiempoPromedioSegundos =
    preguntas.length > 0 ? Math.round(totalTiempoSegundos / preguntas.length) : 60;
  
  // Estados para secciones desplegables
  const [expandedSections, setExpandedSections] = useState({
    datos: true,
    preguntas: false
  });
  const dificultades = [
    { value: 'facil', label: 'Fácil' },
    { value: 'medio', label: 'Medio' },
    { value: 'dificil', label: 'Difícil' }
  ];

  // Cargar categorías desde la API
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      
      // Intentar primero sin filtros
      let response;
      try {
        response = await CategoriesService.getCategoriesList({ 
          page: 1, 
          limit: 100
        });
      } catch (error) {
        // Si falla, intentar con status active
        response = await CategoriesService.getCategoriesList({ 
          page: 1, 
          limit: 100,
          status: 'active'
        });
      }
      
      setCategorias(response.data);
    } catch (error) {
      showError('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

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
      'original',
      'preview',
      'file',
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

  const normalizeQuestionMedia = (question: Pregunta | any): Pregunta => {
    const normalizedImage =
      extractImageValue(question?.imagen) ??
      extractImageValue(question?.image) ??
      extractImageValue(question?.imagenUrl) ??
      extractImageValue(question?.imagen_url) ??
      extractImageValue(question?.imageUrl) ??
      extractImageValue(question?.image_url) ??
      extractImageValue(question?.mediaUrl) ??
      extractImageValue(question?.media_url);
    const rawTime =
      question?.tiempoSegundos ??
      question?.tiempo_segundos ??
      question?.time_seconds ??
      question?.tiempo ??
      question?.tiempoPregunta ??
      question?.timeSeconds;
    const parsedTime =
      typeof rawTime === 'number' && Number.isFinite(rawTime) && rawTime > 0
        ? rawTime
        : (typeof rawTime === 'string' && rawTime.trim() !== '' ? Number(rawTime) : undefined);
    return {
      ...question,
      imagen: normalizeMediaValue(normalizedImage),
      tiempoSegundos: parsedTime && parsedTime > 0 ? parsedTime : 60,
    };
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (trivia) {
      // Convertir fecha de la API a formato datetime-local
      let fechaActivacionFormatted = '';
      if (trivia.fechaActivacion) {
        try {
          // La API envía con offset: "2025-10-17T16:57:00-05:00"
          // Parsear la fecha respetando el offset de Ecuador
          const fechaStr = trivia.fechaActivacion.toString();
          
          // Parsear manualmente para extraer la hora local (no UTC)
          // Formato esperado: YYYY-MM-DDTHH:mm:ss-05:00
          const match = fechaStr.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
          if (match) {
            fechaActivacionFormatted = match[1];
          }
          
          
        } catch (e) {
          
        }
      }

      // Si la activación es programada, forzar estado a inactiva
      const activacionValue = (trivia.activacion as any) ?? 'manual';
      const estadoValue = activacionValue === 'programada' 
        ? 'inactiva' 
        : ((trivia.estado as any) ?? 'activa');

      const normalizedImage =
        extractImageValue(trivia.imagen) ??
        extractImageValue((trivia as any)?.imagenUrl) ??
        extractImageValue((trivia as any)?.imagen_url) ??
        extractImageValue((trivia as any)?.image) ??
        extractImageValue((trivia as any)?.imageUrl) ??
        extractImageValue((trivia as any)?.image_url) ??
        extractImageValue((trivia as any)?.mediaUrl) ??
        extractImageValue((trivia as any)?.media_url);

      setFormData({
        nombre: trivia.nombre ?? '',
        categoria: trivia.categoria ?? '',
        dificultad: (trivia.dificultad as any) ?? 'facil',
        puntos: trivia.puntos ?? 10,
        imagen: normalizeMediaValue(normalizedImage),
        estado: estadoValue,
        activacion: activacionValue,
        duracion: trivia.duracion ?? 5,
        fechaActivacion: fechaActivacionFormatted
      });
      const normalizedQuestions = Array.isArray(trivia.preguntas)
        ? trivia.preguntas.map((pregunta) => normalizeQuestionMedia(pregunta))
        : [];
      setPreguntas(normalizedQuestions);
    } else {
      setFormData({
        nombre: '',
        categoria: '',
        dificultad: 'facil',
        puntos: 10,
        imagen: undefined,
        estado: 'activa',
        activacion: 'manual',
        duracion: 5
      });
      setPreguntas([]);
    }
  }, [trivia]);

  const handleInputChange = (field: keyof TriviaForm, value: string | number | File | undefined) => {
    setFormData(prev => {
      const newData = {
      ...prev,
      [field]: value
      };
      
      // Si se selecciona activación programada, establecer estado como inactiva automáticamente
      if (field === 'activacion' && value === 'programada') {
        newData.estado = 'inactiva';
      }
      
      return newData;
    });
    
    // Si cambia la duración general, distribuir el tiempo igualitariamente entre todas las preguntas
    if (field === 'duracion' && typeof value === 'number' && value > 0) {
      setPreguntas(prevPreguntas => {
        // Solo distribuir si hay preguntas
        if (prevPreguntas.length === 0) {
          return prevPreguntas;
        }
        
        // Convertir minutos a segundos
        const totalSeconds = value * 60;
        // Calcular tiempo por pregunta (distribución igualitaria)
        const tiempoPorPregunta = Math.max(1, Math.floor(totalSeconds / prevPreguntas.length));
        
        // Actualizar el tiempo de todas las preguntas
        return prevPreguntas.map(p => ({
          ...p,
          tiempoSegundos: tiempoPorPregunta
        }));
      });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (!formData.imagen || (typeof formData.imagen === 'string' && formData.imagen.trim().length === 0)) {
      setMainImagePreview(undefined);
      return;
    }

    if (formData.imagen instanceof File) {
      const objectUrl = URL.createObjectURL(formData.imagen);
      setMainImagePreview(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    setMainImagePreview(ensureAbsoluteUrl(formData.imagen) || formData.imagen);
  }, [formData.imagen]);

  const handleImportQuestions = (questions: Pregunta[]) => {
    setPreguntas([...questions, ...preguntas]);
    setShowImportModal(false);
    showSuccess('Éxito', `${questions.length} preguntas importadas correctamente`);
  };

  const handleSave = async () => {
    const nombre = (formData.nombre ?? '').toString();
    const categoria = (formData.categoria ?? '').toString();

    if (!nombre.trim()) {
      showError('Error', 'El nombre de la trivia es requerido');
      return;
    }
    if (!categoria.trim()) {
      showError('Error', 'La categoría es requerida');
      return;
    }
    if (preguntas.length === 0) {
      showError('Error', 'Debe agregar al menos una pregunta');
      return;
    }

    // El backend espera la categoría por NOMBRE y la resuelve a ID
    const categoriaValue = categoria;

    // Actualizar los puntos de la trivia con la suma automática
    setIsSaving(true);
    try {
      // Enviar fecha directamente del input datetime-local con offset de Ecuador
      let fechaActivacionFinal = formData.fechaActivacion;
      if (formData.fechaActivacion && formData.activacion === 'programada') {
        // Agregar segundos y offset de Ecuador: -05:00
        // Formato del input: "2025-10-17T21:26"
        // Formato a enviar: "2025-10-17T21:26:00-05:00"
        fechaActivacionFinal = formData.fechaActivacion + ':00-05:00';
      }

      const triviaData = { 
        ...formData, 
        categoria: categoriaValue, 
        puntos: puntosTotales,
        fechaActivacion: fechaActivacionFinal,
        tiempoPorPregunta: tiempoPromedioSegundos
      };
      
      
      
      await onSave(triviaData, preguntas, [], []);
      onClose();
    } catch (error) {
      // El error se maneja en el componente padre
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-start justify-center p-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={onClose} />
          
          <div className="relative top-8 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {trivia ? 'Editar Trivia' : 'Crear Nueva Trivia'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
              {/* Sección 1: Datos de la Trivia */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection('datos')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between bg-white hover:bg-gray-50 border-b border-gray-200 rounded-t-md transition-colors"
                  aria-expanded={expandedSections.datos}
                  aria-controls="panel-datos-trivia"
                >
                  <h3 className="text-sm font-medium text-gray-900">Datos de la Trivia</h3>
                  {expandedSections.datos ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform rotate-180" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform" />
                  )}
                </button>
                
                {expandedSections.datos && (
                  <div id="panel-datos-trivia" className="p-6 border-t border-gray-200">
                    {/* Resumen compacto */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <div className="text-xs text-gray-500">Preguntas</div>
                        <div className="text-base font-semibold text-gray-900">{preguntas.length}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <div className="text-xs text-gray-500">Puntos Totales</div>
                        <div className="text-base font-semibold text-gray-900">{puntosTotales}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <div className="text-xs text-gray-500">Dificultad</div>
                        <div className="text-base font-semibold text-gray-900 capitalize">{formData.dificultad}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <div className="text-xs text-gray-500">Estado</div>
                        <div className="text-base font-semibold text-gray-900 capitalize">{formData.estado}</div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <div className="text-xs text-gray-500">Tiempo Prom.</div>
                        <div className="text-base font-semibold text-gray-900">
                          {Math.floor(tiempoPromedioSegundos / 60)}m {tiempoPromedioSegundos % 60}s
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de la Trivia *
                        </label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => handleInputChange('nombre', e.target.value)}
                          className="input-field"
                          placeholder="Ej: Trivia de Historia Universal"
                        />
                        <p className="mt-1 text-xs text-gray-500">Nombre visible para los participantes.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría *
                        </label>
                        <select
                          value={formData.categoria}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className="input-field"
                          disabled={loadingCategories}
                        >
                          <option value="">
                            {loadingCategories ? 'Cargando categorías...' : 'Seleccionar categoría'}
                          </option>
                          {categorias.map(categoria => (
                            <option key={categoria.category_id} value={categoria.name}>
                              {categoria.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Usada para filtrar y agrupar trivias.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dificultad *
                        </label>
                        <select
                          value={formData.dificultad}
                          onChange={(e) => handleInputChange('dificultad', e.target.value)}
                          className="input-field"
                        >
                          {dificultades.map(dificultad => (
                            <option key={dificultad.value} value={dificultad.value}>
                              {dificultad.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Define el nivel esperado de los participantes.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Puntos por Trivia *
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={puntosTotales}
                            readOnly
                            className="input-field bg-gray-50 text-gray-600"
                            min="1"
                          />
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            (Auto-calculado)
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Se calcula automáticamente sumando los puntos de cada pregunta
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <select
                          value={formData.estado}
                          onChange={(e) => handleInputChange('estado', e.target.value)}
                          className="input-field"
                          disabled={formData.activacion === 'programada'}
                        >
                          <option value="activa">Activa</option>
                          <option value="inactiva">Inactiva</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Define si la trivia está disponible para jugar.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duración (minutos) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.duracion}
                            onChange={(e) => handleInputChange('duracion', parseInt(e.target.value) || 5)}
                            className="input-field pr-12"
                            min="1"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">min</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Tiempo total disponible para completar la trivia.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Activación
                        </label>
                        <select
                          value={formData.activacion}
                          onChange={(e) => handleInputChange('activacion', e.target.value)}
                          className="input-field"
                        >
                          <option value="manual">Manual</option>
                          <option value="programada">Programada</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Selecciona si se activa manualmente o en una fecha.</p>
                      </div>

                      {formData.activacion === 'programada' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha y Hora de Activación
                          </label>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Imagen principal (opcional)
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleInputChange('imagen', file);
                              }
                              e.currentTarget.value = '';
                            }}
                            className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {mainImagePreview && (
                            <div className="flex items-start gap-3">
                              <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                                <img
                                  src={mainImagePreview}
                                  alt="Imagen de la trivia"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="flex flex-col text-xs text-gray-600 space-y-2">
                                <span>
                                  {formData.imagen instanceof File
                                    ? formData.imagen.name
                                    : 'Vista previa de la imagen actual'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('imagen', undefined)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Quitar imagen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {!mainImagePreview && typeof formData.imagen === 'string' && formData.imagen && (
                          <p className="text-xs text-gray-500 mt-1 break-words">
                            Imagen actualmente asociada: {formData.imagen}
                          </p>
                        )}
                      </div>

                          <input
                            type="datetime-local"
                            value={formData.fechaActivacion || ''}
                            onChange={(e) => handleInputChange('fechaActivacion', e.target.value)}
                            className="input-field"
                          />
                          <p className="mt-1 text-xs text-gray-500">Momento exacto en que la trivia se activará automáticamente.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 2: Preguntas */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection('preguntas')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between bg-white hover:bg-gray-50 border-b border-gray-200 rounded-t-md transition-colors"
                  aria-expanded={expandedSections.preguntas}
                  aria-controls="panel-preguntas-trivia"
                >
                  <h3 className="text-sm font-medium text-gray-900">Preguntas ({preguntas.length})</h3>
                  {expandedSections.preguntas ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform rotate-180" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform" />
                  )}
                </button>
                
                {expandedSections.preguntas && (
                  <div id="panel-preguntas-trivia" className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">Gestiona las preguntas de la trivia</p>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowImportModal(true)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>Importar Preguntas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nuevaPregunta: Pregunta = {
                              id: generateId(),
                              texto: '',
                              opciones: [
                                { id: generateId(), texto: '', esCorrecta: false },
                                { id: generateId(), texto: '', esCorrecta: false }
                              ],
                              puntos: 10,
                            respuestaCorrecta: 0,
                            tiempoSegundos: 60
                            };
                            setPreguntas([nuevaPregunta, ...preguntas]);
                          }}
                          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>Agregar Pregunta</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {preguntas.map((pregunta, index) => (
                        <div key={pregunta.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Pregunta #{preguntas.length - index}</h4>
                            <button
                              type="button"
                              onClick={() => setPreguntas(preguntas.filter(p => p.id !== pregunta.id))}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Pregunta *
                              </label>
                              <input
                                type="text"
                                value={pregunta.texto}
                                onChange={(e) => {
                                  const updatedPreguntas = preguntas.map(p => 
                                    p.id === pregunta.id ? { ...p, texto: e.target.value } : p
                                  );
                                  setPreguntas(updatedPreguntas);
                                }}
                                className="input-field"
                                placeholder="¿Cuál es la capital de Francia?"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Imagen de la Pregunta (opcional)
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const updatedPreguntas = preguntas.map(p => 
                                        p.id === pregunta.id ? { ...p, imagen: file } : p
                                      );
                                      setPreguntas(updatedPreguntas);
                                    }
                                  }}
                                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {pregunta.imagen && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedPreguntas = preguntas.map(p => 
                                        p.id === pregunta.id ? { ...p, imagen: undefined } : p
                                      );
                                      setPreguntas(updatedPreguntas);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                                {pregunta.imagen && (
                                  <div className="mt-2">
                                    <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-200">
                                      <img
                                        src={pregunta.imagen instanceof File ? URL.createObjectURL(pregunta.imagen) : (ensureAbsoluteUrl(pregunta.imagen) || pregunta.imagen)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {pregunta.imagen instanceof File ? pregunta.imagen.name : 'Imagen cargada'}
                                    </p>
                                  </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Puntos *
                                </label>
                                <input
                                  type="number"
                                  value={pregunta.puntos}
                                  onChange={(e) => {
                                    const updatedPreguntas = preguntas.map(p => 
                                      p.id === pregunta.id ? { ...p, puntos: parseInt(e.target.value) || 0 } : p
                                    );
                                    setPreguntas(updatedPreguntas);
                                  }}
                                  className="input-field"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Tiempo límite *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <input
                                      type="number"
                                      value={Math.floor((pregunta.tiempoSegundos ?? 60) / 60)}
                                      onChange={(e) => {
                                        const minutes = parseInt(e.target.value) || 0;
                                        const currentSeconds = pregunta.tiempoSegundos ?? 60;
                                        const secondsPart = currentSeconds % 60;
                                        const totalSeconds = Math.max(minutes, 0) * 60 + secondsPart;
                                        const updatedPreguntas = preguntas.map(p =>
                                          p.id === pregunta.id ? { ...p, tiempoSegundos: totalSeconds } : p
                                        );
                                        setPreguntas(updatedPreguntas);
                                      }}
                                      className="input-field"
                                      min="0"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">Minutos</p>
                                  </div>
                                  <div>
                                    <input
                                      type="number"
                                      value={(pregunta.tiempoSegundos ?? 60) % 60}
                                      onChange={(e) => {
                                        const seconds = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 59);
                                        const currentSeconds = pregunta.tiempoSegundos ?? 60;
                                        const minutesPart = Math.floor(currentSeconds / 60);
                                        const totalSeconds = (minutesPart * 60) + seconds;
                                        const updatedPreguntas = preguntas.map(p =>
                                          p.id === pregunta.id ? { ...p, tiempoSegundos: totalSeconds } : p
                                        );
                                        setPreguntas(updatedPreguntas);
                                      }}
                                      className="input-field"
                                      min="0"
                                      max="59"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">Segundos</p>
                                  </div>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  Total: {pregunta.tiempoSegundos ?? 60} segundos
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Opciones de Respuesta * (Puedes marcar múltiples como correctas)
                              </label>
                              <div className="space-y-3">
                                {pregunta.opciones.map((opcion, opcionIndex) => (
                                  <div key={opcion.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <div className="flex items-start space-x-3">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={opcion.esCorrecta}
                                          onChange={(e) => {
                                            const nuevasOpciones = pregunta.opciones.map((o, i) => 
                                              i === opcionIndex ? { ...o, esCorrecta: e.target.checked } : o
                                            );
                                            const updatedPreguntas = preguntas.map(p => 
                                              p.id === pregunta.id ? { ...p, opciones: nuevasOpciones } : p
                                            );
                                            setPreguntas(updatedPreguntas);
                                          }}
                                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs text-gray-500">Correcta</span>
                                      </div>
                                      
                                      <div className="flex-1 space-y-2">
                                        <input
                                          type="text"
                                          value={opcion.texto}
                                          onChange={(e) => {
                                            const nuevasOpciones = pregunta.opciones.map((o, i) => 
                                              i === opcionIndex ? { ...o, texto: e.target.value } : o
                                            );
                                            const updatedPreguntas = preguntas.map(p => 
                                              p.id === pregunta.id ? { ...p, opciones: nuevasOpciones } : p
                                            );
                                            setPreguntas(updatedPreguntas);
                                          }}
                                          className="input-field"
                                          placeholder={`Opción ${opcionIndex + 1}`}
                                        />
                                        
                                      </div>
                                      
                                      {pregunta.opciones.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nuevasOpciones = pregunta.opciones.filter((_, i) => i !== opcionIndex);
                                            const updatedPreguntas = preguntas.map(p => 
                                              p.id === pregunta.id ? { ...p, opciones: nuevasOpciones } : p
                                            );
                                            setPreguntas(updatedPreguntas);
                                          }}
                                          className="text-red-600 hover:text-red-800 p-1"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                
                                {pregunta.opciones.length < 6 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nuevaOpcion: OpcionPregunta = {
                                        id: generateId(),
                                        texto: '',
                                        esCorrecta: false
                                      };
                                      const nuevasOpciones = [...pregunta.opciones, nuevaOpcion];
                                      const updatedPreguntas = preguntas.map(p => 
                                        p.id === pregunta.id ? { ...p, opciones: nuevasOpciones } : p
                                      );
                                      setPreguntas(updatedPreguntas);
                                    }}
                                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 p-2 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                    <span>Agregar Opción</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {preguntas.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No hay preguntas agregadas</p>
                          <p className="text-sm">Agrega preguntas para crear la trivia</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button 
                onClick={onClose} 
                className="btn-secondary" 
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="btn-primary inline-flex items-center space-x-2" 
                disabled={isSaving}
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSaving ? 'Guardando...' : (trivia ? 'Actualizar Trivia' : 'Crear Trivia')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Importar Preguntas */}
      {showImportModal && (
        <ImportQuestionsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportQuestions}
          existingTrivias={existingTrivias}
          currentTriviaCategory={formData.categoria}
        />
      )}
    </>
  );
};

export default TriviaFormModal;

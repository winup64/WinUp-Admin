import React, { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Trivia, Pregunta, TriviaForm, Premio, Participante } from '../../types';
import { generateId } from '../../utils';
import TriviaFormModal from '../../components/trivias/TriviaFormModal';
import TriviaViewModal from '../../components/trivias/TriviaViewModal';
import EditQuestionModal from '../../components/trivias/EditQuestionModal';
import TriviasService, {
  TriviaQuestionDTO,
  TriviaQuestionPayload,
  TriviaUpsertPayload,
} from '../../services/triviasService';
import CategoriesService from '../../services/categoriesService';
import {
  useTriviasList,
  useCreateTrivia,
  useUpdateTrivia,
  useDeleteTrivia,
} from '../../hooks/useTrivias';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { API_CONFIG } from '../../config/api';

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

const toNumber = (value: any): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
};

const DEFAULT_QUESTION_TIME = 60;

const computeAverageQuestionTime = (list: Pregunta[]): number => {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_QUESTION_TIME;
  const totalSeconds = list.reduce(
    (sum, question) => sum + (question.tiempoSegundos ?? DEFAULT_QUESTION_TIME),
    0
  );
  return Math.max(5, Math.round(totalSeconds / list.length));
};

type TriviaPayloadSource = {
  nombre?: string;
  categoria?: string;
  dificultad?: string;
  estado?: string;
  duracion?: number;
  tiempoPorPregunta?: number;
  activacion?: string;
  fechaActivacion?: string;
  imagen?: File | string;
};

const normalizeDifficultyForApi = (value?: string): TriviaUpsertPayload['dificultad'] => {
  const normalized = (value ?? 'FACIL').toString().trim().toUpperCase();
  if (normalized === 'MEDIO' || normalized === 'DIFICIL') {
    return normalized as TriviaUpsertPayload['dificultad'];
  }
  return 'FACIL';
};

const normalizeEstadoForApi = (value?: string): 'activa' | 'inactiva' =>
  value === 'inactiva' ? 'inactiva' : 'activa';

const normalizeActivacionForApi = (value?: string): 'manual' | 'programada' =>
  value === 'programada' ? 'programada' : 'manual';

const buildQuestionPayloadForApi = (question: Pregunta): TriviaQuestionPayload => {
  // Filtrar opciones vacías antes de procesar
  const validOptions = (question.opciones || []).filter((o) => o.texto && o.texto.trim().length > 0);
  
  const markedIndex = validOptions.findIndex((o) => o.esCorrecta);
  const singleCorrectIndex =
    markedIndex >= 0
      ? markedIndex
      : typeof question.respuestaCorrecta === 'number'
      ? question.respuestaCorrecta
      : 0;

  // Si la imagen es un File, NO incluirla en el payload (el backend la procesará desde question_images)
  // Solo incluir imagen si es una URL string
  const payload: TriviaQuestionPayload = {
    texto: question.texto.trim(),
    puntos: question.puntos,
    opciones: validOptions.map((o, idx) => ({
      texto: o.texto.trim(),
      esCorrecta: idx === singleCorrectIndex,
    })),
  };

  // Incluir tiempo por pregunta (redistribuido al cambiar duración) para persistir en BD
  const tiempoSeg = question.tiempoSegundos ?? (question as any).time_seconds ?? DEFAULT_QUESTION_TIME;
  if (typeof tiempoSeg === 'number' && tiempoSeg > 0) {
    payload.tiempoSegundos = tiempoSeg;
  }

  // Solo agregar imagen si es una URL string (no File)
  if (typeof question.imagen === 'string' && question.imagen.trim().length > 0) {
    payload.imagen = question.imagen;
  }

  return payload;
};

const buildTriviaPayloadForApi = (
  base: TriviaPayloadSource,
  preguntasList: Pregunta[]
): TriviaUpsertPayload => {
  const nombreValue = (base.nombre ?? '').toString().trim();
  const categoriaValue = (base.categoria ?? '').toString().trim();
  const activacionValue = normalizeActivacionForApi(base.activacion);
  const fechaActivacionValue =
    activacionValue === 'programada' && base.fechaActivacion ? base.fechaActivacion : undefined;
  
  // Filtrar preguntas vacías o incompletas antes de construir el payload
  const validQuestions = preguntasList.filter((q) => {
    // Debe tener texto no vacío
    const hasText = q.texto && q.texto.trim().length > 0;
    // Debe tener al menos 2 opciones con texto
    const validOptions = (q.opciones || []).filter((o) => o.texto && o.texto.trim().length > 0);
    const hasEnoughOptions = validOptions.length >= 2;
    
    return hasText && hasEnoughOptions;
  });
  
  const sanitizedQuestions = validQuestions.map(buildQuestionPayloadForApi);

  const payload: TriviaUpsertPayload = {
    nombre: nombreValue,
    categoria: categoriaValue,
    dificultad: normalizeDifficultyForApi(base.dificultad),
    estado: normalizeEstadoForApi(base.estado),
    activacion: activacionValue,
  };

  if (sanitizedQuestions.length > 0) {
    payload.preguntas = sanitizedQuestions;
  }

  if (typeof base.duracion === 'number' && Number.isFinite(base.duracion)) {
    payload.duracion = base.duracion;
  }

  if (typeof base.tiempoPorPregunta === 'number' && base.tiempoPorPregunta > 0) {
    payload.tiempoPorPregunta = base.tiempoPorPregunta;
  }

  if (typeof base.imagen === 'string') {
    const trimmedImage = base.imagen.trim();
    if (trimmedImage.length > 0) {
      payload.imagen = trimmedImage;
    }
  }

  if (fechaActivacionValue) {
    payload.fechaActivacion = fechaActivacionValue;
  }

  // Solo eliminar categoria si está vacía, pero mantenerla si tiene valor
  // (necesaria para update cuando se cambia de categoría)
  if (!categoriaValue) {
    delete payload.categoria;
  }

  return payload;
};

const TriviasPage: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState<'trivias' | 'preguntas'>('trivias');
  const [categoriesById, setCategoriesById] = useState<Record<string, string>>({});
  const [categoriesByName, setCategoriesByName] = useState<Record<string, string>>({}); // Mapeo nombre -> ID
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [scheduledFilter, setScheduledFilter] = useState<'all' | 'manual' | 'programada'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // ✨ React Query hooks - Paginación y filtros desde backend
  const {
    data: triviasResponse,
    isLoading: loadingTrivias,
    refetch: refetchTrivias,
  } = useTriviasList({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm || undefined,
    // Convertir nombre de categoría a category_id (UUID)
    category_id: filterCategory ? (categoriesByName[filterCategory] || undefined) : undefined,
    // Convertir difficulty a MAYÚSCULAS según especificación del backend
    difficulty: filterDifficulty ? filterDifficulty.toUpperCase() : undefined,
    // Mapear estados del UI al backend (active/inactive)
    status: filterStatus === 'activa' ? 'active' : 
            filterStatus === 'inactiva' ? 'inactive' : undefined,
    // Mapear tipo de activación (manual/programada, no 'automatica')
    activation_type: scheduledFilter === 'all' ? undefined : scheduledFilter,
  });

  // Mutations
  const createMutation = useCreateTrivia();
  const updateMutation = useUpdateTrivia();
  const deleteMutation = useDeleteTrivia();

  // Helpers de integración con API
  const mapDTOToUI = (t: any, catMap?: Record<string, string>): Trivia => {
    const id = t?.id || t?._id || t?.trivia_id || t?.triviaId || t?.uuid || generateId();
    const nombre = t?.nombre ?? t?.name ?? t?.description ?? t?.title ?? t?.triviaNombre ?? '';
    // @ts-ignore
    const categoriaId = t?.category_id ?? t?.categoria_id ?? t?.categoryId;
    const usedCatMap = catMap || categoriesById;
    
    // Priorizar el nombre de la categoría si está disponible, sino usar el mapeo de IDs
    let categoria = '';
    
    
    
    if (t?.categoria?.nombre) {
      categoria = t.categoria.nombre;
      
    } else if (t?.categories?.name) {
      categoria = t.categories.name;
      
    } else if (t?.categoria_name) {
      categoria = t.categoria_name;
      
    } else if (t?.categoriaNombre) {
      categoria = t.categoriaNombre;
      
    } else if (t?.categoryName) {
      categoria = t.categoryName;
      
    } else if (categoriaId && usedCatMap[categoriaId]) {
      categoria = usedCatMap[categoriaId];
      
    } else if (t?.categoria && typeof t.categoria === 'string') {
      // Si categoria es un string, verificar si es un UUID
      const isUUID = t.categoria.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      const isNumeric = t.categoria.match(/^\d+$/);
      
      if (isUUID || isNumeric) {
        // Es un ID, intentar mapearlo
        categoria = usedCatMap[t.categoria] || t.categoria;
        
      } else {
        // Parece ser un nombre directo
        categoria = t.categoria;
        
      }
    } else if (categoriaId) {
      categoria = usedCatMap[categoriaId] || categoriaId;
      
    }
    
    
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
    
    const imagenSrc =
      extractImageValue(t?.imagen) ??
      extractImageValue(t?.image) ??
      extractImageValue(t?.imagenUrl) ??
      extractImageValue(t?.imagen_url) ??
      extractImageValue(t?.imageUrl) ??
      extractImageValue(t?.image_url) ??
      extractImageValue(t?.mediaUrl) ??
      extractImageValue(t?.media_url);
    
    const normalizedTriviaImage = normalizeMediaValue(imagenSrc);
    const dificultadRaw = t?.dificultad ?? t?.difficulty ?? 'facil';
    const dificultad = Array.isArray(dificultadRaw)
      ? ((dificultadRaw[0]?.toString?.().toLowerCase?.() || 'facil') as any)
      : ((dificultadRaw?.toString?.().toLowerCase?.() || 'facil') as any);
    
    // Manejo correcto del estado: mapear 'active'/'inactive' del backend a 'activa'/'inactiva' del UI
    const estadoRaw = t?.estado ?? t?.status;
    
    
    let estado: 'activa' | 'inactiva';
    if (estadoRaw === 'active' || estadoRaw === 'activa') {
      estado = 'activa';
    } else if (estadoRaw === 'inactive' || estadoRaw === 'inactiva') {
      estado = 'inactiva';
    } else {
      // Valor por defecto solo si realmente no existe el campo
      estado = 'activa';
    }
    
    const activacion = t?.activacion ?? t?.activation_type ?? t?.activation ?? 'manual';
    const fechaActivacion = t?.fechaActivacion ?? t?.fecha_activacion ?? t?.activationDate ?? t?.scheduled_activation_date ?? undefined;
    // Leer duración de múltiples campos posibles del backend
    const duracion = toNumber(
      t?.duracion ?? 
      t?.duration_minutes ?? 
      t?.duration ??
      t?.duracion_minutos
    ) ?? 0;
    const preguntasSrc = t?.preguntas ?? t?.questions ?? [];
    const preguntas = Array.isArray(preguntasSrc)
      ? preguntasSrc.map((q: any) => {
          const remoteQuestionId = q?.question_id ?? q?.id ?? q?.questionId;
          const questionId = remoteQuestionId ?? generateId();
          const opcionesSrc = q?.opciones ?? q?.options ?? q?.answers ?? [];
          const opciones = Array.isArray(opcionesSrc)
            ? opcionesSrc.map((o: any, idx: number) => {
                const optionId = o?.answer_id ?? o?.id ?? generateId();
                const texto =
                  o?.texto ?? o?.text ?? o?.answer_text ?? o?.respuesta ?? o?.value ?? '';
                const esCorrecta = !!(o?.esCorrecta ?? o?.isCorrect ?? o?.is_correct);
                const orden = toNumber(o?.answer_order ?? o?.orden ?? o?.order) ?? idx + 1;
                return {
                  id: optionId,
                  texto,
                  esCorrecta,
                  orden,
                  answerId: o?.answer_id ?? o?.id,
                };
              })
            : [];
          const correctIndex = opciones.findIndex((o) => o.esCorrecta);
          const preguntaImagen =
            extractImageValue(q?.imagen) ??
            extractImageValue(q?.image) ??
            extractImageValue(q?.imagenUrl) ??
            extractImageValue(q?.imagen_url) ??
            extractImageValue(q?.imageUrl) ??
            extractImageValue(q?.image_url) ??
            extractImageValue(q?.mediaUrl) ??
            extractImageValue(q?.media_url);
          const normalizedPreguntaImagen = normalizeMediaValue(preguntaImagen);
          const timeSeconds =
            toNumber(
              q?.tiempoSegundos ??
                q?.tiempo_segundos ??
                q?.time_seconds ??
                q?.tiempo ??
                q?.timeSeconds ??
                q?.time
            ) ?? DEFAULT_QUESTION_TIME;
          const questionOrder = toNumber(q?.question_order ?? q?.orden ?? q?.order);
          return {
            id: questionId,
            remoteId: typeof remoteQuestionId === 'string' ? remoteQuestionId : undefined,
            texto: q?.texto ?? q?.text ?? q?.question_text ?? '',
            imagen: normalizedPreguntaImagen,
            puntos: toNumber(q?.puntos ?? q?.points) ?? 0,
            opciones,
            respuestaCorrecta: correctIndex >= 0 ? correctIndex : 0,
            tiempoSegundos: timeSeconds,
            orden: questionOrder ?? 0,
          };
        })
      : [];
    // Priorizar number_questions del backend (es el valor real)
    const preguntasCountFromPayload =
      t?.number_questions ??  // Campo del backend que tiene el número real
      t?.totalPreguntas ??
      t?.preguntasTotales ??
      t?.preguntas_total ??
      t?.preguntasCount ??
      t?.preguntas_count ??
      t?.questions_count ??
      t?.question_count ??
      t?.total_questions ??
      t?.totalQuestions ??
      t?.questionCount;
    // Usar el valor del backend si existe, de lo contrario contar las preguntas del array
    // NOTA: El array puede tener menos preguntas (el backend solo envía 5 en findAll)
    const preguntasCount =
      toNumber(preguntasCountFromPayload) ??
      (Array.isArray(preguntasSrc) && preguntasSrc.length > 0 ? preguntasSrc.length : 0);
    
    // Calcular tiempo por pregunta basándose en la duración total y el número de preguntas
    // Siempre calcular desde la duración total si tenemos ambos valores, ya que es más preciso
    let tiempoPorPregunta: number | undefined;
    
    // Si tenemos duración y número de preguntas, calcular desde ahí (más preciso)
    if (duracion > 0 && preguntasCount > 0) {
      // Convertir minutos a segundos y dividir entre el número de preguntas
      const totalSeconds = duracion * 60;
      tiempoPorPregunta = Math.max(1, Math.floor(totalSeconds / preguntasCount));
    } else {
      // Si no podemos calcular desde la duración, intentar obtener del backend
      tiempoPorPregunta = toNumber(
        t?.time_per_question ??
          t?.tiempoPorPregunta ??
          t?.tiempo_por_pregunta ??
          t?.timePerQuestion
      );
      
      // Si tampoco viene del backend y tenemos preguntas, calcular promedio
      if (!tiempoPorPregunta && preguntas.length > 0) {
        const calculatedAverageQuestionTime = computeAverageQuestionTime(preguntas);
        tiempoPorPregunta = calculatedAverageQuestionTime;
      }
    }
    const puntosFromPayload =
      t?.puntos ??
      t?.totalPuntos ??
      t?.total_puntos ??
      t?.puntosTotales ??
      t?.pointsTotal ??
      t?.points_total ??
      t?.totalPoints ??
      t?.points;
    const puntos =
      toNumber(puntosFromPayload) ??
      preguntas.reduce((sum: number, q: any) => sum + (q.puntos || 0), 0);
    return {
      id,
      nombre,
      categoria,
      dificultad,
      puntos,
      totalPreguntas: preguntasCount > 0 ? preguntasCount : preguntas.length,
      tiempoPorPregunta: tiempoPorPregunta ?? undefined,
      imagen: normalizedTriviaImage,
      estado,
      activacion,
      fechaActivacion,
      duracion,
      preguntas,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      premios: [],
      participantes: [],
    };
  };

  // Procesar trivias de la respuesta con mapeo de categorías
  const trivias = useMemo(() => {
    if (!triviasResponse?.data) return [];
    return triviasResponse.data.map((t: any) => mapDTOToUI(t, categoriesById));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triviasResponse, categoriesById]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedTrivia, setSelectedTrivia] = useState<Trivia | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Pregunta | null>(null);
  const [deletingTrivia, setDeletingTrivia] = useState<Trivia | null>(null);
  
  // Filtros para preguntas
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [debouncedQuestionSearchTerm, setDebouncedQuestionSearchTerm] = useState('');
  const [questionFilterTrivia, setQuestionFilterTrivia] = useState('');
  
  // Paginación para preguntas
  const [currentQuestionPage, setCurrentQuestionPage] = useState(1);
  const [questionsPerPage] = useState(5);
  
  // Estado para preguntas expandidas
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const dificultades = [
    { value: 'facil', label: 'Fácil' },
    { value: 'medio', label: 'Medio' },
    { value: 'dificil', label: 'Difícil' }
  ];

  // Extraer datos de paginación del backend
  const apiTotalPages = triviasResponse?.pagination?.totalPages || 0;
  const totalItems = triviasResponse?.total || 0;

  // Obtener todas las preguntas de todas las trivias
  const allQuestions = trivias.flatMap(trivia => 
    trivia.preguntas.map(pregunta => ({
      ...pregunta,
      triviaId: trivia.id,
      triviaNombre: trivia.nombre
    }))
  );

  const filteredQuestions = allQuestions.filter(question => {
    const qText = (question.texto || '').toString().toLowerCase();
    const qTerm = (debouncedQuestionSearchTerm || '').toString().toLowerCase();
    const matchesSearch = qText.includes(qTerm);
    const matchesTrivia = !questionFilterTrivia || question.triviaId === questionFilterTrivia;
    
    return matchesSearch && matchesTrivia;
  });

  // Los datos ya vienen paginados del backend
  const currentTrivias = trivias;

  // Paginación para preguntas
  const totalQuestionPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startQuestionIndex = (currentQuestionPage - 1) * questionsPerPage;
  const endQuestionIndex = startQuestionIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startQuestionIndex, endQuestionIndex);

  const isTemporaryId = (value?: string) => {
    if (!value) return true;
    return /^[a-z0-9]{9}$/i.test(value);
  };

  const buildQuestionDto = (question: Pregunta): TriviaQuestionDTO => ({
    texto: question.texto,
    puntos: question.puntos,
    imagen: typeof question.imagen === 'string' ? question.imagen : undefined,
    tiempoSegundos: question.tiempoSegundos ?? DEFAULT_QUESTION_TIME,
    opciones: question.opciones.map((o, idx) => ({
      texto: o.texto,
      esCorrecta: o.esCorrecta,
      orden: o.orden ?? idx + 1,
    })),
  });

  // Debounce para el término de búsqueda de trivias (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce para el término de búsqueda de preguntas (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuestionSearchTerm(questionSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [questionSearchTerm]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterCategory, filterDifficulty, filterStatus, scheduledFilter]);

  useEffect(() => {
    setCurrentQuestionPage(1);
  }, [debouncedQuestionSearchTerm, questionFilterTrivia]);

  const handleCreateTrivia = () => {
    setSelectedTrivia(null);
    setShowCreateModal(true);
  };

  const handleEditTrivia = async (trivia: Trivia) => {
    try {
      setLoadingDetailId(trivia.id);
      // Cargar detalle para obtener preguntas e ID real
      const dto = await TriviasService.getById(trivia.id);
      const full = mapDTOToUI(dto, categoriesById);
      setSelectedTrivia(full);
      setShowEditModal(true);
    } catch (e) {
      setSelectedTrivia(trivia);
      setShowEditModal(true);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const refreshTriviaDetail = async (triviaId: string) => {
    try {
      const dto = await TriviasService.getById(triviaId);
      const full = mapDTOToUI(dto, categoriesById);
      setSelectedTrivia(full);
    } catch (error) {
      // Ignorar errores silenciosamente para no bloquear la UI
    }
  };

  const handleViewTrivia = async (trivia: Trivia) => {
    try {
      setLoadingDetailId(trivia.id);
      const dto = await TriviasService.getById(trivia.id);
      const full = mapDTOToUI(dto, categoriesById);
      setSelectedTrivia(full);
      setShowViewModal(true);
    } catch (e) {
      setSelectedTrivia(trivia);
      setShowViewModal(true);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (Object.keys(categoriesById).length === 0) {
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapeo temporal de categorías basado en los IDs conocidos
  const getFallbackCategoryMapping = (): Record<string, string> => {
    return {
      'b0c527ba-07c8-4604-97dc-5db3bc28a123': 'Entretenimiento',
      'b07e5d45-07bf-4f9b-a0c2-8ba83ddb6251': 'Deportes',
      '7c00403f-d2c2-4434-bd08-d499a4432605': 'Arte',
      // Agregar más mapeos según sea necesario
    };
  };

  // Función para cargar solo las categorías
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      
      // Intentar primero sin filtros
      let catRes;
      try {
        catRes = await CategoriesService.getCategoriesList({ 
          page: 1, 
          limit: 100
        });
      } catch (error) {
        
        // Si falla, intentar con status active
        catRes = await CategoriesService.getCategoriesList({ 
          page: 1, 
          limit: 100,
          status: 'active'
        });
      }
      
      const mapIdToName: Record<string, string> = {}; // ID -> Nombre
      const mapNameToId: Record<string, string> = {}; // Nombre -> ID
      const categoryNames: string[] = [];
      
      if (catRes && catRes.data) {
        for (const c of catRes.data) {
          if (c.category_id && c.name) {
            mapIdToName[c.category_id] = c.name;
            mapNameToId[c.name] = c.category_id; // Mapeo inverso
            categoryNames.push(c.name);
          }
        }
      }
      
      
      setCategoriesById(mapIdToName);
      setCategoriesByName(mapNameToId);
      setCategoriesList(categoryNames);
      return mapIdToName;
    } catch (error) {
      
      
      // Usar mapeo temporal como fallback
      const fallbackIdToName = getFallbackCategoryMapping();
      const fallbackNames = Object.values(fallbackIdToName);
      
      // Crear mapeo inverso del fallback
      const fallbackNameToId: Record<string, string> = {};
      Object.entries(fallbackIdToName).forEach(([id, name]) => {
        fallbackNameToId[name] = id;
      });
      
      setCategoriesById(fallbackIdToName);
      setCategoriesByName(fallbackNameToId);
      setCategoriesList(fallbackNames);
      return fallbackIdToName;
    } finally {
      setLoadingCategories(false);
    }
  };


  const handleSaveTrivia = async (triviaData: TriviaForm, preguntas: Pregunta[], premios: Premio[], participantes: Participante[]) => {
    // El backend espera la categoría por NOMBRE y la resuelve a ID
    const categoriaValue = (triviaData.categoria ?? '').toString();

    // Validar que haya preguntas válidas antes de construir el payload
    const validQuestions = preguntas.filter((q) => {
      const hasText = q.texto && q.texto.trim().length > 0;
      const validOptions = (q.opciones || []).filter((o) => o.texto && o.texto.trim().length > 0);
      const hasEnoughOptions = validOptions.length >= 2;
      return hasText && hasEnoughOptions;
    });

    if (validQuestions.length === 0) {
      showError('Error', 'Debe agregar al menos una pregunta válida con texto y al menos 2 opciones completas');
      return;
    }

    const payload = buildTriviaPayloadForApi(
      {
        nombre: triviaData.nombre,
        categoria: categoriaValue,
        dificultad: triviaData.dificultad,
        estado: triviaData.estado,
        duracion: triviaData.duracion,
        tiempoPorPregunta: triviaData.tiempoPorPregunta,
        activacion: triviaData.activacion,
        fechaActivacion: triviaData.fechaActivacion,
        imagen: triviaData.imagen,
      },
      preguntas
    );

    

    try {
      // Obtener archivos en el mismo orden que las preguntas que tienen File
      const questionFiles: File[] = [];
      preguntas.forEach((p) => {
        if (p.imagen instanceof File && p.imagen.size > 0) {
          questionFiles.push(p.imagen);
        }
      });
      
      const hasFiles = questionFiles.length > 0;
      if (hasFiles) {
        const fd = new FormData();
        // Enviar dto como campo de texto para que Multer no lo trate como archivo
        fd.append('dto', JSON.stringify(payload));
        // Adjuntar archivos de preguntas en el mismo orden que aparecen en las preguntas
        questionFiles.forEach((file) => fd.append('question_images', file));
        
        // Enviar con FormData (sin fallback que perdería los archivos)
        if (selectedTrivia?.id) {
          await updateMutation.mutateAsync({ id: selectedTrivia.id, data: fd as any });
        } else {
          await createMutation.mutateAsync(fd as any);
        }
      } else {
        // Sin archivos, enviar como JSON normal
        if (selectedTrivia?.id) {
          await updateMutation.mutateAsync({ id: selectedTrivia.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      showSuccess('Éxito', selectedTrivia?.id ? 'Trivia actualizada' : 'Trivia creada');
    } catch (error) {
      showError('Error', selectedTrivia?.id ? 'No se pudo actualizar la trivia' : 'No se pudo crear la trivia');
    }
  };

  const handleDeleteTrivia = (trivia: Trivia) => {
    // Evitar usar IDs generados localmente (9 chars aleatorios)
    if (/^[a-z0-9]{9}$/.test(trivia.id)) {
      showError('No se puede eliminar', 'Esta trivia no tiene ID válido del backend. Intenta abrirla y guardarla para sincronizar.');
      return;
    }
    setDeletingTrivia(trivia);
    setShowDeleteModal(true);
  };

  const confirmDeleteTrivia = async () => {
    if (!deletingTrivia) return;
    
    try {
      await deleteMutation.mutateAsync(deletingTrivia.id);
      showSuccess('Éxito', 'Trivia eliminada correctamente');
      setShowDeleteModal(false);
      setDeletingTrivia(null);
    } catch (error) {
      showError('Error', 'No se pudo eliminar la trivia');
    }
  };



  const handleEditQuestion = (question: Pregunta & { triviaId: string; triviaNombre: string }) => {
    setSelectedQuestion(question);
    setSelectedTrivia(trivias.find(t => t.id === question.triviaId) || null);
    setShowEditQuestionModal(true);
  };

  const handleSaveQuestion = async (updatedQuestion: Pregunta) => {
    if (!selectedTrivia) return;

    const triviaId = selectedTrivia.id;
    const triviaHasRemoteId = triviaId && !isTemporaryId(triviaId);
    const questionDto = buildQuestionDto(updatedQuestion);

    if (triviaHasRemoteId) {
      try {
        setLoadingDetailId(triviaId);
        const remoteQuestionId =
          (!isTemporaryId(updatedQuestion.remoteId) && updatedQuestion.remoteId) ||
          (!isTemporaryId(updatedQuestion.id) && updatedQuestion.id) ||
          undefined;

        if (remoteQuestionId) {
          await TriviasService.updateQuestion(triviaId, remoteQuestionId, questionDto);
        } else {
          await TriviasService.createQuestion(triviaId, questionDto);
        }

        await refreshTriviaDetail(triviaId);
        await refetchTrivias();
        setShowEditQuestionModal(false);
        setSelectedQuestion(null);
        showSuccess('Éxito', remoteQuestionId ? 'Pregunta actualizada' : 'Pregunta creada');
        return;
      } catch (error) {
        showError('Error', 'No se pudo sincronizar la pregunta. Intentaremos actualizar localmente.');
      } finally {
        setLoadingDetailId(null);
      }
    }

    const updatedPreguntas = selectedTrivia.preguntas.map(p =>
      p.id === updatedQuestion.id ? updatedQuestion : p
    );

    const payload = buildTriviaPayloadForApi(
      {
        nombre: selectedTrivia.nombre,
        categoria: selectedTrivia.categoria,
        dificultad: selectedTrivia.dificultad,
        estado: selectedTrivia.estado,
        duracion: selectedTrivia.duracion,
        tiempoPorPregunta: selectedTrivia.tiempoPorPregunta,
        activacion: selectedTrivia.activacion,
        fechaActivacion: selectedTrivia.fechaActivacion,
        imagen: selectedTrivia.imagen,
      },
      updatedPreguntas
    );

    try {
      const hasFiles = updatedPreguntas.some((p) => p.imagen instanceof File);
      if (hasFiles) {
        const fd = new FormData();
        fd.append('dto', JSON.stringify(payload));
        updatedPreguntas.forEach((p) => {
          if (p.imagen instanceof File) {
            fd.append('question_images', p.imagen);
          }
        });
        await updateMutation.mutateAsync({ id: selectedTrivia.id, data: fd as any });
      } else {
        await updateMutation.mutateAsync({ id: selectedTrivia.id, data: payload });
      }
      setShowEditQuestionModal(false);
      setSelectedQuestion(null);
      setSelectedTrivia(null);
      await refetchTrivias();
      showSuccess('Éxito', 'Pregunta actualizada correctamente');
    } catch (error) {
      showError('Error', 'No se pudo actualizar la pregunta');
    }
  };

  // Eliminadas funciones de control de trivias relacionadas con el seguimiento

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Eliminada utilidad no usada para evitar warnings

  // Eliminada utilidad no usada para evitar warnings

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Gestión de Trivias</h1>
          <p className="mt-1 text-gray-600">
            Administra las trivias y sus preguntas
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
            <button
              onClick={handleCreateTrivia}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Trivia</span>
            </button>
          </div>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200 ">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('trivias')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trivias'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 '
            }`}
          >
            Trivias ({totalItems})
          </button>
          <button
            onClick={() => setActiveTab('preguntas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preguntas'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 '
            }`}
          >
            Preguntas ({filteredQuestions.length})
          </button>
        </nav>
      </div>

      {/* Contenido de Trivias */}
      {activeTab === 'trivias' && (
        <>
          {/* Barra de Búsqueda */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                placeholder="Buscar trivias..."
              />
            </div>
          </div>
          
          {/* Filtros */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-field"
              disabled={loadingCategories}
            >
              <option value="">
                    {loadingCategories ? 'Cargando categorías...' : 'Todas las categorías'}
              </option>
              {categoriesList.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="input-field"
            >
              <option value="">Todas las dificultades</option>
              {dificultades.map(dif => (
                <option key={dif.value} value={dif.value}>{dif.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
            >
              <option value="">Todos los estados</option>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>

          <div>
            <select
              value={scheduledFilter}
              onChange={(e) => setScheduledFilter(e.target.value as 'all' | 'manual' | 'programada')}
                  className="input-field"
            >
              <option value="all">Todas las trivias</option>
              <option value="manual">Manuales</option>
              <option value="programada">Programadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Trivias */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {loadingTrivias ? (
              // Skeleton loader para trivias
              [...Array(6)].map((_, idx) => (
                <div key={`skeleton-trivia-${idx}`} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center p-6">
                    <div className="animate-pulse flex items-start space-x-6 flex-1">
                      {/* Imagen skeleton */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
                      </div>
                      
                      {/* Contenido skeleton */}
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="h-6 bg-gray-200 rounded w-48"></div>
                            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                          </div>
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Info grid */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
                          </div>
                        </div>
                        
                        {/* Info adicional y botones */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-4">
                            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                            <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="h-8 w-20 bg-gray-200 rounded"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            <div className="h-8 w-20 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : currentTrivias.map((trivia) => (
              <div key={trivia.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="flex items-center p-6">
                  {/* Imagen/Icono de la Trivia */}
                  <div className="flex-shrink-0 mr-6">
                    {trivia.imagen ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={trivia.imagen instanceof File ? URL.createObjectURL(trivia.imagen) : trivia.imagen} 
                          alt={trivia.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Contenido Principal */}
                  <div className="flex-1 min-w-0">
                    {/* Header con título y estado */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-gray-900 truncate">{trivia.nombre}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          trivia.estado === 'activa' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trivia.estado === 'activa' && <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>}
                          {trivia.estado === 'activa' ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      {/* Rating con estrellas */}
                      <div className="flex items-center space-x-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (trivia.dificultad === 'facil' ? 2 : trivia.dificultad === 'medio' ? 3 : 5)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-1">
                          {trivia.dificultad === 'facil' ? 'Fácil' : trivia.dificultad === 'medio' ? 'Medio' : 'Difícil'}
                        </span>
                      </div>
                    </div>

                    {/* Información de la trivia */}
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 ">Categoría</p>
                        <p className="font-semibold text-gray-900">{trivia.categoria}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 ">Puntos</p>
                        <p className="font-semibold text-gray-900">{trivia.puntos}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 ">Duración</p>
                        <p className="font-semibold text-gray-900">{trivia.duracion} min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 ">Preguntas</p>
                        <p className="font-semibold text-blue-600">
                          {trivia.totalPreguntas ?? trivia.preguntas.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 ">Tiempo / Pregunta</p>
                        <p className="font-semibold text-gray-900">
                          {trivia.tiempoPorPregunta ? `${trivia.tiempoPorPregunta} seg` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                          trivia.activacion === 'manual' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            trivia.activacion === 'manual' ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="capitalize">{trivia.activacion}</span>
                        </div>
                        
                        {trivia.activacion === 'programada' && trivia.fechaActivacion && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Se activará:</span>
                            <span className="ml-1">
                              {new Date(trivia.fechaActivacion).toLocaleString('es-EC', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'America/Guayaquil'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controles de Acción */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewTrivia(trivia)}
                          disabled={loadingDetailId === trivia.id}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            loadingDetailId === trivia.id
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Visualizar</span>
                        </button>
                        
                        <button
                          onClick={() => handleEditTrivia(trivia)}
                          disabled={loadingDetailId === trivia.id}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            loadingDetailId === trivia.id
                              ? 'bg-blue-300 text-white cursor-not-allowed'
                              : 'text-white bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Editar</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteTrivia(trivia)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Eliminar</span>
                        </button>
                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {currentTrivias.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay trivias</h3>
              <p className="text-gray-500 mb-4">
                 {searchTerm || filterCategory || filterDifficulty || filterStatus || scheduledFilter !== 'all'
                  ? 'No se encontraron trivias con los filtros aplicados.'
                  : 'Comienza creando tu primera trivia.'
                }
              </p>
               {!searchTerm && !filterCategory && !filterDifficulty && !filterStatus && scheduledFilter === 'all' && (
                <button
                  onClick={handleCreateTrivia}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Primera Trivia
                </button>
              )}
            </div>
          )}

          {/* Paginación para trivias */}
          {apiTotalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando página {currentPage} de {apiTotalPages} ({totalItems} trivias en total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span>Anterior</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: apiTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, apiTotalPages))}
                  disabled={currentPage === apiTotalPages}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <span>Siguiente</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Contenido de Preguntas */}
      {activeTab === 'preguntas' && (
        <>
           {/* Filtros para preguntas */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                 <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={questionSearchTerm}
                    onChange={(e) => setQuestionSearchTerm(e.target.value)}
                   className="input-field pl-10"
                   placeholder="Buscar preguntas..."
                  />
              </div>
              
              <div>
                <select
                  value={questionFilterTrivia}
                  onChange={(e) => setQuestionFilterTrivia(e.target.value)}
                   className="input-field"
                >
                  <option value="">Todas las trivias</option>
                  {trivias.map(trivia => (
                    <option key={trivia.id} value={trivia.id}>{trivia.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de preguntas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {loadingTrivias ? (
                  // Skeleton loader para preguntas
                  [...Array(5)].map((_, idx) => (
                    <div key={`skeleton-question-${idx}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="animate-pulse space-y-3">
                          {/* Header con número e icono */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                              <div className="h-5 bg-gray-200 rounded w-32"></div>
                            </div>
                            <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          </div>
                          
                          {/* Pregunta */}
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          </div>
                          
                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="h-3 bg-gray-200 rounded w-40"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : currentQuestions.map((question, index) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  return (
                    <div key={`${question.triviaId}-${question.id}`} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Header de la pregunta */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 :bg-gray-700 transition-colors"
                        onClick={() => toggleQuestionExpansion(question.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900 ">
                                Pregunta {index + 1}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-900 font-medium mb-2">
                              {question.texto}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500 ">
                                <span className="font-medium">Trivia:</span> {question.triviaNombre}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditQuestion(question);
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Editar</span>
                                </button>
                                <ChevronDownIcon 
                                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenido expandible */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50 ">
                          <div className="pt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Opciones de respuesta:</h4>
                            <div className="space-y-2">
                              {question.opciones.map((opcion, opcionIndex) => (
                                <div
                                  key={opcionIndex}
                                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                                    opcionIndex === question.respuestaCorrecta
                                      ? 'bg-green-100 border border-green-200'
                                      : 'bg-white border border-gray-200 '
                                  }`}
                                >
                                  <span className="text-sm font-semibold text-gray-600 w-6">
                                    {String.fromCharCode(65 + opcionIndex)}.
                                  </span>
                                  <span className={`text-sm flex-1 ${
                                    opcion.esCorrecta
                                      ? 'text-green-800 font-medium'
                                      : 'text-gray-700'
                                  }`}>
                                    {opcion.texto}
                                  </span>
                                  {opcion.esCorrecta && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                              ? Correcta
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {currentQuestions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay preguntas</h3>
                  <p className="text-gray-500 mb-4">
                    {questionSearchTerm || questionFilterTrivia
                      ? 'No se encontraron preguntas con los filtros aplicados.'
                      : 'No hay preguntas disponibles. Crea una trivia para agregar preguntas.'
                    }
                  </p>
                </div>
              )}

              {/* Paginación para preguntas */}
              {totalQuestionPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {startQuestionIndex + 1} a {Math.min(endQuestionIndex, filteredQuestions.length)} de {filteredQuestions.length} preguntas
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentQuestionPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentQuestionPage === 1}
                      className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 :bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span>Anterior</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalQuestionPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentQuestionPage(page)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentQuestionPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-50 :bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentQuestionPage(prev => Math.min(prev + 1, totalQuestionPages))}
                      disabled={currentQuestionPage === totalQuestionPages}
                      className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 :bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <span>Siguiente</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modales */}
       <TriviaFormModal
         isOpen={showCreateModal}
         onClose={() => setShowCreateModal(false)}
         onSave={handleSaveTrivia}
         trivia={undefined}
         existingTrivias={trivias}
       />

       <TriviaFormModal
         isOpen={showEditModal}
         onClose={() => setShowEditModal(false)}
         onSave={handleSaveTrivia}
         trivia={selectedTrivia || undefined}
         existingTrivias={trivias}
       />

      <TriviaViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        trivia={selectedTrivia}
      />

      <EditQuestionModal
        isOpen={showEditQuestionModal}
        onClose={() => {
          setShowEditQuestionModal(false);
          setSelectedQuestion(null);
          setSelectedTrivia(null);
        }}
        onSave={handleSaveQuestion}
        pregunta={selectedQuestion}
        triviaId={selectedTrivia?.id || ''}
        triviaNombre={selectedTrivia?.nombre || ''}
      />

      {/* Modal de Participantes */}
      {showParticipantsModal && selectedTrivia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Participantes de: {selectedTrivia.nombre}
                </h3>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="text-gray-400 hover:text-gray-600 :text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {selectedTrivia.seguimiento?.usuariosActivos && selectedTrivia.seguimiento.usuariosActivos.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTrivia.seguimiento.usuariosActivos.map((usuario) => (
                      <div key={usuario.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 ">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
                            {usuario.nombre.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 ">{usuario.nombre}</p>
                            <p className="text-xs text-gray-500 ">{usuario.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{usuario.puntosActuales}</p>
                            <p className="text-xs text-gray-500 ">puntos</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progreso: {usuario.progreso}%</span>
                            <span>
                              {usuario.preguntasRespondidas}/
                              {selectedTrivia.totalPreguntas ?? selectedTrivia.preguntas.length} preguntas
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${usuario.progreso}%` }}
                            ></div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 ">
                            <div>
                              <span className="font-medium">Tiempo:</span> {usuario.tiempoTranscurrido.toFixed(1)} min
                            </div>
                            <div>
                              <span className="font-medium">Restante:</span> {usuario.tiempoRestante.toFixed(1)} min
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Última actividad: {new Date(usuario.ultimaActividad).toLocaleString('es-ES')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 ">No hay participantes activos en esta trivia</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 ">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total participantes: {selectedTrivia.seguimiento?.participantes || 0}
                </div>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingTrivia && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Eliminar Trivia</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que deseas eliminar esta trivia? Esta acción no se puede deshacer.
                  </p>
                  {/* Información de la trivia */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">{deletingTrivia.nombre}</div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Categoría:</span>
                        <span className="font-medium">{deletingTrivia.categoria}</span>
                    </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Preguntas:</span>
                        <span className="font-medium">
                          {deletingTrivia.totalPreguntas ?? deletingTrivia.preguntas.length}
                        </span>
                    </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Estado:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          deletingTrivia.estado === 'activa' 
                          ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {deletingTrivia.estado === 'activa' ? 'Activa' : 'Inactiva'}
                            </span>
                            </div>
                          </div>
                          </div>
                        </div>
                    </div>
              <div className="flex space-x-3 px-4 py-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingTrivia(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteTrivia}
                  disabled={deleteMutation.isPending}
                  className={`flex items-center justify-center text-white font-medium py-2 px-4 rounded-md text-sm flex-1 transition-colors ${
                    deleteMutation.isPending ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar Trivia'
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

export default TriviasPage;


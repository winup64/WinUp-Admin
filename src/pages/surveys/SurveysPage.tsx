import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlusIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, XMarkIcon, PlusCircleIcon, MinusCircleIcon, MagnifyingGlassIcon, FunnelIcon, ChartBarIcon, PhotoIcon } from '@heroicons/react/24/outline';
import SurveysService, { SurveyCreateRequestPayload, SurveyUpdateRequestPayload } from '../../services/surveysService';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  useSurveysList, 
  useCreateSurvey, 
  useUpdateSurvey, 
  useDeleteSurvey 
} from '../../hooks/useSurveys';
import { generateId } from '../../utils';

interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  imageFile?: File | null;
  order?: number;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating';
  options?: QuestionOption[];
  required: boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
  imageUrl?: string | null;
  imageFile?: File | null;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  imageFile?: File | null;
  questions: Question[];
  isActive: boolean;
  status: 'active' | 'inactive';
  pointsEarned?: number | null;
  responses: number;
  created_at?: string;
  updated_at?: string;
}

interface QuestionFormProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onUpdate: (field: keyof Question, value: any) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onUpdateOption: (index: number, field: 'text', value: string) => void;
  onQuestionImageFileChange: (file: File | null) => void;
  onOptionImageFileChange: (index: number, file: File | null) => void;
}

const DEFAULT_RATING_OPTIONS = ['1', '2', '3', '4', '5'];

const formatSurveyDate = (value?: string | null): string => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const withMediaDefaults = (survey: Survey): Survey => ({
  ...survey,
  imageUrl: survey.imageUrl || '',
  imageFile: survey.imageFile ?? null,
  questions: (survey.questions || []).map((question) => ({
    ...question,
    imageUrl: question.imageUrl || '',
    imageFile: question.imageFile ?? null,
    options: Array.isArray(question.options)
      ? question.options.map((option, idx) => {
          if (typeof option === 'string') {
            return {
              id: generateId(),
              text: option,
              imageUrl: '',
              imageFile: null,
              order: idx + 1,
            };
          }
          return {
            ...option,
            id: option.id || generateId(),
            imageUrl: option.imageUrl || '',
            imageFile: option.imageFile ?? null,
            order: option.order ?? idx + 1,
          };
        })
      : [],
  })),
});

interface SurveyImageUploadProps {
  imageUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  label?: string;
}

const SurveyImageUpload: React.FC<SurveyImageUploadProps> = ({
  imageUrl,
  onFileChange,
  onRemove,
  label = 'Imagen de la encuesta',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAreaClick = () => fileInputRef.current?.click();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
    event.target.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Vista previa de la encuesta"
            className="w-full h-48 object-cover rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 bg-white/90 text-danger-600 rounded-full p-1.5 shadow hover:bg-danger-50 transition-colors"
            title="Quitar imagen"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
          onClick={handleAreaClick}
        >
          <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Sube una imagen destacada</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG o GIF · Máx. 5MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <button
          type="button"
          onClick={handleAreaClick}
          className="btn-secondary flex-1"
        >
          {imageUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Quitar imagen
          </button>
        )}
      </div>
    </div>
  );
};

const SurveysPage: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce para el término de búsqueda (500ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetear paginación cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // ✨ React Query hooks - Reemplazan localStorage y carga manual
  const { 
    data: surveysResponse, 
    isLoading: loading, 
    error: surveysError 
  } = useSurveysList({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  // Mutations
  const createMutation = useCreateSurvey();
  const updateMutation = useUpdateSurvey();
  const deleteMutation = useDeleteSurvey();

  // Extraer datos de la respuesta
  const surveys = React.useMemo(() => {
    if (!surveysResponse?.data) return [];
    return surveysResponse.data.map((survey) => withMediaDefaults(SurveysService.mapSurveyFromAPI(survey)));
  }, [surveysResponse]);

  const totalSurveys = surveysResponse?.total || 0;
  const totalPages = Math.ceil(totalSurveys / itemsPerPage);
  const apiTotalPages = totalPages;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const createScrollRef = useRef<HTMLDivElement | null>(null);
  const editScrollRef = useRef<HTMLDivElement | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [isLoadingSurveyDetails, setIsLoadingSurveyDetails] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [newSurvey, setNewSurvey] = useState<Survey>({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    imageFile: null as File | null,
    questions: [] as Question[],
    isActive: true,
    status: 'active' as 'active' | 'inactive',
    pointsEarned: null as number | null,
    responses: 0,
    created_at: undefined as string | undefined,
    updated_at: undefined as string | undefined,
  });

  const handleEditSurvey = async (survey: Survey) => {
    // Abrir modal con datos básicos para feedback inmediato
    setEditingSurvey(survey);
    setShowEditModal(true);
    // Cargar detalles completos (preguntas/opciones) antes de editar
    try {
      setIsLoadingSurveyDetails(true);
      const full = await SurveysService.getSurveyById(survey.id);
      const mapped = SurveysService.mapSurveyFromAPI(full.data as any);
      setEditingSurvey(withMediaDefaults(mapped));
    } catch (e) {
      
    } finally {
      setIsLoadingSurveyDetails(false);
    }
  };

  const handleDeleteSurvey = (survey: Survey) => {
    setDeletingSurvey(survey);
    setShowDeleteModal(true);
  };

  const confirmDeleteSurvey = async () => {
    if (!deletingSurvey) return;
    
    try {
      await deleteMutation.mutateAsync(deletingSurvey.id!);
      showSuccess('Encuesta Eliminada', `${deletingSurvey.title} ha sido eliminada exitosamente`);
      setShowDeleteModal(false);
      setDeletingSurvey(null);
    } catch (error) {
      showError('Error al Eliminar', 'Error al eliminar la encuesta. Por favor, inténtalo de nuevo.');
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const buildSurveySubmissionPayload = (survey: Survey): SurveyCreateRequestPayload => {
    const dto = SurveysService.mapSurveyToAPI(survey);
    const questionImages: Array<File | null> = [];

    survey.questions.forEach((question) => {
      questionImages.push(question.imageFile ?? null);
    });

    return {
      dto,
      media: {
        surveyImage: survey.imageFile ?? null,
        questionImages,
      },
    };
  };

  const handleSurveyImageFileChange = (file: File | null, isEdit: boolean = false) => {
    const preview = file ? URL.createObjectURL(file) : '';
    if (isEdit) {
      setEditingSurvey((prev) => (prev ? { ...prev, imageFile: file, imageUrl: file ? preview : '' } : prev));
    } else {
      setNewSurvey((prev) => ({ ...prev, imageFile: file, imageUrl: file ? preview : '' }));
    }
  };

  const handleRemoveSurveyImage = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditingSurvey((prev) => (prev ? { ...prev, imageFile: null, imageUrl: '' } : prev));
    } else {
      setNewSurvey((prev) => ({ ...prev, imageFile: null, imageUrl: '' }));
    }
  };

  const handleQuestionImageFileChange = (questionId: string, file: File | null, isEdit: boolean = false) => {
    const preview = file ? URL.createObjectURL(file) : '';
    updateQuestionState(questionId, isEdit, (question) => ({
      ...question,
      imageFile: file,
      imageUrl: file ? preview : question.imageUrl,
    }));
  };

  // Las opciones ya no soportan imágenes - esta función se mantiene para compatibilidad pero no hace nada
  const handleOptionImageFileChange = (
    questionId: string,
    optionIndex: number,
    file: File | null,
    isEdit: boolean = false
  ) => {
    // No hacer nada - las opciones ya no soportan imágenes
  };

  const createDefaultOptions = (type: Question['type']): QuestionOption[] => {
    if (type === 'multiple_choice') {
      return [
        { id: generateId(), text: '', imageUrl: null, imageFile: null, order: 1 },
        { id: generateId(), text: '', imageUrl: null, imageFile: null, order: 2 },
      ];
    }
    if (type === 'rating') {
      return DEFAULT_RATING_OPTIONS.map((value, index) => ({
        id: generateId(),
        text: value,
        imageUrl: null,
        imageFile: null,
        order: index + 1,
      }));
    }
    return [];
  };

  const updateQuestionState = (
    questionId: string,
    isEdit: boolean,
    updater: (question: Question) => Question
  ) => {
    if (isEdit) {
      setEditingSurvey((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q.id === questionId ? updater(q) : q)),
        };
      });
    } else {
      setNewSurvey((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === questionId ? updater(q) : q)),
      }));
    }
  };

  const addQuestion = (isEdit: boolean = false) => {
    const currentQuestions = isEdit && editingSurvey ? editingSurvey.questions : newSurvey.questions;
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      type: 'text',
      required: true,
      order: currentQuestions.length + 1,
      options: createDefaultOptions('text'),
      imageUrl: '',
      imageFile: null,
    };

    if (isEdit && editingSurvey) {
      setEditingSurvey({
        ...editingSurvey,
        questions: [...editingSurvey.questions, newQuestion]
      });
    } else {
      setNewSurvey({
        ...newSurvey,
        questions: [...newSurvey.questions, newQuestion]
      });
    }
  };

  const removeQuestion = (questionId: string, isEdit: boolean = false) => {
    if (isEdit && editingSurvey) {
      setEditingSurvey({
        ...editingSurvey,
        questions: editingSurvey.questions.filter(q => q.id !== questionId)
      });
    } else {
      setNewSurvey({
        ...newSurvey,
        questions: newSurvey.questions.filter(q => q.id !== questionId)
      });
    }
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any, isEdit: boolean = false) => {
    // Preservar scroll y foco del contenedor al cambiar el tipo
    const container = isEdit ? editScrollRef.current : createScrollRef.current;
    const prevScrollTop = container?.scrollTop ?? 0;
    const activeElement = document.activeElement as HTMLElement;
    const isSelectFocused = activeElement?.tagName === 'SELECT';

    if (isEdit && editingSurvey) {
      setEditingSurvey({
        ...editingSurvey,
        questions: editingSurvey.questions.map(q => {
          if (q.id !== questionId) return q;
          const updated: Question = { ...q, [field]: value } as Question;
          if (field === 'type') {
            updated.options = createDefaultOptions(value as Question['type']);
          }
          return updated;
        })
      });
    } else {
      setNewSurvey({
        ...newSurvey,
        questions: newSurvey.questions.map(q => {
          if (q.id !== questionId) return q;
          const updated: Question = { ...q, [field]: value } as Question;
          if (field === 'type') {
            updated.options = createDefaultOptions(value as Question['type']);
          }
          return updated;
        })
      });
    }

    // Restaurar scroll y foco después del render usando requestAnimationFrame
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = prevScrollTop;
      }
      
      // Restaurar foco al select si estaba enfocado
      if (isSelectFocused && activeElement) {
        // Buscar el select correspondiente por el ID de la pregunta
        const selectElement = container?.querySelector(`select[data-question-id="${questionId}"]`) as HTMLSelectElement;
        if (selectElement) {
          setTimeout(() => {
            selectElement.focus();
          }, 10);
        }
      }
    });
  };

  const getQuestionById = (questionId: string, isEdit: boolean): Question | undefined => {
    const collection = isEdit ? editingSurvey?.questions : newSurvey.questions;
    return collection?.find((q) => q.id === questionId);
  };

  const normalizeOptionOrders = (options: QuestionOption[]): QuestionOption[] =>
    options.map((opt, index) => ({
      ...opt,
      order: index + 1,
    }));

  const addOption = (questionId: string, isEdit: boolean = false) => {
    const targetQuestion = getQuestionById(questionId, isEdit);
    if (!targetQuestion || targetQuestion.type !== 'multiple_choice') return;

    const currentOptions = Array.isArray(targetQuestion.options) ? targetQuestion.options : [];
    const withNewOption = [
      ...currentOptions,
      { id: generateId(), text: '', imageUrl: null, order: currentOptions.length + 1 },
    ];

    updateQuestionState(questionId, isEdit, (question) => ({
      ...question,
      options: normalizeOptionOrders(withNewOption),
    }));
  };

  const removeOption = (questionId: string, optionIndex: number, isEdit: boolean = false) => {
    const targetQuestion = getQuestionById(questionId, isEdit);
    if (!targetQuestion || targetQuestion.type !== 'multiple_choice') return;
    const currentOptions = Array.isArray(targetQuestion.options) ? targetQuestion.options : [];

    if (currentOptions.length <= 2) {
      showError('Validación', 'Las preguntas de opción múltiple deben tener al menos 2 opciones');
      return;
    }

    const updatedOptions = currentOptions.filter((_, index) => index !== optionIndex);

    updateQuestionState(questionId, isEdit, (question) => ({
      ...question,
      options: normalizeOptionOrders(updatedOptions),
    }));
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    field: 'text',
    value: string,
    isEdit: boolean = false
  ) => {
    const targetQuestion = getQuestionById(questionId, isEdit);
    if (!targetQuestion || targetQuestion.type !== 'multiple_choice') return;
    const currentOptions = Array.isArray(targetQuestion.options) ? targetQuestion.options : [];

    const updatedOptions = currentOptions.map((option, index) => {
      if (index !== optionIndex) return option;
      return {
        ...option,
        text: value, // Solo actualizar el texto, las imágenes ya no se soportan
      };
    });

    updateQuestionState(questionId, isEdit, (question) => ({
      ...question,
      options: normalizeOptionOrders(updatedOptions),
    }));
  };

  // Función de validación con errores por campo
  const validateSurvey = (survey: any, isEdit: boolean = false) => {
    const errors: {[key: string]: string} = {};
    
    if (!survey.title.trim()) {
      errors.title = 'El título es requerido';
    }
    
    if (!survey.description.trim()) {
      errors.description = 'La descripción es requerida';
    }
    
    if (survey.questions.length === 0) {
      errors.questions = 'Debes agregar al menos una pregunta';
    }
    
    survey.questions.forEach((q: Question, index: number) => {
      if (!q.text.trim()) {
        errors[`question_${index}_text`] = 'El texto de la pregunta es requerido';
      }
      
      if (q.type === 'multiple_choice') {
        const options = Array.isArray(q.options) ? q.options : [];
        const validOptions = options.filter((opt) => opt.text && opt.text.trim().length > 0);
        if (validOptions.length < 2) {
          errors[`question_${index}_options`] = 'Debe tener al menos 2 opciones';
        } else if (validOptions.some((opt) => opt.text.trim().length === 0)) {
          errors[`question_${index}_options`] = 'Todas las opciones deben tener texto';
        }
      }

      if (q.type === 'rating') {
        const options = Array.isArray(q.options) && q.options.length > 0
          ? q.options
          : createDefaultOptions('rating');
        const invalidOption = options.some((opt) => Number.isNaN(Number(opt.text)));
        if (invalidOption) {
          errors[`question_${index}_options`] = 'Las opciones de calificación deben ser valores numéricos (por ejemplo 1-5)';
        }
      }
    });
    
    return errors;
  };

  const handleCreateSurvey = async () => {
    setValidationErrors({});
    
    const errors = validateSurvey(newSurvey);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showError('Validación', 'Por favor corrige los errores marcados');
      return;
    }

    try {
      const payload = buildSurveySubmissionPayload(newSurvey);
      await createMutation.mutateAsync(payload);
      
      showSuccess('Encuesta Creada', `${newSurvey.title} ha sido creada exitosamente`);
      setShowCreateModal(false);
      setNewSurvey({ 
        id: '',
        title: '', 
        description: '', 
        imageUrl: '',
        imageFile: null,
        questions: [], 
        isActive: true,
        status: 'active',
        pointsEarned: null,
        responses: 0,
        created_at: undefined,
        updated_at: undefined,
      });
      setValidationErrors({});
    } catch (error) {
      showError('Error al Crear', 'Error al crear la encuesta. Por favor, inténtalo de nuevo.');
    }
  };

  // Componente de input con estado local; propaga solo en blur (sin debounce)
  const OptimizedInput = React.memo(({ 
    value, 
    onChange, 
    placeholder, 
    className = "input-field mt-1",
    type = "text"
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
    type?: string;
  }) => {
    const [localValue, setLocalValue] = useState(value);
    const isFocusedRef = useRef(false);

    // Sincronizar con el estado padre solo cuando cambie externamente y no esté enfocado
    useEffect(() => {
      if (!isFocusedRef.current) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
    };

    const handleFocus = () => {
      isFocusedRef.current = true;
    };

    const handleBlur = () => {
      isFocusedRef.current = false;
      onChange(localValue);
    };

    if (type === "textarea") {
      return (
        <textarea
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={className}
          rows={3}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        type={type}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className}
        placeholder={placeholder}
      />
    );
  });

  // Handlers optimizados para evitar re-renders en inputs principales
  const handleNewSurveyTitleChange = useCallback((value: string) => {
    setNewSurvey(prev => ({ ...prev, title: value }));
    // Limpiar error de validación al escribir
    setValidationErrors(prev => {
      if (prev.title) {
        return { ...prev, title: '' };
      }
      return prev;
    });
  }, []);

  const handleNewSurveyDescriptionChange = useCallback((value: string) => {
    setNewSurvey(prev => ({ ...prev, description: value }));
    // Limpiar error de validación al escribir
    setValidationErrors(prev => {
      if (prev.description) {
        return { ...prev, description: '' };
      }
      return prev;
    });
  }, []);

  const handleEditingSurveyTitleChange = useCallback((value: string) => {
    setEditingSurvey(prev => prev ? ({ ...prev, title: value }) : null);
    // Limpiar error de validación al escribir
    setValidationErrors(prev => {
      if (prev.title) {
        return { ...prev, title: '' };
      }
      return prev;
    });
  }, []);

  const handleEditingSurveyDescriptionChange = useCallback((value: string) => {
    setEditingSurvey(prev => prev ? ({ ...prev, description: value }) : null);
    // Limpiar error de validación al escribir
    setValidationErrors(prev => {
      if (prev.description) {
        return { ...prev, description: '' };
      }
      return prev;
    });
  }, []);

  const handleUpdateSurvey = async () => {
    if (!editingSurvey) return;

    setValidationErrors({});
    
    const normalizedEditing = {
      ...editingSurvey,
      questions: editingSurvey.questions.map((q, index) => ({
        ...q,
        order: q.order ?? index + 1,
        options:
          q.type === 'text'
            ? []
            : Array.isArray(q.options) && q.options.length > 0
              ? q.options
              : createDefaultOptions(q.type),
      })),
    };

    const errors = validateSurvey(normalizedEditing, true);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showError('Validación', 'Por favor corrige los errores marcados');
      return;
    }

    try {
      const payload = buildSurveySubmissionPayload(normalizedEditing) as SurveyUpdateRequestPayload;
      await updateMutation.mutateAsync({ id: normalizedEditing.id!, data: payload });
      
      showSuccess('Encuesta Actualizada', `${editingSurvey.title} ha sido actualizada exitosamente`);
      setShowEditModal(false);
      setEditingSurvey(null);
      setValidationErrors({});
    } catch (error) {
      showError('Error al Actualizar', 'Error al actualizar la encuesta. Por favor, inténtalo de nuevo.');
    }
  };

   // Componente para opción: sin debounce; propaga en blur (sin soporte de imágenes)
  const OptimizedOptionInput = React.memo(
    ({
      value,
      onTextChange,
      placeholder,
      onRemove,
      canRemove = true,
    }: {
      value: string;
      onTextChange: (value: string) => void;
      placeholder: string;
      onRemove: () => void;
      canRemove?: boolean;
    }) => {
      const [localValue, setLocalValue] = useState(value);
      const textFocusedRef = useRef(false);

      // Sincronizar texto
      useEffect(() => {
        if (!textFocusedRef.current) {
          setLocalValue(value);
        }
      }, [value]);

      return (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={() => {
              textFocusedRef.current = true;
            }}
            onBlur={() => {
              textFocusedRef.current = false;
              onTextChange(localValue);
            }}
            className="input-field flex-1 text-sm"
            placeholder={placeholder}
          />
          <button
            onClick={onRemove}
            className={`text-red-500 hover:text-red-700 ${!canRemove ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Eliminar opción"
            type="button"
            disabled={!canRemove}
          >
            <MinusCircleIcon className="h-3 w-3" />
          </button>
        </div>
      );
    }
  );

  const QuestionForm = React.memo(
    ({
      question,
      questionNumber,
      totalQuestions,
      onUpdate,
      onRemove,
      onAddOption,
      onRemoveOption,
      onUpdateOption,
      onQuestionImageFileChange,
      onOptionImageFileChange,
    }: QuestionFormProps) => {
      // Estado local para el texto de la pregunta; propaga en blur
      const [localText, setLocalText] = useState(question.text);
      const isFocusedRef = useRef(false);

      // Sincronizar con el estado padre solo cuando cambie el texto y no esté enfocado
      useEffect(() => {
        if (!isFocusedRef.current && question.text !== localText) {
          setLocalText(question.text);
        }
      }, [question.text]); // eslint-disable-line react-hooks/exhaustive-deps

      // Reinicializar localText cuando cambie la pregunta completa (nueva pregunta)
      useEffect(() => {
        setLocalText(question.text);
      }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

      const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalText(value);
      };

      const handleTextFocus = () => {
        isFocusedRef.current = true;
      };

      const handleTextBlur = () => {
        isFocusedRef.current = false;
        onUpdate('text', localText);
      };

      const normalizedOptions = Array.isArray(question.options) ? question.options : [];
      const isMultipleChoice = question.type === 'multiple_choice';
      const isRating = question.type === 'rating';
      const ratingOptions = isRating
        ? (normalizedOptions.length > 0 ? normalizedOptions : createDefaultOptions('rating'))
        : [];

      return (
        <div className="border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">
          Pregunta {questionNumber} de {Math.max(totalQuestions, questionNumber)}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
          title="Eliminar pregunta"
        >
          <MinusCircleIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-2">
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Texto de la pregunta</label>
           <input
             type="text"
             value={localText}
             onChange={handleTextChange}
            onFocus={handleTextFocus}
            onBlur={handleTextBlur}
             className={`input-field text-sm ${validationErrors[`question_${questionNumber - 1}_text`] ? 'border-red-500' : ''}`}
             placeholder="Escribe tu pregunta aquí"
           />
           {validationErrors[`question_${questionNumber - 1}_text`] && (
             <p className="text-red-500 text-sm mt-1">{validationErrors[`question_${questionNumber - 1}_text`]}</p>
           )}
         </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de la pregunta</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onQuestionImageFileChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            className="text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Sube una imagen para acompañar la pregunta.</p>
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt={`Pregunta ${questionNumber}`}
              className="w-24 h-24 object-cover rounded mt-2 border border-gray-200"
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={question.type}
              onChange={(e) => onUpdate('type', e.target.value)}
              onFocus={(e) => {
                // Preservar referencia del select enfocado
                e.currentTarget.setAttribute('data-focused', 'true');
              }}
              onBlur={(e) => {
                e.currentTarget.removeAttribute('data-focused');
              }}
              data-question-id={question.id}
              className="input-field text-sm"
            >
              <option value="text">Texto libre</option>
              <option value="multiple_choice">Opción múltiple</option>
              <option value="rating">Calificación</option>
            </select>
          </div>
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              id={`required-${question.id}`}
              checked={question.required}
              onChange={(e) => onUpdate('required', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor={`required-${question.id}`} className="ml-2 block text-sm text-gray-700">
              Obligatoria
            </label>
          </div>
        </div>

        {isMultipleChoice && (
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Opciones</label>
             <div className="space-y-1">
             {normalizedOptions.map((option, index) => (
                 <OptimizedOptionInput
                  key={option.id || `${question.id}-opt-${index}`}
                  value={option.text}
                  onTextChange={(value) => onUpdateOption(index, 'text', value)}
                   placeholder={`Opción ${index + 1}`}
                   onRemove={() => onRemoveOption(index)}
                  canRemove={normalizedOptions.length > 2}
                 />
               ))}
              {validationErrors[`question_${questionNumber - 1}_options`] && (
                <p className="text-red-500 text-sm mt-1">{validationErrors[`question_${questionNumber - 1}_options`]}</p>
              )}
               <button
                type="button"
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   onAddOption();
                 }}
                 className="btn-secondary text-xs flex items-center"
               >
                 <PlusCircleIcon className="h-3 w-3 mr-1" />
                 Agregar Opción
               </button>
             </div>
           </div>
         )}

        {isRating && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escala de calificación (automática)
            </label>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((option, index) => (
                <span
                  key={`${question.id}-rating-${index}`}
                  className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold"
                >
                  {option.text}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Esta escala (1-5) se utiliza para calcular el promedio automáticamente.
            </p>
            {validationErrors[`question_${questionNumber - 1}_options`] && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors[`question_${questionNumber - 1}_options`]}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
      );
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Gestión de Encuestas</h1>
          <p className="text-gray-600">Administra las encuestas de la aplicación</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Encuesta
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar encuestas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={clearFilters}
              className="btn-secondary flex items-center w-full justify-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={`skeleton-survey-${idx}`} className="card p-6">
              <div className="animate-pulse space-y-4">
                {/* Header con icono + título skeleton */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
                
                {/* Info (Preguntas y Fecha) skeleton */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                
                {/* Badge + Botones skeleton */}
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : surveys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            return null;
          })()}
          {surveys.map((survey) => {
            // Primero intentar obtener el conteo del array de preguntas
            const questionsArrayLength = Array.isArray(survey.questions) ? survey.questions.length : 0;
            
            // Si el array tiene preguntas, usar ese conteo
            // Si no, buscar en las propiedades de conteo que vienen del API
            const fallbackCount =
              (survey as any)?.questions_count ??
              (survey as any)?.total_questions ??
              (survey as any)?.questionCount ??
              (survey as any)?.totalQuestions ??
              (survey as any)?._count?.questions ??
              0;
            
            // Usar el conteo del array si tiene elementos, sino usar el fallback del API
            const questionCount = questionsArrayLength > 0 ? questionsArrayLength : fallbackCount;
            return (
              <div key={survey.id} className="card p-6">
              {survey.imageUrl ? (
                <div className="mb-4">
                  <img
                    src={survey.imageUrl}
                    alt={survey.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="mb-4 w-full h-32 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center border border-dashed border-primary-200">
                  <ClipboardDocumentListIcon className="h-10 w-10 text-primary-500" />
                </div>
              )}
              <div className="flex items-center mb-4">
                <ClipboardDocumentListIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                  <p className="text-sm text-gray-500">
                    {survey.description || 'Sin descripción registrada.'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Preguntas:</span>
                  <span className="text-sm font-medium text-gray-900">{questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Actualizada:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatSurveyDate(survey.updated_at || survey.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Puntos:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {survey.pointsEarned ? `+${survey.pointsEarned}` : 'Sin puntos'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className={`badge ${survey.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {survey.status === 'active' ? 'Activa' : 'Inactiva'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => (window.location.href = `/surveys/${survey.id}?tab=analisis`)}
                    className="text-primary-600 hover:text-primary-900 text-sm flex items-center"
                    title="Ver análisis"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    Análisis
                  </button>
                  <button
                    onClick={() => handleEditSurvey(survey)}
                    className="text-warning-600 hover:text-warning-900 text-sm flex items-center"
                    title="Editar encuesta"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteSurvey(survey)}
                    className="text-danger-600 hover:text-danger-900 text-sm flex items-center"
                    title="Eliminar encuesta"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay encuestas</h3>
            <p className="text-gray-500 mb-4">
              {debouncedSearchTerm || statusFilter !== 'all'
                ? 'No se encontraron encuestas con los filtros aplicados.'
                : 'Comienza creando tu primera encuesta.'}
            </p>
            {!debouncedSearchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Primera Encuesta
              </button>
            )}
          </div>
        </div>
      )}

      {/* Paginación */}
      {!loading && apiTotalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {/* Números de página */}
          <div className="flex space-x-1">
            {Array.from({ length: apiTotalPages }, (_, i) => i + 1).map((page) => {
              // Mostrar solo algunas páginas para evitar sobrecarga
              if (
                page === 1 || 
                page === apiTotalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 '
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 || 
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 py-2 text-gray-500 ">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(apiTotalPages, currentPage + 1))}
            disabled={currentPage === apiTotalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de creación de encuesta */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Crear Nueva Encuesta</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto" ref={createScrollRef}>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Título de la Encuesta</label>
                   <OptimizedInput
                     value={newSurvey.title}
                     onChange={handleNewSurveyTitleChange}
                     placeholder="Ej: Satisfacción del Usuario"
                     className={`input-field mt-1 ${validationErrors.title ? 'border-red-500' : ''}`}
                   />
                   {validationErrors.title && (
                     <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                   )}
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Descripción</label>
                   <OptimizedInput
                     value={newSurvey.description}
                     onChange={handleNewSurveyDescriptionChange}
                     placeholder="Descripción de la encuesta"
                     className={`input-field mt-1 ${validationErrors.description ? 'border-red-500' : ''}`}
                     type="textarea"
                   />
                   {validationErrors.description && (
                     <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                   )}
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Puntos Ganados</label>
                  <input
                    type="number"
                    min="0"
                    value={newSurvey.pointsEarned !== null && newSurvey.pointsEarned !== undefined ? newSurvey.pointsEarned : ''}
                    onChange={(e) => setNewSurvey({ ...newSurvey, pointsEarned: e.target.value ? Number(e.target.value) : null })}
                    className="input-field mt-1"
                    placeholder="Ej: 100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Puntos que ganará el usuario al completar la encuesta</p>
                </div>
                <div>
                  <SurveyImageUpload
                    imageUrl={newSurvey.imageUrl || ''}
                    onFileChange={(file) => handleSurveyImageFileChange(file, false)}
                    onRemove={() => handleRemoveSurveyImage(false)}
                    label="Imagen destacada de la encuesta"
                  />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Estado</label>
                   <div className="mt-1">
                     <label className="inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         checked={newSurvey.status === 'active'}
                         onChange={(e) => setNewSurvey({ ...newSurvey, status: e.target.checked ? 'active' : 'inactive', isActive: e.target.checked })}
                         className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700">
                         {newSurvey.status === 'active' ? 'Activa' : 'Inactiva'}
                       </span>
                     </label>
                   </div>
                 </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Preguntas</label>
                    <button
                      type="button"
                      onClick={() => addQuestion(false)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      Agregar Pregunta
                    </button>
                  </div>
                  {validationErrors.questions && (
                    <p className="text-red-500 text-sm mb-2">{validationErrors.questions}</p>
                  )}
                  
                  {newSurvey.questions.map((question, index) => (
                    <QuestionForm
                      key={question.id}
                      question={question}
                      questionNumber={index + 1}
                      totalQuestions={newSurvey.questions.length}
                      onUpdate={(field, value) => updateQuestion(question.id, field, value, false)}
                      onRemove={() => removeQuestion(question.id, false)}
                      onAddOption={() => addOption(question.id, false)}
                      onRemoveOption={(idx) => removeOption(question.id, idx, false)}
                      onUpdateOption={(idx, field, value) =>
                        updateOption(question.id, idx, field, value, false)
                      }
                      onQuestionImageFileChange={(file) =>
                        handleQuestionImageFileChange(question.id, file, false)
                      }
                      onOptionImageFileChange={(idx, file) =>
                        handleOptionImageFileChange(question.id, idx, file, false)
                      }
                    />
                  ))}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateSurvey}
                    className="btn-primary flex items-center justify-center flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando...
                      </>
                    ) : (
                      'Crear Encuesta'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de encuesta */}
      {showEditModal && editingSurvey && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Encuesta</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto" ref={editScrollRef}>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Título de la Encuesta</label>
                   <OptimizedInput
                     value={editingSurvey.title}
                     onChange={handleEditingSurveyTitleChange}
                     placeholder="Título de la encuesta"
                     className="input-field mt-1"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Descripción</label>
                   <OptimizedInput
                     value={editingSurvey.description}
                     onChange={handleEditingSurveyDescriptionChange}
                     placeholder="Descripción de la encuesta"
                     className="input-field mt-1"
                     type="textarea"
                   />
                 </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Puntos Ganados</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSurvey.pointsEarned !== null && editingSurvey.pointsEarned !== undefined ? editingSurvey.pointsEarned : ''}
                    onChange={(e) => setEditingSurvey({ ...editingSurvey, pointsEarned: e.target.value ? Number(e.target.value) : null })}
                    className="input-field mt-1"
                    placeholder="Ej: 100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Puntos que ganará el usuario al completar la encuesta</p>
                </div>
                <div>
                  <SurveyImageUpload
                    imageUrl={editingSurvey.imageUrl || ''}
                    onFileChange={(file) => handleSurveyImageFileChange(file, true)}
                    onRemove={() => handleRemoveSurveyImage(true)}
                    label="Imagen destacada de la encuesta"
                  />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Estado</label>
                   <div className="mt-1">
                     <label className="inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editingSurvey.status === 'active'}
                         onChange={(e) => setEditingSurvey({ ...editingSurvey, status: e.target.checked ? 'active' : 'inactive', isActive: e.target.checked })}
                         className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700">
                         {editingSurvey.status === 'active' ? 'Activa' : 'Inactiva'}
                       </span>
                     </label>
                   </div>
                 </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Preguntas</label>
                    <button
                      type="button"
                      onClick={() => addQuestion(true)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      Agregar Pregunta
                    </button>
                  </div>
                  
                  {editingSurvey.questions.map((question, index) => (
                    <QuestionForm
                      key={question.id}
                      question={question}
                      questionNumber={index + 1}
                      totalQuestions={editingSurvey.questions.length}
                      onUpdate={(field, value) => updateQuestion(question.id, field, value, true)}
                      onRemove={() => removeQuestion(question.id, true)}
                      onAddOption={() => addOption(question.id, true)}
                      onRemoveOption={(idx) => removeOption(question.id, idx, true)}
                      onUpdateOption={(idx, field, value) =>
                        updateOption(question.id, idx, field, value, true)
                      }
                      onQuestionImageFileChange={(file) =>
                        handleQuestionImageFileChange(question.id, file, true)
                      }
                      onOptionImageFileChange={(idx, file) =>
                        handleOptionImageFileChange(question.id, idx, file, true)
                      }
                    />
                  ))}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateSurvey}
                    className="btn-primary flex items-center justify-center flex-1"
                    disabled={updateMutation.isPending || isLoadingSurveyDetails}
                  >
                    {updateMutation.isPending || isLoadingSurveyDetails ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isLoadingSurveyDetails ? 'Cargando...' : 'Actualizando...'}
                      </>
                    ) : (
                      'Actualizar'
                    )}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingSurvey && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Eliminar Encuesta?
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que quieres eliminar esta encuesta? Esta acción no se puede deshacer.
                  </p>
                  
                  {/* Información de la encuesta a eliminar */}
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shrink-0 flex-none">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 ">
                          {deletingSurvey.title}
                        </div>
                        <div className="text-sm text-gray-500 ">{deletingSurvey.description}</div>
                        <div className="text-xs text-gray-400">
                          {deletingSurvey.questions.length} preguntas • {deletingSurvey.responses} respuestas
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 px-4 py-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingSurvey(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSurvey}
                  disabled={deleteMutation.isPending}
                  className={`flex items-center justify-center text-white font-medium py-2 px-4 rounded-md text-sm flex-1 transition-colors ${
                    deleteMutation.isPending 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
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
                    'Eliminar'
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

export default SurveysPage;

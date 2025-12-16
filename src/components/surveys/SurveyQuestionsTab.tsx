import React from 'react';
import { 
  QuestionMarkCircleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

interface Survey {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  questions: any[];
  isActive: boolean;
  status: 'active' | 'inactive';
  pointsEarned?: number | null;
  responses: number;
  created_at?: string;
  updated_at?: string;
}

interface SurveyQuestionsTabProps {
  survey: Survey;
}

const DEFAULT_RATING_OPTIONS = ['1', '2', '3', '4', '5'];

const SurveyQuestionsTab: React.FC<SurveyQuestionsTabProps> = ({ survey }) => {
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return ClipboardDocumentListIcon;
      case 'multiple_choice':
        return CheckCircleIcon;
      case 'rating':
        return QuestionMarkCircleIcon;
      default:
        return QuestionMarkCircleIcon;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Texto Libre';
      case 'multiple_choice':
        return 'Opción Múltiple';
      case 'rating':
        return 'Calificación';
      default:
        return 'Desconocido';
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'text-blue-600 bg-blue-50';
      case 'multiple_choice':
        return 'text-green-600 bg-green-50';
      case 'rating':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (survey.questions.length === 0) {
    return (
      <div className="text-center py-12">
        <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay preguntas</h3>
        <p className="mt-1 text-sm text-gray-500">Esta encuesta no tiene preguntas configuradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Preguntas de la Encuesta</h3>
          <p className="text-sm text-gray-500">
            {survey.questions.length} pregunta{survey.questions.length !== 1 ? 's' : ''} configurada{survey.questions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {survey.questions.map((question, index) => {
          const Icon = getQuestionTypeIcon(question.type);
          const typeLabel = getQuestionTypeLabel(question.type);
          const typeColor = getQuestionTypeColor(question.type);
          const questionImage = question.imageUrl || (question as any).image_url || null;
          const normalizedOptions = Array.isArray(question.options) ? question.options : [];

          return (
            <div key={question.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      Pregunta {index + 1}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {typeLabel}
                    </span>
                    {question.required && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Obligatoria
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    {question.text}
                  </h4>
                  {questionImage && (
                    <div className="mb-3">
                      <img
                        src={questionImage}
                        alt={`Pregunta ${index + 1}`}
                        className="w-full max-w-sm rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Opciones para preguntas de opción múltiple */}
                  {question.type === 'multiple_choice' && normalizedOptions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Opciones:</p>
                      <ul className="space-y-1">
                        {normalizedOptions.map((option: any, optionIndex: number) => {
                          const optionText = typeof option === 'string' ? option : option.text;
                          const optionImage = typeof option === 'object'
                            ? (option.imageUrl || option.image_url || null)
                            : null;

                          return (
                            <li key={optionIndex} className="flex items-center text-sm text-gray-600 space-x-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mr-2">
                              {optionIndex + 1}
                            </span>
                            <span>{optionText}</span>
                            {optionImage && (
                              <img
                                src={optionImage}
                                alt={`Opción ${optionIndex + 1}`}
                                className="w-10 h-10 rounded border border-gray-200 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Información adicional para rating */}
                  {question.type === 'rating' && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Escala de calificación</p>
                      <div className="flex flex-wrap gap-2">
                        {(normalizedOptions.length > 0 ? normalizedOptions : DEFAULT_RATING_OPTIONS).map(
                          (option: any, idx: number) => {
                            const label = typeof option === 'string' ? option : option.text;
                            return (
                              <span
                                key={`${question.id}-rating-${idx}`}
                                className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold"
                              >
                                {label}
                              </span>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="card p-6 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen de Preguntas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {survey.questions.filter(q => q.type === 'text').length}
            </p>
            <p className="text-sm text-gray-500">Texto Libre</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {survey.questions.filter(q => q.type === 'multiple_choice').length}
            </p>
            <p className="text-sm text-gray-500">Opción Múltiple</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {survey.questions.filter(q => q.type === 'rating').length}
            </p>
            <p className="text-sm text-gray-500">Calificación</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyQuestionsTab;

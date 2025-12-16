import React from 'react';
import { XMarkIcon, UserIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { SurveyResponse } from '../../services/surveysService';

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: any[];
  isActive: boolean;
  status: 'active' | 'inactive';
  pointsEarned?: number | null;
  responses: number;
  created_at?: string;
  updated_at?: string;
}

interface ResponseDetailModalProps {
  response: SurveyResponse;
  survey: Survey;
  onClose: () => void;
}

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({ 
  response, 
  survey, 
  onClose 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionById = (questionId: string) => {
    return survey.questions.find(q => q.id === questionId);
  };

  const getAnswerForQuestion = (questionId: string) => {
    const answer = response.answers.find(a => a.questionId === questionId);
    return answer ? answer.answer : 'Sin respuesta';
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'multiple_choice':
        return '☑️';
      case 'rating':
        return '⭐';
      default:
        return '❓';
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Detalle de Respuesta
              </h3>
              <p className="text-sm text-gray-500">
                Respuesta de {response.userName} para "{survey.title}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Información del usuario */}
          <div className="card p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">
                  {response.userName}
                </h4>
                {response.userEmail && (
                  <p className="text-sm text-gray-500">{response.userEmail}</p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(response.completedAt)}
                </div>
                <div className="flex items-center">
                  {response.isCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Completada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Incompleta
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Respuestas por pregunta */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Respuestas por Pregunta
            </h4>
            
            {survey.questions.map((question, index) => {
              const answer = getAnswerForQuestion(question.id);
              const typeIcon = getQuestionTypeIcon(question.type);
              const typeLabel = getQuestionTypeLabel(question.type);

              return (
                <div key={question.id} className="card p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{typeIcon}</span>
                        <span className="text-sm font-medium text-gray-500">
                          {typeLabel}
                        </span>
                        {question.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Obligatoria
                          </span>
                        )}
                      </div>
                      
                      <h5 className="text-base font-medium text-gray-900 mb-3">
                        {question.text}
                      </h5>

                      {/* Mostrar opciones para preguntas de opción múltiple */}
                      {question.type === 'multiple_choice' && question.options && question.options.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Opciones disponibles:</p>
                          <div className="grid grid-cols-1 gap-1">
                            {question.options.map((option: string, optionIndex: number) => (
                              <div key={optionIndex} className="flex items-center text-sm">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mr-2">
                                  {optionIndex + 1}
                                </span>
                                <span className={answer === option ? 'font-medium text-primary-600' : 'text-gray-600'}>
                                  {option}
                                </span>
                                {answer === option && (
                                  <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Respuesta del usuario */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Respuesta:</p>
                        <p className="text-sm text-gray-900">
                          {answer === 'Sin respuesta' ? (
                            <span className="text-gray-500 italic">No respondida</span>
                          ) : (
                            answer
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailModal;

import React from 'react';
import { ClipboardDocumentListIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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

interface SurveyInfoTabProps {
  survey: Survey;
}

const SurveyInfoTab: React.FC<SurveyInfoTabProps> = ({ survey }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionTypeCount = () => {
    const counts = {
      text: 0,
      multiple_choice: 0,
      rating: 0
    };

    survey.questions.forEach(question => {
      if (question.type === 'text') counts.text++;
      else if (question.type === 'multiple_choice') counts.multiple_choice++;
      else if (question.type === 'rating') counts.rating++;
    });

    return counts;
  };

  const questionTypeCount = getQuestionTypeCount();

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            {survey.imageUrl ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={survey.imageUrl}
                  alt={survey.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-semibold">
                {survey.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <p className="text-sm text-gray-900">{survey.title}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <span className={`badge ${survey.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {survey.status === 'active' ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          {survey.pointsEarned && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puntos Ganados</label>
              <p className="text-sm font-semibold text-primary-600">+{survey.pointsEarned} puntos</p>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <p className="text-sm text-gray-900">{survey.description || 'Sin descripción'}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Preguntas</p>
              <p className="text-2xl font-semibold text-gray-900">{survey.questions.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Respuestas</p>
              <p className="text-2xl font-semibold text-gray-900">{survey.responses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
              <p className="text-sm text-gray-900">{formatDate(survey.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de preguntas por tipo */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Preguntas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Texto Libre</p>
                <p className="text-2xl font-bold text-blue-600">{questionTypeCount.text}</p>
              </div>
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Opción Múltiple</p>
                <p className="text-2xl font-bold text-green-600">{questionTypeCount.multiple_choice}</p>
              </div>
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Calificación</p>
                <p className="text-2xl font-bold text-purple-600">{questionTypeCount.rating}</p>
              </div>
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyInfoTab;

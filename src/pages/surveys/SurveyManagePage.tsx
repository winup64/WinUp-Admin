import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import SurveysService from '../../services/surveysService';
import { useNotifications } from '../../contexts/NotificationContext';

// Componentes de tabs
import SurveyInfoTab from '../../components/surveys/SurveyInfoTab';
import SurveyAnalyticsTab from '../../components/surveys/SurveyAnalyticsTab';
import SurveyQuestionsTab from '../../components/surveys/SurveyQuestionsTab';

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

const SurveyManagePage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useNotifications();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informacion');

  // Obtener tab activo de la URL
  useEffect(() => {
    const tab = searchParams.get('tab') || 'informacion';
    setActiveTab(tab);
  }, [searchParams]);

  // Cargar datos de la encuesta
  useEffect(() => {
    if (surveyId) {
      loadSurveyData();
    }
  }, [surveyId]);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      const response = await SurveysService.getSurveyById(surveyId!);
      const mappedSurvey = SurveysService.mapSurveyFromAPI(response.data as any);
      setSurvey(mappedSurvey);
    } catch (error) {
      showError('Error al Cargar', 'Error al cargar los datos de la encuesta');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'informacion', name: 'Información', icon: ClipboardDocumentListIcon },
    { id: 'analisis', name: 'Análisis', icon: ClipboardDocumentListIcon },
    { id: 'preguntas', name: 'Preguntas', icon: ClipboardDocumentListIcon },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Cargando encuesta...</span>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Encuesta no encontrada</p>
        <button
          onClick={() => navigate('/surveys')}
          className="btn-primary mt-4"
        >
          Volver a Encuestas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/surveys')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <p className="text-gray-600">{survey.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`badge ${survey.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
            {survey.status === 'active' ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'informacion' && <SurveyInfoTab survey={survey} />}
        {activeTab === 'analisis' && <SurveyAnalyticsTab survey={survey} />}
        {activeTab === 'preguntas' && <SurveyQuestionsTab survey={survey} />}
      </div>
    </div>
  );
};

export default SurveyManagePage;

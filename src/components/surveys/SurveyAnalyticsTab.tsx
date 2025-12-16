import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import SurveysService from '../../services/surveysService';
import { useNotifications } from '../../contexts/NotificationContext';

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: any[];
}

interface SurveyAnalyticsTabProps {
  survey: Survey;
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  questionType: 'text' | 'multiple_choice' | 'rating';
  totalAnswers: number;
  distribution?: { [key: string]: number };
  average?: number;
  wordFrequency?: Array<{ text: string; count: number }>;
}

interface AnalyticsData {
  totalResponses: number;
  completedResponses: number;
  incompleteResponses: number;
  questionStats: QuestionStat[];
}

const SurveyAnalyticsTab: React.FC<SurveyAnalyticsTabProps> = ({ survey }) => {
  const { showError, showSuccess } = useNotifications();
  const [selectedChart, setSelectedChart] = useState<{ [key: string]: 'bar' | 'pie' }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [survey.id, currentPage]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await SurveysService.getSurveyAnalyticsPaginated(survey.id, {
        page: currentPage,
        limit: 10
      });

      setAnalytics(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      showError('Error al Cargar', 'Error al cargar el análisis de la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const completionRate = analytics && analytics.totalResponses > 0
    ? ((analytics.completedResponses / analytics.totalResponses) * 100).toFixed(1)
    : '0.0';

  const toggleChart = (questionId: string) => {
    setSelectedChart(prev => ({
      ...prev,
      [questionId]: prev[questionId] === 'bar' ? 'pie' : 'bar'
    }));
  };

  const getChartType = (questionId: string): 'bar' | 'pie' => {
    return selectedChart[questionId] || 'bar';
  };

  const handleExport = async (type: 'excel' | 'csv') => {
    try {
      const blob = await SurveysService.exportSurveyAnalytics(survey.id, type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-${survey.id}-analytics.${type === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Éxito', `Archivo ${type.toUpperCase()} descargado correctamente`);
    } catch (error) {
      showError('Error', `No se pudo exportar a ${type.toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Cargando análisis...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar el análisis</p>
        <button onClick={loadAnalytics} className="btn-primary mt-4">
          Reintentar
        </button>
      </div>
    );
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
            Resumen General
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="btn-primary flex items-center text-sm"
              title="Exportar a Excel"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary flex items-center text-sm"
              title="Exportar a CSV"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Total Respuestas</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Completas</p>
                <p className="text-2xl font-bold text-green-600">{analytics.completedResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 rounded-full p-3">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">Incompletas</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.incompleteResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-3">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Tasa Completado</p>
                <p className="text-2xl font-bold text-purple-600">{completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis por Pregunta */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Análisis por Pregunta</h3>
        
        {analytics.questionStats.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500">No hay preguntas analizadas en esta página</p>
          </div>
        ) : (
          analytics.questionStats.map((stat: QuestionStat, index: number) => {
            const chartType = getChartType(stat.questionId);

            return (
              <div key={stat.questionId} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                        {((currentPage - 1) * 10) + index + 1}
                      </span>
                      <span className="text-lg font-medium text-gray-900">{stat.questionText}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        Tipo: <span className="font-medium">
                          {stat.questionType === 'text' && '📝 Texto Libre'}
                          {stat.questionType === 'multiple_choice' && '☑️ Opción Múltiple'}
                          {stat.questionType === 'rating' && '⭐ Calificación'}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Total respuestas: <span className="font-medium">{stat.totalAnswers}</span>
                      </span>
                      {stat.average !== undefined && (
                        <>
                          <span>•</span>
                          <span>
                            Promedio: <span className="font-medium text-yellow-600">
                              {stat.average.toFixed(1)} ⭐
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Toggle entre gráficos */}
                  {stat.distribution && (
                    <button
                      onClick={() => toggleChart(stat.questionId)}
                      className="btn-secondary text-sm"
                    >
                      {chartType === 'bar' ? '🥧 Ver Pastel' : '📊 Ver Barras'}
                    </button>
                  )}
                </div>

                {/* Gráfico de Barras */}
                {stat.distribution && chartType === 'bar' && (
                  <div className="mt-6 space-y-3">
                    {Object.entries(stat.distribution).map(([option, count], idx) => {
                      const percentage = ((Number(count) / stat.totalAnswers) * 100).toFixed(1);
                      const width = `${percentage}%`;
                      return (
                        <div key={option}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{option}</span>
                            <span className="text-gray-500">{Number(count)} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-6">
                            <div
                              className="h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-semibold transition-all duration-500"
                              style={{ 
                                width: width,
                                backgroundColor: colors[idx % colors.length]
                              }}
                            >
                              {parseFloat(percentage) > 10 && `${percentage}%`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Gráfico de Pastel */}
                {stat.distribution && chartType === 'pie' && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(stat.distribution).map(([option, count], idx) => {
                        const percentage = ((Number(count) / stat.totalAnswers) * 100).toFixed(1);
                        return (
                          <div key={option} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colors[idx % colors.length] }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{option}</p>
                              <p className="text-xs text-gray-500">{Number(count)} respuestas ({percentage}%)</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Nube de palabras para texto libre */}
                {stat.questionType === 'text' && stat.wordFrequency && stat.wordFrequency.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Palabras más comunes:</h4>
                    
                    {/* Nube de palabras visual */}
                    <div className="bg-gray-50 rounded-lg p-6 min-h-[150px] flex flex-wrap items-center justify-center gap-3">
                      {stat.wordFrequency?.map((word: { text: string; count: number }, idx: number) => {
                        const wordFreq = stat.wordFrequency || [];
                        const maxCount = wordFreq[0]?.count || 1;
                        const minCount = wordFreq[wordFreq.length - 1]?.count || 1;
                        const normalized = (word.count - minCount) / (maxCount - minCount || 1);
                        const fontSize = 14 + (22 * normalized);
                        
                        return (
                          <span
                            key={word.text}
                            className="font-semibold transition-all hover:scale-110 cursor-default"
                            style={{ 
                              fontSize: `${fontSize}px`,
                              color: colors[idx % colors.length]
                            }}
                            title={`${word.text}: ${word.count} menciones`}
                          >
                            {word.text}
                          </span>
                        );
                      })}
                    </div>
                    
                    {/* Top 10 palabras en lista */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {stat.wordFrequency?.slice(0, 10).map((word: { text: string; count: number }, idx: number) => (
                        <div key={word.text} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {idx + 1}. {word.text}
                          </span>
                          <span className="text-sm text-gray-500">{word.count} veces</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje si no hay suficientes datos de texto */}
                {stat.questionType === 'text' && (!stat.wordFrequency || stat.wordFrequency.length === 0) && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      No hay suficientes respuestas de texto para generar análisis
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                  <span key={page} className="px-2 py-2 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Mensaje si no hay respuestas */}
      {analytics.totalResponses === 0 && (
        <div className="card p-12 text-center">
          <div className="text-gray-400 mb-4">
            <ChartBarIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay respuestas aún</h3>
          <p className="text-gray-500">
            Cuando los usuarios comiencen a responder esta encuesta, aquí verás el análisis detallado.
          </p>
        </div>
      )}
    </div>
  );
};

export default SurveyAnalyticsTab;


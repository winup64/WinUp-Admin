import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import SurveysService, { SurveyResponse } from '../../services/surveysService';
import { useNotifications } from '../../contexts/NotificationContext';
import ResponseDetailModal from './ResponseDetailModal';

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

interface SurveyResponsesTabProps {
  survey: Survey;
}

const SurveyResponsesTab: React.FC<SurveyResponsesTabProps> = ({ survey }) => {
  const { showError } = useNotifications();
  
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    from: '',
    to: '',
    isCompleted: undefined as boolean | undefined,
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadResponses();
  }, [currentPage, filters]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const response = await SurveysService.getSurveyResponses(survey.id, {
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        isCompleted: filters.isCompleted,
      });

      setResponses(response.data);
      setTotalResponses(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      showError('Error al Cargar', 'Error al cargar las respuestas de la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      from: '',
      to: '',
      isCompleted: undefined,
    });
    setCurrentPage(1);
  };

  const handleViewResponse = async (response: SurveyResponse) => {
    try {
      const detailResponse = await SurveysService.getSurveyResponseById(survey.id, response.id);
      setSelectedResponse(detailResponse.data);
      setShowDetailModal(true);
    } catch (error) {
      showError('Error al Cargar', 'Error al cargar el detalle de la respuesta');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isCompleted: boolean) => {
    return isCompleted ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Completada
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Incompleta
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Respuestas de la Encuesta</h3>
          <p className="text-sm text-gray-500">
            {totalResponses} respuesta{totalResponses !== 1 ? 's' : ''} total{totalResponses !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar usuario
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input-field pl-10"
                  placeholder="Nombre o email..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.isCompleted === undefined ? '' : filters.isCompleted.toString()}
                onChange={(e) => handleFilterChange('isCompleted', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="true">Completadas</option>
                <option value="false">Incompletas</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="btn-secondary mr-2"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de respuestas */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Cargando respuestas...</span>
        </div>
      ) : responses.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay respuestas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Aún no hay respuestas para esta encuesta.
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {response.userName}
                          </div>
                          {response.userEmail && (
                            <div className="text-sm text-gray-500">
                              {response.userEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(response.completedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(response.isCompleted)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewResponse(response)}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
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
        </>
      )}

      {/* Modal de detalle de respuesta */}
      {showDetailModal && selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          survey={survey}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedResponse(null);
          }}
        />
      )}
    </div>
  );
};

export default SurveyResponsesTab;

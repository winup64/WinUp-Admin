import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Trivia, Pregunta } from '../../types';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Pregunta[]) => void;
  existingTrivias: Trivia[];
  currentTriviaCategory?: string;
}

const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingTrivias,
  currentTriviaCategory
}) => {
  const { showSuccess, showError } = useNotifications();
  const [searchTrivia, setSearchTrivia] = useState('');
  const [searchQuestion, setSearchQuestion] = useState('');
  const [selectedTrivia, setSelectedTrivia] = useState<Trivia | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [importAll, setImportAll] = useState(false);

  // Lista de categorías no utilizada eliminada para evitar warnings

  // Filtrar trivias por búsqueda y categoría
  const filteredTrivias = existingTrivias.filter(trivia => {
    // Solo mostrar trivias de la misma categoría
    const matchesCategory = !currentTriviaCategory || trivia.categoria === currentTriviaCategory;
    
    // Filtrar por búsqueda
    const matchesSearch = trivia.nombre.toLowerCase().includes(searchTrivia.toLowerCase()) ||
                         trivia.categoria.toLowerCase().includes(searchTrivia.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Filtrar preguntas de la trivia seleccionada
  const filteredQuestions = selectedTrivia ? selectedTrivia.preguntas.filter(pregunta =>
    pregunta.texto.toLowerCase().includes(searchQuestion.toLowerCase())
  ) : [];

  // Resetear selecciones cuando cambia la trivia
  useEffect(() => {
    setSelectedQuestions([]);
    setImportAll(false);
  }, [selectedTrivia]);

  const handleTriviaSelect = (trivia: Trivia) => {
    setSelectedTrivia(trivia);
    setSearchQuestion('');
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTrivia) {
      setSelectedQuestions(selectedTrivia.preguntas.map(q => q.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleImportAllToggle = () => {
    setImportAll(!importAll);
    if (!importAll) {
      setSelectedQuestions([]);
    }
  };

  const handleImport = () => {
    if (!selectedTrivia) {
      showError('Error', 'Debes seleccionar una trivia');
      return;
    }

    let questionsToImport: Pregunta[] = [];

    if (importAll) {
      questionsToImport = selectedTrivia.preguntas;
    } else {
      questionsToImport = selectedTrivia.preguntas.filter(q => selectedQuestions.includes(q.id));
    }

    questionsToImport = questionsToImport.map((question) => ({
      ...question,
      tiempoSegundos: question.tiempoSegundos ?? 60,
    }));

    if (questionsToImport.length === 0) {
      showError('Error', 'Debes seleccionar al menos una pregunta');
      return;
    }

    onImport(questionsToImport);
    onClose();
    showSuccess('Éxito', `${questionsToImport.length} preguntas importadas correctamente`);
  };

  // Helpers de dificultad no utilizados eliminados para evitar warnings

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Importar Preguntas
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona las preguntas que quieres importar
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Paso 1: Seleccionar Trivia */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                1. Selecciona una Trivia
              </h4>
              
              {/* Buscador de trivias */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTrivia}
                    onChange={(e) => setSearchTrivia(e.target.value)}
                    className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Buscar trivia por nombre o categoría..."
                  />
                </div>
              </div>

              {/* Lista de trivias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {filteredTrivias.map(trivia => (
                  <div
                    key={trivia.id}
                    onClick={() => handleTriviaSelect(trivia)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTrivia?.id === trivia.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{trivia.nombre}</h5>
                        <p className="text-xs text-gray-500">{trivia.categoria}</p>
                        <p className="text-xs text-gray-400">
                          {trivia.totalPreguntas ?? trivia.preguntas.length} preguntas
                        </p>
                      </div>
                      {selectedTrivia?.id === trivia.id && (
                        <CheckIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTrivias.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron trivias</p>
                </div>
              )}
            </div>

            {/* Paso 2: Seleccionar Preguntas */}
            {selectedTrivia && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    2. Selecciona las Preguntas de "{selectedTrivia.nombre}"
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      Seleccionar todas
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                {/* Opción de importar todas */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={importAll}
                      onChange={handleImportAllToggle}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Importar todas las preguntas ({selectedTrivia.preguntas.length})
                    </span>
                  </label>
                </div>

                {/* Buscador de preguntas */}
                {!importAll && (
                  <div className="mb-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuestion}
                        onChange={(e) => setSearchQuestion(e.target.value)}
                        className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Buscar pregunta por texto o categoría..."
                      />
                    </div>
                  </div>
                )}

                {/* Lista de preguntas */}
                {!importAll && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredQuestions.map((pregunta, index) => (
                      <div
                        key={pregunta.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedQuestions.includes(pregunta.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleQuestionToggle(pregunta.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                Pregunta {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{pregunta.texto}</p>
                            <div className="text-xs text-gray-500">
                              {pregunta.opciones.length} opciones
                            </div>
                          </div>
                          {selectedQuestions.includes(pregunta.id) && (
                            <CheckIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!importAll && filteredQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No se encontraron preguntas</p>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de selección */}
            {selectedTrivia && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Resumen de Importación</h5>
                <div className="text-sm text-gray-600">
                  <p><strong>Trivia:</strong> {selectedTrivia.nombre}</p>
                  <p><strong>Preguntas a importar:</strong> {
                    importAll 
                      ? selectedTrivia.preguntas.length 
                      : selectedQuestions.length
                  }</p>
                  {!importAll && selectedQuestions.length > 0 && (
                    <p><strong>Seleccionadas:</strong> {selectedQuestions.length} de {selectedTrivia.preguntas.length}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedTrivia || (!importAll && selectedQuestions.length === 0)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2 inline" />
              Importar ({importAll ? selectedTrivia?.preguntas.length || 0 : selectedQuestions.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportQuestionsModal;

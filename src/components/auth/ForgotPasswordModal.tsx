import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { isValidEmail } from '../../utils';
import { slowOperationClient } from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import { ForgotPasswordResponse } from '../../types/api';
import { handleApiError, getErrorMessage } from '../../utils/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  const { showSuccess, showError } = useNotifications();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('El email no es válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Llamada real a la API para recuperar contraseña usando cliente de operaciones lentas
      const response = await slowOperationClient.post<{ data: ForgotPasswordResponse }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: email.trim(),
      });
      
      // El servidor siempre responde con éxito (por seguridad)
      setIsSubmitted(true);
      showSuccess('Email enviado', response.data.data?.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
      
    } catch (err: any) {
      
      // Usar el mismo manejo de errores que login, pero con lógica especial para forgot password
      const apiError = handleApiError(err);
      const errorMessage = getErrorMessage(apiError);
      
      // Para forgot password, por seguridad siempre mostramos éxito si el email tiene formato válido
      if (err.response?.status === 404 || err.response?.status === 400) {
        setIsSubmitted(true);
        showSuccess('Email enviado', 'Si el email existe, recibirás un enlace de recuperación.');
      } else {
        setError(errorMessage);
        showError('Error', 'No se pudo enviar el email de recuperación.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isSubmitted ? 'Email Enviado' : 'Recuperar Contraseña'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                ¡Revisa tu correo!
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Si no recibes el email en unos minutos, revisa tu carpeta de spam.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingresa tu correo electrónico"
                  required
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Enlace'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;

import React, { useState } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { slowOperationClient } from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import { ResetPasswordResponse } from '../../types/api';
import { handleApiError, getErrorMessage } from '../../utils/api';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showSuccess, showError } = useNotifications();

  // Función para validar formato del token
  const isValidToken = (token: string): boolean => {
    // Validar que el token no esté vacío y tenga un formato básico válido
    return token.trim().length > 10 && /^[A-Za-z0-9\-_]+$/.test(token.trim());
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validar token
    if (!isValidToken(token)) {
      newErrors.push('Token de recuperación inválido');
    }

    if (!newPassword.trim()) {
      newErrors.push('La nueva contraseña es requerida');
    } else if (newPassword.length < 6) {
      newErrors.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (!confirmPassword.trim()) {
      newErrors.push('La confirmación de contraseña es requerida');
    } else if (newPassword !== confirmPassword) {
      newErrors.push('Las contraseñas no coinciden');
    }

    if (newErrors.length > 0) {
      setError(newErrors.join('. '));
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Llamada real a la API para restablecer contraseña usando cliente de operaciones lentas
      const response = await slowOperationClient.post<{ data: ResetPasswordResponse }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token: token.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      
      setIsSuccess(true);
      showSuccess('Contraseña restablecida', response.data.data?.message || 'Tu contraseña ha sido restablecida exitosamente.');
      
    } catch (err: any) {
      
      // Usar el mismo manejo de errores que login
      const apiError = handleApiError(err);
      const errorMessage = getErrorMessage(apiError);
      
      setError(errorMessage);
      showError('Error al restablecer contraseña', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isSuccess ? 'Contraseña Restablecida' : 'Restablecer Contraseña'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                ¡Contraseña restablecida!
              </h4>
              <p className="text-sm text-gray-600 mb-6">
                Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
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
                  Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError(null);
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          error ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ingresa tu nueva contraseña"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          error ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirma tu nueva contraseña"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
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
                      Restableciendo...
                    </div>
                  ) : (
                    'Restablecer Contraseña'
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

export default ResetPasswordModal;

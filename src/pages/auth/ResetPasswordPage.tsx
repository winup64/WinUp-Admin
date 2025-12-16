import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { slowOperationClient } from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import { ResetPasswordResponse } from '../../types/api';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotifications();

  // Función para validar formato del token
  const isValidToken = (token: string): boolean => {
    // Validar que el token no esté vacío y tenga un formato básico válido
    return token.trim().length > 10 && /^[A-Za-z0-9\-_]+$/.test(token.trim());
  };

  useEffect(() => {
    // Obtener el token de la URL
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      if (isValidToken(tokenFromUrl)) {
        setToken(tokenFromUrl);
      } else {
        setError('Token de recuperación inválido. El formato del enlace no es correcto.');
      }
    } else {
      setError('Token de recuperación no encontrado. Verifica que el enlace sea correcto.');
    }
  }, [searchParams]);

  // Validar que la contraseña sea fuerte según requisitos del backend
  const isStrongPassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos 1 letra minúscula (a-z)');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos 1 letra MAYÚSCULA (A-Z)');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos 1 número (0-9)');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Al menos 1 carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!newPassword.trim()) {
      newErrors.push('La nueva contraseña es requerida');
      setError(newErrors.join('. '));
      return false;
    }

    // Validar contraseña fuerte
    const passwordValidation = isStrongPassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.push('La contraseña no es lo suficientemente fuerte:');
      newErrors.push(...passwordValidation.errors);
      setError(newErrors.join('\n• '));
      return false;
    }

    if (!confirmPassword.trim()) {
      newErrors.push('La confirmación de contraseña es requerida');
      setError(newErrors.join('. '));
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.push('Las contraseñas no coinciden. Por favor, verifica que ambas sean iguales.');
      setError(newErrors.join('. '));
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de recuperación no encontrado.');
      return;
    }

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
      
      // Manejo específico de errores del backend
      let errorMessage = 'No pudimos restablecer tu contraseña. Por favor, intenta de nuevo.';
      
      if (err.response?.data?.message) {
        const backendMessage = err.response.data.message;
        
        // Mapear mensajes específicos del backend
        if (typeof backendMessage === 'string') {
          // Errores de validación de contraseña fuerte
          if (backendMessage.includes('not strong enough')) {
            errorMessage = 'La contraseña no es lo suficientemente fuerte. Debe cumplir con todos los requisitos de seguridad.';
          }
          // Contraseñas no coinciden
          else if (backendMessage.includes('no coinciden') || backendMessage.includes('not match')) {
            errorMessage = 'Las contraseñas no coinciden. Por favor, verifica que ambas sean iguales.';
          }
          // Token inválido
          else if (backendMessage.includes('inválido') || backendMessage.includes('invalid')) {
            errorMessage = 'El enlace de restablecimiento es inválido. Por favor, solicita uno nuevo.';
          }
          // Token ya usado
          else if (backendMessage.includes('ya fue utilizado') || backendMessage.includes('already used')) {
            errorMessage = 'Este enlace ya fue utilizado. Si necesitas restablecer tu contraseña nuevamente, solicita un nuevo enlace.';
          }
          // Token expirado
          else if (backendMessage.includes('expirado') || backendMessage.includes('expired')) {
            errorMessage = 'El enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo. Los enlaces son válidos por 1 hora.';
          }
          // Contraseña igual a la actual
          else if (backendMessage.includes('debe ser diferente') || backendMessage.includes('same as current')) {
            errorMessage = 'La nueva contraseña debe ser diferente de tu contraseña actual. Por favor, elige una contraseña diferente.';
          }
          // Token vacío
          else if (backendMessage.includes('should not be empty') && backendMessage.includes('token')) {
            errorMessage = 'El token de recuperación es inválido. Verifica que el enlace sea correcto.';
          }
          // Contraseña vacía
          else if (backendMessage.includes('should not be empty') && (backendMessage.includes('Password') || backendMessage.includes('password'))) {
            errorMessage = 'La contraseña es requerida y no puede estar vacía.';
          }
          // Usar mensaje del backend si no coincide con ningún caso específico
          else {
            errorMessage = backendMessage;
          }
        } 
        // Si es un array de mensajes de validación
        else if (Array.isArray(backendMessage)) {
          errorMessage = backendMessage.join('. ');
        }
      }
      
      setError(errorMessage);
      showError('Error al restablecer contraseña', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-100">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Contraseña restablecida!
            </h1>
            <p className="text-gray-600">
              Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-100">
        <div>
          <div className="mx-auto flex items-center justify-center">
            <div className="relative">
              <img
                src="/images/logo.png"
                alt="WinUp Logo"
                className="relative h-14 w-14 object-contain"
              />
            </div>
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Restablecer Contraseña
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Ingresa tu nueva contraseña para completar el proceso de recuperación
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              
              {/* Requisitos de contraseña */}
              {newPassword && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requisitos de contraseña:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{newPassword.length >= 8 ? '✓' : '○'}</span>
                      Mínimo 8 caracteres
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
                      Al menos 1 letra minúscula (a-z)
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                      Al menos 1 letra MAYÚSCULA (A-Z)
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                      Al menos 1 número (0-9)
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword) ? '✓' : '○'}</span>
                      Al menos 1 carácter especial (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
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
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !token}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Restableciendo...</span>
                </div>
              ) : (
                'Restablecer Contraseña'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

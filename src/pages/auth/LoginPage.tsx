import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { LoginCredentials } from "../../types/auth";
import { isValidEmail } from "../../utils";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!isValidEmail(email)) {
      newErrors.email = "El email no es válido";
    } else if (email.length > 254) {
      newErrors.email = "El email es demasiado largo";
    }

    if (!password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    } else if (password.length > 128) {
      newErrors.password = "La contraseña es demasiado larga";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validación en tiempo real
  const validateEmail = (emailValue: string): string | undefined => {
    if (!emailValue.trim()) {
      return "El email es requerido";
    } else if (!isValidEmail(emailValue)) {
      return "El email no es válido";
    } else if (emailValue.length > 254) {
      return "El email es demasiado largo";
    }
    return undefined;
  };

  const validatePassword = (passwordValue: string): string | undefined => {
    if (!passwordValue.trim()) {
      return "La contraseña es requerida";
    } else if (passwordValue.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    } else if (passwordValue.length > 128) {
      return "La contraseña es demasiado larga";
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const credentials: LoginCredentials = {
      email: email.trim(),
      password: password.trim(),
    };

    try {
      const result = await login(credentials);
      
      if (result.success) {
        navigate("/dashboard");
      } else {
        // Solo mostrar error en el formulario, no duplicar notificaciones
        const errorMessage = result.error || "Error de autenticación";
        setErrors({ general: errorMessage });
      }
    } catch (err) {
      setErrors({ general: "Error de conexión. Intenta de nuevo." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm px-8 py-10 space-y-6 border border-gray-200">
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
          <h1 className="mt-4 text-center text-h2 text-gray-900">
            Panel de Control WinUp
          </h1>
          <p className="mt-2 text-center text-body text-gray-600">
            Panel de Administración
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-body font-medium text-gray-700 mb-2"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEmail(newValue);
                    
                    // Validación en tiempo real
                    const emailError = validateEmail(newValue);
                    setErrors(prev => ({ ...prev, email: emailError }));
                  }}
                  className={`pl-10 input-field focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 ${
                    errors.email ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 
                    email && !errors.email ? 'border-green-500 focus:ring-green-100 focus:border-green-500' : ''
                  }`}
                  placeholder="Ingresa tu correo electrónico"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-caption text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-body font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setPassword(newValue);
                    
                    // Validación en tiempo real
                    const passwordError = validatePassword(newValue);
                    setErrors(prev => ({ ...prev, password: passwordError }));
                  }}
                  className={`pl-10 pr-10 input-field focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 ${
                    errors.password ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 
                    password && !errors.password ? 'border-green-500 focus:ring-green-100 focus:border-green-500' : ''
                  }`}
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-caption text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-body">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          {errors.general && (
            <p className="text-caption text-red-600 text-center">{errors.general}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <span>Iniciar sesión</span>
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-caption text-gray-500">
              Acceso restringido para administradores autorizados únicamente.
            </p>
          </div>

        </form>
      </div>
      
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default LoginPage;

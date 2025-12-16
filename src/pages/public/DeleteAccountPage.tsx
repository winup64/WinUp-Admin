import React from 'react';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

const DeleteAccountPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Eliminación de Cuenta</h1>
            <p className="text-primary-100">WinUp</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* Introducción */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cómo solicitar la eliminación de tu cuenta
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              En <strong>WinUp</strong>, respetamos tu derecho a eliminar tu cuenta y todos los datos asociados. 
              Esta página te guiará a través del proceso para solicitar la eliminación permanente de tu cuenta.
            </p>
          </div>

          {/* Pasos para solicitar eliminación */}
          <div className="border-l-4 border-primary-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Pasos para solicitar la eliminación de tu cuenta
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">1</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-700">
                    <strong>Envía un correo electrónico</strong> a{' '}
                    <a 
                      href="mailto:winup64@gmail.com?subject=Solicitud%20de%20Eliminación%20de%20Cuenta"
                      className="text-primary-600 hover:text-primary-700 underline font-medium"
                    >
                      winup64@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">2</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-700">
                    <strong>Asunto del correo:</strong> "Solicitud de Eliminación de Cuenta"
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">3</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-700">
                    <strong>Incluye en el cuerpo del correo:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1 ml-4">
                    <li>Tu dirección de correo electrónico registrada</li>
                    <li>Tu nombre de usuario (username)</li>
                    <li>Confirmación explícita de que deseas eliminar todos tus datos</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">4</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-700">
                    <strong>Procesamiento:</strong> Procesaremos tu solicitud dentro de un plazo de <strong>30 días hábiles</strong> desde la recepción del correo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Datos que se eliminarán */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Datos que se eliminarán permanentemente
            </h3>
            <p className="text-gray-700 mb-4">
              Al eliminar tu cuenta, se eliminarán <strong>permanentemente</strong> los siguientes datos:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Información personal:</strong> Nombre, apellido, email, teléfono, dirección física, fecha de nacimiento, género, foto de perfil/avatar</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Datos de la cuenta:</strong> Username, contraseña (hash), tipo de cuenta (DEMO/PREMIUM), estado de la cuenta, fechas de creación y actualización</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Sistema de puntos:</strong> Puntos totales, puntos ganados, puntos gastados, puntos reales, puntos de venta, puntos demo, y todo el historial de transacciones de puntos</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Actividad en trivias:</strong> Participaciones, respuestas a preguntas, puntuaciones, resultados, tiempo empleado, y todas las estadísticas de desempeño</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Respuestas a encuestas:</strong> Todas las respuestas completadas a encuestas, respuestas específicas a cada pregunta, y puntos ganados por completar encuestas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Participación en sorteos:</strong> Historial de participación en sorteos semanales y mensuales, información de participación (nivel, multiplicador, puntuación de actividad)</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Canjes de premios:</strong> Historial completo de canjes de premios, códigos únicos de canje, información de premios redimidos, y estados de entrega</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Testimonios:</strong> Testimonios y reseñas publicadas por ti, incluyendo calificaciones</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Historial de actividad:</strong> Registros de acceso, historial de actividad en la aplicación, y preferencias de la aplicación</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Tokens de autenticación:</strong> Todos los tokens de sesión activos serán invalidados</span>
              </li>
            </ul>
          </div>

          {/* Datos que se conservarán */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Datos que se conservarán
            </h3>
            <p className="text-gray-700 mb-4">
              Por razones legales y de cumplimiento, los siguientes datos pueden conservarse:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span><strong>Registros de premios monetarios:</strong> Información de premios monetarios ganados y pagos realizados se conservará según los plazos requeridos por las leyes fiscales y legales aplicables en nuestra jurisdicción</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span><strong>Registros de transacciones financieras:</strong> Datos relacionados con pagos y transacciones financieras se conservarán según los períodos de retención establecidos por las autoridades fiscales y las obligaciones legales aplicables</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span><strong>Datos anonimizados:</strong> Datos agregados y anonimizados para análisis estadísticos (sin identificación personal) se conservarán indefinidamente</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                <span><strong>Registros de cumplimiento:</strong> Cualquier registro requerido por autoridades fiscales o legales se conservará según los plazos específicos establecidos por la ley en nuestra jurisdicción</span>
              </li>
            </ul>
          </div>

          {/* Períodos de retención */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Períodos de retención adicionales
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>Datos fiscales y legales:</strong> Los registros de premios monetarios y transacciones financieras se conservan según los períodos de retención establecidos por las leyes fiscales y legales aplicables en nuestra jurisdicción, contados desde la fecha de la transacción.
              </li>
              <li>
                <strong>Eliminación de datos personales:</strong> Una vez procesada tu solicitud, los datos personales identificables se eliminarán completamente dentro de un plazo máximo de <strong>30 días hábiles</strong>. Recibirás una confirmación por correo electrónico una vez completado el proceso.
              </li>
              <li>
                <strong>Datos anonimizados:</strong> Los datos estadísticos agregados y completamente anonimizados (sin posibilidad de identificar individuos) se conservarán indefinidamente para fines de análisis y mejora del servicio.
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Necesitas ayuda o tienes preguntas?
            </h3>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre el proceso de eliminación de cuenta o necesitas asistencia, puedes contactarnos:
            </p>
            <div className="space-y-3">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Correo electrónico</p>
                  <a 
                    href="mailto:winup64@gmail.com"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    winup64@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Nota final */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Nota importante:</strong> Una vez que tu cuenta sea eliminada, esta acción no se puede deshacer. 
              Todos los datos personales serán eliminados permanentemente, excepto aquellos que debamos conservar por obligaciones legales. 
              Si tienes dudas antes de proceder, te recomendamos contactarnos primero.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} WinUp</p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;


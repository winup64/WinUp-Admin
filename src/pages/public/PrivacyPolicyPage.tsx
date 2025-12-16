import React from 'react';
import { ShieldCheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-12 w-12 mr-4" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
                <p className="text-primary-100">WinUp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* Introducción */}
          <div>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-gray-700 leading-relaxed">
              En <strong>WinUp</strong>, nos comprometemos a proteger tu privacidad y garantizar la seguridad de tus datos personales. 
              Esta Política de Privacidad explica qué información recopilamos, cómo la usamos, y tus derechos respecto a tus datos.
            </p>
          </div>

          {/* Responsable */}
          <div className="border-l-4 border-primary-500 pl-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Responsable del Tratamiento</h2>
            <p className="text-gray-700 mb-2"><strong>Aplicación:</strong> WinUp</p>
            <p className="text-gray-700 mb-2"><strong>Contacto:</strong> winup64@gmail.com</p>
            <p className="text-gray-700">
              Si tienes preguntas sobre esta política o sobre el tratamiento de tus datos, puedes contactarnos a través del correo electrónico proporcionado.
            </p>
          </div>

          {/* Información que recopilamos */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1.1 Datos Personales</h3>
                <p className="text-gray-700 mb-2">Cuando te registras y usas WinUp, recopilamos:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li><strong>Datos de identificación:</strong> Nombre, apellido, nombre de usuario</li>
                  <li><strong>Datos de contacto:</strong> Correo electrónico, número de teléfono</li>
                  <li><strong>Datos demográficos:</strong> Dirección física, fecha de nacimiento, género</li>
                  <li><strong>Datos de cuenta:</strong> Contraseña (cifrada), foto de perfil/avatar</li>
                  <li><strong>Tipo de cuenta:</strong> DEMO, PREMIUM</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1.2 Datos de Uso y Actividad</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li><strong>Sistema de puntos:</strong> Puntos totales, puntos ganados, puntos gastados, historial de transacciones</li>
                  <li><strong>Actividad en trivias:</strong> Participaciones, respuestas, puntuaciones, resultados, tiempo empleado</li>
                  <li><strong>Respuestas a encuestas:</strong> Respuestas completadas y específicas a cada pregunta</li>
                  <li><strong>Participación en sorteos:</strong> Historial de participación, nivel, multiplicador, puntuación de actividad</li>
                  <li><strong>Canjes de premios:</strong> Historial de canjes, códigos únicos, estados de entrega</li>
                  <li><strong>Testimonios:</strong> Reseñas y calificaciones publicadas</li>
                  <li><strong>Historial de actividad:</strong> Fechas de acceso, última actividad, preferencias</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1.3 Datos Técnicos</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li><strong>Información del dispositivo:</strong> Modelo, sistema operativo, versión de la app</li>
                  <li><strong>Datos de conexión:</strong> Dirección IP, tipo de conexión</li>
                  <li><strong>Identificadores únicos:</strong> ID de dispositivo, tokens de sesión</li>
                  <li><strong>Datos de almacenamiento local:</strong> Caché, partidas guardadas, preferencias locales</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cómo usamos la información */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cómo Usamos Tu Información</h2>
            <p className="text-gray-700 mb-4">Utilizamos tus datos para:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Proporcionar el servicio:</strong> Gestionar tu cuenta, permitir tu participación en trivias, sorteos y encuestas</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Procesar transacciones:</strong> Administrar puntos, canjes de premios, pagos de premios monetarios</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Personalizar la experiencia:</strong> Adaptar contenido, recomendaciones y notificaciones</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Comunicarnos contigo:</strong> Enviar notificaciones sobre sorteos, premios, actualizaciones</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Mejorar el servicio:</strong> Analizar el uso de la app, identificar errores, desarrollar nuevas funciones</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Seguridad:</strong> Prevenir fraudes, proteger la integridad de la app, cumplir con nuestros términos</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span><strong>Cumplimiento legal:</strong> Cumplir con obligaciones fiscales, legales y regulatorias</span>
              </li>
            </ul>
          </div>

          {/* Permisos de la aplicación */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Permisos de la Aplicación</h2>
            <p className="text-gray-700 mb-4">WinUp solicita los siguientes permisos en tu dispositivo:</p>
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📱 Almacenamiento</h4>
                <p className="text-gray-700 text-sm">
                  Para guardar datos locales como caché, partidas guardadas, y preferencias de la aplicación. 
                  Esto mejora el rendimiento y permite usar algunas funciones sin conexión.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🌐 Internet</h4>
                <p className="text-gray-700 text-sm">
                  Para conectarse a nuestros servidores y sincronizar tus datos, participar en trivias en tiempo real, 
                  recibir notificaciones, y acceder a contenido actualizado.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🔔 Notificaciones</h4>
                <p className="text-gray-700 text-sm">
                  Para enviarte notificaciones sobre sorteos, premios ganados, recordatorios de trivias, 
                  y actualizaciones importantes de la aplicación.
                </p>
              </div>
            </div>
          </div>

          {/* Compartir información */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartir Información</h2>
            <p className="text-gray-700 mb-4">
              <strong>No vendemos ni alquilamos</strong> tus datos personales a terceros. 
              Podemos compartir información en las siguientes circunstancias:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span><strong>Proveedores de servicios:</strong> Compartimos datos con proveedores que nos ayudan a operar la app (hosting, procesamiento de pagos, análisis). Estos proveedores están obligados a proteger tu información.</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span><strong>Requisitos legales:</strong> Si la ley lo requiere o para proteger nuestros derechos legales, responder a procesos legales, o cooperar con autoridades.</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span><strong>Con tu consentimiento:</strong> Podemos compartir información con terceros si nos das permiso explícito.</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span><strong>Datos anonimizados:</strong> Podemos compartir datos agregados y anonimizados (sin identificación personal) para análisis estadísticos.</span>
              </li>
            </ul>
          </div>

          {/* Retención de datos */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Retención de Datos</h2>
            <p className="text-gray-700 mb-4">Conservamos tus datos mientras:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Tu cuenta esté activa y uses nuestros servicios</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Sea necesario para cumplir con obligaciones legales, fiscales o contables</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Sea necesario para resolver disputas o hacer cumplir nuestros acuerdos</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Cuando elimines tu cuenta, eliminaremos tus datos personales dentro de 30 días hábiles, 
              excepto aquellos que debamos conservar por obligaciones legales.
            </p>
          </div>

          {/* Tus derechos */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Tus Derechos</h2>
            <p className="text-gray-700 mb-4">Como usuario de WinUp, tienes los siguientes derechos:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">→</span>
                <div>
                  <strong>Derecho de acceso:</strong> Puedes solicitar una copia de los datos personales que tenemos sobre ti.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">→</span>
                <div>
                  <strong>Derecho de rectificación:</strong> Puedes corregir datos inexactos o incompletos desde la configuración de tu cuenta.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">→</span>
                <div>
                  <strong>Derecho de eliminación:</strong> Puedes solicitar la eliminación de tu cuenta y datos personales. 
                  <a href="/delete-account" className="text-primary-600 hover:text-primary-700 underline ml-1">
                    Ver cómo eliminar tu cuenta
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">→</span>
                <div>
                  <strong>Derecho de portabilidad:</strong> Puedes solicitar tus datos en un formato estructurado y legible.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">→</span>
                <div>
                  <strong>Derecho de oposición:</strong> Puedes oponerte al procesamiento de tus datos para ciertos fines.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 font-bold">→</span>
                <div>
                  <strong>Derecho de revocación:</strong> Puedes retirar tu consentimiento en cualquier momento (cuando el procesamiento se base en consentimiento).
                </div>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Para ejercer cualquiera de estos derechos, contáctanos en: <strong>winup64@gmail.com</strong>
            </p>
          </div>

          {/* Seguridad */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seguridad de Datos</h2>
            <p className="text-gray-700 mb-3">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra:
            </p>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Acceso no autorizado</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Pérdida, alteración o destrucción accidental</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Uso indebido o divulgación no autorizada</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Estas medidas incluyen cifrado de contraseñas, conexiones seguras (HTTPS), controles de acceso, 
              y monitoreo de seguridad. Sin embargo, ningún sistema es 100% seguro, por lo que te recomendamos 
              mantener tu contraseña segura y no compartirla.
            </p>
          </div>

          {/* Privacidad de menores */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacidad de Menores</h2>
            <p className="text-gray-700">
              WinUp no está dirigida a menores de 13 años. No recopilamos intencionalmente información personal 
              de menores de 13 años. Si descubrimos que hemos recopilado datos de un menor, eliminaremos esa 
              información inmediatamente. Si crees que podríamos tener información de un menor, contáctanos.
            </p>
          </div>

          {/* Cambios a la política */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cambios a esta Política</h2>
            <p className="text-gray-700">
              Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas 
              o por razones legales. Te notificaremos sobre cambios significativos a través de la app o por correo electrónico. 
              La fecha de "Última actualización" en la parte superior indica cuándo se modificó por última vez esta política.
            </p>
          </div>

          {/* Contacto */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas, inquietudes o solicitudes sobre esta Política de Privacidad o sobre cómo tratamos tus datos personales, 
              puedes contactarnos:
            </p>
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

          {/* Nota final */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Tu privacidad es importante para nosotros.</strong> Al usar WinUp, aceptas esta Política de Privacidad. 
              Si no estás de acuerdo con alguna parte de esta política, por favor no uses nuestra aplicación.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} WinUp - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;


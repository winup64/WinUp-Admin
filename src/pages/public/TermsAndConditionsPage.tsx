import React from 'react';
import { DocumentTextIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
            <div className="flex items-center">
              <DocumentTextIcon className="h-12 w-12 mr-4" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Términos y Condiciones</h1>
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
            <p className="text-gray-700 leading-relaxed mb-4">
              Bienvenido a <strong>WinUp</strong>. Estos Términos y Condiciones ("Términos") rigen tu acceso y uso 
              de nuestra aplicación móvil, servicios y plataforma (colectivamente, el "Servicio").
            </p>
            <p className="text-gray-700 leading-relaxed">
              Al registrarte, acceder o usar WinUp, aceptas estar legalmente obligado por estos Términos. 
              Si no estás de acuerdo con alguna parte de estos Términos, no debes usar nuestro Servicio.
            </p>
          </div>

          {/* Aceptación de los términos */}
          <div className="border-l-4 border-primary-500 pl-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 mb-2">
              Al crear una cuenta en WinUp, confirmas que:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Tienes al menos 13 años de edad</li>
              <li>Tienes capacidad legal para celebrar contratos vinculantes</li>
              <li>Has leído y entendido estos Términos y nuestra Política de Privacidad</li>
              <li>Proporcionarás información veraz, precisa y actualizada</li>
              <li>Usarás el Servicio de manera responsable y conforme a la ley</li>
            </ul>
          </div>

          {/* Descripción del servicio */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700 mb-4">
              WinUp es una plataforma de entretenimiento interactiva que ofrece:
            </p>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Trivias</h4>
                <p className="text-gray-700 text-sm">
                  Participa en trivias de diferentes categorías y dificultades para demostrar tus conocimientos 
                  y ganar puntos.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Encuestas</h4>
                <p className="text-gray-700 text-sm">
                  Comparte tu opinión respondiendo encuestas y gana puntos por cada participación.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎁 Sorteos</h4>
                <p className="text-gray-700 text-sm">
                  Participa en sorteos mensuales, semanales y de productos usando tus puntos para tener oportunidades 
                  de ganar premios.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🏆 Sistema de Puntos</h4>
                <p className="text-gray-700 text-sm">
                  Acumula puntos mediante tu actividad y canjéalos por premios físicos, digitales o participaciones 
                  en sorteos.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💎 Cuentas Premium</h4>
                <p className="text-gray-700 text-sm">
                  Accede a beneficios exclusivos, multiplicadores de puntos y participación en sorteos premium.
                </p>
              </div>
            </div>
          </div>

          {/* Cuenta de usuario */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cuenta de Usuario</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Registro</h3>
                <p className="text-gray-700">
                  Para usar WinUp, debes crear una cuenta proporcionando información personal precisa y completa, 
                  incluyendo nombre, correo electrónico, teléfono y otros datos requeridos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Responsabilidad de la Cuenta</h3>
                <p className="text-gray-700 mb-2">Eres responsable de:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Mantener la confidencialidad de tu contraseña</li>
                  <li>Todas las actividades que ocurran bajo tu cuenta</li>
                  <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
                  <li>Cerrar sesión al finalizar cada sesión</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.3 Tipos de Cuenta</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span><strong>Cuenta DEMO (Gratuita):</strong> Acceso básico a funciones limitadas de la plataforma</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span><strong>Cuenta PREMIUM:</strong> Acceso completo con beneficios exclusivos, multiplicadores y sorteos premium</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sistema de puntos */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Sistema de Puntos</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Obtención de Puntos</h3>
                <p className="text-gray-700 mb-2">Puedes ganar puntos de las siguientes maneras:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Participando y completando trivias</li>
                  <li>Respondiendo encuestas</li>
                  <li>Completando tareas y desafíos</li>
                  <li>Bonificaciones por actividad diaria</li>
                  <li>Multiplicadores exclusivos para usuarios PREMIUM</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.2 Uso de Puntos</h3>
                <p className="text-gray-700 mb-2">Los puntos pueden usarse para:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Participar en sorteos de productos y premios</li>
                  <li>Canjear premios físicos o digitales</li>
                  <li>Acceder a contenido exclusivo</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.3 Política de Puntos</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span>Los puntos <strong>no tienen valor monetario real</strong> y no pueden ser transferidos, vendidos o intercambiados por dinero</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span>Los puntos no son reembolsables ni transferibles entre cuentas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span>WinUp se reserva el derecho de ajustar, modificar o eliminar puntos en caso de actividad fraudulenta o abuso del sistema</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span>Los puntos pueden expirar si tu cuenta está inactiva por más de 12 meses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sorteos y premios */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sorteos y Premios</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.1 Participación en Sorteos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>La participación en sorteos requiere el uso de puntos según se indique para cada sorteo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Debes cumplir con los requisitos de elegibilidad específicos de cada sorteo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Los usuarios PREMIUM tienen acceso a sorteos exclusivos con mejores premios</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Los multiplicadores aumentan tus probabilidades de ganar</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.2 Selección de Ganadores</h3>
                <p className="text-gray-700 mb-2">
                  Los ganadores de sorteos son seleccionados mediante un proceso aleatorio y transparente. 
                  La selección se basa en:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Número de participaciones (tickets) de cada usuario</li>
                  <li>Multiplicadores activos</li>
                  <li>Algoritmo aleatorio certificado</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.3 Entrega de Premios</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Los ganadores serán notificados a través de la app y por correo electrónico</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Los ganadores deben confirmar su premio dentro de 7 días hábiles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Premios físicos: se entregarán en la dirección registrada dentro de 15-30 días hábiles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Premios digitales: se entregarán mediante código único dentro de 48 horas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Premios monetarios: se transferirán a la cuenta bancaria registrada</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.4 Condiciones de Premios</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span>Los premios <strong>no son transferibles ni canjeables por dinero</strong> (excepto premios monetarios)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span>WinUp no es responsable de problemas de entrega causados por información incorrecta del usuario</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span>Los premios no reclamados en el plazo establecido se considerarán forfeit (perdidos)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span>Los impuestos aplicables a premios son responsabilidad del ganador</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Conducta del usuario */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Conducta del Usuario</h2>
            <p className="text-gray-700 mb-4">Al usar WinUp, te comprometes a NO:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Usar la app para fines ilegales o no autorizados</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Crear múltiples cuentas para obtener ventajas injustas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Usar bots, scripts o herramientas automatizadas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Manipular el sistema de puntos, trivias o sorteos</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Compartir o vender tu cuenta</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Intentar acceder sin autorización a otras cuentas o sistemas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Publicar contenido ofensivo, difamatorio o inapropiado</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Realizar ingeniería inversa, decompilar o desensamblar la aplicación</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">✗</span>
                <span>Interferir con el funcionamiento normal del servicio</span>
              </li>
            </ul>
          </div>

          {/* Suscripciones premium */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Suscripciones PREMIUM</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">7.1 Beneficios PREMIUM</h3>
                <p className="text-gray-700 mb-2">Las cuentas PREMIUM incluyen:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Multiplicadores de puntos exclusivos</li>
                  <li>Acceso a sorteos premium con mejores premios</li>
                  <li>Contenido exclusivo y trivias especiales</li>
                  <li>Prioridad en atención al cliente</li>
                  <li>Bonificaciones adicionales</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">7.2 Pago y Renovación</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Las suscripciones PREMIUM se cobran de manera recurrente (mensual o anual)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>La renovación automática puede cancelarse en cualquier momento</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Los cambios en el precio se notificarán con 30 días de anticipación</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>No se ofrecen reembolsos por períodos parcialmente utilizados</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">7.3 Cancelación</h3>
                <p className="text-gray-700">
                  Puedes cancelar tu suscripción PREMIUM en cualquier momento desde la configuración de tu cuenta. 
                  La cancelación será efectiva al final del período de facturación actual. 
                  No se realizarán reembolsos por el tiempo restante.
                </p>
              </div>
            </div>
          </div>

          {/* Propiedad intelectual */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Propiedad Intelectual</h2>
            <p className="text-gray-700 mb-4">
              Todos los derechos de propiedad intelectual sobre WinUp, incluyendo pero no limitado a:
            </p>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Nombre, logotipo y marca "WinUp"</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Diseño, código fuente y arquitectura de la aplicación</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Contenido de trivias, encuestas y preguntas</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Gráficos, imágenes, textos y multimedia</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              Pertenecen exclusivamente a WinUp o sus licenciantes. No se otorga ninguna licencia o derecho 
              sobre estos elementos más allá del uso personal y no comercial de la aplicación.
            </p>
          </div>

          {/* Limitación de responsabilidad */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitación de Responsabilidad</h2>
            <p className="text-gray-700 mb-4">
              <strong>WinUp se proporciona "tal cual" y "según disponibilidad".</strong> No garantizamos que:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>El servicio será ininterrumpido, seguro o libre de errores</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Los resultados obtenidos serán precisos o confiables</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-600 mr-2">•</span>
                <span>Se corregirán todos los defectos o errores</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              WinUp no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, 
              incluyendo pero no limitado a pérdida de ganancias, datos, o uso, causados por tu acceso o 
              imposibilidad de acceder al servicio.
            </p>
          </div>

          {/* Suspensión y terminación */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Suspensión y Terminación</h2>
            <p className="text-gray-700 mb-4">
              WinUp se reserva el derecho de suspender o terminar tu cuenta, con o sin previo aviso, si:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Violas estos Términos y Condiciones</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Participas en actividades fraudulentas o abusivas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Proporcionas información falsa o engañosa</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Realizas conductas que perjudiquen a otros usuarios o a la plataforma</span>
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              En caso de terminación, perderás acceso a tu cuenta y todos los puntos y beneficios acumulados. 
              Los premios pendientes de entrega serán procesados según corresponda.
            </p>
          </div>

          {/* Modificaciones */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modificaciones a los Términos</h2>
            <p className="text-gray-700">
              WinUp se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. 
              Las modificaciones entrarán en vigor inmediatamente después de su publicación en la aplicación. 
              Te notificaremos sobre cambios significativos a través de la app o por correo electrónico. 
              Tu uso continuado del servicio después de las modificaciones constituye tu aceptación de los nuevos Términos.
            </p>
          </div>

          {/* Ley aplicable */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Ley Aplicable y Jurisdicción</h2>
            <p className="text-gray-700">
              Estos Términos se regirán e interpretarán de acuerdo con las leyes de Ecuador. 
              Cualquier disputa relacionada con estos Términos o el uso de WinUp será resuelta en los 
              tribunales competentes de Ecuador.
            </p>
          </div>

          {/* Disposiciones generales */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Disposiciones Generales</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <div>
                  <strong>Integridad del Acuerdo:</strong> Estos Términos, junto con la Política de Privacidad, 
                  constituyen el acuerdo completo entre tú y WinUp.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <div>
                  <strong>Divisibilidad:</strong> Si alguna disposición es declarada inválida, las demás 
                  disposiciones seguirán siendo válidas.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <div>
                  <strong>Renuncia:</strong> La falta de ejercicio de cualquier derecho no constituye una renuncia 
                  a dicho derecho.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <div>
                  <strong>Cesión:</strong> No puedes ceder estos Términos sin nuestro consentimiento previo por escrito.
                </div>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas, dudas o solicitudes sobre estos Términos y Condiciones, 
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
              <strong>Al usar WinUp, aceptas cumplir con estos Términos y Condiciones.</strong> 
              Si no estás de acuerdo con alguna parte de estos Términos, debes dejar de usar 
              nuestra aplicación inmediatamente. Te recomendamos revisar periódicamente estos Términos 
              para estar al tanto de cualquier cambio.
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

export default TermsAndConditionsPage;


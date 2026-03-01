import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  GiftIcon,
  TicketIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Usuarios', href: '/users', icon: UsersIcon },
  { name: 'Categorías', href: '/categories', icon: TagIcon },
  { name: 'Trivias', href: '/trivias', icon: QuestionMarkCircleIcon },
  { name: 'Premios', href: '/rewards', icon: GiftIcon },
  { name: 'Sorteos', href: '/raffles', icon: TicketIcon },
  { name: 'Encuestas', href: '/surveys', icon: ClipboardDocumentListIcon },
  { name: 'Testimonios', href: '/testimonials', icon: ChatBubbleLeftRightIcon },
  { name: 'Notificaciones', href: '/notifications', icon: BellIcon },
  // { name: 'Reportes', href: '/reports', icon: ChartBarIcon }, // Oculto temporalmente
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="flex h-full flex-col bg-white shadow-lg w-64 transition-colors"> {/* Ancho equilibrado */}
      {/* Header del sidebar */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-gray-200 transition-colors"> {/* Altura equilibrada */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold text-primary-600 transition-colors">WinUp Administrador</h1> {/* Tamaño equilibrado */}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" /> {/* Icono equilibrado */}
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-4"> {/* Espaciado equilibrado */}
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" /> {/* Iconos equilibrados */}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Perfil del administrador */}
      <div className="border-t border-gray-200 p-4 transition-colors"> {/* Padding equilibrado */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center transition-colors">
              <span className="text-white text-xs font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate transition-colors"> {/* Texto equilibrado */}
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate transition-colors">
              {user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'} {/* Texto completo */}
            </p>
          </div>
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="ml-2 px-3 py-1.5 rounded-md text-red-600 hover:text-white hover:bg-red-600 transition-colors duration-200 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cerrar sesión"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs font-medium">Saliendo...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs font-medium">Salir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

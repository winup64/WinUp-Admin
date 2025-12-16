import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 transition-colors">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8"> {/* Altura y padding equilibrados */}
        {/* Botón de menú para móviles */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="h-5 w-5" /> {/* Icono equilibrado */}
        </button>

        {/* Espacio para el título/logo cuando no hay búsqueda */}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900 transition-colors">Administrador</h1>
        </div>

        {/* Perfil */}
        <div className="flex items-center space-x-4"> {/* Espaciado equilibrado */}
          {/* Perfil */}
          <div className="flex items-center space-x-3"> {/* Espaciado equilibrado */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-900 transition-colors">{user?.username}</p> {/* Texto equilibrado */}
              <p className="text-xs text-gray-500 transition-colors">{user?.email}</p> {/* Email completo sin truncar */}
            </div>
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center transition-colors">
              <span className="text-white text-xs font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

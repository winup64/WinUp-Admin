import React, { useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { User } from '../../services/usersService';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  useUsersList,
  useUsersPointsStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '../../hooks/useUsers';
import type { AccountUserType } from '../../types';


type NewUser = {
  first_name: string;
  last_name: string;
  address: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  birth_date: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  status: 'ACTIVE' | 'INACTIVE';
  role: 'ADMIN' | 'USER';
  user_type?: AccountUserType;
};

const UsersPage: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  
  // Estados de UI (formularios y modales)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | AccountUserType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'ADMIN' | 'USER'>('USER');
  const [editUserType, setEditUserType] = useState<AccountUserType>('UNASSIGNED');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editBirthDate, setEditBirthDate] = useState<string>('');
  const [editGender, setEditGender] = useState<'Masculino' | 'Femenino' | 'Otro'>('Masculino');
  const [editPassword, setEditPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    first_name: '',
    last_name: '',
    address: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    birth_date: '',
    gender: 'Masculino',
    status: 'ACTIVE',
    role: 'USER',
    user_type: 'UNASSIGNED', // Valor por defecto para rol USER
  });

  const appliedAccountTypeFilter = accountTypeFilter === 'all' ? undefined : accountTypeFilter;

  // ✨ React Query hooks - Reemplazan useEffect y estados manuales
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError
  } = useUsersList({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    // Backend espera y devuelve status en MAYÚSCULAS
    status: statusFilter !== 'all' ? (statusFilter as 'ACTIVE' | 'INACTIVE') : undefined,
    user_type: appliedAccountTypeFilter,
  });

  // Estadísticas de puntos
  const { data: pointsStats } = useUsersPointsStats();

  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // Extraer datos de la respuesta
  const apiUsers = usersResponse?.data || [];
  const totalUsersCount = usersResponse?.totalUsers || 0;
  const totalPagesCount = usersResponse?.pagination?.totalPages || 0;

  const formatNumber = (value: number | string | null | undefined): string => {
    const num = typeof value === 'string' ? Number(value) : value;
    if (typeof num === 'number' && isFinite(num)) {
      try {
        return num.toLocaleString('es-PE');
      } catch (_) {
        return num.toLocaleString();
      }
    }
    return '0';
  };

  const ACCOUNT_TYPE_VALUES: AccountUserType[] = ['UNASSIGNED', 'DEMO', 'PREMIUM', 'EXPIRED', 'ADMIN'];

  const normalizeAccountType = (value?: string | null): AccountUserType | undefined => {
    if (!value) return undefined;
    const upper = value.toUpperCase();
    let normalizedUpper = upper;
    if (upper === 'EXPIRADO') normalizedUpper = 'EXPIRED';
    if (upper === 'SIN_PLAN' || upper === 'SINPLAN' || upper === 'NO_PLAN') normalizedUpper = 'UNASSIGNED';
    return (ACCOUNT_TYPE_VALUES as string[]).includes(normalizedUpper)
      ? (normalizedUpper as AccountUserType)
      : undefined;
  };

  const PLAN_LABELS: Record<AccountUserType, string> = {
    UNASSIGNED: 'Sin plan',
    DEMO: 'Demo',
    PREMIUM: 'Premium',
    EXPIRED: 'Expirado',
    ADMIN: 'Administrador',
  };

  const PLAN_BADGE_STYLES: Record<AccountUserType, string> = {
    UNASSIGNED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    DEMO: 'bg-amber-50 text-amber-700 border border-amber-200',
    PREMIUM: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    EXPIRED: 'bg-rose-50 text-rose-700 border border-rose-200',
    ADMIN: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const PLAN_TABLE_LABELS: Record<AccountUserType, string> = {
    UNASSIGNED: 'SIN PLAN',
    DEMO: 'DEMO',
    PREMIUM: 'PREMIUM',
    EXPIRED: 'EXPIRADO',
    ADMIN: 'ADMIN',
  };

  const getPlanTableLabel = (value?: string | null): string => {
    const normalized = normalizeAccountType(value);
    if (normalized) {
      return PLAN_TABLE_LABELS[normalized];
    }
    return value ? value.toUpperCase() : '-';
  };

  const renderPlanBadge = (value?: string | null) => {
    const normalized = normalizeAccountType(value);
    if (!normalized) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          {value || 'Sin dato'}
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE_STYLES[normalized]}`}>
        {PLAN_LABELS[normalized]}
      </span>
    );
  };

  const isUnassignedPlan = (value?: string | null): boolean => normalizeAccountType(value) === 'UNASSIGNED';

  const getExpirationLabel = (user: User): string => {
    if (isUnassignedPlan(user.user_type)) {
      return 'Sin plan asignado';
    }
    if (user.expires_at) {
      try {
        return new Date(user.expires_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return user.expires_at;
      }
    }
    return 'Sin expiración';
  };


  // Cálculos de paginación
  const totalItems = totalUsersCount || 0;
  const totalPages = totalPagesCount || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = apiUsers;

  // Valores de cards basados únicamente en estadísticas de puntos
  const totalUsers = pointsStats?.count || 0;
  const averagePoints = pointsStats?.average ?? 0;
  const maxPoints = pointsStats?.max ?? 0;
  const minPoints = pointsStats?.min ?? 0;
  const statsNotice = !pointsStats ? 'Estadísticas no disponibles en este momento.' : null;

  const getStatusBadge = (status: string | undefined) => {
    if (status === 'ACTIVE') return <span className="badge badge-success">Activo</span>;
    if (status === 'INACTIVE') return <span className="badge badge-danger">Inactivo</span>;
    return <span className="badge badge-secondary">{status || 'N/A'}</span>;
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
    const currentRole = Array.isArray(user.role) && user.role.length > 0 ? (user.role[0] as 'ADMIN' | 'USER') : 'USER';
    setEditRole(currentRole);
    const currentType = normalizeAccountType(user.user_type);

    // Establecer user_type según el rol
    if (currentRole === 'ADMIN') {
      setEditUserType('ADMIN');
    } else if (currentType && currentType !== 'ADMIN') {
      setEditUserType(currentType);
    } else {
      setEditUserType('UNASSIGNED');
    }
    
    // 🔄 NORMALIZAR DIRECCIÓN
    setEditAddress((user as any).address || '');
    
    // 🔄 NORMALIZAR FECHA DE NACIMIENTO (de ISO a YYYY-MM-DD)
    const birthDate = (user as any).birth_date;
    if (birthDate) {
      try {
        const date = new Date(birthDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setEditBirthDate(`${year}-${month}-${day}`);
      } catch {
        setEditBirthDate('');
      }
    } else {
      setEditBirthDate('');
    }
    
    // 🔄 NORMALIZAR GÉNERO (M/F/O/masculino/femenino -> Masculino/Femenino/Otro)
    const gender = ((user as any).gender || '').toString().toLowerCase();
    if (gender === 'm' || gender === 'masculino') {
      setEditGender('Masculino');
    } else if (gender === 'f' || gender === 'femenino') {
      setEditGender('Femenino');
    } else if (gender === 'o' || gender === 'otro') {
      setEditGender('Otro');
    } else {
      setEditGender('Masculino'); // Valor por defecto
    }
    
    // Limpiar contraseña al abrir modal de edición
    setEditPassword('');
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleAssignPlanFromDetails = (user: User) => {
    handleEditUser(user);
    setSelectedUser(null);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      const fullName = `${deletingUser.first_name} ${deletingUser.last_name}`;
      await deleteMutation.mutateAsync(deletingUser.user_id);
      
      showSuccess(
        'Usuario Eliminado',
        `${fullName} ha sido eliminado exitosamente.`
      );
      
      // Cerrar modal
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error: any) {
      
      // Función para traducir mensajes de error del backend a español
      const translateErrorMessage = (message: string): string => {
        const translations: Record<string, string> = {
          'User already exists': 'Ya existe un usuario con este email o nombre de usuario',
          'Email already exists': 'Este correo electrónico ya está registrado',
          'Username already exists': 'Este nombre de usuario ya está en uso',
          'Invalid email': 'Correo electrónico inválido',
          'Invalid phone': 'Número de teléfono inválido',
          'Password too short': 'La contraseña es demasiado corta',
          'Invalid password': 'Contraseña inválida',
          'Required field': 'Campo requerido',
          'Validation failed': 'Error de validación',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Acceso prohibido',
          'Not found': 'No encontrado',
          'Internal server error': 'Error interno del servidor',
          'Bad request': 'Solicitud incorrecta',
          'User not found': 'Usuario no encontrado',
          'Invalid token': 'Token inválido',
          'Token expired': 'Token expirado',
          'Access denied': 'Acceso denegado',
          'Cannot delete user': 'No se puede eliminar el usuario',
          'User has related data': 'El usuario tiene datos relacionados',
          'Constraint violation': 'No se puede eliminar. El usuario tiene datos relacionados.',
        };
        
        // Buscar traducción exacta
        if (translations[message]) return translations[message];
        
        // Buscar traducción parcial
        for (const [key, value] of Object.entries(translations)) {
          if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
          }
        }
        
        return message;
      };
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        const translatedMessage = backendMessage 
          ? translateErrorMessage(backendMessage)
          : 'No se puede eliminar el usuario. Puede tener datos relacionados.';
        showError('No se puede eliminar', translatedMessage);
      } else if (error.response?.status === 401) {
        showError(
          'Sesión Expirada',
          'Token no válido o no proporcionado. Por favor, inicia sesión nuevamente.'
        );
      } else if (error.response?.status === 403) {
        showError(
          'Sin Permisos',
          'Sin permisos de administrador para realizar esta acción.'
        );
      } else if (error.response?.status === 404) {
        showError(
          'Usuario No Encontrado',
          'El usuario que intentas eliminar no existe.'
        );
      } else {
        const backendMessage = error.response?.data?.message || error.message;
        const translatedMessage = backendMessage 
          ? translateErrorMessage(backendMessage)
          : 'Error al eliminar el usuario';
        showError('Error de Eliminación', translatedMessage);
      }
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.username || !newUser.password || !newUser.role) {
      showError(
        'Campos Requeridos',
        'Por favor completa todos los campos obligatorios'
      );
      return;
    }
    
    // ✅ VALIDACIÓN DE TELÉFONO ECUATORIANO
    if (newUser.phone && newUser.phone.trim() !== '') {
      const phoneRegex = /^(\+593|0)[9]\d{8}$/;
      const cleanPhone = newUser.phone.replace(/\s+/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        showError(
          'Teléfono Inválido',
          'El formato de teléfono debe ser:\n- Móvil: 09XXXXXXXX (10 dígitos)\n- Con código internacional: +593 9XXXXXXXX'
        );
        return;
      }
    }
    
    // ✅ VALIDACIÓN DE CONTRASEÑA
    if (newUser.password && newUser.password.trim() !== '') {
      if (newUser.password.length < 8) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe tener al menos 8 caracteres.'
        );
        return;
      }
      
      if (!/[A-Z]/.test(newUser.password)) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe contener al menos una letra mayúscula.'
        );
        return;
      }
      
      if (!/[a-z]/.test(newUser.password)) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe contener al menos una letra minúscula.'
        );
        return;
      }
      
      if (!/[0-9]/.test(newUser.password)) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe contener al menos un número.'
        );
        return;
      }
    }
    
    try {
      // Preparar datos para la API del backend admin
      const payload = {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone || undefined,
        address: newUser.address || undefined,
        birth_date: newUser.birth_date || undefined,
        gender: ((): string | undefined => {
          if (!newUser.gender) return undefined;
          if (newUser.gender === 'Masculino') return 'M';
          if (newUser.gender === 'Femenino') return 'F';
          return 'O';
        })(),
        is_active: newUser.status === 'ACTIVE',
        role: newUser.role,
        user_type: newUser.user_type,
      } as any;

      await createMutation.mutateAsync(payload);
      
      showSuccess(
        'Usuario Creado',
        `${newUser.first_name} ${newUser.last_name} ha sido registrado exitosamente.`
      );
      
      // Cerrar modal y resetear formulario
      setShowCreateModal(false);
      setNewUser({
        first_name: '',
        last_name: '',
        address: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        birth_date: '',
        gender: 'Masculino',
        status: 'ACTIVE',
        role: 'USER',
        user_type: 'UNASSIGNED'
      });
    } catch (error: any) {
      
      // Función para traducir mensajes de error del backend a español
      const translateErrorMessage = (message: string): string => {
        const translations: Record<string, string> = {
          'User already exists': 'Ya existe un usuario con este email o nombre de usuario',
          'Email already exists': 'Este correo electrónico ya está registrado',
          'Username already exists': 'Este nombre de usuario ya está en uso',
          'Invalid email': 'Correo electrónico inválido',
          'Invalid phone': 'Número de teléfono inválido',
          'Password too short': 'La contraseña es demasiado corta',
          'Invalid password': 'Contraseña inválida',
          'Required field': 'Campo requerido',
          'Validation failed': 'Error de validación',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Acceso prohibido',
          'Not found': 'No encontrado',
          'Internal server error': 'Error interno del servidor',
          'Bad request': 'Solicitud incorrecta',
        };
        
        // Buscar traducción exacta
        if (translations[message]) return translations[message];
        
        // Buscar traducción parcial
        for (const [key, value] of Object.entries(translations)) {
          if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
          }
        }
        
        return message;
      };
      
      // Manejar errores específicos
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        let translatedMessage = 'Los datos proporcionados no son válidos. Verifica la información.';
        
        if (Array.isArray(backendMessage)) {
          translatedMessage = backendMessage.map(msg => translateErrorMessage(msg)).join('\n');
        } else if (backendMessage) {
          translatedMessage = translateErrorMessage(backendMessage);
        }
        
        showError('Datos Inválidos', translatedMessage);
      } else if (error.response?.status === 409) {
        const backendMessage = error.response?.data?.message || 'Ya existe un usuario con este email o nombre de usuario.';
        showError('Usuario Existente', translateErrorMessage(backendMessage));
      } else {
        const backendMessage = error.response?.data?.message || error.message;
        const translatedMessage = backendMessage ? translateErrorMessage(backendMessage) : 'Error al crear el usuario';
        showError('Error de Creación', translatedMessage);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    // ✅ VALIDACIÓN DE TELÉFONO ECUATORIANO
    if (editingUser.phone && editingUser.phone.trim() !== '') {
      const phoneRegex = /^(\+593|0)[9]\d{8}$/;
      const cleanPhone = editingUser.phone.replace(/\s+/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        showError(
          'Teléfono Inválido',
          'El formato de teléfono debe ser:\n- Móvil: 09XXXXXXXX (10 dígitos)\n- Con código internacional: +593 9XXXXXXXX'
        );
        return;
      }
    }
    
    // ✅ VALIDACIÓN DE CONTRASEÑA (solo si se ingresó una nueva)
    if (editPassword && editPassword.trim() !== '') {
      if (editPassword.length < 8) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe tener al menos 8 caracteres.'
        );
        return;
      }
      
      if (!/[A-Z]/.test(editPassword)) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe contener al menos una letra mayúscula.'
        );
        return;
      }
      
      if (!/[a-z]/.test(editPassword)) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe contener al menos una letra minúscula.'
        );
        return;
      }
      
      if (!/[0-9]/.test(editPassword)) {
        showError(
          'Contraseña Inválida',
          'La contraseña debe contener al menos un número.'
        );
        return;
      }
    }
    
    try {
      // Preparar datos para la actualización backend
      const updateData: any = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        username: editingUser.username,
        phone: editingUser.phone || undefined,
        address: editAddress || undefined,
        birth_date: editBirthDate || undefined,
        gender: ((): string | undefined => {
          if (!editGender) return undefined;
          if (editGender === 'Masculino') return 'M';
          if (editGender === 'Femenino') return 'F';
          return 'O';
        })(),
        is_active: editingUser.status === 'ACTIVE',
        role: editRole,
        user_type: editUserType,
       };
       
       // 🔐 Agregar contraseña solo si se proporcionó una nueva
       if (editPassword && editPassword.trim() !== '') {
         updateData.password = editPassword;
       }

       await updateMutation.mutateAsync({
        id: editingUser.user_id, 
        data: updateData 
      });
      
      showSuccess(
        'Usuario Actualizado',
        `${editingUser.first_name} ${editingUser.last_name} ha sido actualizado exitosamente.`
      );
      
      // Cerrar modal
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error: any) {
      
      // Función para traducir mensajes de error del backend a español
      const translateErrorMessage = (message: string): string => {
        const translations: Record<string, string> = {
          'User already exists': 'Ya existe un usuario con este email o nombre de usuario',
          'Email already exists': 'Este correo electrónico ya está registrado',
          'Username already exists': 'Este nombre de usuario ya está en uso',
          'Invalid email': 'Correo electrónico inválido',
          'Invalid phone': 'Número de teléfono inválido',
          'Password too short': 'La contraseña es demasiado corta',
          'Invalid password': 'Contraseña inválida',
          'Required field': 'Campo requerido',
          'Validation failed': 'Error de validación',
          'Unauthorized': 'No autorizado',
          'Forbidden': 'Acceso prohibido',
          'Not found': 'No encontrado',
          'Internal server error': 'Error interno del servidor',
          'Bad request': 'Solicitud incorrecta',
          'User not found': 'Usuario no encontrado',
          'Invalid token': 'Token inválido',
          'Token expired': 'Token expirado',
          'Access denied': 'Acceso denegado',
        };
        
        // Buscar traducción exacta
        if (translations[message]) return translations[message];
        
        // Buscar traducción parcial
        for (const [key, value] of Object.entries(translations)) {
          if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
          }
        }
        
        return message;
      };
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message;
        let translatedMessage = 'Los datos proporcionados no son válidos. Verifica la información.';
        
        if (Array.isArray(backendMessage)) {
          translatedMessage = backendMessage.map(msg => translateErrorMessage(msg)).join('\n');
        } else if (backendMessage) {
          translatedMessage = translateErrorMessage(backendMessage);
        }
        
        showError('Datos Inválidos', translatedMessage);
      } else if (error.response?.status === 401) {
        showError(
          'Sesión Expirada',
          'Token no válido o no proporcionado. Por favor, inicia sesión nuevamente.'
        );
      } else if (error.response?.status === 403) {
        showError(
          'Sin Permisos',
          'Sin permisos de administrador para realizar esta acción.'
        );
      } else if (error.response?.status === 404) {
        showError(
          'Usuario No Encontrado',
          'El usuario que intentas actualizar no existe.'
        );
      } else {
        const backendMessage = error.response?.data?.message || error.message;
        const translatedMessage = backendMessage ? translateErrorMessage(backendMessage) : 'Error al actualizar el usuario';
        showError('Error de Actualización', translatedMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-gray-900 ">Gestión de Usuarios</h1>
           <p className="text-gray-600 ">Administra los usuarios de la aplicación</p>
         </div>
         <button 
           onClick={() => setShowCreateModal(true)}
           className="btn-primary flex items-center"
         >
           <PlusIcon className="h-5 w-5 mr-2" />
           Nuevo Usuario
         </button>
       </div>

      {/* Estadísticas de Puntos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. Total Usuarios */}
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-primary-600 ">
            {formatNumber(totalUsers)}
          </div>
          <div className="text-sm text-gray-600 ">Total Usuarios</div>
          {pointsStats ? (
            <div className="text-xs text-green-600 mt-1">En el sistema</div>
          ) : statsNotice ? (
            <div className="text-xs text-gray-500 mt-1">{statsNotice}</div>
          ) : null}
        </div>
        
        {/* 2. Máximo Puntos */}
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-warning-600 ">
            {formatNumber(maxPoints)}
          </div>
          <div className="text-sm text-gray-600 ">Máximo Puntos</div>
          {pointsStats ? (
            <div className="text-xs text-orange-600 mt-1">Puntos Totales</div>
          ) : statsNotice ? (
            <div className="text-xs text-gray-500 mt-1">{statsNotice}</div>
          ) : null}
        </div>
        
        {/* 3. Media de Puntos */}
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-success-600 ">
            {formatNumber(averagePoints)}
          </div>
          <div className="text-sm text-gray-600 ">Media de Puntos</div>
          {pointsStats ? (
            <div className="text-xs text-blue-600 mt-1">Puntos Totales</div>
          ) : statsNotice ? (
            <div className="text-xs text-gray-500 mt-1">{statsNotice}</div>
          ) : null}
        </div>
        
        {/* 4. Mínimo Puntos */}
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-info-600 ">
            {formatNumber(minPoints)}
          </div>
          <div className="text-sm text-gray-600 ">Mínimo Puntos</div>
          {pointsStats ? (
            <div className="text-xs text-purple-600 mt-1">Puntos Totales</div>
          ) : statsNotice ? (
            <div className="text-xs text-gray-500 mt-1">{statsNotice}</div>
          ) : null}
        </div>
      </div>

      {/* Estadísticas sin consumo de API: sin banner de error */}

      {/* Filtros */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 " />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
          <div>
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value as 'all' | AccountUserType)}
              className="input-field"
            >
              <option value="all">Todos los tipos</option>
              <option value="UNASSIGNED">Sin plan</option>
              <option value="DEMO">Demo</option>
              <option value="PREMIUM">Premium</option>
              <option value="EXPIRED">Expirado</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {/* Selector de tamaño de página removido */}
          <div className="flex space-x-2">
            <button className="btn-secondary flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtros
            </button>
          </div>
        </div>
      </div>

             {/* Tabla de usuarios */}
       <div className="card overflow-hidden">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200 ">
             <thead className="bg-gray-50 ">
               <tr>
                <th className="table-header">Nombre</th>
                <th className="table-header">Email</th>
                <th className="table-header">Rol</th>
                <th className="table-header">Tipo de Cuenta</th>
                <th className="table-header">Estado</th>
                 <th className="table-header">Fecha de Registro</th>
                 <th className="table-header">Acciones</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200 ">
              {isLoadingUsers ? (
                // Estados de carga - Skeleton mejorado
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={`skeleton-user-${index}`} className="hover:bg-gray-50 :bg-gray-700">
                    <td className="table-cell">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-44"></div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="animate-pulse flex space-x-2 justify-end">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.map((user) => (
                 <tr key={user.user_id} className="hover:bg-gray-50 :bg-gray-700">
                   <td className="table-cell">
                     <div className="text-sm font-medium text-gray-900 ">
                       {`${user.first_name} ${user.last_name}`.trim()}
                     </div>
                   </td>
                   <td className="table-cell">
                     <div>
                       <div className="text-sm text-gray-900 ">{user.email}</div>
                       <div className="text-xs text-gray-400 ">@{user.username}</div>
                     </div>
                   </td>
                   <td className="table-cell">
                     <div className="text-sm text-gray-900 ">
                       {(Array.isArray(user.role) && user.role.length > 0) ? user.role.join(', ') : '—'}
                     </div>
                   </td>
                  <td className="table-cell">
                    <div className="text-sm font-semibold text-gray-900 tracking-wide">
                      {getPlanTableLabel(user.user_type)}
                    </div>
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(user.status)}
                  </td>
                   <td className="table-cell">
                     <span className="text-sm text-gray-900 ">
                       {new Date(user.create_at).toLocaleDateString()}
                     </span>
                   </td>
                   <td className="table-cell">
                     <div className="flex space-x-2">
                       <button
                         onClick={() => handleViewUser(user)}
                         className="text-primary-600 hover:text-primary-900 :text-primary-300"
                         title="Ver detalles"
                       >
                         <EyeIcon className="h-5 w-5" />
                       </button>
                       <button
                         onClick={() => handleEditUser(user)}
                         className="text-warning-600 hover:text-warning-900 :text-warning-300"
                         title="Editar"
                       >
                         <PencilIcon className="h-5 w-5" />
                       </button>
                       <button
                         onClick={() => handleDeleteUser(user)}
                         className="text-danger-600 hover:text-danger-900 :text-danger-300"
                         title="Eliminar"
                       >
                         <TrashIcon className="h-5 w-5" />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

        {/* Mensaje cuando no hay usuarios */}
        {!isLoadingUsers && paginatedUsers.length === 0 && (
          <div className="p-12">
            <div className="text-center">
              {(usersError && (usersError as any)?.response?.status !== 404) ? (
                <div className="text-red-600">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los usuarios</h3>
                  <p className="text-sm text-gray-500">
                    Ocurrió un problema al conectar con el servidor. Por favor, intenta de nuevo.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || accountTypeFilter !== 'all'
                      ? 'No se encontraron usuarios con los filtros aplicados.'
                      : 'Comienza creando tu primer usuario.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && accountTypeFilter === 'all' && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Crear Primer Usuario
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paginación */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 ">
          <div className="text-sm text-gray-600 ">
            {isLoadingUsers ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-52"></div>
              </div>
            ) : (
              <>
                Mostrando <span className="font-medium">{totalItems === 0 ? 0 : startIndex + 1}</span>
                {' '}–{' '}
                <span className="font-medium">{totalItems === 0 ? 0 : endIndex}</span> de <span className="font-medium">{totalItems}</span>
              </>
            )}
          </div>
          <div className="inline-flex rounded-md shadow-sm isolate">
            <button
              className="px-3 py-1 border border-gray-300 rounded-l-md text-sm disabled:opacity-50 bg-white text-gray-900 hover:bg-gray-50 :bg-gray-700"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >Primera</button>
            <button
              className="px-3 py-1 border-t border-b border-gray-300 text-sm disabled:opacity-50 bg-white text-gray-900 hover:bg-gray-50 :bg-gray-700"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >Anterior</button>
            <span className="px-3 py-1 border-t border-b border-gray-300 text-sm bg-gray-50 text-gray-900 ">
              Página {currentPage} de {Math.max(1, totalPages)}
            </span>
            <button
              className="px-3 py-1 border-t border-b border-gray-300 text-sm disabled:opacity-50 bg-white text-gray-900 hover:bg-gray-50 :bg-gray-700"
              onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
              disabled={currentPage === Math.max(1, totalPages) || totalPages === 0}
            >Siguiente</button>
            <button
              className="px-3 py-1 border border-gray-300 rounded-r-md text-sm disabled:opacity-50 bg-white text-gray-900 hover:bg-gray-50 :bg-gray-700"
              onClick={() => setCurrentPage(Math.max(1, totalPages))}
              disabled={currentPage === Math.max(1, totalPages) || totalPages === 0}
            >Última</button>
          </div>
        </div>
       </div>

             {/* Modal de detalles del usuario */}
       {selectedUser && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-6 border border-gray-200 w-full max-w-2xl shadow-lg rounded-md bg-white ">
             <div className="mt-3">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-semibold text-gray-900 ">Detalles del Usuario</h3>
                 <button
                   onClick={() => setSelectedUser(null)}
                   className="text-gray-400 hover:text-gray-600 :text-gray-300"
                 >
                   <XMarkIcon className="h-6 w-6" />
                 </button>
               </div>
               
               {/* Header del usuario con avatar */}
               <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center shrink-0 flex-none">
                     <span className="text-white text-2xl font-bold">
                        {(selectedUser.first_name + ' ' + selectedUser.last_name).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                     </span>
                   </div>
                  <div>
                     <h4 className="text-xl font-semibold text-gray-900 ">{selectedUser.first_name} {selectedUser.last_name}</h4>
                     {/* Correo removido del encabezado por solicitud */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Cuenta</h5>
                        <div className="mt-1 space-y-1 text-sm text-gray-700 ">
                          <div><span className="font-medium">Usuario:</span> @{selectedUser.username}</div>
                          <div><span className="font-medium">Correo:</span> {selectedUser.email}</div>
                          <div><span className="font-medium">Rol:</span> {(Array.isArray(selectedUser.role) && selectedUser.role.length > 0) ? selectedUser.role.join(', ') : '—'}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">Tipo de usuario:</span>
                            {renderPlanBadge(selectedUser.user_type)}
                          </div>
                        </div>
                      </div>

                      {/* Métricas - Solo se muestran si el usuario NO es ADMIN */}
                      {(!Array.isArray(selectedUser.role) || !selectedUser.role.includes('ADMIN')) && (
                        <div className="pt-3">
                          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Métricas</h5>
                          <div className="mt-1 space-y-1 text-sm text-gray-700 ">
                            <div><span className="font-medium">Total de puntos:</span> {formatNumber(selectedUser.total_points)}</div>
                            <div><span className="font-medium">Puntos ganados:</span> {formatNumber(selectedUser.earned_points)}</div>
                            <div><span className="font-medium">Puntos gastados:</span> {formatNumber(selectedUser.spent_points)}</div>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-white/40 /40 pt-3">
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contacto</h5>
                        <div className="mt-1 text-sm text-gray-700 ">
                          <span className="font-medium">Teléfono:</span> {selectedUser.phone || '—'}
                        </div>
                      </div>

                      <div className="border-t border-white/40 /40 pt-3">
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Sistema</h5>
                        <div className="mt-1 space-y-1 text-sm text-gray-700 ">
                          <div><span className="font-medium">Creación:</span> {new Date(selectedUser.create_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</div>
                          <div><span className="font-medium">Estado:</span> {selectedUser.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</div>
                          <div><span className="font-medium">Fecha de expiración:</span> {getExpirationLabel(selectedUser)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                 </div>
               </div>

              {isUnassignedPlan(selectedUser.user_type) && (
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-lg border border-dashed border-primary-200 bg-primary-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-primary-900">Usuario sin plan</p>
                    <p className="text-sm text-primary-700">
                      Invita a {selectedUser.first_name} a elegir un plan para activar beneficios y evitar bloqueos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssignPlanFromDetails(selectedUser)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
                  >
                    Asignar plan
                  </button>
                </div>
              )}

              {/* Información detallada removida por solicitud (usuario/estado/teléfono) */}

               {/* Acciones rápidas */}
               <div className="mt-6 pt-6 border-t border-gray-200 ">
                 <div className="flex justify-end space-x-3">
                   <button
                     onClick={() => {
                       setSelectedUser(null);
                       handleEditUser(selectedUser);
                     }}
                     className="btn-secondary flex items-center"
                   >
                     <PencilIcon className="h-4 w-4 mr-2" />
                     Editar Usuario
                   </button>
                   <button
                     onClick={() => setSelectedUser(null)}
                     className="btn-primary"
                   >
                     Cerrar
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
                )}

      {/* Modal de creación de usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border border-gray-200 w-full max-w-2xl shadow-lg rounded-md bg-white ">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-gray-900 ">Crear Nuevo Usuario</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 :text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Header del usuario con avatar */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-2">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                    <PlusIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 ">Nuevo Usuario</h4>
                    <p className="text-gray-600 ">Complete la información del usuario a crear</p>
                  </div>
                </div>
              </div>

              {/* Formulario de creación (replicando diseño del de edición) */}
              <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                        className="input-field"
                        placeholder="Nombre"
                        required
                      />
                    </div>
                    
                    <div className="min-h-[90px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                        className="input-field"
                        placeholder="Apellido"
                        required
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="input-field"
                        placeholder="email@ejemplo.com"
                        required
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                      <select
                        value={newUser.gender}
                        onChange={(e) => setNewUser({ ...newUser, gender: e.target.value as any })}
                        className="input-field"
                        required
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="input-field"
                        placeholder="username"
                        required
                      />
                    </div>
                    
                    <div className="min-h-[90px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="input-field"
                        placeholder="09XXXXXXXX o +593 9XXXXXXXX"
                        title="Formato: 09XXXXXXXX (10 dígitos) o +593 9XXXXXXXX"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">📱 Ej: 0987654321 o +593987654321</p>
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input
                        type="text"
                        value={newUser.address}
                        onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                        className="input-field"
                        placeholder="Calle 123"
                        required
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={newUser.birth_date}
                        onChange={(e) => setNewUser({ ...newUser, birth_date: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Información Adicional (igual al de edición) */}
                <div className="bg-blue-50 /20 rounded-lg p-1">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Información Adicional</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => {
                          const nextRole = e.target.value as NewUser['role'];
                          setNewUser((prev) => {
                            const fallbackType =
                              prev.user_type && prev.user_type !== 'ADMIN'
                                ? prev.user_type
                                : 'UNASSIGNED';
                            return {
                              ...prev,
                              role: nextRole,
                              user_type: nextRole === 'ADMIN' ? 'ADMIN' : fallbackType,
                            };
                          });
                        }}
                        className="input-field"
                        required
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                      {newUser.role === 'ADMIN' ? (
                        <select
                          value={newUser.user_type || 'ADMIN'}
                          onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value as AccountUserType })}
                          className="input-field"
                          required
                        >
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <select
                          value={newUser.user_type && newUser.user_type !== 'ADMIN' ? newUser.user_type : 'UNASSIGNED'}
                          onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value as AccountUserType })}
                          className="input-field"
                          required
                        >
                          <option value="UNASSIGNED">Sin plan</option>
                          <option value="DEMO">Demo</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="EXPIRED">Expirado</option>
                        </select>
                      )}
                    </div>

                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        value={newUser.status}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
                        className="input-field"
                        required
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="input-field pr-10"
                          placeholder="Contraseña segura"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Indicadores de validación de contraseña */}
                      {newUser.password && newUser.password.trim() !== '' && (
                        <div className="mt-2 space-y-1 text-xs">
                          <div className={`flex items-center ${newUser.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{newUser.password.length >= 8 ? '✓' : '○'}</span>
                            <span>Mínimo 8 caracteres</span>
                          </div>
                          <div className={`flex items-center ${/[A-Z]/.test(newUser.password) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[A-Z]/.test(newUser.password) ? '✓' : '○'}</span>
                            <span>Al menos una letra mayúscula</span>
                          </div>
                          <div className={`flex items-center ${/[a-z]/.test(newUser.password) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[a-z]/.test(newUser.password) ? '✓' : '○'}</span>
                            <span>Al menos una letra minúscula</span>
                          </div>
                          <div className={`flex items-center ${/[0-9]/.test(newUser.password) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[0-9]/.test(newUser.password) ? '✓' : '○'}</span>
                            <span>Al menos un número</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Crear Usuario
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

       {/* Modal de edición de usuario */}
       {showEditModal && editingUser && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-6 border border-gray-200 w-full max-w-2xl shadow-lg rounded-md bg-white ">
             <div className="mt-3">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-2xl font-semibold text-gray-900 ">Editar Usuario</h3>
                 <button
                   onClick={() => setShowEditModal(false)}
                   className="text-gray-400 hover:text-gray-600 :text-gray-300"
                 >
                   <XMarkIcon className="h-6 w-6" />
                 </button>
               </div>
               
               {/* Header del usuario con avatar */}
               <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-2">
                 <div className="flex items-center space-x-4">
                   <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                     <span className="text-white text-2xl font-bold">
                       {(editingUser.first_name + ' ' + editingUser.last_name).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                     </span>
                   </div>
                   <div>
                     <h4 className="text-xl font-semibold text-gray-900 ">{editingUser.first_name} {editingUser.last_name}</h4>
                     <p className="text-gray-600 ">{editingUser.email}</p>
                      <div className="mt-2">{getStatusBadge(editingUser.status)}</div>
                   </div>
                 </div>
               </div>

              {/* Formulario de edición (replicando diseño del de creación) */}
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={editingUser.first_name}
                        onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="min-h-[90px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={editingUser.last_name}
                        onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value as 'Masculino' | 'Femenino' | 'Otro')}
                        className="input-field"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                      <input
                        type="text"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="min-h-[90px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={editingUser.phone || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        className="input-field"
                        placeholder="09XXXXXXXX o +593 9XXXXXXXX"
                        title="Formato: 09XXXXXXXX (10 dígitos) o +593 9XXXXXXXX"
                      />
                      <p className="text-xs text-gray-500 mt-1">📱 Ej: 0987654321 o +593987654321</p>
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="input-field"
                        placeholder="Calle 123"
                      />
                    </div>

                    <div className="min-h-[72px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={editBirthDate}
                        onChange={(e) => setEditBirthDate(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    

                  </div>
                </div>

                {/* Información Adicional (igual al de creación) */}
                <div className="bg-blue-50 /20 rounded-lg p-1">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Información Adicional</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                      <select
                        value={editRole}
                        onChange={(e) => {
                          const next = e.target.value as 'ADMIN' | 'USER';
                          setEditRole(next);
                          // Actualizar automáticamente el user_type según el rol
                          if (next === 'ADMIN') {
                            setEditUserType('ADMIN');
                          } else {
                            setEditUserType((prev) => (prev === 'ADMIN' ? 'UNASSIGNED' : prev));
                          }
                        }}
                        className="input-field"
                        required
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                      {editRole === 'ADMIN' ? (
                        <select
                          value={editUserType}
                          onChange={(e) => setEditUserType(e.target.value as AccountUserType)}
                          className="input-field"
                          required
                        >
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <select
                          value={editUserType === 'ADMIN' ? 'UNASSIGNED' : editUserType}
                          onChange={(e) => setEditUserType(e.target.value as AccountUserType)}
                          className="input-field"
                          required
                        >
                          <option value="UNASSIGNED">Sin plan</option>
                          <option value="DEMO">Demo</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="EXPIRED">Expirado</option>
                        </select>
                      )}
                    </div>

                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        value={editingUser.status}
                        onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                        className="input-field"
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 /50 rounded-lg p-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="input-field pr-10"
                          placeholder="Dejar vacío para no cambiar"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Indicadores de validación de contraseña */}
                      {editPassword && editPassword.trim() !== '' && (
                        <div className="mt-2 space-y-1 text-xs">
                          <div className={`flex items-center ${editPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{editPassword.length >= 8 ? '✓' : '○'}</span>
                            <span>Mínimo 8 caracteres</span>
                          </div>
                          <div className={`flex items-center ${/[A-Z]/.test(editPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[A-Z]/.test(editPassword) ? '✓' : '○'}</span>
                            <span>Al menos una letra mayúscula</span>
                          </div>
                          <div className={`flex items-center ${/[a-z]/.test(editPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[a-z]/.test(editPassword) ? '✓' : '○'}</span>
                            <span>Al menos una letra minúscula</span>
                          </div>
                          <div className={`flex items-center ${/[0-9]/.test(editPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className="mr-1">{/[0-9]/.test(editPassword) ? '✓' : '○'}</span>
                            <span>Al menos un número</span>
                          </div>
                        </div>
                      )}
                    </div>
                   </div>
                 </div>

                

                 {/* Botones de acción */}
                 <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                   <button
                     type="button"
                     onClick={() => setShowEditModal(false)}
                     className="btn-secondary"
                   >
                     Cancelar
                   </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Actualizando...
                       </>
                     ) : (
                       'Actualizar Usuario'
                     )}
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* Modal de confirmación de eliminación */}
       {showDeleteModal && deletingUser && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white ">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 /30 rounded-full mb-4">
                 <TrashIcon className="h-6 w-6 text-red-600 " />
               </div>
               
               <div className="text-center">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   ¿Eliminar Usuario?
                 </h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500 mb-4">
                     ¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.
                   </p>
                   
                   {/* Información del usuario a eliminar */}
                   <div className="bg-gray-50 /50 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shrink-0 flex-none">
                         <span className="text-white text-sm font-bold">
                           {(deletingUser.first_name + ' ' + deletingUser.last_name).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                         </span>
                       </div>
                       <div>
                         <div className="text-sm font-medium text-gray-900 ">
                           {deletingUser.first_name} {deletingUser.last_name}
                         </div>
                         <div className="text-sm text-gray-500 ">{deletingUser.email}</div>
                         <div className="text-xs text-gray-400 ">@{deletingUser.username}</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex space-x-3 px-4 py-3">
                 <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingUser(null);
                  }}
                  className="btn-secondary flex-1"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleteMutation.isPending}
                  className={`flex items-center justify-center text-white font-medium py-2 px-4 rounded-md text-sm transition-colors ${
                    deleteMutation.isPending 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {deleteMutation.isPending ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Eliminando...
                     </>
                   ) : (
                     'Eliminar'
                   )}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default UsersPage;




import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  QuestionMarkCircleIcon,
  GiftIcon,
  TicketIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Area, 
  ComposedChart 
} from 'recharts';
import { 
  useDashboardStats, 
  useUserGrowth, 
  useUserTypes, 
  useRecentActivity,
  useUsersTotal
} from '../../hooks/useDashboard';

/**
 * Dashboard Principal - Versión con React Query
 * 
 * CAMBIOS PRINCIPALES:
 * - ❌ Eliminados todos los useEffect manuales
 * - ❌ Eliminados estados de loading/error manuales
 * - ❌ Eliminado LocalStorage manual
 * - ❌ Eliminados locks con useRef
 * - ❌ Eliminado debounce manual
 * - ✅ Todo se maneja con React Query hooks
 * - ✅ Caché automático
 * - ✅ Actualización en background
 * - ✅ Sincronización entre pestañas
 */
const DashboardPage: React.FC = () => {
  // Estado local solo para UI (selectores de año independientes)
  const currentYear = new Date().getFullYear();
  const [yearGrowth, setYearGrowth] = useState<number>(currentYear);
  const [yearTypes, setYearTypes] = useState<number>(currentYear);
  const [activeUserTypeIndex, setActiveUserTypeIndex] = useState<number | null>(null);

  // Estados para controlar carga escalonada con delays
  const [enableUsersTotal, setEnableUsersTotal] = useState(false);
  const [enableGrowth, setEnableGrowth] = useState(false);
  const [enableTypes, setEnableTypes] = useState(false);
  const [enableRecent, setEnableRecent] = useState(false);

  // ✨ React Query hooks con carga escalonada y delays progresivos
  
  // 1. Stats primero (inmediato - 0ms)
  const { data: statsData, isLoading: isLoadingStats, error: statsError } = useDashboardStats();
  
  // 2. Total de usuarios (delay: 80ms después de stats)
  const { data: usersTotalFromList } = useUsersTotal({ enabled: enableUsersTotal });
  
  // 3. Crecimiento (delay: 100ms después de stats)
  const { data: userGrowth = [], isLoading: isLoadingGrowth, error: growthError } = useUserGrowth({ 
    year: yearGrowth,
    enabled: enableGrowth
  });
  
  // 4. Tipos de usuario (delay: 150ms después de stats)
  const { data: userTypes = [], isLoading: isLoadingUserTypes, error: userTypesError } = useUserTypes({ 
    year: yearTypes,
    enabled: enableTypes
  });
  
  // 5. Actividad reciente (delay: 200ms después de stats)
  const { data: recentActivities = [], isLoading: isLoadingRecent, error: recentError } = useRecentActivity({ 
    limit: 5,
    enabled: enableRecent
  });

  // Escalonar la carga de queries con useEffect
  useEffect(() => {
    if (!isLoadingStats && statsData) {
      // Una vez que stats termina, activar las demás con delays progresivos
      const timer1 = setTimeout(() => setEnableUsersTotal(true), 80);
      const timer2 = setTimeout(() => setEnableGrowth(true), 100);
      const timer3 = setTimeout(() => setEnableTypes(true), 150);
      const timer4 = setTimeout(() => setEnableRecent(true), 200);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [isLoadingStats, statsData]);

  // Colores para el gráfico de tipos de usuario
  const USER_TYPE_COLORS: Record<string, string> = {
    PREMIUM: '#10B981',
    SUSCRITO: '#10B981',
    SUBSCRIBED: '#10B981',
    DEMO: '#F59E0B',
    UNASSIGNED: '#6366F1',
    FREE: '#60A5FA',
    EXPIRADO: '#EF4444',
    EXPIRED: '#EF4444',
    INACTIVE: '#9CA3AF',
  };

  // Mapeo de nombres técnicos a nombres en español amigables
  const USER_TYPE_LABELS: Record<string, string> = {
    PREMIUM: 'Suscritos',
    SUSCRITO: 'Suscritos',
    SUBSCRIBED: 'Suscritos',
    DEMO: 'Demos',
    UNASSIGNED: 'Sin plan',
    FREE: 'Gratuitos',
    EXPIRADO: 'Expirados',
    EXPIRED: 'Expirados',
    INACTIVE: 'Inactivos',
  };
  
  const fallbackColors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F472B6', '#22C55E'];
  
  const userTypeChartData = userTypes
    .map((t, idx) => {
      const userTypeKey = t.userType?.toUpperCase?.() || '';
      return {
        name: USER_TYPE_LABELS[userTypeKey] || t.userType || 'Otros',
        value: t.count,
        color: USER_TYPE_COLORS[userTypeKey] || fallbackColors[idx % fallbackColors.length],
      };
    })
    .sort((a, b) => (b.value || 0) - (a.value || 0));
  
  const userTypesTotal = userTypeChartData.reduce((sum, d) => sum + (d.value || 0), 0);

  // Tarjetas de estadísticas
  const stats = [
    {
      name: 'Usuarios Totales',
      value: ((): string => {
        const val = (typeof usersTotalFromList === 'number')
          ? usersTotalFromList
          : (statsData?.totalUsers ?? null);
        return typeof val === 'number' ? val.toLocaleString() : '—';
      })(),
      icon: UsersIcon,
    },
    {
      name: 'Trivias Activas',
      value: statsData ? statsData.activeTrivias.toLocaleString() : '—',
      icon: QuestionMarkCircleIcon,
    },
    {
      name: 'Premios Disponibles',
      value: statsData ? statsData.activeRewards.toLocaleString() : '—',
      icon: GiftIcon,
    },
    {
      name: 'Sorteos Activos',
      value: statsData ? statsData.activeRaffles.toLocaleString() : '—',
      icon: TicketIcon,
    },
    {
      name: 'Encuestas Activas',
      value: statsData ? statsData.completedSurveys.toLocaleString() : '—',
      icon: ChartBarIcon,
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Dashboard</h1>
          <p className="text-gray-600">Resumen general de la aplicación de Trivia</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {isLoadingStats && (
          [...Array(3)].map((_, idx) => (
            <div key={`stats-skel-${idx}`} className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-7 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        )}
        
        {statsError && (
          <div className="col-span-full">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              Error al cargar estadísticas. Por favor, intenta de nuevo.
            </div>
          </div>
        )}
        
        {!isLoadingStats && !statsError && stats.map((stat) => (
          <div key={stat.name} className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 ">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Crecimiento de usuarios */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Crecimiento de Usuarios</h3>
            <div className="flex items-center space-x-2">
              <label htmlFor="year-growth" className="text-sm text-gray-600">Año</label>
              <select
                id="year-growth"
                value={yearGrowth}
                onChange={(e) => setYearGrowth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: currentYear - 2022 + 1 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoadingGrowth ? (
            <div className="h-[300px]">
              <div className="h-full w-full animate-pulse">
                <div className="h-6 w-40 bg-gray-200 rounded mb-3"></div>
                <div className="h-[240px] bg-gray-100 rounded"></div>
              </div>
            </div>
          ) : growthError ? (
            <div className="h-[300px] flex items-center justify-center text-red-600 bg-red-50 border border-red-200 rounded-md">
              Error al cargar datos de crecimiento
            </div>
          ) : (
            (() => {
              const hasAnyData = userGrowth.some(u => (u.totalUsers || 0) > 0 || (u.activeUsers || 0) > 0);
              if (!hasAnyData) {
                return (
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-600">No hay datos para {yearGrowth}.</p>
                  </div>
                );
              }
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={userGrowth.map(u => ({ month: u.month, users: u.totalUsers, active: u.activeUsers }))}>
                    <defs>
                      <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v: number) => (typeof v === 'number' ? v.toLocaleString('es-PE') : v)} />
                    <Tooltip formatter={(value: number) => (typeof value === 'number' ? value.toLocaleString('es-PE') : value)} />
                    <Legend verticalAlign="top" height={28} />
                    <Area type="monotone" dataKey="active" stroke="none" fill="url(#activeGradient)" fillOpacity={0.28} isAnimationActive={true} animationDuration={300} legendType="none" />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} name="Usuarios Totales" dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={2} name="Usuarios Activos" dot={false} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              );
            })()
          )}
        </div>

        {/* Tipos de usuario */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tipos de Usuario</h3>
            <div className="flex items-center space-x-2">
              <label htmlFor="year-user-types" className="text-sm text-gray-600">Año</label>
              <select
                id="year-user-types"
                value={yearTypes}
                onChange={(e) => setYearTypes(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: currentYear - 2022 + 1 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoadingUserTypes ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="h-full w-full animate-pulse">
                <div className="h-6 w-40 bg-gray-200 rounded mb-3 mx-auto"></div>
                <div className="h-[240px] bg-gray-100 rounded"></div>
            </div>
          </div>
          ) : userTypesError ? (
            <div className="h-[300px] flex items-center justify-center text-red-600 bg-red-50 border border-red-200 rounded-md">
              Error al cargar tipos de usuario
            </div>
          ) : userTypeChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
              No hay datos para {yearTypes}.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Legend verticalAlign="top" height={28} />
                <Pie
                  data={userTypeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={false}
                  onMouseEnter={(_, idx) => setActiveUserTypeIndex(idx)}
                  onMouseLeave={() => setActiveUserTypeIndex(null)}
                >
                  {userTypeChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={1}
                      fillOpacity={activeUserTypeIndex === null ? 1 : (activeUserTypeIndex === index ? 1 : 0.5)}
                    />
                  ))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan className="fill-gray-900" fontSize="16" fontWeight="600">{userTypesTotal.toLocaleString('es-PE')}</tspan>
                  <tspan x="50%" dy="1.2em" className="fill-gray-500" fontSize="12">Total</tspan>
                </text>
                <Tooltip 
                  formatter={(value: number, name: string, item: any) => {
                    const count = typeof value === 'number' ? value.toLocaleString('es-PE') : value;
                    const pct = item?.payload?.percent ? `${(item.payload.percent * 100).toFixed(0)}%` : '—';
                    return [`${count} (${pct})`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        
        {isLoadingRecent ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentError ? (
          <div className="p-6 text-red-600 bg-red-50 border-t border-red-200">
            Error al cargar actividad reciente
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="p-6">
            <div className="h-[180px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              No hay actividad reciente.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentActivities.map((a, idx) => (
              <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 ">{a.title}</p>
                    <p className="text-sm text-gray-500 ">{a.description}</p>
                  </div>
                  <p className="text-sm text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

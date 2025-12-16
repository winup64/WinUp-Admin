import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
  GiftIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { convertToCSV, downloadFile } from '../../utils';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  // Datos de ejemplo para los gráficos
  const userData = [
    { month: 'Ene', users: 1200, active: 800, new: 150, churned: 50 },
    { month: 'Feb', users: 1500, active: 950, new: 200, churned: 30 },
    { month: 'Mar', users: 1800, active: 1100, new: 180, churned: 40 },
    { month: 'Abr', users: 2200, active: 1400, new: 250, churned: 35 },
    { month: 'May', users: 2500, active: 1600, new: 220, churned: 45 },
    { month: 'Jun', users: 2800, active: 1800, new: 200, churned: 55 },
  ];

  const revenueData = [
    { month: 'Ene', revenue: 5000, subscriptions: 45, avgRevenue: 111 },
    { month: 'Feb', revenue: 7500, subscriptions: 68, avgRevenue: 110 },
    { month: 'Mar', revenue: 9000, subscriptions: 82, avgRevenue: 110 },
    { month: 'Abr', revenue: 12000, subscriptions: 109, avgRevenue: 110 },
    { month: 'May', revenue: 15000, subscriptions: 136, avgRevenue: 110 },
    { month: 'Jun', revenue: 18000, subscriptions: 164, avgRevenue: 110 },
  ];

  const userTypeData = [
    { name: 'Suscritos', value: 60, color: '#10B981' },
    { name: 'Demo', value: 20, color: '#F59E0B' },
    { name: 'Expirados', value: 10, color: '#EF4444' },
    { name: 'Sin plan', value: 10, color: '#6366F1' },
  ];

  const stats = [
    {
      name: 'Usuarios Activos',
      value: '1,847',
      change: '+12%',
      changeType: 'positive',
      icon: UsersIcon,
      detail: 'vs mes anterior',
    },
    {
      name: 'Ingresos Mensuales',
      value: '$18,000',
      change: '+18%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      detail: 'vs mes anterior',
    },
    {
      name: 'Preguntas Jugadas',
      value: '45,678',
      change: '+8%',
      changeType: 'positive',
      icon: QuestionMarkCircleIcon,
      detail: 'este mes',
    },
    {
      name: 'Premios Entregados',
      value: '234',
      change: '+15%',
      changeType: 'positive',
      icon: GiftIcon,
      detail: 'este mes',
    },
    {
      name: 'Sorteos Activos',
      value: '12',
      change: '-2',
      changeType: 'negative',
      icon: TicketIcon,
      detail: 'vs mes anterior',
    },
    {
      name: 'Tasa de Conversión',
      value: '8.5%',
      change: '+2.1%',
      changeType: 'positive',
      icon: ChartBarIcon,
      detail: 'demo a suscrito',
    },
  ];

  const recentActivities = [
    { id: 1, action: 'Nuevo usuario registrado', user: 'maria.garcia@email.com', time: '2 min ago', type: 'user' },
    { id: 2, action: 'Sorteo completado', user: 'iPhone 15 Pro', time: '1 hora ago', type: 'raffle' },
    { id: 3, action: 'Nueva pregunta agregada', user: 'Categoría Historia', time: '3 horas ago', type: 'question' },
    { id: 4, action: 'Premio reclamado', user: 'Gift Card $50', time: '5 horas ago', type: 'reward' },
    { id: 5, action: 'Encuesta creada', user: 'Satisfacción del usuario', time: '1 día ago', type: 'survey' },
    { id: 6, action: 'Suscripción renovada', user: 'juan.perez@email.com', time: '1 día ago', type: 'subscription' },
  ];

  const handleExportData = (type: string) => {
    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    switch (type) {
      case 'users':
        data = userData.map(item => ({
          Mes: item.month,
          'Usuarios Totales': item.users,
          'Usuarios Activos': item.active,
          'Nuevos Usuarios': item.new,
          'Usuarios Perdidos': item.churned
        }));
        filename = 'reporte_usuarios.csv';
        headers = ['Mes', 'Usuarios Totales', 'Usuarios Activos', 'Nuevos Usuarios', 'Usuarios Perdidos'];
        break;
      case 'revenue':
        data = revenueData.map(item => ({
          Mes: item.month,
          'Ingresos': `$${item.revenue.toLocaleString()}`,
          'Suscripciones': item.subscriptions,
          'Ingreso Promedio': `$${item.avgRevenue}`
        }));
        filename = 'reporte_ingresos.csv';
        headers = ['Mes', 'Ingresos', 'Suscripciones', 'Ingreso Promedio'];
        break;
    }

    const csvContent = convertToCSV(data, headers);
    downloadFile(csvContent, filename);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UsersIcon className="h-4 w-4 text-primary-600" />;
      case 'raffle':
        return <TicketIcon className="h-4 w-4 text-success-600" />;
      case 'question':
        return <QuestionMarkCircleIcon className="h-4 w-4 text-warning-600" />;
      case 'reward':
        return <GiftIcon className="h-4 w-4 text-danger-600" />;
      case 'survey':
        return <DocumentChartBarIcon className="h-4 w-4 text-secondary-600" />;
      case 'subscription':
        return <CurrencyDollarIcon className="h-4 w-4 text-success-600" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Analítica</h1>
          <p className="text-gray-600">Análisis detallado del rendimiento de la aplicación</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <button 
            onClick={() => handleExportData('users')}
            className="btn-secondary flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.detail}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de usuarios */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Crecimiento de Usuarios</h3>
            <button 
              onClick={() => handleExportData('users')}
              className="text-primary-600 hover:text-primary-900 text-sm"
            >
              Exportar
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Usuarios Totales" />
              <Area type="monotone" dataKey="active" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Usuarios Activos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ingresos */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ingresos Mensuales</h3>
            <button 
              onClick={() => handleExportData('revenue')}
              className="text-primary-600 hover:text-primary-900 text-sm"
            >
              Exportar
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']} />
              <Bar dataKey="revenue" fill="#10B981" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico secundario */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Tipos de usuario */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Usuario</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userTypeData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {userTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-primary-600 mb-2">85%</div>
          <div className="text-sm text-gray-600">Tasa de Retención</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-success-600 mb-2">12.5</div>
          <div className="text-sm text-gray-600">Preguntas por Sesión</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-warning-600 mb-2">$45</div>
          <div className="text-sm text-gray-600">LTV Promedio</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-danger-600 mb-2">3.2</div>
          <div className="text-sm text-gray-600">Días para Conversión</div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

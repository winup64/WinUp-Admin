# 🎯 Sistema de Administración Web - Trivia App

## 📋 Descripción

Sistema de administración web completo para la aplicación móvil de Trivia, desarrollado con **React 18**, **TypeScript** y **Tailwind CSS**. Este panel permite a los administradores gestionar todos los aspectos de la aplicación desde una interfaz web moderna, responsiva y fácil de usar.

## 🚀 Características Principales

### ✅ **Funcionalidades Implementadas**

#### 🔐 **Autenticación y Seguridad**
- Sistema de login seguro con validación
- Gestión de sesiones con localStorage
- Rutas protegidas automáticas
- Roles de administrador y super administrador
- Validación de acceso por módulo

#### 📊 **Dashboard y Analítica Avanzada**
- **Métricas en tiempo real**: Usuarios activos, ingresos, preguntas jugadas
- **Gráficos interactivos**: Área, barras, circulares y líneas
- **KPIs principales**: Tasa de retención, LTV, conversión
- **Actividad reciente** con timeline visual
- **Exportación de datos** en formato CSV

#### 👥 **Gestión Completa de Usuarios**
- Listado con búsqueda avanzada y filtros
- Gestión de perfiles y estados (Demo/Suscrito/Expirado)
- Vista detallada de cada usuario
- Edición de información y puntos
- Suspensión/Reactivación de cuentas

#### 🎮 **Gestión de Contenido Avanzada**
- **Categorías**: CRUD completo con colores personalizados
- **Preguntas**: Creación con múltiples opciones, dificultades y explicaciones
- **Sistema de puntos** configurable por pregunta
- **Validación completa** de formularios
- **Estados activo/inactivo** para todo el contenido

#### 🏆 **Sistema de Premios y Sorteos**
- **Catálogo de premios** con gestión de stock
- **Diferentes tipos**: Físicos, Digitales, Gift Cards
- **Sorteos configurables** con umbrales de puntos
- **Seguimiento en tiempo real** de participantes
- **Historial de ganadores** y entregas

#### 📝 **Sistema de Encuestas Completo**
- **Múltiples tipos** de preguntas: Texto, múltiple opción, rating, sí/no
- **Puntos opcionales** por completar encuestas
- **Análisis de respuestas** en tiempo real
- **Exportación de datos** de encuestas
- **Filtros por fecha** y tipo de pregunta

#### 🏅 **Testimonios y Credibilidad**
- **Gestión de testimonios** con sistema de verificación
- **Ratings de 1 a 5 estrellas**
- **Registro de ganadores** de sorteos
- **Estados activo/inactivo** para contenido
- **Filtros por rating** y verificación

#### 🔔 **Sistema de Notificaciones Avanzado**
- **Notificaciones push** con diferentes tipos
- **Destinatarios específicos**: Todos, Demo, Suscritos, Usuarios específicos
- **Programación de envío** de notificaciones
- **Sistema de alertas toast** en tiempo real
- **Historial** de notificaciones enviadas

#### ⚙️ **Configuración del Sistema**
- **Modo demo** configurable con límites
- **Control granular** de funcionalidades
- **Modo mantenimiento** con mensaje personalizado
- **Configuración de notificaciones** del sistema
- **Parámetros generales** ajustables

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 18** - Biblioteca de interfaz de usuario con hooks modernos
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Framework de estilos utility-first
- **React Router** - Navegación declarativa
- **Heroicons** - Iconografía moderna y consistente
- **Recharts** - Gráficos y visualizaciones interactivas

### **Estado y Datos**
- **Context API** - Estado global de React
- **localStorage** - Persistencia de sesiones
- **Mock data** - Datos de demostración completos
- **Tipos TypeScript** - Interfaces y tipos definidos

### **Herramientas de Desarrollo**
- **Vite** - Build tool y dev server rápido
- **PostCSS** - Procesamiento de CSS
- **ESLint** - Linting de código TypeScript
- **Prettier** - Formateo automático de código

## 📦 Instalación y Configuración

### **Prerrequisitos**
- Node.js 16+ 
- npm o yarn

### **Instalación**

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd trivia-website-administrator
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env.local
echo "REACT_APP_API_URL=http://localhost:3001" > .env.local
```

4. **Iniciar servidor de desarrollo**
```bash
npm start
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

### **Credenciales de Prueba**
- **Email**: admin@trivia.com
- **Contraseña**: admin123

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── auth/           # Componentes de autenticación
│   ├── layout/         # Layout principal
│   └── ui/             # Componentes de interfaz
├── contexts/           # Contextos de React
│   ├── AuthContext.tsx # Autenticación
│   └── NotificationContext.tsx # Notificaciones
├── pages/              # Páginas principales
│   ├── auth/           # Páginas de autenticación
│   ├── dashboard/      # Dashboard principal
│   ├── users/          # Gestión de usuarios
│   ├── categories/     # Gestión de categorías
│   ├── questions/      # Gestión de preguntas
│   ├── rewards/        # Gestión de premios
│   ├── raffles/        # Gestión de sorteos
│   ├── surveys/        # Gestión de encuestas
│   ├── testimonials/   # Testimonios y ganadores
│   ├── notifications/  # Gestión de notificaciones
│   ├── reports/        # Reportes y analítica
│   └── settings/       # Configuración del sistema
├── types/              # Definiciones de TypeScript
├── utils/              # Utilidades y helpers
└── config/             # Configuración del sistema
```

## 🎨 Diseño y UI/UX

### **Paleta de Colores**
- **Primary**: Azul (#3B82F6)
- **Success**: Verde (#10B981)
- **Warning**: Amarillo (#F59E0B)
- **Danger**: Rojo (#EF4444)
- **Secondary**: Gris (#64748B)

### **Tema de Diseño**
- **Modo claro exclusivo** - Interfaz optimizada para máxima legibilidad
- **Sin modo oscuro** - Diseño consistente y uniforme
- **Colores suaves** - Reducción de fatiga visual
- **Contraste optimizado** - Accesibilidad mejorada

### **Componentes Reutilizables**
- **Botones**: Primary, Secondary, Danger con estados
- **Cards**: Con sombras suaves y bordes redondeados
- **Badges**: Estados con colores diferenciados
- **Campos de entrada**: Con validación y estados
- **Tablas**: Responsivas con paginación
- **Modales**: Con animaciones y overlay
- **Notificaciones Toast**: Con diferentes tipos y duraciones

### **Responsive Design**
- **Mobile-first approach** con breakpoints optimizados
- **Sidebar colapsible** en dispositivos móviles
- **Tablas con scroll horizontal** en pantallas pequeñas
- **Modales responsivos** que se adaptan al contenido
- **Gráficos adaptativos** que mantienen la legibilidad

## 🔧 Funcionalidades por Módulo

### **Dashboard**
- ✅ Métricas principales con comparaciones
- ✅ Gráficos de crecimiento y tendencias
- ✅ Actividad reciente con timeline
- ✅ KPIs clave del negocio
- ✅ Exportación de datos

### **Usuarios**
- ✅ Listado completo con filtros avanzados
- ✅ Búsqueda por nombre y email
- ✅ Gestión de estados y puntos
- ✅ Vista detallada de perfiles
- ✅ Acciones de edición y eliminación

### **Categorías**
- ✅ CRUD completo con validación
- ✅ Colores personalizados por categoría
- ✅ Estados activo/inactivo
- ✅ Contador de preguntas asociadas
- ✅ Formularios validados

### **Preguntas**
- ✅ Creación con múltiples opciones
- ✅ Diferentes niveles de dificultad
- ✅ Sistema de puntos configurable
- ✅ Explicaciones para respuestas
- ✅ Filtros por categoría y dificultad
- ✅ Estados activo/inactivo

### **Premios**
- ✅ Catálogo con gestión de stock
- ✅ Diferentes tipos de premios
- ✅ Puntos requeridos configurables
- ✅ Estados activo/inactivo
- ✅ Soporte para imágenes

### **Sorteos**
- ✅ Creación con fechas y umbrales
- ✅ Seguimiento de participantes
- ✅ Información de ganadores
- ✅ Estados activo/inactivo
- ✅ Estadísticas de participación

### **Encuestas**
- ✅ Múltiples tipos de preguntas
- ✅ Puntos opcionales por completar
- ✅ Análisis de respuestas
- ✅ Exportación de datos
- ✅ Filtros por fecha y tipo

### **Testimonios**
- ✅ Gestión con sistema de verificación
- ✅ Ratings de 1 a 5 estrellas
- ✅ Registro de ganadores
- ✅ Estados activo/inactivo
- ✅ Filtros por rating

### **Notificaciones**
- ✅ Diferentes tipos de notificación
- ✅ Destinatarios específicos
- ✅ Programación de envío
- ✅ Estados activo/inactivo
- ✅ Historial de envíos

### **Reportes**
- ✅ Gráficos interactivos múltiples
- ✅ Métricas detalladas por segmento
- ✅ Exportación en formato CSV
- ✅ Filtros de fecha configurables
- ✅ KPIs principales

### **Configuración**
- ✅ Modo demo configurable
- ✅ Control de funcionalidades
- ✅ Modo mantenimiento
- ✅ Configuración de notificaciones
- ✅ Parámetros generales

## 🔐 Seguridad

### **Autenticación**
- Login seguro con validación de credenciales
- Gestión de sesiones con localStorage
- Rutas protegidas automáticas
- Logout automático por inactividad

### **Autorización**
- Roles de administrador definidos
- Permisos por módulo configurables
- Validación de acceso en cada acción
- Auditoría de acciones (preparado)

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### **Características**
- Sidebar colapsible en móviles
- Navegación adaptativa
- Tablas con scroll horizontal
- Modales responsivos
- Gráficos adaptativos

## 🚀 Comandos Disponibles

### **Desarrollo**
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

### **Producción**
```bash
# Build para producción
npm run build
```

### **Tests**
```bash
# Ejecutar tests
npm test
```

## 🔄 Integración con App Móvil

### **API Endpoints Conectados**
- `/users-admin/users` - Gestión de usuarios
- `/categories-admin/categories` - Categorías
- `/trivias-admin/trivias` - Preguntas
- `/rewards-admin/rewards` - Premios
- `/surveys-admin` - Encuestas
- `/testimonials-admin/testimonials` - Testimonios
- `/notifications-admin/notifications` - Notificaciones ✅ **CONECTADO**

### **Sincronización**
- Configuración en tiempo real
- Actualización de contenido
- Notificaciones push
- Métricas sincronizadas

## 📈 Roadmap

### **Fase 1 - Funcionalidades Básicas** ✅
- [x] Autenticación completa
- [x] Dashboard con métricas
- [x] Gestión de usuarios
- [x] Gestión de categorías
- [x] Gestión de preguntas

### **Fase 2 - Contenido y Premios** ✅
- [x] Gestión de premios
- [x] Gestión de sorteos
- [x] Sistema de encuestas
- [x] Testimonios y ganadores
- [x] Sistema de notificaciones

### **Fase 3 - Analítica y Reportes** ✅
- [x] Reportes avanzados
- [x] Gráficos interactivos
- [x] Exportación de datos
- [x] Configuración del sistema
- [x] Sistema de notificaciones toast

### **Fase 4 - Avanzado** 🚧
- [ ] API REST completa
- [ ] Integración con app móvil
- [ ] Notificaciones push reales
- [ ] Analytics avanzado
- [ ] Exportación de datos mejorada
- [ ] Backup automático

## 🆕 Cambios Recientes

### **Versión 1.1.0** (Actual)
- ✅ **Eliminación del modo oscuro** - Interfaz optimizada en modo claro
- ✅ **Mejoras de accesibilidad** - Mayor contraste y legibilidad
- ✅ **Optimización de rendimiento** - Código más limpio y eficiente
- ✅ **Actualización de dependencias** - Versiones más recientes y seguras

### **Mejoras de UX**
- Interfaz más limpia y profesional
- Reducción de complejidad visual
- Mejor experiencia de usuario
- Carga más rápida

## 🤝 Contribución

### **Estándares de Código**
- TypeScript estricto
- ESLint configurado
- Prettier para formato
- Commits semánticos

### **Flujo de Trabajo**
1. Fork del repositorio
2. Crear rama feature
3. Implementar cambios
4. Tests y linting
5. Pull request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: admin@trivia.com
- **Issues**: [GitHub Issues]

## 🎯 Características Destacadas

### **Sistema de Notificaciones Toast**
- Notificaciones en tiempo real
- Diferentes tipos: Success, Error, Warning, Info
- Auto-cierre configurable
- Animaciones suaves
- Posicionamiento inteligente

### **Exportación de Datos**
- Formato CSV estándar
- Filtros aplicados incluidos
- Headers en español
- Datos formateados correctamente

### **Validación Completa**
- Formularios validados en tiempo real
- Mensajes de error claros
- Validación de tipos de archivo
- Límites configurables

### **Configuración Centralizada**
- Archivo de configuración único
- Constantes reutilizables
- Configuración por entorno
- Fácil personalización

### **Diseño Optimizado**
- Modo claro exclusivo para mejor legibilidad
- Colores suaves que reducen la fatiga visual
- Interfaz limpia y profesional
- Accesibilidad mejorada

---

**Desarrollado con ❤️ para la aplicación de Trivia**

*Sistema de Administración Trivia - Versión 1.1.0*

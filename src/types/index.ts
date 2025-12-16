// Tipos para el sistema de administración de Trivia

// Importar tipos de la API
export * from './api';
export * from './auth';

// Mantener compatibilidad con tipos existentes
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  lastLogin?: string;
  permissions: string[];
}

// Nuevo tipo Admin compatible con la API
export interface ApiAdmin {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'demo' | 'subscribed' | 'expired';
  points: number;
  joinDate: string;
  lastActive: string;
  isActive: boolean;
  profileImage?: string;
  phone?: string;
  country?: string;
  timezone?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  categoryId: string;
  categoryName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  category: 'physical' | 'digital' | 'gift_card';
  createdAt: string;
  updatedAt: string;
}

// Sistema de Sorteos Mejorado
export interface MonthlyRaffle {
  id: string;
  name: string;
  month: number;
  year: number;
  totalFund: number; // 60% de las mensualidades
  weeklyRaffles: WeeklyRaffle[];
  participants: RaffleParticipant[];
  weeklyDistribution: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week5?: number; // opcional si el mes tiene 5 sábados
  };
  participantDistribution: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week5?: number; // opcional si el mes tiene 5 sábados
  };
  winnerExclusionSettings: {
    enabled: boolean;
    exclusionPeriod: 'next_week' | 'next_month' | 'custom_weeks' | 'custom_months';
    customPeriod: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyRaffle {
  id: string;
  name: string;
  description: string;
  week: number;
  weekNumber: number;
  month: number;
  year: number;
  monthlyRaffleId: string;
  fund: number; // Fondo semanal
  totalFund: number; // Fondo semanal
  pointsRequired?: number;
  winnersCount?: number; // Número de ganadores: Top 3 + resto con porcentaje igual
  maxParticipants: number;
  currentParticipants: number;
  participants: RaffleParticipant[];
  winners: RaffleWinner[];
  prizeDistribution: PrizeDistribution;
  drawDate: string;
  startDate: Date;
  endDate: Date;
  registrationStartDate: string;
  registrationEndDate: string;
  imageUrl?: string; // URL de la imagen del sorteo semanal
  isActive: boolean;
  isCompleted: boolean;
  isRegistrationOpen: boolean;
  isDrawn: boolean;
  excludedParticipants: string[]; // IDs de participantes excluidos
  createdAt: string;
  updatedAt: string;
}

export interface RaffleParticipant {
  id: string;
  name: string;
  email: string;
  points: number;
  participationLevel: 'bronze' | 'silver' | 'gold' | 'diamond';
  joinedAt: string;
  profileImage?: string;
  status: 'registered' | 'winner' | 'loser';
  position?: number;
  prizeAmount?: number;
  multiplier: number; // Multiplicador por nivel de participación
  activityScore: number; // Puntuación de actividad
  loyaltyPoints: number; // Puntos de fidelidad
  exclusionStatus: {
    isExcluded: boolean;
    excludedUntil?: string;
    reason?: 'winner' | 'manual' | 'suspension';
    excludedFromRaffles: string[];
  };
}

export interface RaffleWinner {
  id: string;
  name: string;
  email: string;
  phone?: string; // Teléfono del ganador
  position: number; // 1-10
  prizeAmount: number;
  prizePercentage: number;
  drawDate: string;
  isPaid: boolean;
  paymentMethod?: 'whatsapp' | 'bank_transfer' | 'crypto' | 'gift_card' | 'points';
  paymentStatus: 'pending' | 'verifying' | 'processing' | 'completed' | 'rejected' | 'refunded';
  paymentDate?: string;
  profileImage?: string;
  specialPrize?: string; // Premio especial si aplica
}

export interface PrizeRange {
  id: string;
  startPosition: number;
  endPosition: number;
  percentage: number;
}

export interface SpecialPrize {
  id: string;
  name: string;
  percentage: number;
  description?: string;
  criteria?: string;
}

export interface PrizeDistribution {
  // Premios por posición específica
  specificPositions: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
  };
  
  // Rangos de premios (ej: 4to-10mo lugar, 11vo-20vo lugar)
  prizeRanges: PrizeRange[];
}

export interface ProductRaffle {
  id: string;
  name: string;
  description: string;
  product: string;
  productValue: number;
  pointsRequired: number;
  imageUrl?: string;
  imageFile?: File;
  maxParticipants: number;
  currentParticipants: number;
  participants: RaffleParticipant[];
  winner?: RaffleWinner;
  prizeDistribution: PrizeDistribution;
  drawDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  status?: 'pending' | 'active' | 'finished' | 'inactive' | 'suspended';
  isActive: boolean;
  isCompleted: boolean;
  isRegistrationOpen: boolean;
  isDrawn: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces para el sistema de fidelidad
export interface LoyaltyLevel {
  id: string;
  name: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
  color: string;
}

export interface LoyaltyPoints {
  userId: string;
  totalPoints: number;
  currentLevel: string;
  pointsHistory: PointsTransaction[];
}

export interface PointsTransaction {
  id: string;
  points: number;
  reason: 'participation' | 'win' | 'referral' | 'activity' | 'bonus';
  description: string;
  date: string;
}

// Interfaces para analytics
export interface RaffleAnalytics {
  monthlyFund: number;
  distributedAmount: number;
  participationRate: number;
  retentionRate: number;
  averagePrize: number;
  topParticipants: RaffleParticipant[];
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  month: string;
  totalFund: number;
  distributedAmount: number;
  participants: number;
  winners: number;
  averagePrize: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  pointsReward: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  responsesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[];
  required: boolean;
  order: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  userName: string;
  answers: SurveyAnswer[];
  completedAt: string;
  pointsEarned: number;
}

export interface SurveyAnswer {
  questionId: string;
  answer: string | number;
}

// Eventos WebSocket para encuestas
export interface SurveyOptionEvent {
  option_id: string;
  option_text: string;
  image_url?: string | null;
  option_order: number;
}

export interface SurveyQuestionEvent {
  question_id: string;
  question_text: string;
  question_type: string;
  image_url?: string | null;
  required?: boolean;
  question_order: number;
  options?: SurveyOptionEvent[];
}

export interface SurveyChangedEvent {
  survey_id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  status?: string;
  points_earned?: number;
  created_at?: string | null;
  updated_at?: string | null;
  questions?: SurveyQuestionEvent[];
  action: 'created' | 'updated' | 'deleted';
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  rating: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Winner {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  prize: string;
  raffleId: string;
  raffleTitle: string;
  wonAt: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: 'all' | 'demo' | 'subscribed' | 'specific';
  targetUsers?: string[];
  isActive: boolean;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  demoMode: {
    enabled: boolean;
    durationDays: number;
    maxPoints: number;
  };
  features: {
    surveys: boolean;
    raffles: boolean;
    rewards: boolean;
    testimonials: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  demoUsers: number;
  subscribedUsers: number;
  totalQuestions: number;
  totalRewards: number;
  activeRaffles: number;
  totalPoints: number;
  surveysCompleted: number;
  testimonialsCount: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos para formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface UserForm {
  name: string;
  email: string;
  subscriptionStatus: 'demo' | 'subscribed' | 'expired';
  points: number;
}

export interface CategoryForm {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

export interface QuestionForm {
  text: string;
  categoryId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface RewardForm {
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  category: 'physical' | 'digital' | 'gift_card';
}

export interface RaffleForm {
  title: string;
  description: string;
  prize: string;
  pointsThreshold: number;
  maxParticipants: number;
  startDate: string;
  endDate: string;
  drawDate: string;
  isActive: boolean;
}

export interface SurveyForm {
  title: string;
  description: string;
  questions: SurveyQuestion[];
  pointsReward: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface TestimonialForm {
  userId: string;
  content: string;
  rating: number;
  isVerified: boolean;
  isActive: boolean;
}

export interface NotificationForm {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: 'all' | 'demo' | 'subscribed' | 'specific';
  targetUsers?: string[];
  isActive: boolean;
  scheduledAt?: string;
}

// Tipos para Trivias
export interface Trivia {
  id: string;
  nombre: string;
  categoria: string;
  dificultad: 'facil' | 'medio' | 'dificil';
  puntos: number;
  totalPreguntas?: number;
  tiempoPorPregunta?: number;
  imagen?: File | string;
  estado: 'activa' | 'inactiva';
  activacion: 'manual' | 'programada';
  fechaActivacion?: string; // Solo si activacion es 'programada'
  duracion: number; // Duración en minutos
  preguntas: Pregunta[];
  fechaCreacion: string;
  fechaActualizacion: string;
  // Nuevos campos
  premios: Premio[];
  participantes: Participante[];
  // Datos de seguimiento
  seguimiento?: TriviaSeguimiento;
}

export interface Premio {
  id: string;
  lugar: number;
  tipo: 'economico' | 'articulo';
  descripcion: string;
  valor?: number; // Solo si es económico
  articulo?: string; // Solo si es artículo
  cantidad: number;
}

export interface Participante {
  id: string;
  nombre: string;
  email: string;
  puntosMinimos: number;
  tipo: 'manual' | 'automatico';
  fechaRegistro: string;
  estado: 'activo' | 'inactivo';
}

export interface TriviaSeguimiento {
  participantes: number;
  completadas: number;
  tiempoPromedio: number; // en minutos
  puntuacionPromedio: number;
  fechaInicio?: string;
  fechaFin?: string;
  estadoActual: 'programada' | 'activa' | 'finalizada' | 'pausada';
  ultimaActividad: string;
  estadisticasPorPregunta: PreguntaEstadistica[];
  // Datos en tiempo real
  usuariosActivos: UsuarioActivo[];
  tiempoRestante?: number; // en minutos, solo si está activa
  proximaTrivia?: string; // ID de la próxima trivia programada
  // Ganadores
  ganadores: Ganador[];
}

export interface Ganador {
  id: string;
  nombre: string;
  email: string;
  puntuacion: number;
  tiempo: number; // en minutos
  posicion: number;
  fechaCompletado: string;
  premio?: string;
}

export interface UsuarioActivo {
  id: string;
  nombre: string;
  email: string;
  puntosActuales: number;
  preguntasRespondidas: number;
  tiempoTranscurrido: number; // en minutos
  tiempoRestante: number; // en minutos
  ultimaActividad: string;
  progreso: number; // porcentaje completado
}

export interface PreguntaEstadistica {
  preguntaId: string;
  texto: string;
  intentos: number;
  aciertos: number;
  tiempoPromedio: number; // en segundos
  dificultad: 'facil' | 'medio' | 'dificil';
}

export interface OpcionPregunta {
  id: string;
  texto: string;
  esCorrecta: boolean;
  orden?: number;
  answerId?: string;
}

export interface Pregunta {
  id: string;
  remoteId?: string;
  texto: string;
  imagen?: File | string; // Imagen opcional de la pregunta
  opciones: OpcionPregunta[];
  puntos: number;
  respuestaCorrecta: number; // Mantener para compatibilidad
  tiempoSegundos?: number;
  orden?: number;
}

export interface TriviaForm {
  nombre: string;
  categoria: string;
  dificultad: 'facil' | 'medio' | 'dificil';
  puntos: number;
  imagen?: File | string;
  estado: 'activa' | 'inactiva';
  activacion: 'manual' | 'programada';
  fechaActivacion?: string; // Solo si activacion es 'programada'
  duracion: number; // Duración en minutos
  tiempoPorPregunta?: number;
}

export interface PreguntaForm {
  texto: string;
  imagen?: File | string; // Imagen opcional de la pregunta
  opciones: OpcionPregunta[];
  respuestaCorrecta: number;
  puntos: number;
  tiempoSegundos?: number;
}
export const API_CONFIG = {
  //BASE_URL: "http://localhost:3001",
  BASE_URL: "https://backend-trivia-prqv.onrender.com", 
  TIMEOUT: 30000,
  AUTH_TIMEOUT: 15000,
  RESET_TIMEOUT: 45000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  //PRUEBAS DE BACKEND
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CLEANUP_TOKENS: '/auth/cleanup-tokens',
  },
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    USER_GROWTH: '/admin/dashboard/user-growth',
    USER_TYPES: '/admin/dashboard/user-types',
    RECENT_ACTIVITY: '/admin/dashboard/recent-activity',
  },
  USERS: '/users',
  USERS_ADMIN: {
    LIST: '/users-admin/users',
    GET: '/users-admin/user',
    CREATE: '/users-admin/user/create',
    UPDATE: '/users-admin/user/update',
    DELETE: '/users-admin/user',
    USER_STATS: '/users-admin/users-stats',
    USERS_STATISTICS: '/users-admin/users/statistics',
    POINTS_STATS: '/users-admin/user-profiles/points/stats',
  },
  CATEGORIES: '/categories',
  CATEGORIES_ADMIN: {
    LIST: '/categories-admin/categories',
    GET: '/categories-admin/category',
    CREATE: '/categories-admin/category/create',
    UPDATE: '/categories-admin/category/update',
    DELETE: '/categories-admin/category/delete',
  },
  QUESTIONS: '/questions',
  REWARDS: '/rewards',
  REWARDS_ADMIN: {
    LIST: '/rewards-admin/rewards',
    CREATE: '/rewards-admin/reward/create',
    UPDATE: '/rewards-admin/reward/update',
    DELETE: '/rewards-admin/reward/delete',
  },
  RAFFLES: '/raffles',
  RAFFLES_ADMIN: {
    LIST: '/raffles-admin/raffles',
    CREATE: '/raffles-admin/raffles',
    UPDATE: '/raffles-admin/raffles',
    DELETE: '/raffles-admin/raffles',
  },
  SURVEYS: '/surveys',
  SURVEYS_ADMIN: {
    LIST: '/surveys-admin',
    CREATE: '/surveys-admin',
    GET: '/surveys-admin',
    UPDATE: '/surveys-admin',
    DELETE: '/surveys-admin',
    ANALYTICS: '/surveys-admin',
    ANALYTICS_EXPORT: '/surveys-admin',
  },
  USER_SURVEYS: {
    LIST: '/user-surveys/surveys',
    GET: '/user-surveys/surveys',
    RESPONSES: '/user-surveys/surveys',
    RESULT: '/user-surveys/surveys',
  },
  TESTIMONIALS: '/testimonials',
  TESTIMONIALS_ADMIN: {
    LIST: '/testimonials-admin/testimonials',
    GET: '/testimonials-admin/testimonial',
    CREATE: '/testimonials-admin/testimonial/create',
    UPDATE: '/testimonials-admin/testimonial/update',
    DELETE: '/testimonials-admin/testimonial/delete',
  },
  TRIVIAS_ADMIN: {
    LIST: '/trivias-admin/trivias',
    GET: '/trivias-admin/trivia',
    CREATE: '/trivias-admin/trivia/create',
    UPDATE: '/trivias-admin/trivia/update',
    DELETE: '/trivias-admin/trivia/delete',
  },
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_ADMIN: {
    LIST: '/notifications-admin/notifications',
    GET: '/notifications-admin/notification',
    CREATE: '/notifications-admin/notification/create',
    UPDATE: '/notifications-admin/notification/update',
    DELETE: '/notifications-admin/notification/delete',
  },
  REPORTS: '/reports',
  SETTINGS: '/settings',
  ADMIN_SETTINGS: '/admin-settings',
};

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  TOKEN_EXPIRY: 'token_expiry',
};

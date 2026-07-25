import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Profile
export const profileAPI = {
  getBodyTypes: () => api.get('/profile/body-types'),
  setup: (data) => api.post('/profile/setup', data),
  getTransformationPlan: () => api.get('/profile/transformation-plan'),
  updateWeight: (data) => api.put('/profile/update-weight', data),
  getWeightHistory: () => api.get('/profile/weight-history'),
  getStats: () => api.get('/profile/stats'),
  allocateStats: (data) => api.put('/profile/allocate-stats', data),
};

// Quests
export const questsAPI = {
  getToday: () => api.get('/quests/today'),
  updateProgress: (questId, value) => api.put(`/quests/${questId}/progress`, { value }),
  completeQuest: (questId) => api.post(`/quests/${questId}/complete`),
  endOfDay: () => api.post('/quests/end-of-day'),
  getHistory: (days = 7) => api.get(`/quests/history?days=${days}`),
};

// Diet
export const dietAPI = {
  logFood: (data) => api.post('/diet/log', data),
  getToday: () => api.get('/diet/today'),
  getMealPlan: () => api.get('/diet/meal-plan'),
  deleteLog: (logId) => api.delete(`/diet/log/${logId}`),
  getHistory: (days = 7) => api.get(`/diet/history?days=${days}`),
};

// Steps
export const stepsAPI = {
  logSteps: (steps) => api.post('/steps/log', { steps }),
  addSteps: (steps) => api.post('/steps/add', { steps }),
  getToday: () => api.get('/steps/today'),
  getHistory: (days = 30) => api.get(`/steps/history?days=${days}`),
  getWeekly: () => api.get('/steps/weekly'),
};

// Combat
export const combatAPI = {
  getTypes: () => api.get('/combat/types'),
  getSession: (combatType, skillLevel = 'beginner', duration = 30) => 
    api.get(`/combat/session?combatType=${combatType}&skillLevel=${skillLevel}&duration=${duration}`),
  logSession: (data) => api.post('/combat/log', data),
  getHistory: (days = 30) => api.get(`/combat/history?days=${days}`),
  getStats: () => api.get('/combat/stats'),
};

// Punishment
export const punishmentAPI = {
  getStatus: () => api.get('/punishment/status'),
  getActive: () => api.get('/punishment/active'),
  getBlockedApps: () => api.get('/punishment/blocked-apps'),
  checkDaily: () => api.post('/punishment/check-daily'),
  getHistory: (limit = 30) => api.get(`/punishment/history?limit=${limit}`),
};

// Activity
export const activityAPI = {
  log: (data) => api.post('/activity/log', data),
  getToday: () => api.get('/activity/today'),
  getHistory: (days = 30) => api.get(`/activity/history?days=${days}`),
};

export default api;

import axios from 'axios';

// ✅ When proxy is set in package.json,
//    use relative URLs — no need for full http://localhost:5000
const API = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auto-attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem('taskify_user') || '{}');
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Token parse error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Log responses for debugging
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url:     error.config?.url,
      status:  error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login',    data);

// ── Tasks ─────────────────────────────────────
export const fetchTasks    = ()         => API.get('/tasks');
export const createTask    = (data)     => API.post('/tasks',       data);
export const updateTask    = (id, data) => API.put(`/tasks/${id}`,  data);
export const deleteTaskAPI = (id)       => API.delete(`/tasks/${id}`);

// ── Stats ─────────────────────────────────────
export const fetchStats = () => API.get('/stats');

// ── Focus / Pomodoro ──────────────────────────
export const saveFocusSession  = (data) => API.post('/focus',         data);
export const fetchFocusHistory = ()     => API.get('/focus/history');

// ── AI Suggestions ────────────────────────────
export const fetchSuggestions = () => API.get('/suggestions');
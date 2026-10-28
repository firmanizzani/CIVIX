import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('civix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = /^\/?auth\/(login|register)(?:\?|$)/.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('civix_token');
      localStorage.removeItem('civix_user');
      if (!['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
        const destination = window.location.pathname + window.location.search + window.location.hash;
        window.location.replace(`/login?redirect=${encodeURIComponent(destination)}`);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

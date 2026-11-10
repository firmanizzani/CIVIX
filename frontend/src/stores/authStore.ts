import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { User } from '@/types';
import apiClient from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (nama: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

function storeSession({ token, user }: { token: string; user: User }) {
  localStorage.setItem('civix_token', token);
  localStorage.setItem('civix_user', JSON.stringify(user));
  return { token, user, isLoading: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('civix_user') ? JSON.parse(localStorage.getItem('civix_user')!) : null,
  token: localStorage.getItem('civix_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      set(storeSession(res.data));
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.error || 'Login gagal');
    }
  },

  loginWithGoogle: async (credential) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/google', { credential }, { timeout: 15000 });
      set(storeSession(res.data));
    } catch (error) {
      set({ isLoading: false });
      if (isAxiosError<{ error?: string }>(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new Error('Server CIVIX terlalu lama merespons. Coba masuk lagi.');
        }
        if (!error.response) throw new Error('Server CIVIX tidak bisa dihubungi. Coba masuk lagi.');
        const message = error.response.data?.error;
        if (typeof message === 'string' && message) throw new Error(message);
      }
      throw new Error('Gagal masuk dengan Google. Coba lagi.');
    }
  },

  register: async (nama, email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/register', { nama, email, password });
      set(storeSession(res.data));
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.error || 'Registrasi gagal');
    }
  },

  logout: () => {
    localStorage.removeItem('civix_token');
    localStorage.removeItem('civix_user');
    set({ token: null, user: null });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('civix_token');
    if (!token) return;
    try {
      const res = await apiClient.get('/auth/me');
      const user = res.data;
      localStorage.setItem('civix_user', JSON.stringify(user));
      set({ user });
    } catch {
      localStorage.removeItem('civix_token');
      localStorage.removeItem('civix_user');
      set({ token: null, user: null });
    }
  },

  setUser: (user) => set({ user }),
}));

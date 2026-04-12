import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,

        setError: (error) => set({ error }),

        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              throw new Error('Server returned an unexpected response format. Please ensure the API is running.');
            }

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.message || 'Login failed');
            }

            set({ user: data.user, isAuthenticated: true, isLoading: false });
          } catch (err: any) {
            const message = err instanceof SyntaxError ? 'Failed to parse server response' : err.message;
            set({ error: message, isLoading: false, isAuthenticated: false });
            throw err;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await fetch('/api/logout');
          } catch (err) {
            console.error('Logout error:', err);
          } finally {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },

        checkAuth: async () => {
          set({ isLoading: true });
          try {
            const res = await fetch('/api/me');
            const contentType = res.headers.get('content-type');
            
            if (res.ok && contentType && contentType.includes('application/json')) {
              const data = await res.json();
              set({ user: data.user, isAuthenticated: true, isLoading: false });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } catch (err) {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    )
  )
);

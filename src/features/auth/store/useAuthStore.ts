import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

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
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password.trim(),
            });

            if (error) {
              throw error;
            }

            if (!data.user) {
              throw new Error('Login failed. No user found.');
            }

            const user: User = {
              email: data.user.email || email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Admin',
              role: 'admin',
            };

            set({ user, isAuthenticated: true, isLoading: false, error: null });
          } catch (err: any) {
            const message = err.message || 'Login failed';
            set({ error: message, isLoading: false, isAuthenticated: false });
            throw err;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error('Logout error:', err);
          } finally {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },

        checkAuth: async () => {
          set({ isLoading: true });
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session?.user) {
              set({ user: null, isAuthenticated: false, isLoading: false });
              return;
            }

            const user: User = {
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin',
              role: 'admin',
            };
            set({ user, isAuthenticated: true, isLoading: false });
          } catch (err) {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { enabled: process.env.NODE_ENV !== 'production' }
  )
);

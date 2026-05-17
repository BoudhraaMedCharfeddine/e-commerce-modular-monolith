'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthStore {
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setTokens: (accessToken, refreshToken) => {
        Cookies.set('accessToken', accessToken, { expires: 1 });
        Cookies.set('refreshToken', refreshToken, { expires: 7 });
        try {
          const decoded = jwtDecode<{ sub: string; email: string; role: 'USER' | 'ADMIN' }>(accessToken);
          set({ user: { id: decoded.sub, email: decoded.email, role: decoded.role } });
        } catch {}
      },
      logout: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null });
      },
    }),
    { name: 'auth-store', partialize: (state) => ({ user: state.user }) },
  ),
);

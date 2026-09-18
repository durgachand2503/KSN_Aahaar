'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/constants';

// Only cache the admin profile (name/email/role), NOT the token
const ADMIN_CACHE_KEY = 'ksn_admin_profile';

/* ── Types ── */
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;  // Kept in memory only — never stored in localStorage (C7 fix)
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AdminAuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ADMIN'; payload: { admin: AdminUser; token: string } }
  | { type: 'LOGOUT' };

interface AdminAuthContextType extends AdminAuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

/* ── Reducer ── */
function adminAuthReducer(state: AdminAuthState, action: AdminAuthAction): AdminAuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ADMIN':
      return {
        ...state,
        admin: action.payload.admin,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { admin: null, token: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

const initialState: AdminAuthState = {
  admin: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

/* ── Context ── */
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminAuthReducer, initialState);

  // C7 FIX: Verify session using the httpOnly cookie set at admin login.
  // We do NOT store the token in localStorage. Only the admin profile is cached.
  useEffect(() => {
    const verifySession = async () => {
      // Optimistic hydration from cached profile to prevent loading flash
      try {
        const cached = localStorage.getItem(ADMIN_CACHE_KEY);
        if (cached) {
          const admin = JSON.parse(cached) as AdminUser;
          dispatch({ type: 'SET_ADMIN', payload: { admin, token: '' } });
        }
      } catch {
        localStorage.removeItem(ADMIN_CACHE_KEY);
      }

      // Verify with server using the httpOnly cookie
      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          const admin = data.data as AdminUser;
          localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(admin));
          dispatch({ type: 'SET_ADMIN', payload: { admin, token: '' } });
        } else {
          localStorage.removeItem(ADMIN_CACHE_KEY);
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    verifySession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Server sets httpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: data.error || 'Login failed' };
      }

      const admin = data.data.admin as AdminUser;
      // C7: Store only the admin profile (not token) for session cache
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(admin));
      dispatch({ type: 'SET_ADMIN', payload: { admin, token: '' } });
      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_CACHE_KEY);
    dispatch({ type: 'LOGOUT' });
    // Clear the httpOnly adminToken cookie on the server
    fetch(`${API_BASE_URL}/admin/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

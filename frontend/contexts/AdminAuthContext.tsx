'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { adminLogin as apiAdminLogin } from '@/lib/api';

/* ── Types ── */
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
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

  // Check for existing admin auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('ksn_admin_token');
    const storedAdmin = localStorage.getItem('ksn_admin_user');

    if (storedToken && storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin) as AdminUser;
        dispatch({ type: 'SET_ADMIN', payload: { admin, token: storedToken } });
      } catch {
        localStorage.removeItem('ksn_admin_token');
        localStorage.removeItem('ksn_admin_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const result = await apiAdminLogin(email, password);

      if (!result.success || !result.data) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: result.error || 'Login failed' };
      }

      const { admin, token } = result.data;
      localStorage.setItem('ksn_admin_token', token);
      localStorage.setItem('ksn_admin_user', JSON.stringify(admin));
      dispatch({ type: 'SET_ADMIN', payload: { admin, token } });

      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ksn_admin_token');
    localStorage.removeItem('ksn_admin_user');
    dispatch({ type: 'LOGOUT' });
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

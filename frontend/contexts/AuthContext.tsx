'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';

/* ── Types ── */
interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: {
    id: string;
    label?: string;
    houseFlat: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    instructions?: string;
    isDefault: boolean;
  }[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: AuthUser; token: string } }
  | { type: 'UPDATE_USER'; payload: AuthUser }
  | { type: 'LOGOUT' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name: string; phone: string }) => Promise<{ success: boolean; error?: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/* ── Reducer ── */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { user: null, token: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

/* ── Context ── */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('ksn_auth_token');
    const storedUser = localStorage.getItem('ksn_auth_user');

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as AuthUser;
        dispatch({ type: 'SET_USER', payload: { user, token: storedToken } });
      } catch {
        localStorage.removeItem('ksn_auth_token');
        localStorage.removeItem('ksn_auth_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Helper: persist auth
  const persistAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem('ksn_auth_token', token);
    localStorage.setItem('ksn_auth_user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: { user, token } });
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: data.error || 'Login failed' };
      }

      persistAuth(data.data.user, data.data.token);
      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [persistAuth]);

  // Register
  const register = useCallback(async (regData: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(regData),
      });

      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: data.error || 'Registration failed' };
      }

      persistAuth(data.data.user, data.data.token);
      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [persistAuth]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('ksn_auth_token');
    localStorage.removeItem('ksn_auth_user');
    dispatch({ type: 'LOGOUT' });

    // Also call server logout (fire and forget)
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  // Update Profile
  const updateProfile = useCallback(async (profileData: { name: string; phone: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Update failed' };

      if (state.user) {
        const updatedUser = { ...state.user, ...profileData };
        localStorage.setItem('ksn_auth_user', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [state.token, state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

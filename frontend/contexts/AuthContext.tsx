'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/constants';

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
  token: string | null;  // Kept in state for API calls, NOT stored in localStorage (C6 fix)
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


// localStorage key for user profile cache (NOT the token — token is httpOnly cookie only)
const USER_CACHE_KEY = 'ksn_user_profile';

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

  // C6 FIX: On mount, verify session by calling /api/auth/me (which uses the httpOnly cookie).
  // We do NOT store the token in localStorage. The cookie is sent automatically.
  // We cache only the user profile object for instant re-hydration.
  useEffect(() => {
    const verifySession = async () => {
      // Optimistic hydration from cache to avoid loading flash
      try {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
          const user = JSON.parse(cachedUser) as AuthUser;
          // Set immediately as optimistic state (token=null until verified)
          dispatch({ type: 'SET_USER', payload: { user, token: '' } });
        }
      } catch {
        localStorage.removeItem(USER_CACHE_KEY);
      }

      // Verify with the server using the httpOnly cookie
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          const user = data.data as AuthUser;
          // Update cache with fresh data from server
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
          // Token in state is empty string — all auth is done via cookie
          dispatch({ type: 'SET_USER', payload: { user, token: '' } });
        } else {
          // Session expired or no cookie
          localStorage.removeItem(USER_CACHE_KEY);
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        // Network error — trust cached state if available, just mark as not loading
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    verifySession();
  }, []);

  // Login: cookies are set by the server (httpOnly). We only store the user profile.
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Server sets httpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: data.error || 'Login failed' };
      }

      const user = data.data.user as AuthUser;
      // C6: Store only user profile (not token) for session cache
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: { user, token: '' } });
      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // Register: same pattern as login
  const register = useCallback(async (regData: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
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

      const user = data.data.user as AuthUser;
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: { user, token: '' } });
      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // Logout: clear user cache + call server to clear the httpOnly cookie
  const logout = useCallback(() => {
    localStorage.removeItem(USER_CACHE_KEY);
    dispatch({ type: 'LOGOUT' });
    fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  // Update Profile
  const updateProfile = useCallback(async (profileData: { name: string; phone: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // Uses httpOnly cookie, no Bearer header needed
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Update failed' };

      if (state.user) {
        const updatedUser = { ...state.user, ...profileData };
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, [state.user]);

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

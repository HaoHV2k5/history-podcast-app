import { create } from 'zustand';
import { UserResponse, AuthResponse } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'su_ky_admin_access_token';
const REFRESH_TOKEN_KEY = 'su_ky_admin_refresh_token';
const USER_DATA_KEY = 'su_ky_admin_user_data';

const getInitialAccessToken = (): string | null => {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const getInitialUser = (): UserResponse | null => {
  try {
    const raw = sessionStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialAccessToken = getInitialAccessToken();
const initialUser = getInitialUser();

interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (authData: AuthResponse, userData?: UserResponse) => void;
  setAccessToken: (token: string) => void;
  setUser: (userData: UserResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  clearRefreshToken: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialAccessToken,
  user: initialUser,
  isAuthenticated: Boolean(initialAccessToken && initialUser),
  isLoading: false,
  error: null,

  setAuth: (authData: AuthResponse, userData?: UserResponse) => {
    // Store tokens in sessionStorage
    try {
      if (authData.accessToken) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
      }
      if (authData.refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
      }
      sessionStorage.removeItem('su_ky_admin_dev_mode');
    } catch {
      // ignore
    }

    const roles = authData.roles || (authData.role ? [authData.role] : []);
    const mergedUser: UserResponse = userData || {
      id: authData.userId,
      email: authData.email,
      phone: authData.phone,
      roleName: authData.role,
      roles: roles,
      isAdmin: roles.includes('ADMIN') || authData.role === 'ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(mergedUser));
    } catch {
      // ignore
    }

    set({
      accessToken: authData.accessToken,
      user: mergedUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  setAccessToken: (token: string) => {
    try {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // ignore
    }
    set({ accessToken: token, isAuthenticated: true });
  },

  setUser: (userData: UserResponse) => {
    try {
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch {
      // ignore
    }
    set({ user: userData });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  logout: () => {
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_DATA_KEY);
      sessionStorage.removeItem('su_ky_admin_dev_mode');
    } catch {
      // ignore
    }
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  getRefreshToken: () => {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken: (token: string) => {
    try {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  clearRefreshToken: () => {
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  hasRole: (role: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles && user.roles.includes(role)) return true;
    if (user.roleName === role) return true;
    return false;
  },

  isAdmin: () => {
    const { user } = get();
    if (!user) return false;
    if (user.isAdmin) return true;
    if (user.roles && user.roles.includes('ADMIN')) return true;
    if (user.roleName === 'ADMIN') return true;
    return false;
  },
}));

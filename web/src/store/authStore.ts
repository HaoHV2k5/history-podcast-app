import { create } from 'zustand';
import { UserResponse, AuthResponse } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'su_ky_admin_access_token';
const REFRESH_TOKEN_KEY = 'su_ky_admin_refresh_token';
const USER_DATA_KEY = 'su_ky_admin_user_data';

const readStoredItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStoredItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const removeStoredItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const getInitialAccessToken = (): string | null => {
  try {
    return readStoredItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const getInitialUser = (): UserResponse | null => {
  try {
    const raw = readStoredItem(USER_DATA_KEY);
    if (raw) return JSON.parse(raw);
    return null;
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
  isCreator: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialAccessToken,
  user: initialUser,
  isAuthenticated: Boolean(initialAccessToken && initialUser),
  isLoading: false,
  error: null,

  setAuth: (authData: AuthResponse, userData?: UserResponse) => {
    if (authData.accessToken) {
      writeStoredItem(ACCESS_TOKEN_KEY, authData.accessToken);
    }
    if (authData.refreshToken) {
      writeStoredItem(REFRESH_TOKEN_KEY, authData.refreshToken);
    }
    const authRoles = authData.roles || (authData.role ? [authData.role] : []);
    const userRoles = userData?.roles || (userData?.roleName ? [userData.roleName] : []);
    const combinedRoles = Array.from(new Set([...authRoles, ...userRoles]));

    const mergedUser: UserResponse = {
      ...(userData || {}),
      id: userData?.id || authData.userId,
      email: userData?.email || authData.email,
      phone: userData?.phone || authData.phone,
      roleName: userData?.roleName || authData.role,
      roles: combinedRoles,
      isAdmin:
        Boolean(userData?.isAdmin) ||
        combinedRoles.includes('ADMIN') ||
        authData.role === 'ADMIN' ||
        userData?.roleName === 'ADMIN',
      isCreator:
        Boolean(userData?.isCreator) ||
        combinedRoles.includes('CREATOR') ||
        authData.role === 'CREATOR' ||
        userData?.roleName === 'CREATOR',
      status: userData?.status || 'ACTIVE',
      createdAt: userData?.createdAt || new Date().toISOString(),
    };

    writeStoredItem(USER_DATA_KEY, JSON.stringify(mergedUser));

    set({
      accessToken: authData.accessToken,
      user: mergedUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  setAccessToken: (token: string) => {
    writeStoredItem(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token, isAuthenticated: true });
  },

  setUser: (userData: UserResponse) => {
    writeStoredItem(USER_DATA_KEY, JSON.stringify(userData));
    set({ user: userData });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  logout: () => {
    removeStoredItem(ACCESS_TOKEN_KEY);
    removeStoredItem(REFRESH_TOKEN_KEY);
    removeStoredItem(USER_DATA_KEY);
    try {
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
    return readStoredItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string) => {
    writeStoredItem(REFRESH_TOKEN_KEY, token);
  },

  clearRefreshToken: () => {
    removeStoredItem(REFRESH_TOKEN_KEY);
  },

  hasRole: (role: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles && user.roles.includes(role)) return true;
    if (user.roleName === role) return true;
    if (role === 'ADMIN' && user.isAdmin) return true;
    if (role === 'CREATOR' && user.isCreator) return true;
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

  isCreator: () => {
    const { user } = get();
    if (!user) return false;
    if (user.isCreator) return true;
    if (user.roles && user.roles.includes('CREATOR')) return true;
    if (user.roleName === 'CREATOR') return true;
    return false;
  },
}));

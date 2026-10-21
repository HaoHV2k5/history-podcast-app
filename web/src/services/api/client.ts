import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ApiResponse } from '@/types/api';
import { AuthResponse } from '@/types/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Kiểm tra xem JWT Access Token đã hết hạn hoặc sắp hết hạn trong vòng `bufferSeconds` giây tới hay chưa.
 */
export const isJwtExpiringSoon = (token: string | null, bufferSeconds = 60): boolean => {
  if (!token || token === 'dev-admin-token') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as { exp?: number };
    if (!payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp - nowSec <= bufferSeconds;
  } catch {
    return false;
  }
};

// Flag to track whether a refresh is currently in flight
let isRefreshing = false;

// Queue of pending requests waiting for a new token
interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

/**
 * Thực hiện làm mới Access Token dùng chung hàng đợi (Single-Flight Mutex)
 * để tránh gọi trùng lặp khi nhiều request cùng lúc phát hiện token sắp/đã hết hạn.
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = useAuthStore.getState().getRefreshToken();
  if (!refreshToken || refreshToken === 'dev-admin-refresh') {
    return null;
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const response = await axios.post<ApiResponse<AuthResponse>>(
      `${baseURL}/api/v1/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`
    );

    const authData = response.data?.data;
    if (!authData || !authData.accessToken) {
      throw new Error('Không nhận được token làm mới từ máy chủ');
    }

    useAuthStore.getState().setAccessToken(authData.accessToken);
    if (authData.refreshToken) {
      useAuthStore.getState().setRefreshToken(authData.refreshToken);
    }

    processQueue(null, authData.accessToken);
    return authData.accessToken;
  } catch (err) {
    processQueue(err, null);
    throw err;
  } finally {
    isRefreshing = false;
  }
};

// 1. Request Interceptor: Proactive Refresh Before Expiry + Inject Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    const isAuthEndpoint =
      url.includes('/api/v1/auth/login') ||
      url.includes('/api/v1/auth/refresh') ||
      url.includes('/api/v1/auth/register');

    let accessToken = useAuthStore.getState().accessToken;

    // Nếu Access Token sắp hết hạn (< 60s) hoặc đã hết hạn, tự động làm mới NGAY TRƯỚC khi gửi request
    if (!isAuthEndpoint && accessToken && isJwtExpiringSoon(accessToken, 60)) {
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          accessToken = refreshed;
        }
      } catch {
        // Nếu refresh thất bại, để Response Interceptor xử lý tiếp
      }
    }

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: 401 (or 403 with expired token) Single Refresh Queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const currentToken = useAuthStore.getState().accessToken;
    const isExpired403 = status === 403 && Boolean(currentToken && isJwtExpiringSoon(currentToken, 0));

    if (status !== 401 && !isExpired403) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    if (
      url.includes('/api/v1/auth/login') ||
      url.includes('/api/v1/auth/refresh') ||
      url.includes('/api/v1/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = useAuthStore.getState().getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) {
        throw new Error('Không thể làm mới Access Token');
      }

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshErr) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    }
  }
);

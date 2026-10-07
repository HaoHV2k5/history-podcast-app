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

// 1. Request Interceptor: Inject Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: 401 Single Refresh Queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no response or not a 401, reject immediately
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Skip retry for login, refresh, or register endpoints
    const url = originalRequest.url || '';
    if (
      url.includes('/api/v1/auth/login') ||
      url.includes('/api/v1/auth/refresh') ||
      url.includes('/api/v1/auth/register')
    ) {
      return Promise.reject(error);
    }

    // Prevent infinite loop if request was already retried
    if (originalRequest._retry) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If another request is currently refreshing the token, enqueue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Call refresh token API directly without interceptor loop
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${baseURL}/api/v1/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`
      );

      const authData = response.data.data;
      if (!authData || !authData.accessToken) {
        throw new Error('Không nhận được token làm mới từ máy chủ');
      }

      // Update access token in Zustand store & refresh token in sessionStorage
      useAuthStore.getState().setAccessToken(authData.accessToken);
      if (authData.refreshToken) {
        useAuthStore.getState().setRefreshToken(authData.refreshToken);
      }

      // Re-run original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
      }

      // Process any queued requests with the new token
      processQueue(null, authData.accessToken);

      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

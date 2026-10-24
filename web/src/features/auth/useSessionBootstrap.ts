import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/auth';
import { isJwtExpiringSoon, refreshAccessToken } from '@/services/api/client';

export const useSessionBootstrap = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const logout = useAuthStore((s) => s.logout);
  const getRefreshToken = useAuthStore((s) => s.getRefreshToken);

  useEffect(() => {
    let isMounted = true;

    const silentProactiveRefresh = async () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated || !state.accessToken) {
        return;
      }
      // Làm mới chủ động trước khi hết hạn 2 phút (120 giây)
      if (isJwtExpiringSoon(state.accessToken, 120)) {
        try {
          await refreshAccessToken();
        } catch {
          // Nếu refresh token thực sự hết hạn (sau 7 ngày), để interceptor xử lý khi có thao tác
        }
      }
    };

    const bootstrap = async () => {
      const currentState = useAuthStore.getState();
      if (currentState.isAuthenticated) {
        if (currentState.accessToken) {
          if (isJwtExpiringSoon(currentState.accessToken, 120)) {
            try {
              await refreshAccessToken();
            } catch {
              if (isMounted) {
                logout();
                setLoading(false);
              }
              return;
            }
          }

          if (!currentState.user?.fullName) {
            try {
              const userRes = await authApi.getCurrentUser();
              if (isMounted && userRes.data) {
                useAuthStore.getState().setUser({
                  ...useAuthStore.getState().user,
                  ...userRes.data,
                });
              }
            } catch {
              // ignore background profile hydration error
            }
          }
        }
        if (isMounted) setLoading(false);
        return;
      }

      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // 1. Refresh access token
        const refreshRes = await authApi.refreshToken(storedRefreshToken);
        if (!refreshRes.data || !refreshRes.data.accessToken) {
          throw new Error('Không thể làm mới phiên đăng nhập');
        }

        const authData = refreshRes.data;

        // 2. Fetch authenticated user profile
        useAuthStore.getState().setAccessToken(authData.accessToken);
        const userRes = await authApi.getCurrentUser();

        if (isMounted) {
          setAuth(authData, userRes.data);
        }
      } catch {
        if (isMounted) {
          logout();
          setLoading(false);
        }
      }
    };

    void bootstrap();

    // Định kỳ kiểm tra mỗi 60 giây & khi quay lại tab để gia hạn ngầm trước khi Access Token 15 phút hết hạn
    const intervalId = window.setInterval(() => {
      void silentProactiveRefresh();
    }, 60_000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void silentProactiveRefresh();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [setAuth, setLoading, logout, getRefreshToken]);
};

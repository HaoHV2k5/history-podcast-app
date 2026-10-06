import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/auth';

export const useSessionBootstrap = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const logout = useAuthStore((s) => s.logout);
  const getRefreshToken = useAuthStore((s) => s.getRefreshToken);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      // In development mode, allow activating local visual QA session if flagged in sessionStorage
      if (import.meta.env.DEV && sessionStorage.getItem('su_ky_admin_dev_mode') === 'true') {
        setAuth(
          {
            accessToken: 'dev-admin-token',
            refreshToken: 'dev-admin-refresh',
            tokenType: 'Bearer',
            userId: 1,
            email: 'admin@suky.vn',
            role: 'ADMIN',
            roles: ['ADMIN'],
          },
          {
            id: 1,
            email: 'admin@suky.vn',
            fullName: 'Quản Trị Viên Sử Ký',
            roleName: 'ADMIN',
            roles: ['ADMIN'],
            isAdmin: true,
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          }
        );
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
        // Temporary set access token so get profile works
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

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setAuth, setLoading, logout, getRefreshToken]);
};

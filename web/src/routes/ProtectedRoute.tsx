import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import { evaluateRouteAccess } from './protectedRouteLogic';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasRole = useAuthStore((s) => s.hasRole);

  const hasDevBypassParamOrSession = Boolean(
    sessionStorage.getItem('su_ky_admin_dev_mode') === 'true' ||
      new URLSearchParams(location.search).get('dev') === 'true'
  );

  const isDevBypass = Boolean(import.meta.env.DEV && hasDevBypassParamOrSession);

  React.useEffect(() => {
    if (isDevBypass && !useAuthStore.getState().isAuthenticated) {
      const devUser = {
        id: 1,
        email: 'admin@suky.vn',
        fullName: 'Quản Trị Viên & Tác Giả Sử Ký',
        roleName: 'ADMIN',
        roles: ['ADMIN', 'CREATOR'],
        isAdmin: true,
        isCreator: true,
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      };
      useAuthStore.getState().setAuth(
        {
          accessToken: 'dev-admin-token',
          refreshToken: 'dev-admin-refresh',
          tokenType: 'Bearer',
          userId: 1,
          email: 'admin@suky.vn',
          role: 'ADMIN',
          roles: ['ADMIN', 'CREATOR'],
        },
        devUser
      );
    }
  }, [isDevBypass]);

  const decision = evaluateRouteAccess({
    isLoading,
    isAuthenticated,
    allowedRoles,
    isDev: Boolean(import.meta.env.DEV),
    hasDevBypassParamOrSession,
    checkHasRole: hasRole,
  });

  if (decision === 'LOADING') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-canvas">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="font-serif text-lg font-semibold text-ink">SỬ KÝ</p>
            <p className="text-xs text-muted">Đang xác thực phiên làm việc...</p>
          </div>
        </div>
      </div>
    );
  }

  if (decision === 'LOGIN_REDIRECT') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (decision === 'FORBIDDEN_REDIRECT') {
    return <Navigate to="/forbidden" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

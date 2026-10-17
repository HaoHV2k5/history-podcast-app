import React from 'react';
import { ShieldX, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const isCreator = useAuthStore((s) => s.isCreator());

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-error-bg text-status-error-text">
          <ShieldX className="h-7 w-7" />
        </div>

        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink mb-2">
          Truy cập bị từ chối
        </h1>

        <p className="text-sm text-muted mb-6 leading-relaxed">
          Tài khoản{' '}
          <span className="font-mono font-medium text-ink">
            {user?.email || 'hiện tại'}
          </span>{' '}
          không có thẩm quyền cần thiết để truy cập không gian làm việc này.
        </p>

        <div className="rounded-lg border border-border bg-surface-subtle p-3.5 mb-6 text-left">
          <p className="text-xs font-semibold text-ink mb-1">Vai trò hiện tại:</p>
          <div className="flex flex-wrap gap-1.5">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-sm bg-surface px-2 py-0.5 text-[11px] font-mono font-medium text-muted border border-border"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted">Không xác định</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate('/admin/overview')}
              className="w-full justify-center"
            >
              Về Cổng Quản trị (Admin)
            </Button>
          )}
          {isCreator && (
            <Button
              variant="outline"
              onClick={() => navigate('/creator')}
              className="w-full justify-center"
            >
              Về Không gian Sáng tạo (Creator)
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleLogout}
            className="w-full justify-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất và đăng nhập lại
          </Button>
        </div>
      </div>
    </div>
  );
};

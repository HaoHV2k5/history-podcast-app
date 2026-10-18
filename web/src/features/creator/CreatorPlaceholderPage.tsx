import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, CheckCircle2, Video, ArrowRight } from 'lucide-react';

export const CreatorPlaceholderPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-accent text-canvas shadow-sm">
            <Video className="h-8 w-8" />
          </div>
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
            Không Gian Sáng Tạo Sử Ký
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink mb-2">
            Creator Studio
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto">
            Hệ thống điều hướng và phân quyền đa vai trò (Multi-Role Routing) đã sẵn sàng.
          </p>
        </div>

        {/* Milestone 1 Status Card */}
        <div className="rounded-lg border border-border bg-surface p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-3.5 rounded-md border border-status-success-text/20 bg-status-success-bg/60 p-4">
            <CheckCircle2 className="h-5 w-5 text-status-success-text shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-status-success-text">
                Milestone 1 Hoàn Tất: Xác Thực & Điều Hướng Đa Vai Trò
              </h2>
              <p className="text-xs text-status-success-text/90 leading-relaxed">
                Tài khoản của bạn đã được xác thực thành công với vai trò Nhà sáng tạo (CREATOR) và được điều hướng chính xác vào không gian sáng tạo chuyên biệt.
              </p>
            </div>
          </div>

          {/* User Details */}
          <div className="rounded-md border border-border bg-surface-subtle p-4 space-y-3">
            <p className="text-xs font-semibold text-ink uppercase tracking-wider">
              Thông tin phiên làm việc
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted">Tài khoản:</span>{' '}
                <span className="font-mono font-medium text-ink">{user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted">Mã định danh:</span>{' '}
                <span className="font-mono font-medium text-ink">#{user?.id || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 flex-wrap">
                <span className="text-muted">Vai trò đã xác thực:</span>
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <span
                      key={r}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        r === 'CREATOR'
                          ? 'bg-accent-soft text-accent border border-accent/20'
                          : 'bg-surface text-ink border border-border'
                      }`}
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-muted">{user?.roleName || 'CREATOR'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Roadmap Info */}
          <div className="rounded-md border border-border bg-canvas p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Lộ trình triển khai kế tiếp (Milestone 2)</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Toàn bộ không gian làm việc chuyên sâu của Creator (Creator Studio Layout, Quy trình thẩm định KYC, Thiết lập Kênh Podcast, Xưởng kịch bản hoạt họa AI và Upload video) sẽ được xây dựng theo từng bước trong Milestone 2.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin/overview')}
                className="flex-1 justify-center min-h-[44px]"
              >
                <span>Chuyển sang Cổng Quản trị</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleLogout}
              className={`${isAdmin ? 'sm:w-auto' : 'w-full'} justify-center min-h-[44px]`}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          Sử Ký — Nền tảng Podcast & Hoạt Họa Lịch Sử Việt Nam
        </p>
      </div>
    </div>
  );
};

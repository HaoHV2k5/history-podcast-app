import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, ChevronRight, LogOut, User, Shield, Video, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { CreatorModerationNotificationPopover } from '@/features/moderation/components/CreatorModerationNotificationPopover';

interface CreatorHeaderProps {
  onToggleMobileMenu?: () => void;
  currentUser?: {
    email: string;
    fullName?: string;
    roles?: string[];
  } | null;
  onLogout?: () => void;
}

const CREATOR_ROUTE_NAME_MAP: Record<string, string> = {
  creator: 'Không gian Sáng tạo',
  dashboard: 'Tổng quan Studio',
  content: 'Thư viện nội dung',
  create: 'Tạo nội dung mới',
  series: 'Tuyển tập Podcast',
  livestream: 'Phát trực tiếp',
  kyc: 'Xác thực KYC',
  channel: 'Quản lý Kênh',
  wallet: 'Ví & Thu nhập',
};

export const CreatorHeader: React.FC<CreatorHeaderProps> = ({
  onToggleMobileMenu,
  currentUser,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const segments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((seg, idx) => {
    const path = '/' + segments.slice(0, idx + 1).join('/');
    const name = CREATOR_ROUTE_NAME_MAP[seg] || seg;
    const isLast = idx === segments.length - 1;
    return { name, path, isLast };
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/80 bg-surface/85 backdrop-blur-md px-4 md:px-6 shadow-xs transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          id="creator-mobile-toggle-btn"
          variant="ghost"
          size="sm"
          onClick={onToggleMobileMenu}
          className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 p-0 text-muted hover:text-ink cursor-pointer"
          aria-label="Mở danh mục điều hướng Studio"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted truncate">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-border shrink-0" />}
              {crumb.isLast ? (
                <span className="font-semibold text-ink truncate max-w-[160px] md:max-w-[220px]">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-ink transition-colors truncate max-w-[120px] md:max-w-[160px]"
                >
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick workspace switch (if dual-role) + User Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-status-success-text/25 bg-status-success-bg/80 text-status-success-text text-[11px] font-medium select-none shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success-text animate-pulse" />
          <span>Creator Studio Online</span>
        </div>

        {/* Switch to Admin Workspace for Dual-Role Users */}
        {isAdmin && (
          <Button
            id="creator-switch-to-admin-btn"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/overview')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink border-border hover:bg-surface-subtle min-h-[38px] cursor-pointer"
            title="Chuyển sang Cổng Quản trị Sử Ký"
          >
            <Shield className="h-3.5 w-3.5 text-accent" />
            <span>Cổng Quản trị</span>
            <ArrowRight className="h-3 w-3 text-muted" />
          </Button>
        )}

        {/* Creator Moderation Notification & Lifecycle Tracking Center */}
        <CreatorModerationNotificationPopover />

        {/* Authenticated Creator Profile Dropdown */}
        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id="creator-user-menu-btn"
                type="button"
                className="flex items-center gap-2.5 rounded-lg border border-border bg-canvas px-3 py-1.5 min-h-[44px] text-left transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                aria-label="Menu tài khoản nhà sáng tạo"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent font-semibold text-xs border border-accent/20">
                  {currentUser.fullName ? (
                    currentUser.fullName.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-xs leading-tight">
                  <span className="font-medium text-ink max-w-[130px] md:max-w-[160px] truncate">
                    {currentUser.fullName || currentUser.email}
                  </span>
                  <span className="text-[10px] text-accent font-medium">
                    Nhà sáng tạo
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent id="creator-profile-dropdown" align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold text-ink truncate">
                    {currentUser.fullName || 'Nhà sáng tạo'}
                  </p>
                  <p className="text-[11px] text-muted truncate font-mono">
                    {currentUser.email}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1">
                    {currentUser.roles?.map((r) => (
                      <Badge
                        key={r}
                        variant={r === 'CREATOR' ? 'default' : 'outline'}
                        className="text-[10px] py-0 px-1"
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Dual-role switch option in dropdown */}
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={() => navigate('/admin/overview')}
                    className="text-xs text-ink cursor-pointer focus:bg-surface-subtle"
                  >
                    <Shield className="mr-2 h-4 w-4 text-accent" />
                    <span>Chuyển sang Cổng Quản trị</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                id="creator-logout-btn"
                onClick={onLogout}
                className="text-status-error-text focus:bg-status-error-bg focus:text-status-error-text cursor-pointer text-xs"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Video className="h-4 w-4 text-accent" />
            <span className="font-medium">Creator Studio</span>
          </div>
        )}
      </div>
    </header>
  );
};

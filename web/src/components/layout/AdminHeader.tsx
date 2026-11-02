import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, ChevronDown, LogOut, Shield, Bell } from 'lucide-react';
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

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
  currentUser?: {
    email: string;
    fullName?: string;
    roles?: string[];
  } | null;
  onLogout?: () => void;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  admin: 'Quản trị',
  overview: 'Tổng quan',
  moderation: 'Kiểm duyệt nội dung',
  kyc: 'Xác thực định danh',
  users: 'Người dùng',
  channels: 'Kênh phát thanh',
  membership: 'Gói hội viên',
  transactions: 'Biến động số dư',
  withdrawals: 'Yêu cầu rút tiền',
  narrators: 'Hồ sơ Thuyết minh viên',
  contracts: 'Hợp đồng thu âm',
  escrow: 'Ký quỹ đảm bảo',
  disputes: 'Xử lý Khiếu nại',
  policies: 'Chính sách & Cấu hình',
  roles: 'Phân quyền tài khoản',
  audit: 'Nhật ký hệ thống',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleMobileMenu,
  currentUser,
  onLogout,
}) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((seg, idx) => {
    const path = '/' + segments.slice(0, idx + 1).join('/');
    const name = /^\d+$/.test(seg) ? `Chi tiết #${seg}` : ROUTE_NAME_MAP[seg] || seg;
    const isLast = idx === segments.length - 1;
    return { name, path, isLast };
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/80 bg-surface/85 backdrop-blur-md px-4 sm:px-6 shadow-xs transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMobileMenu}
          className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 p-0 text-muted hover:text-ink"
          aria-label="Mở danh mục điều hướng"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-border shrink-0" />}
              {crumb.isLast ? (
                <span className="font-semibold text-ink truncate max-w-[200px]">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-ink transition-colors truncate max-w-[150px]"
                >
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Authenticated Admin Profile Dropdown */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-status-success-text/25 bg-status-success-bg/90 text-status-success-text text-xs font-medium select-none shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-status-success-text animate-pulse" />
          <span>Hệ thống trực tuyến</span>
        </div>

        {/* System Notification Bell */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-canvas text-muted hover:text-ink hover:bg-surface-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Thông báo hệ thống (2 thông báo mới)"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#DC2626] text-white font-mono text-[10px] font-bold shadow-xs">
            2
          </span>
        </button>

        {currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-lg border border-border bg-canvas px-3 py-1.5 min-h-[40px] text-left transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FCE7F3] text-[#9D174D] font-bold text-xs border border-[#FBCFE8] shadow-2xs">
                  {currentUser.fullName ? (
                    currentUser.fullName.charAt(0).toUpperCase()
                  ) : (
                    'D'
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-xs leading-tight">
                  <span className="font-bold text-ink max-w-[150px] truncate">
                    {currentUser.fullName || 'Demo Administrator'}
                  </span>
                  <span className="text-[10px] text-muted">
                    {currentUser.roles?.includes('ADMIN') ? 'Quản trị viên' : 'Nhân sự'}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-medium text-ink truncate">
                    {currentUser.fullName || 'Quản trị viên'}
                  </p>
                  <p className="text-[11px] text-muted truncate font-mono">
                    {currentUser.email}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1">
                    {currentUser.roles?.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px] py-0 px-1">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-status-error-text focus:bg-status-error-bg focus:text-status-error-text cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Shield className="h-4 w-4 text-accent" />
            <span className="font-mono">Chế độ quản trị</span>
          </div>
        )}
      </div>
    </header>
  );
};

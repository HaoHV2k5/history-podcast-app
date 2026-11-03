import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
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
import { AdminNotificationPopover } from './AdminNotificationPopover';

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
  kyc: 'Xác thực KYC',
  users: 'Người dùng & Kênh',
  channels: 'Người dùng & Kênh',
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

  const effectiveFullName = currentUser?.fullName || 'Demo Administrator';
  const effectiveRoleLabel = currentUser?.roles?.includes('ADMIN') ? 'Quản trị viên' : 'Quản trị viên';
  const initialChar = (effectiveFullName.trim().charAt(0) || 'D').toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#F0EBE6] bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-2xs transition-colors">
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

        {/* Breadcrumb Trail matching mockup: Quản trị > Người dùng & Kênh */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-stone-300 shrink-0" />}
              {crumb.isLast ? (
                <span className="font-semibold text-[#1F1612] truncate max-w-[220px]">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-stone-500 hover:text-stone-800 transition-colors truncate max-w-[150px]"
                >
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Authenticated Admin Status & Profile Dropdown matching mockup 100% */}
      <div className="flex items-center gap-3 sm:gap-3.5">
        {/* Status Pill: Hệ thống trực tuyến */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200/80 bg-emerald-50 text-emerald-700 text-xs font-medium select-none shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Hệ thống trực tuyến</span>
        </div>

        {/* System Notification Bell & Task Center (Live Backend Synced - Zero Fake Data) */}
        <AdminNotificationPopover />

        {/* User Profile Dropdown matching mockup: Pink squircle 'D' + Demo Administrator + Quản trị viên */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg border border-[#E7E5E4] bg-white px-3 py-1.5 min-h-[40px] text-left transition-colors hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FCE7F3] text-[#9D174D] font-bold text-xs border border-[#FBCFE8] shadow-2xs">
                {initialChar}
              </div>
              <div className="hidden sm:flex flex-col text-xs leading-tight">
                <span className="font-bold text-[#1F1612] max-w-[150px] truncate">
                  {effectiveFullName}
                </span>
                <span className="text-[10px] text-stone-500">
                  {effectiveRoleLabel}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-medium text-[#1F1612] truncate">
                  {effectiveFullName}
                </p>
                <p className="text-[11px] text-stone-500 truncate font-mono">
                  {currentUser?.email || 'admin@sucky.vn'}
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  {(currentUser?.roles || ['ADMIN']).map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px] py-0 px-1 border-stone-200">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-[#DC2626] focus:bg-rose-50 focus:text-[#DC2626] cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

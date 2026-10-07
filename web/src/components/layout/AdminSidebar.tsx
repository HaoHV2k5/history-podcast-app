import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  UserCheck,
  Users,
  Crown,
  ArrowLeftRight,
  Wallet,
  Mic,
  FileText,
  Lock,
  AlertCircle,
  Sliders,
  Shield,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'WORKSPACE',
    items: [
      { id: '01', label: 'Tổng quan', to: '/admin/overview', icon: LayoutDashboard },
      { id: '02', label: 'Kiểm duyệt nội dung', to: '/admin/moderation', icon: ShieldAlert },
      { id: '03', label: 'Xác thực KYC', to: '/admin/kyc', icon: UserCheck },
    ],
  },
  {
    title: 'QUẢN TRỊ NỀN TẢNG',
    items: [
      { id: '04', label: 'Người dùng & Kênh', to: '/admin/users', icon: Users },
      { id: '05', label: 'Gói hội viên', to: '/admin/membership', icon: Crown },
      { id: '06', label: 'Biến động số dư', to: '/admin/transactions', icon: ArrowLeftRight },
      { id: '07', label: 'Yêu cầu rút tiền', to: '/admin/withdrawals', icon: Wallet },
    ],
  },
  {
    title: 'VẬN HÀNH THUYẾT MINH',
    items: [
      { id: '08', label: 'Hồ sơ Thuyết minh', to: '/admin/narrators', icon: Mic },
      { id: '09', label: 'Hợp đồng thu âm', to: '/admin/contracts', icon: FileText },
      { id: '10', label: 'Ký quỹ Escrow', to: '/admin/escrow', icon: Lock },
      { id: '11', label: 'Xử lý Khiếu nại', to: '/admin/disputes', icon: AlertCircle },
    ],
  },
  {
    title: 'QUẢN TRỊ HỆ THỐNG',
    items: [
      { id: '12', label: 'Chính sách & Cấu hình', to: '/admin/policies', icon: Sliders },
      { id: '13', label: 'Phân quyền tài khoản', to: '/admin/roles', icon: Shield },
      { id: '14', label: 'Nhật ký hệ thống', to: '/admin/audit', icon: History },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  className,
}) => {
  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-border bg-surface-subtle transition-all duration-200 select-none z-30 shrink-0',
        collapsed ? 'w-[72px]' : 'w-[232px]',
        className
      )}
    >
      {/* Brand Book-Seal Masthead */}
      <div className="h-16 flex items-center px-4 border-b border-border bg-surface-subtle">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Book Seal Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-canvas">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <path d="M6 14h6" />
            </svg>
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-base font-bold tracking-tight text-ink leading-tight">
                SỬ KÝ
              </span>
              <span className="text-[11px] font-medium tracking-wider uppercase text-muted truncate">
                Cổng Quản Trị
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                {section.title}
              </h3>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? `${item.id} ${item.label}` : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 min-h-[44px] text-xs font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-accent-soft text-accent font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-sm before:bg-accent'
                          : 'text-ink/80 hover:bg-surface hover:text-ink'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-colors" />
                    {!collapsed && (
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] text-muted group-hover:text-ink">
                          {item.id}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-border bg-surface-subtle">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-11 min-h-[44px] w-full items-center justify-center rounded-lg border border-border bg-surface text-ink-muted hover:bg-surface-subtle hover:text-ink transition-colors text-xs font-medium gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

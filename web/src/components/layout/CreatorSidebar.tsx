import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  PlusCircle,
  BookOpen,
  UserCheck,
  Radio,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CreatorNavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface CreatorNavSection {
  title: string;
  items: CreatorNavItem[];
}

const CREATOR_NAV_SECTIONS: CreatorNavSection[] = [
  {
    title: 'KHÔNG GIAN LÀM VIỆC',
    items: [
      { id: '01', label: 'Tổng quan Bàn làm việc', to: '/creator', icon: LayoutDashboard },
    ],
  },
  {
    title: 'SẢN XUẤT NỘI DUNG',
    items: [
      { id: '02', label: 'Thư viện nội dung', to: '/creator/content', icon: Video },
      { id: '03', label: 'Tạo nội dung mới', to: '/creator/create', icon: PlusCircle },
      { id: '04', label: 'Tuyển tập tác phẩm', to: '/creator/series', icon: BookOpen },
      { id: '05', label: 'Phát trực tiếp', to: '/creator/livestream', icon: Tv },
    ],
  },
  {
    title: 'THIẾT LẬP & TÀI CHÍNH',
    items: [
      { id: '06', label: 'Xác thực KYC', to: '/creator/kyc', icon: UserCheck },
      { id: '07', label: 'Quản lý Kênh', to: '/creator/channel', icon: Radio },
      { id: '08', label: 'Ví & Thu nhập', to: '/creator/wallet', icon: Wallet },
    ],
  },
];

interface CreatorSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  onNavClick?: () => void;
}

export const CreatorSidebar: React.FC<CreatorSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  className,
  onNavClick,
}) => {
  return (
    <aside
      id="creator-sidebar"
      className={cn(
        'relative flex flex-col h-full border-r border-border bg-surface-subtle transition-all duration-200 select-none z-30 shrink-0',
        collapsed ? 'w-[72px]' : 'w-[232px]',
        className
      )}
    >
      {/* Brand Book-Seal Masthead (Identical to Admin Portal) */}
      <div className="h-16 flex items-center px-4 border-b border-border bg-surface-subtle">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Book Seal Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-canvas shadow-xs border border-accent-hover/30">
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
                Xưởng Sáng Tạo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {CREATOR_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                {section.title}
              </h3>
            )}
            <nav className="space-y-0.5" aria-label={section.title}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/creator'}
                    title={item.label}
                    onClick={onNavClick}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 min-h-[44px] text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        isActive
                          ? 'bg-gradient-to-r from-accent-soft via-accent-soft/80 to-transparent text-accent font-semibold shadow-2xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-sm before:bg-accent'
                          : 'text-ink/80 hover:bg-surface hover:text-ink hover:translate-x-0.5'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-colors" />
                    {!collapsed && (
                      <div className="flex items-center justify-between gap-1 flex-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="shrink-0 rounded-xs bg-surface px-1.5 py-0.5 text-[9px] font-medium text-muted border border-border">
                            {item.badge}
                          </span>
                        )}
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
          id="creator-sidebar-collapse-btn"
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          className="flex h-11 min-h-[44px] w-full items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-subtle hover:text-ink transition-colors text-xs font-medium gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
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

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if current route is a detail workbench page requiring full-bleed bottom bar (0px space underneath)
  const isDetailPage = /^\/admin\/[a-z0-9_-]+\/\d+/.test(location.pathname);

  return (
    <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-canvas text-ink">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-full">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform lg:hidden transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AdminSidebar
          collapsed={false}
          onToggleCollapse={() => setMobileOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 h-full">
        <AdminHeader
          onToggleMobileMenu={() => setMobileOpen(true)}
          currentUser={
            user
              ? {
                  email: user.email,
                  fullName: user.fullName,
                  roles: user.roles,
                }
              : null
          }
          onLogout={handleLogout}
        />

        <main
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 flex flex-col',
            isDetailPage ? 'pb-0' : 'pb-4 sm:pb-6 md:pb-8'
          )}
        >
          <div className="w-full flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

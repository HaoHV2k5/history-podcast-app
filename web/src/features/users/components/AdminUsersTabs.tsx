import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Radio } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AdminUsersTabsProps {
  activeTab?: 'users' | 'channels';
}

export const AdminUsersTabs: React.FC<AdminUsersTabsProps> = ({ activeTab = 'users' }) => {
  return (
    <div className="flex items-center gap-6 border-b border-[#E7E5E4]" role="tablist" aria-label="Phân loại quản lý người dùng và kênh">
      <NavLink
        to="/admin/users"
        role="tab"
        aria-selected={activeTab === 'users'}
        className={cn(
          'inline-flex items-center gap-2 pb-3 pt-1 text-sm font-semibold transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]',
          activeTab === 'users'
            ? 'border-b-2 border-[#991B1B] text-[#991B1B]'
            : 'border-b-2 border-transparent text-stone-500 hover:text-stone-800'
        )}
      >
        <User className="h-4 w-4" />
        <span>Người dùng (Users)</span>
      </NavLink>

      <NavLink
        to="/admin/channels"
        role="tab"
        aria-selected={activeTab === 'channels'}
        className={cn(
          'inline-flex items-center gap-2 pb-3 pt-1 text-sm font-semibold transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]',
          activeTab === 'channels'
            ? 'border-b-2 border-[#991B1B] text-[#991B1B]'
            : 'border-b-2 border-transparent text-stone-500 hover:text-stone-800'
        )}
      >
        <Radio className="h-4 w-4" />
        <span>Kênh Podcast (Channels)</span>
      </NavLink>
    </div>
  );
};


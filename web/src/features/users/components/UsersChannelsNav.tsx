import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Radio } from 'lucide-react';
import { cn } from '@/utils/cn';

export const UsersChannelsNav: React.FC = () => {
  return (
    <div className="flex items-center gap-2 border-b border-border mb-6" role="tablist">
      <NavLink
        to="/admin/users"
        role="tab"
        className={({ isActive }) =>
          cn(
            'inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-medium border-b-2 transition-colors duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-sm',
            isActive
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
          )
        }
      >
        <Users className="h-4 w-4" />
        <span>Người dùng (Users)</span>
      </NavLink>

      <NavLink
        to="/admin/channels"
        role="tab"
        className={({ isActive }) =>
          cn(
            'inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-medium border-b-2 transition-colors duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-sm',
            isActive
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
          )
        }
      >
        <Radio className="h-4 w-4" />
        <span>Kênh Podcast (Channels)</span>
      </NavLink>
    </div>
  );
};

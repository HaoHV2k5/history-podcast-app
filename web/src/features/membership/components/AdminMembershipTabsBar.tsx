import React from 'react';
import { Crown, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminMembershipTabsBarProps {
  activeTab: 'tiers' | 'history';
  onTabChange: (tab: 'tiers' | 'history') => void;
  onOpenConfigModal: () => void;
  onOpenCreatePlanModal?: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const AdminMembershipTabsBar: React.FC<AdminMembershipTabsBarProps> = ({
  activeTab,
  onTabChange,
  onOpenConfigModal,
  containerRef,
}) => {
  return (
    <div
      ref={containerRef}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EBE6] pb-1"
    >
      {/* Left: 2 Tabs */}
      <div className="flex items-center gap-6 text-sm" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tiers'}
          onClick={() => onTabChange('tiers')}
          className={`relative pb-3 flex items-center gap-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'tiers'
              ? 'text-[#991B1B] font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Crown className="h-4 w-4" />
          <span>Đặc quyền hệ thống &amp; Gói kênh</span>
          {activeTab === 'tiers' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#991B1B] rounded-full" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => onTabChange('history')}
          className={`relative pb-3 flex items-center gap-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'text-[#991B1B] font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Lịch sử thanh toán</span>
          {activeTab === 'history' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#991B1B] rounded-full" />
          )}
        </button>
      </div>

      {/* Right: System Perks Configuration Button (Admin manages system-wide perks only, not per-channel plans) */}
      <div className="flex items-center gap-2.5 pb-2 sm:pb-0">
        <Button
          type="button"
          size="sm"
          onClick={onOpenConfigModal}
          className="min-h-[38px] px-4 text-xs font-semibold bg-[#991B1B] hover:bg-[#831826] text-white transition-colors shadow-xs rounded-xl cursor-pointer"
        >
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          <span>Cấu hình đặc quyền hệ thống</span>
        </Button>
      </div>
    </div>
  );
};

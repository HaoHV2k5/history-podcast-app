import React from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface AdminModerationBatchBarProps {
  selectedCount: number;
  onApproveBatch: () => void;
  onRejectBatch: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export const AdminModerationBatchBar: React.FC<AdminModerationBatchBarProps> = ({
  selectedCount,
  onApproveBatch,
  onRejectBatch,
  onClearSelection,
  isProcessing = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-[#E0DDD7] bg-white/95 backdrop-blur-md px-5 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 select-none">
      <div className="flex items-center gap-2 border-r border-[#E0DDD7] pr-3 text-xs font-semibold text-[#1C1917]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#991B1B] text-[10px] text-white">
          {selectedCount}
        </span>
        <span>Đã chọn {selectedCount} video</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={onApproveBatch}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Phê duyệt</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={onRejectBatch}
          className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Từ chối</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#78716C] hover:bg-[#F5F2EB] hover:text-[#1C1917] transition-colors"
          title="Bỏ chọn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};


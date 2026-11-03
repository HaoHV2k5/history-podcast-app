import React from 'react';
import { CheckCircle2, XCircle, Download, X } from 'lucide-react';

interface AdminKycBatchBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchApprove: () => void;
  onBatchReject: () => void;
  onBatchExport: () => void;
  isProcessing?: boolean;
}

export const AdminKycBatchBar: React.FC<AdminKycBatchBarProps> = ({
  selectedCount,
  onClearSelection,
  onBatchApprove,
  onBatchReject,
  onBatchExport,
  isProcessing,
}) => {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="Thanh tác vụ hàng loạt hồ sơ KYC"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-[#991B1B]/30 bg-[#1C1917] px-4 py-2.5 text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-200 select-none max-w-xl w-[92vw] sm:w-auto"
    >
      <div className="flex items-center gap-2 pr-3 border-r border-white/20">
        <span className="flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-[#991B1B] text-xs font-bold font-mono">
          {selectedCount}
        </span>
        <span className="text-xs font-medium hidden sm:inline">hồ sơ đã chọn</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBatchApprove}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Duyệt đã chọn</span>
        </button>

        <button
          type="button"
          onClick={onBatchReject}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Từ chối</span>
        </button>

        <button
          type="button"
          onClick={onBatchExport}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-medium transition-colors"
          title="Xuất CSV các hồ sơ đã chọn"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Xuất CSV</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1"
          title="Bỏ chọn tất cả"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, Eye } from 'lucide-react';
import { WithdrawalItem } from '@/types/withdrawal';
import { formatVND } from '@/utils/formatters';
import {
  getInitials,
  getAvatarColor,
  formatMaskedAccountNumber,
  getWithdrawalStatusBadge,
  formatWithdrawalDateTime,
} from '../overviewLogic';

interface AdminWithdrawalsTableProps {
  items: WithdrawalItem[];
  totalCount: number;
  isLoading?: boolean;
}

export const AdminWithdrawalsTable: React.FC<AdminWithdrawalsTableProps> = ({
  items,
  totalCount,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-xs">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Wallet className="h-4 w-4" />
            </div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1C1917]">
              Yêu cầu Rút tiền chờ xem xét ({totalCount})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/withdrawals')}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-[#E0DDD7] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] shadow-2xs transition-colors hover:border-accent/40 hover:bg-[#F9F7F4] hover:text-accent cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Withdrawals Table Layout */}
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F0EBE1] text-xs font-medium text-[#78716C]">
                <th className="py-3 pr-3 font-medium">Nhà sáng tạo</th>
                <th className="py-3 px-3 font-medium">Số tiền</th>
                <th className="py-3 px-3 font-medium">Ngân hàng</th>
                <th className="py-3 px-3 font-medium">Thời gian yêu cầu</th>
                <th className="py-3 px-3 font-medium">Trạng thái</th>
                <th className="py-3 pl-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]/70">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                      <span className="text-xs text-muted">Đang tải yêu cầu rút tiền...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.slice(0, 4).map((item, idx) => {
                  const initials = getInitials(item.accountHolderName);
                  const palette = getAvatarColor(item.accountHolderName);
                  const statusBadge = getWithdrawalStatusBadge(item.status);
                  const maskedAcc = formatMaskedAccountNumber(item.accountNumber);
                  const formattedTime = formatWithdrawalDateTime(item.requestedAt);

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-[#FBF9F6] transition-colors duration-150 group"
                    >
                      {/* Creator */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2.5 min-w-[140px]">
                          {item.creatorAvatar ? (
                            <img
                              src={item.creatorAvatar}
                              alt={item.accountHolderName || 'Nhà sáng tạo'}
                              className="h-8 w-8 shrink-0 rounded-full object-cover shadow-2xs border border-black/[0.06]"
                            />
                          ) : (
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs select-none shadow-2xs border border-black/[0.06] ${palette.bg} ${palette.text}`}
                            >
                              {initials}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-[#1C1917] truncate group-hover:text-accent transition-colors">
                            {item.accountHolderName || 'Chưa cập nhật'}
                          </span>
                        </div>
                      </td>

                      {/* Số tiền */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-bold text-[#1C1917] whitespace-nowrap tabular-nums">
                          {formatVND(item.amount)}
                        </span>
                      </td>

                      {/* Ngân hàng */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-xs leading-tight">
                          <span className="font-semibold text-[#1C1917] truncate max-w-[130px]">
                            {item.bankName || 'Ngân hàng'}
                          </span>
                          <span className="font-mono text-[11px] text-[#A8A29E] tracking-tight mt-0.5">
                            {maskedAcc}
                          </span>
                        </div>
                      </td>

                      {/* Thời gian yêu cầu */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs text-[#57534E] whitespace-nowrap tabular-nums">
                          {formattedTime}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium select-none ${
                            statusBadge.variant === 'error'
                              ? 'bg-[#FFF0F0] text-[#DC2626]'
                              : statusBadge.variant === 'processing'
                              ? 'bg-[#EFF6FF] text-[#2563EB]'
                              : statusBadge.variant === 'success'
                              ? 'bg-[#ECFDF5] text-[#15803D]'
                              : 'bg-[#FEF7E6] text-[#D97706]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              statusBadge.variant === 'error'
                                ? 'bg-[#DC2626]'
                                : statusBadge.variant === 'processing'
                                ? 'bg-[#2563EB]'
                                : statusBadge.variant === 'success'
                                ? 'bg-[#15803D]'
                                : 'bg-[#D97706]'
                            }`}
                          />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/withdrawals/${item.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E0DDD7] bg-white px-3 py-1 text-xs font-medium text-[#1C1917] shadow-2xs transition-all duration-150 hover:border-accent/40 hover:text-accent hover:bg-canvas active:scale-[0.98] cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#78716C]" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-muted">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-ink">Không có yêu cầu rút tiền nào cần duyệt</p>
                    <p className="text-[11px] text-muted">Tất cả giao dịch đã được xử lý xong.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


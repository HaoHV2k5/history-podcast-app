import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowRight, User } from 'lucide-react';
import { KycProfile } from '@/types/kyc';
import { formatDate } from '@/utils/formatters';
import { getInitials, getAvatarColor, getKycStatusBadge } from '../overviewLogic';

interface AdminKycQueueProps {
  items: KycProfile[];
  totalCount: number;
  isLoading?: boolean;
}

export const AdminKycQueue: React.FC<AdminKycQueueProps> = ({
  items,
  totalCount,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-xs">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#E0DDD7]/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDE8E8] text-[#DC2626]">
              <User className="h-4 w-4" />
            </div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-ink">
              Hàng đợi Xác thực KYC Nhà sáng tạo ({totalCount})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/kyc')}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-accent transition-colors p-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* KYC Applicants List */}
        <div className="divide-y divide-[#E0DDD7]/60">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <span className="text-xs text-muted">Đang tải hồ sơ KYC...</span>
            </div>
          ) : items.length > 0 ? (
            items.slice(0, 4).map((item, idx) => {
              const initials = getInitials(item.fullName || item.userEmail);
              const palette = getAvatarColor(item.fullName || item.userEmail);
              const statusBadge = getKycStatusBadge(item.status);

              return (
                <div
                  key={item.id || idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/kyc/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/kyc/${item.id}`);
                    }
                  }}
                  className="group py-3 flex items-center justify-between gap-3 sm:gap-4 hover:bg-[#F9F7F4] -mx-2 px-2.5 rounded-xl transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* Left: Avatar & Applicant Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-2xs border border-black/[0.06] select-none ${palette.bg} ${palette.text}`}
                    >
                      {initials}
                    </div>

                    <div className="flex flex-col min-w-0 space-y-0.5">
                      <span className="text-xs font-semibold text-ink truncate group-hover:text-accent transition-colors">
                        {item.fullName || 'Chưa cập nhật tên'}
                      </span>
                      <span className="text-[11px] text-muted font-mono truncate">
                        {item.userEmail || item.contactEmail || 'Chưa cập nhật email'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Registration Date & Status Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] text-muted">
                      Đăng ký: {formatDate(item.createdAt)}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none ${statusBadge.variant === 'error'
                          ? 'bg-[#FDE8E8] text-[#DC2626] border-[#FECACA]'
                          : statusBadge.variant === 'processing'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                            : statusBadge.variant === 'success'
                              ? 'bg-[#ECF3EE] text-[#246B4C] border-[#A7F3D0]'
                              : 'bg-[#FEF7E6] text-[#D97706] border-[#FDE68A]'
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusBadge.variant === 'error'
                            ? 'bg-[#DC2626]'
                            : statusBadge.variant === 'processing'
                              ? 'bg-[#2563EB]'
                              : statusBadge.variant === 'success'
                                ? 'bg-[#246B4C]'
                                : 'bg-[#D97706]'
                          }`}
                      />
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-muted">
                <UserCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-ink">Không có hồ sơ KYC nào chờ duyệt</p>
              <p className="text-[11px] text-muted">Tất cả đơn đăng ký Nhà sáng tạo đã được xác thực.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


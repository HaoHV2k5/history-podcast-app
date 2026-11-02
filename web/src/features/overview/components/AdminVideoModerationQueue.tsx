import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowRight, Film } from 'lucide-react';
import { AdminModerationItem } from '@/types/moderation';
import { formatDateTime } from '@/utils/formatters';
import { resolveHistoricalThumbnail } from '@/features/studio/creatorStudioUtils';
import { getModerationStatusBadge } from '../overviewLogic';

interface AdminVideoModerationQueueProps {
  items: AdminModerationItem[];
  totalCount: number;
  isLoading?: boolean;
}

export const AdminVideoModerationQueue: React.FC<AdminVideoModerationQueueProps> = ({
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
              <Film className="h-4 w-4" />
            </div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-ink">
              Hàng đợi Kiểm duyệt Video ({totalCount})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/moderation')}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-accent transition-colors p-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Video Items List */}
        <div className="divide-y divide-[#E0DDD7]/60">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <span className="text-xs text-muted">Đang tải hàng đợi video...</span>
            </div>
          ) : items.length > 0 ? (
            items.slice(0, 4).map((item, idx) => {
              const thumbnailSrc =
                resolveHistoricalThumbnail(item.title, item.optimizedUrl || item.fileUrl, item.fileUrl) ||
                (idx % 2 === 0
                  ? '/assets/studio/topic-bach-dang-1288.png'
                  : '/assets/studio/topic-thang-long.png');

              const statusBadge = getModerationStatusBadge(item.decision);

              return (
                <div
                  key={item.reviewId || idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/moderation/${item.reviewId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/moderation/${item.reviewId}`);
                    }
                  }}
                  className="group py-3.5 flex items-center justify-between gap-3 sm:gap-4 hover:bg-[#F9F7F4] -mx-2 px-2.5 rounded-xl transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* Left: Video Thumbnail & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E0DDD7] bg-[#EFEAE3] shadow-2xs">
                      <img
                        src={thumbnailSrc}
                        alt={item.title || 'Video thumbnail'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to topic image on network error
                          (e.target as HTMLImageElement).src = '/assets/studio/topic-bach-dang-1288.png';
                        }}
                      />
                    </div>

                    <div className="flex flex-col min-w-0 space-y-0.5">
                      <span className="text-xs font-semibold text-ink truncate group-hover:text-accent transition-colors">
                        {item.title || 'Nội dung chưa đặt tiêu đề'}
                      </span>
                      <span className="text-[11px] text-muted truncate">
                        {item.channelName ? `Kênh: ${item.channelName}` : 'Chưa phân kênh'}
                        {item.creatorEmail ? ` • ${item.creatorEmail}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Right: Timestamp & Status Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block font-mono text-[11px] text-muted tabular-nums">
                      {formatDateTime(item.createdAt)}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none ${
                        statusBadge.variant === 'error'
                          ? 'bg-[#FDE8E8] text-[#DC2626] border-[#FECACA]'
                          : statusBadge.variant === 'success'
                          ? 'bg-[#ECF3EE] text-[#246B4C] border-[#A7F3D0]'
                          : 'bg-[#FEF7E6] text-[#D97706] border-[#FDE68A]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          statusBadge.variant === 'error'
                            ? 'bg-[#DC2626]'
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
                <Video className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-ink">Không có video nào chờ duyệt</p>
              <p className="text-[11px] text-muted">Tất cả video đã được xử lý hoặc xuất bản.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Radio,
  X,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useModerationTracker } from '../useModerationTracker';
import { formatDate, formatDuration } from '@/utils/formatters';

export const CreatorModerationNotificationPopover: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'decisions'>('pending');

  const {
    pendingVideos,
    pendingCount,
    recentDecisions,
    isFetching,
    isPolling,
    checkNow,
    dismissDecision,
    clearAllDecisions,
  } = useModerationTracker();

  const totalBadgeCount = pendingCount + recentDecisions.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="creator-moderation-bell-btn"
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-canvas text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          aria-label="Theo dõi kiểm duyệt tác phẩm trong phiên"
          title="Theo dõi kiểm duyệt tác phẩm (Phiên làm việc)"
        >
          <Bell className="h-4 w-4" />

          {/* Indicator Badge */}
          {totalBadgeCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs ${
                recentDecisions.some((d) => d.decision === 'REJECTED')
                  ? 'bg-status-error-text'
                  : recentDecisions.some((d) => d.decision === 'APPROVED')
                    ? 'bg-status-success-text'
                    : 'bg-accent'
              }`}
            >
              {totalBadgeCount}
            </span>
          )}

          {/* Real-time Polling Dot */}
          {isPolling && (
            <span className="absolute bottom-1 right-1 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] sm:w-[420px] p-0 border border-border bg-surface shadow-modal rounded-xl overflow-hidden z-50"
      >
        {/* Header Bar */}
        <div className="p-3.5 px-4 border-b border-border bg-surface-subtle/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-accent-soft text-accent flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink block leading-tight">
                Theo Dõi Kiểm Duyệt Tác Phẩm
              </span>
              <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isPolling ? 'bg-emerald-500' : 'bg-muted'}`}
                />
                <span>{isPolling ? 'Tự động thăm dò trạng thái (15s)' : 'Trạng thái sẵn sàng'}</span>
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkNow()}
            disabled={isFetching}
            className="h-7 px-2 text-[11px] gap-1 text-muted hover:text-ink cursor-pointer"
            title="Kiểm tra trạng thái ngay từ server"
          >
            <RotateCcw className={`h-3 w-3 ${isFetching ? 'animate-spin text-accent' : ''}`} />
            <span className="hidden sm:inline">Kiểm tra</span>
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border text-xs bg-surface">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 px-3 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-accent text-accent font-semibold bg-surface-subtle/30'
                : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle/20'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Đang chờ duyệt</span>
            {pendingCount > 0 && (
              <Badge variant="pending" size="sm" className="px-1.5 py-0 h-4 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decisions')}
            className={`flex-1 py-2 px-3 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'decisions'
                ? 'border-accent text-accent font-semibold bg-surface-subtle/30'
                : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle/20'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quyết định trong phiên</span>
            {recentDecisions.length > 0 && (
              <Badge variant="accent" size="sm" className="px-1.5 py-0 h-4 text-[10px]">
                {recentDecisions.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border p-1">
          {/* TAB 1: PENDING ITEMS */}
          {activeTab === 'pending' && (
            <>
              {pendingVideos.length > 0 ? (
                pendingVideos.map((item) => (
                  <div
                    key={item.contentId}
                    onClick={() => navigate(`/creator/content/${item.contentId}`)}
                    className="p-3 hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-ink line-clamp-1 group-hover:text-accent transition-colors">
                        {item.title}
                      </span>
                      <Badge variant="pending" size="sm" className="shrink-0 text-[10px]">
                        Chờ duyệt
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                      {item.durationSeconds ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {formatDuration(item.durationSeconds)}
                        </span>
                      ) : null}
                      <span>{formatDate(item.createdAt)}</span>
                      {item.aiShieldScore !== null && item.aiShieldScore !== undefined && (
                        <span className="flex items-center gap-1 text-accent font-medium font-mono">
                          <ShieldCheck className="h-3 w-3" />
                          {Number(item.aiShieldScore).toFixed(1)}/100
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-1.5 text-muted px-4">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-muted/50" />
                  <p className="text-xs font-medium text-ink">Không có tác phẩm nào đang chờ duyệt</p>
                  <p className="text-[11px] text-muted">
                    Các tác phẩm bạn gửi kiểm duyệt sẽ tự động hiển thị và được theo dõi tại đây.
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: RECENT DECISION EVENTS */}
          {activeTab === 'decisions' && (
            <>
              {recentDecisions.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted border-b border-border/40 mb-1">
                    <span>{recentDecisions.length} quyết định trong phiên</span>
                    <button
                      type="button"
                      onClick={() => clearAllDecisions()}
                      className="text-accent hover:underline cursor-pointer font-medium"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  {recentDecisions.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg transition-colors space-y-1.5 relative ${
                      event.decision === 'APPROVED'
                        ? 'bg-status-success-bg/40 border border-status-success-text/20'
                        : 'bg-status-error-bg/40 border border-status-error-text/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissDecision(event.id);
                      }}
                      className="absolute top-2 right-2 text-muted hover:text-ink p-0.5"
                      title="Bỏ qua thông báo này"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 pr-6">
                      {event.decision === 'APPROVED' ? (
                        <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-status-error-text shrink-0" />
                      )}
                      <span
                        className={`text-xs font-bold ${
                          event.decision === 'APPROVED'
                            ? 'text-status-success-text'
                            : 'text-status-error-text'
                        }`}
                      >
                        {event.decision === 'APPROVED'
                          ? 'Đã được Phê duyệt & Xuất bản!'
                          : 'Bị Từ chối kiểm duyệt'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-ink line-clamp-1">{event.title}</p>

                    {event.reason && (
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                        <strong>Lý do:</strong> {event.reason}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted">
                      <span>{new Date(event.timestamp).toLocaleTimeString('vi-VN')}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/creator/content/${event.contentId}`)}
                        className="inline-flex items-center gap-1 text-accent hover:underline font-semibold"
                      >
                        <span>{event.decision === 'APPROVED' ? 'Xem tác phẩm' : 'Sửa & Gửi lại'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
                <div className="py-8 text-center space-y-1.5 text-muted px-4">
                  <Radio className="h-8 w-8 mx-auto text-muted/50" />
                  <p className="text-xs font-medium text-ink">Chưa có quyết định mới trong phiên này</p>
                  <p className="text-[11px] text-muted">
                    Khi Ban biên tập duyệt hoặc từ chối tác phẩm, hệ thống sẽ phát hiện và cập nhật ngay.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation & Transparency Disclaimer */}
        <div className="p-3 bg-surface-subtle/60 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs h-7 px-2.5 gap-1 w-full justify-center"
            >
              <span>Vào Thư viện nội dung</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-[10px] text-muted/80 leading-normal text-center italic">
            * Cơ chế: Thăm dò trạng thái theo thời gian thực (Polling) từ API nội dung đã xác thực.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

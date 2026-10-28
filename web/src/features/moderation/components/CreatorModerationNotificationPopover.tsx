import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  CheckCircle2,
  CheckCheck,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Radio,
  X,
  Sparkles,
  AlertTriangle,
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
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const {
    pendingVideos,
    pendingCount,
    unreadPendingCount,
    recentDecisions,
    unreadDecisionsCount,
    unreadCount,
    isRead,
    markAsRead,
    markAllAsRead,
    exhaustedCount,
    isFetching,
    isPolling,
    checkNow,
    dismissDecision,
    clearAllDecisions,
  } = useModerationTracker();

  // Filter items based on filterMode
  const displayedPendingVideos =
    filterMode === 'unread'
      ? pendingVideos.filter((v) => !isRead(`pending-${v.contentId}`))
      : pendingVideos;

  const displayedDecisions =
    filterMode === 'unread'
      ? recentDecisions.filter((d) => !isRead(`decision-${d.id}`))
      : recentDecisions;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="creator-moderation-bell-btn"
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-canvas text-muted transition-all duration-150 hover:bg-surface-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95 cursor-pointer shadow-2xs"
          aria-label="Theo dõi thông báo kiểm duyệt tác phẩm"
          title="Thông báo kiểm duyệt tác phẩm"
        >
          <Bell className="h-4 w-4" />

          {/* Indicator Badge: Only renders when unreadCount > 0, disappears completely once read */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs animate-scale-in ${
                recentDecisions.some((d) => !isRead(`decision-${d.id}`) && d.decision === 'REJECTED')
                  ? 'bg-status-error-text'
                  : recentDecisions.some((d) => !isRead(`decision-${d.id}`) && d.decision === 'APPROVED')
                    ? 'bg-status-success-text'
                    : 'bg-accent'
              }`}
            >
              {unreadCount}
            </span>
          )}

          {/* Real-time Polling Pulse Dot */}
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
        className="w-[360px] sm:w-[430px] p-0 border border-border/80 bg-white/95 backdrop-blur-2xl shadow-apple-dialog rounded-2xl overflow-hidden z-50 animate-apple-spring-in"
      >
        {/* Header Bar */}
        <div className="p-3.5 px-4 border-b border-border/60 bg-gradient-to-b from-[#FAF8F5]/90 to-white/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink block leading-tight">
                Theo Dõi Kiểm Duyệt Tác Phẩm
              </span>
              <span className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isPolling ? 'bg-emerald-500' : 'bg-muted'}`}
                />
                <span>{isPolling ? 'Tự động thăm dò trạng thái (15s)' : 'Trạng thái sẵn sàng'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-7 px-2 text-[11px] gap-1 text-accent hover:text-accent-hover font-semibold cursor-pointer active:scale-95 transition-transform"
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đã đọc tất cả</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => checkNow()}
              disabled={isFetching}
              className="h-7 px-2 text-[11px] gap-1 text-muted hover:text-ink cursor-pointer active:scale-95 transition-transform"
              title="Kiểm tra trạng thái ngay từ máy chủ"
            >
              <RotateCcw className={`h-3 w-3 ${isFetching ? 'animate-spin text-accent' : ''}`} />
              <span className="hidden sm:inline">Kiểm tra</span>
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border/60 text-xs bg-surface">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 px-3 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'border-accent text-accent font-semibold bg-surface-subtle/30'
                : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle/20'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Đang chờ duyệt</span>
            {pendingCount > 0 && (
              <Badge
                variant={unreadPendingCount > 0 ? 'accent' : 'pending'}
                size="sm"
                className="px-1.5 py-0 h-4 text-[10px]"
              >
                {pendingCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decisions')}
            className={`flex-1 py-2.5 px-3 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'decisions'
                ? 'border-accent text-accent font-semibold bg-surface-subtle/30'
                : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle/20'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quyết định trong phiên</span>
            {recentDecisions.length > 0 && (
              <Badge
                variant={unreadDecisionsCount > 0 ? 'accent' : 'outline'}
                size="sm"
                className="px-1.5 py-0 h-4 text-[10px]"
              >
                {recentDecisions.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Read / Unread Filter Toggle Bar */}
        <div className="px-3.5 py-1.5 bg-[#FAF8F5]/60 border-b border-border/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white shadow-2xs text-ink font-semibold border border-border/80'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Tất cả ({activeTab === 'pending' ? pendingVideos.length : recentDecisions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unread')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                filterMode === 'unread'
                  ? 'bg-white shadow-2xs text-accent font-semibold border border-border/80'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>Chưa đọc</span>
              {(activeTab === 'pending' ? unreadPendingCount : unreadDecisionsCount) > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
              <span>
                ({activeTab === 'pending' ? unreadPendingCount : unreadDecisionsCount})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'decisions' && recentDecisions.length > 0 && (
              <button
                type="button"
                onClick={() => clearAllDecisions()}
                className="text-muted hover:text-status-error-text text-[10px] transition-colors cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* Retry Exhaustion Alert Banner */}
        {exhaustedCount > 0 && (
          <div className="mx-3 my-2 p-2 rounded-xl bg-status-warning-bg/40 border border-status-warning-text/30 flex items-center justify-between text-[11px] text-ink">
            <div className="flex items-center gap-1.5 pr-2">
              <AlertTriangle className="h-3.5 w-3.5 text-status-warning-text shrink-0" />
              <span>
                <strong>{exhaustedCount}</strong> tác phẩm cần kết nối lại để xác nhận kết quả
              </span>
            </div>
            <button
              type="button"
              onClick={() => checkNow()}
              disabled={isFetching}
              className="text-accent font-semibold hover:underline shrink-0 cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Tab Content Panel */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60 p-1.5 space-y-1">
          {/* TAB 1: PENDING ITEMS */}
          {activeTab === 'pending' && (
            <>
              {displayedPendingVideos.length > 0 ? (
                displayedPendingVideos.map((item) => {
                  const read = isRead(`pending-${item.contentId}`);
                  return (
                    <div
                      key={item.contentId}
                      onClick={() => {
                        markAsRead(`pending-${item.contentId}`);
                        navigate(`/creator/content/${item.contentId}`);
                      }}
                      className={`p-3 rounded-xl transition-all cursor-pointer space-y-1.5 group relative ${
                        read
                          ? 'bg-surface hover:bg-surface-subtle/50 opacity-80'
                          : 'bg-accent/[0.04] border-l-2 border-accent hover:bg-accent/[0.07] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {!read && (
                            <span
                              className="h-2 w-2 rounded-full bg-accent shrink-0"
                              title="Thông báo mới chưa đọc"
                            />
                          )}
                          <span
                            className={`text-xs truncate transition-colors ${
                              read
                                ? 'font-medium text-ink-muted group-hover:text-ink'
                                : 'font-bold text-ink group-hover:text-accent'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="pending" size="sm" className="shrink-0 text-[10px]">
                            Chờ duyệt
                          </Badge>
                          {!read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(`pending-${item.contentId}`);
                              }}
                              className="p-1 rounded-md text-muted hover:text-accent hover:bg-white transition-colors cursor-pointer"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
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
                        {read && (
                          <span className="text-[10px] text-muted/70 italic ml-auto">
                            ✓ Đã đọc
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-1.5 text-muted px-4">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-muted/50" />
                  <p className="text-xs font-medium text-ink">
                    {filterMode === 'unread'
                      ? 'Tất cả tác phẩm chờ duyệt đã được đọc'
                      : 'Không có tác phẩm nào đang chờ duyệt'}
                  </p>
                  <p className="text-[11px] text-muted">
                    {filterMode === 'unread'
                      ? 'Chuyển sang bộ lọc "Tất cả" để xem lại các tác phẩm đang được xử lý.'
                      : 'Các tác phẩm bạn gửi kiểm duyệt sẽ tự động hiển thị và được theo dõi tại đây.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: RECENT DECISION EVENTS */}
          {activeTab === 'decisions' && (
            <>
              {displayedDecisions.length > 0 ? (
                displayedDecisions.map((event) => {
                  const read = isRead(`decision-${event.id}`);
                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        markAsRead(`decision-${event.id}`);
                        navigate(`/creator/content/${event.contentId}`);
                      }}
                      className={`p-3 rounded-xl transition-all space-y-1.5 relative cursor-pointer group ${
                        read
                          ? 'bg-surface hover:bg-surface-subtle/50 opacity-80 border border-border/50'
                          : event.decision === 'APPROVED'
                            ? 'bg-status-success-bg/40 border border-status-success-text/30 border-l-4 border-l-status-success-text shadow-2xs'
                            : 'bg-status-error-bg/40 border border-status-error-text/30 border-l-4 border-l-status-error-text shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pr-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {!read && (
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                event.decision === 'APPROVED'
                                  ? 'bg-status-success-text'
                                  : 'bg-status-error-text'
                              }`}
                              title="Chưa đọc"
                            />
                          )}
                          {event.decision === 'APPROVED' ? (
                            <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 text-status-error-text shrink-0" />
                          )}
                          <span
                            className={`text-xs font-bold truncate ${
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

                        <div className="flex items-center gap-1">
                          {!read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(`decision-${event.id}`);
                              }}
                              className="p-1 rounded-md text-muted hover:text-ink hover:bg-white/80 transition-colors cursor-pointer"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissDecision(event.id);
                            }}
                            className="p-1 rounded-md text-muted hover:text-ink hover:bg-white/80 transition-colors cursor-pointer"
                            title="Bỏ qua thông báo này"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-ink line-clamp-1">{event.title}</p>

                      {event.reason && (
                        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                          <strong>Lý do:</strong> {event.reason}
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[10px] text-muted">
                        <span>{new Date(event.timestamp).toLocaleTimeString('vi-VN')}</span>
                        <div className="flex items-center gap-2">
                          {read && <span className="italic text-muted/70">✓ Đã đọc</span>}
                          <span className="inline-flex items-center gap-1 text-accent font-semibold group-hover:underline">
                            <span>{event.decision === 'APPROVED' ? 'Xem tác phẩm' : 'Sửa & Gửi lại'}</span>
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-1.5 text-muted px-4">
                  <Radio className="h-8 w-8 mx-auto text-muted/50" />
                  <p className="text-xs font-medium text-ink">
                    {filterMode === 'unread'
                      ? 'Tất cả quyết định đã được đọc'
                      : 'Chưa có quyết định mới trong phiên này'}
                  </p>
                  <p className="text-[11px] text-muted">
                    {filterMode === 'unread'
                      ? 'Chuyển sang bộ lọc "Tất cả" để xem lại lịch sử các quyết định.'
                      : 'Khi Ban biên tập duyệt hoặc từ chối tác phẩm, hệ thống sẽ phát hiện và cập nhật ngay.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation & Transparency Disclaimer */}
        <div className="p-3 bg-[#FAF8F5]/60 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/creator/content')}
              className="text-xs h-8 px-3 gap-1.5 w-full justify-center rounded-xl border-border/80 hover:bg-white text-ink font-medium cursor-pointer active:scale-[0.98] transition-transform"
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


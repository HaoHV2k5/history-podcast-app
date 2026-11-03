import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  Wallet,
  AlertTriangle,
  Crown,
  ChevronRight,
  Clock,
  Inbox,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import { moderationApi } from '@/services/api/moderation';
import { kycApi } from '@/services/api/kyc';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { disputesApi } from '@/services/api/disputes';
import { membershipApi } from '@/services/api/membership';
import {
  ADMIN_READ_IDS_KEY_PREFIX,
  safeParseReadIds,
  serializeReadIds,
  buildAdminNotificationItems,
  AdminNotificationItem,
} from './adminNotificationLogic';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

export const AdminNotificationPopover: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  // Isolate read notifications per authenticated user (Zero Data Leaks)
  const storageKey = user?.email
    ? `${ADMIN_READ_IDS_KEY_PREFIX}${encodeURIComponent(user.email)}`
    : `${ADMIN_READ_IDS_KEY_PREFIX}default`;

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    return safeParseReadIds(typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null);
  });

  // Sync state if storage key changes (e.g. login switch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReadIds(safeParseReadIds(localStorage.getItem(storageKey)));
    }
  }, [storageKey]);

  // 1. Pending Moderation Reviews (decision = PENDING / WAITING_REVIEW)
  const { data: modData, isFetching: modFetching } = useQuery({
    queryKey: ['admin-notifications-moderation'],
    queryFn: () => moderationApi.getReviews({ decision: 'PENDING', size: 20 }),
    refetchInterval: 30000,
  });

  // 2. Pending KYC Profiles (status = PENDING / SUBMITTED)
  const { data: kycData, isFetching: kycFetching } = useQuery({
    queryKey: ['admin-notifications-kyc'],
    queryFn: () => kycApi.getKycProfiles({ status: 'PENDING', size: 20 }),
    refetchInterval: 30000,
  });

  // 3. Pending Withdrawals (status = PENDING)
  const { data: withData, isFetching: withFetching } = useQuery({
    queryKey: ['admin-notifications-withdrawals'],
    queryFn: () => withdrawalsApi.getAllWithdrawals(0, 50),
    refetchInterval: 30000,
  });

  // 4. Open Disputes (status !== RESOLVED)
  const { data: dispData, isFetching: dispFetching } = useQuery({
    queryKey: ['admin-notifications-disputes'],
    queryFn: () => disputesApi.getAllDisputes('OPEN'),
    refetchInterval: 30000,
  });

  // 5. Membership Payments (status = PENDING)
  const { data: memData, isFetching: memFetching } = useQuery({
    queryKey: ['admin-notifications-membership'],
    queryFn: () => membershipApi.getAllPayments(),
    refetchInterval: 30000,
  });

  // Consolidate real items from server responses (Zero Fake Data)
  const notifications: AdminNotificationItem[] = useMemo(() => {
    return buildAdminNotificationItems({
      moderationData: modData?.data,
      kycData: kycData?.data,
      withdrawalsData: withData?.data,
      disputesData: dispData?.data,
      membershipData: memData?.data,
    });
  }, [modData, kycData, withData, dispData, memData]);

  const isRead = (id: string) => readIds.has(id);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, serializeReadIds(next));
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, serializeReadIds(next));
      }
      return next;
    });
  };

  // Unread count drives header badge
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !isRead(n.id)).length;
  }, [notifications, readIds]);

  // Filter items based on active mode
  const displayedItems = useMemo(() => {
    if (filterMode === 'unread') {
      return notifications.filter((n) => !isRead(n.id));
    }
    return notifications;
  }, [notifications, filterMode, readIds]);

  const isGlobalFetching =
    modFetching || kycFetching || withFetching || dispFetching || memFetching || isRefreshing;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-moderation'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-kyc'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-withdrawals'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-disputes'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-membership'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleItemClick = (item: AdminNotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    navigate(item.link);
  };

  const getCategoryIcon = (category: AdminNotificationItem['category']) => {
    switch (category) {
      case 'moderation':
        return <ShieldAlert className="h-4 w-4 text-amber-600" />;
      case 'kyc':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'withdrawals':
        return <Wallet className="h-4 w-4 text-emerald-600" />;
      case 'disputes':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case 'membership':
        return <Crown className="h-4 w-4 text-[#991B1B]" />;
      default:
        return <Bell className="h-4 w-4 text-stone-600" />;
    }
  };

  const getCategoryBg = (category: AdminNotificationItem['category']) => {
    switch (category) {
      case 'moderation':
        return 'bg-amber-50 border-amber-200/80';
      case 'kyc':
        return 'bg-blue-50 border-blue-200/80';
      case 'withdrawals':
        return 'bg-emerald-50 border-emerald-200/80';
      case 'disputes':
        return 'bg-rose-50 border-rose-200/80';
      case 'membership':
        return 'bg-[#FFF5F5] border-rose-200/80';
      default:
        return 'bg-stone-50 border-stone-200';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:text-[#1F1612] hover:bg-stone-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B] cursor-pointer shadow-2xs"
          aria-label={
            unreadCount > 0
              ? `Thông báo hệ thống (${unreadCount} thông báo chưa đọc)`
              : 'Thông báo hệ thống (Không có thông báo mới)'
          }
          title={
            unreadCount > 0
              ? `Có ${unreadCount} thông báo chưa đọc`
              : 'Thông báo hệ thống - Đã xem hết'
          }
        >
          <Bell className="h-4 w-4" />

          {/* Indicator Badge: Strictly renders unread count when > 0, disappears completely when read (Zero Fake Data) */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#DC2626] text-white font-mono text-[10px] font-bold shadow-xs animate-in zoom-in-75 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Polling / fetching pulse indicator */}
          {isGlobalFetching && unreadCount === 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] sm:w-[420px] p-0 rounded-2xl border border-[#F0EBE6] bg-white shadow-xl overflow-hidden text-left"
        sideOffset={8}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#F0EBE6] bg-[#FFFBF7] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#991B1B]">
              <Bell className="h-3.5 w-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F1612] leading-tight">
                Tác vụ & Thông báo
              </h4>
              <p className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{notifications.length} tác vụ trực tiếp • {unreadCount} chưa đọc</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#991B1B] hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer active:scale-95"
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đã đọc tất cả</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Làm mới dữ liệu từ máy chủ"
              aria-label="Làm mới dữ liệu"
            >
              <RotateCcw
                className={cn('h-3.5 w-3.5', isGlobalFetching && 'animate-spin text-[#991B1B]')}
              />
            </button>
          </div>
        </div>

        {/* Read / Unread Filter Toggle Bar (Matching Creator Experience) */}
        <div className="px-3.5 py-1.5 bg-[#FAF8F5]/80 border-b border-[#F0EBE6] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn(
                'px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer',
                filterMode === 'all'
                  ? 'bg-white shadow-2xs text-[#1F1612] font-bold border border-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              )}
            >
              Tất cả ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('unread')}
              className={cn(
                'px-2.5 py-0.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer',
                filterMode === 'unread'
                  ? 'bg-white shadow-2xs text-[#991B1B] font-bold border border-rose-200'
                  : 'text-stone-500 hover:text-stone-800'
              )}
            >
              <span>Chưa đọc</span>
              {unreadCount > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
              )}
              <span>({unreadCount})</span>
            </button>
          </div>

          <span className="text-[10px] text-stone-400">
            {unreadCount === 0 ? '✓ Đã đọc hết' : `${unreadCount} cần xem`}
          </span>
        </div>

        {/* Notification List Body */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-[#F0EBE6]/70">
          {displayedItems.length > 0 ? (
            displayedItems.map((item) => {
              const read = isRead(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'group relative flex items-start gap-3 p-3 transition-all cursor-pointer select-none',
                    read
                      ? 'bg-white hover:bg-stone-50/80 border-l-[3px] border-transparent opacity-75 hover:opacity-100'
                      : 'bg-[#FFF8F8] hover:bg-[#FEE2E2]/30 border-l-[3px] border-[#991B1B] shadow-2xs'
                  )}
                >
                  {/* Category Icon */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 shadow-2xs transition-transform group-hover:scale-105',
                      getCategoryBg(item.category)
                    )}
                  >
                    {getCategoryIcon(item.category)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {!read && (
                          <span
                            className="h-2 w-2 rounded-full bg-[#DC2626] shrink-0"
                            title="Thông báo mới chưa đọc"
                          />
                        )}
                        <h5
                          className={cn(
                            'text-xs truncate transition-colors',
                            read
                              ? 'font-normal text-stone-600 group-hover:text-stone-900'
                              : 'font-bold text-[#1F1612] group-hover:text-[#991B1B]'
                          )}
                        >
                          {item.title}
                        </h5>
                      </div>

                      {/* Read Toggle Button or Badge */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-md font-medium border',
                            read
                              ? 'bg-stone-100 text-stone-500 border-stone-200/60'
                              : 'bg-rose-100 text-rose-700 border-rose-200'
                          )}
                        >
                          {item.badgeLabel}
                        </span>

                        {!read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(item.id);
                            }}
                            className="p-1 rounded-md text-stone-400 hover:text-[#991B1B] hover:bg-white transition-colors cursor-pointer"
                            title="Đánh dấu đã đọc"
                            aria-label="Đánh dấu đã đọc"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p
                      className={cn(
                        'text-[11px] truncate mt-0.5',
                        read ? 'text-stone-400' : 'text-stone-600 font-medium'
                      )}
                    >
                      {item.subtitle}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-stone-300" />
                        {item.timeText}
                      </span>

                      {read ? (
                        <span className="text-[10px] text-stone-400 italic">
                          ✓ Đã đọc
                        </span>
                      ) : (
                        <span className="font-semibold text-[#991B1B] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Mở xử lý</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : filterMode === 'unread' && notifications.length > 0 ? (
            /* All items read empty state */
            <div className="px-6 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2.5 shadow-2xs">
                <CheckCircle2 className="h-5 w-5 stroke-[2]" />
              </div>
              <h5 className="text-xs font-bold text-[#1F1612]">
                Bạn đã đọc hết thông báo!
              </h5>
              <p className="text-[11px] text-stone-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                Không còn tác vụ chưa đọc nào. Nhấn vào &quot;Tất cả&quot; để xem lại lịch sử tác vụ.
              </p>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="mt-3 text-[11px] font-semibold text-[#991B1B] hover:underline cursor-pointer"
              >
                Xem tất cả ({notifications.length}) tác vụ
              </button>
            </div>
          ) : (
            /* System wide 0 tasks empty state (Zero Fake Data) */
            <div className="px-6 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-3 shadow-2xs">
                <Inbox className="h-6 w-6 stroke-[1.8]" />
              </div>
              <h5 className="text-xs font-bold text-[#1F1612]">
                Hệ thống đang hoạt động ổn định
              </h5>
              <p className="text-[11px] text-stone-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                Không có tác vụ nào tồn đọng hoặc hồ sơ cần phê duyệt lúc này.
              </p>

              {/* Quick links to core admin queues */}
              <div className="mt-4 pt-3 border-t border-[#F0EBE6] flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/moderation');
                  }}
                  className="text-[10px] px-2 py-1 rounded-md bg-stone-100 hover:bg-[#FEE2E2] hover:text-[#991B1B] text-stone-600 transition-colors font-medium cursor-pointer"
                >
                  Kiểm duyệt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/kyc');
                  }}
                  className="text-[10px] px-2 py-1 rounded-md bg-stone-100 hover:bg-[#FEE2E2] hover:text-[#991B1B] text-stone-600 transition-colors font-medium cursor-pointer"
                >
                  KYC Creator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/withdrawals');
                  }}
                  className="text-[10px] px-2 py-1 rounded-md bg-stone-100 hover:bg-[#FEE2E2] hover:text-[#991B1B] text-stone-600 transition-colors font-medium cursor-pointer"
                >
                  Rút tiền
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/membership');
                  }}
                  className="text-[10px] px-2 py-1 rounded-md bg-stone-100 hover:bg-[#FEE2E2] hover:text-[#991B1B] text-stone-600 transition-colors font-medium cursor-pointer"
                >
                  Gói hội viên
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#F0EBE6] bg-[#FFFBF7] px-4 py-2 flex items-center justify-between text-[10px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Đồng bộ máy chủ Sử Ký</span>
          </div>
          <span className="font-mono text-[9px] text-stone-400">Đã đọc/Chưa đọc lưu cục bộ</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

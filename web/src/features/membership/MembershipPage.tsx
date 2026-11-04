import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { membershipApi } from '@/services/api/membership';
import { usersApi } from '@/services/api/users';
import { channelsApi } from '@/services/api/channels';
import { isReducedMotion } from '@/utils/motion';
import {
  calculateMembershipKPIs,
  filterMembershipPayments,
  exportMembershipPaymentsToCSV,
  mapPaymentStatus,
  determinePlanName,
  determinePaymentMethod,
  DEFAULT_PLATFORM_TIERS,
  SYSTEM_PERKS_UPDATED_EVENT,
  getSystemMembershipPerks,
  saveCustomSystemPerks,
  MembershipTierConfig,
  PaymentDisplayRow,
  calculateDateRangeBounds,
} from './membershipLogic';

import { AdminMembershipHeroBanner } from './components/AdminMembershipHeroBanner';
import { AdminMembershipStatCards } from './components/AdminMembershipStatCards';
import { AdminMembershipTabsBar } from './components/AdminMembershipTabsBar';
import { AdminMembershipTierCards } from './components/AdminMembershipTierCards';
import { AdminMembershipFilterToolbar } from './components/AdminMembershipFilterToolbar';
import { AdminMembershipTransactionsTable } from './components/AdminMembershipTransactionsTable';
import { AdminMembershipDetailModal } from './components/AdminMembershipDetailModal';
import { AdminMembershipPlanConfigModal } from './components/AdminMembershipPlanConfigModal';

export const MembershipPage: React.FC = () => {
  // GSAP animation references
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tiersRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  // Filter & Pagination States (Default dateRangePreset = 'all' so all transactions are shown immediately)
  const [activeTab, setActiveTab] = useState<'tiers' | 'history'>('tiers');
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);

  // System-wide Membership Perks State (Shared between Admin & Creator)
  const [systemPerks, setSystemPerks] = useState<string[]>(() => getSystemMembershipPerks());

  useEffect(() => {
    const syncPerks = () => {
      setSystemPerks(getSystemMembershipPerks());
    };
    window.addEventListener(SYSTEM_PERKS_UPDATED_EVENT, syncPerks);
    window.addEventListener('storage', syncPerks);
    return () => {
      window.removeEventListener(SYSTEM_PERKS_UPDATED_EVENT, syncPerks);
      window.removeEventListener('storage', syncPerks);
    };
  }, []);

  // Fetch Live Channels to inspect real membership plans configured by Creators
  const { data: channelsData } = useQuery({
    queryKey: ['admin-membership-channels'],
    queryFn: () => channelsApi.getAllChannels(0, 50),
    staleTime: 60000,
  });

  const channelsList = useMemo(
    () => channelsData?.data?.items || [],
    [channelsData]
  );

  // Fetch real membership plans from active channels (Read-only monitoring)
  const { data: remotePlans } = useQuery({
    queryKey: ['admin-channel-plans', channelsList.map((c) => c.id).join(',')],
    queryFn: async () => {
      const results: MembershipTierConfig[] = [];
      for (const ch of channelsList) {
        try {
          const res = await membershipApi.getChannelPlan(ch.id);
          if (res?.data && res.data.status === 'ACTIVE') {
            results.push({
              id: String(res.data.id),
              channelId: ch.id,
              channelName: ch.name,
              badge: ch.name || res.data.name,
              badgeType: 'popular',
              title: res.data.name,
              price: res.data.monthlyPrice,
              priceUnit: '/ tháng',
              subscriberCount: 0,
              thumbnail: '/assets/studio/admin-membership-tier-standard.png',
              perks: res.data.perks || [],
            });
          }
        } catch {
          // Channel does not have membership plan enabled (MEM_7001)
        }
      }
      return results;
    },
    enabled: channelsList.length > 0,
  });

  const tiers = useMemo(() => {
    if (remotePlans && remotePlans.length > 0) {
      return remotePlans;
    }
    return DEFAULT_PLATFORM_TIERS;
  }, [remotePlans]);

  // Modal States
  const [selectedPayment, setSelectedPayment] = useState<PaymentDisplayRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Feedback Notification
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fetch Live Membership Payments from Backend API
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['admin-membership-payments'],
    queryFn: () => membershipApi.getAllPayments(),
  });

  // Fetch Live Users to join real user profile information by viewerId
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-lookup'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 200 }),
    staleTime: 60000,
  });

  const rawPayments = useMemo(() => paymentsData?.data || [], [paymentsData]);
  const userMap = useMemo(() => {
    const map = new Map<number, { id: number; fullName?: string; email?: string; avatarUrl?: string }>();
    const rawU = usersData?.data;
    const list = !rawU
      ? []
      : Array.isArray(rawU)
      ? rawU
      : 'content' in rawU && Array.isArray((rawU as any).content)
      ? (rawU as any).content
      : 'items' in rawU && Array.isArray((rawU as any).items)
      ? (rawU as any).items
      : [];
    for (const u of list) {
      if (u && typeof u.id === 'number') {
        map.set(u.id, u);
      }
    }
    return map;
  }, [usersData]);

  // Date bounds calculation
  const dateBounds = useMemo(() => {
    return calculateDateRangeBounds(dateRangePreset, customDateStart, customDateEnd);
  }, [dateRangePreset, customDateStart, customDateEnd]);

  // Map raw payments with authentic user profile information into display rows (Zero Fake Data)
  const paymentRows: PaymentDisplayRow[] = useMemo(() => {
    if (!rawPayments || rawPayments.length === 0) {
      return [];
    }
    return rawPayments.map((p, idx) => {
      const matchedUser = p.viewerId ? userMap.get(p.viewerId) : undefined;
      const realEmail = p.viewerEmail?.trim() || matchedUser?.email?.trim() || '';
      const userName =
        p.viewerFullName?.trim() ||
        matchedUser?.fullName?.trim() ||
        (realEmail ? realEmail.split('@')[0] : `Hội viên #${p.membershipId}`);
      const userEmail =
        realEmail || `Mã đăng ký hội viên: #${p.membershipId}`;
      const userAvatar = p.viewerAvatarUrl || matchedUser?.avatarUrl;

      const planName = determinePlanName(p.amount, p.planName || p.channelName);
      const methodInfo = determinePaymentMethod('WALLET', idx);
      const statusInfo = mapPaymentStatus(p.status);

      return {
        id: p.id,
        membershipId: p.membershipId,
        userName,
        userEmail,
        userAvatar,
        planName,
        amount: Number(p.amount || 0),
        paymentMethod: methodInfo.name,
        paymentMethodType: methodInfo.type,
        status: p.status || 'SUCCESS',
        statusLabel: statusInfo.label,
        statusVariant: statusInfo.variant,
        paidAt: p.paidAt,
        creatorEarning: Number(p.creatorEarning || p.amount * 0.9),
        commissionAmount: Number(p.commissionAmount || p.amount * 0.1),
      };
    });
  }, [rawPayments, userMap]);

  // Calculate live KPIs directly from backend data (100% Zero Fake Data)
  const kpis = useMemo(() => {
    return calculateMembershipKPIs(rawPayments, tiers);
  }, [rawPayments, tiers]);

  // Filter payments
  const filteredRows = useMemo(() => {
    return filterMembershipPayments(
      paymentRows,
      searchQuery,
      planFilter,
      statusFilter,
      dateBounds.startDate,
      dateBounds.endDate
    );
  }, [paymentRows, searchQuery, planFilter, statusFilter, dateBounds]);

  const totalElements = filteredRows.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * size, (page + 1) * size);
  }, [filteredRows, page, size]);

  const isFiltered = Boolean(
    searchQuery ||
      planFilter !== 'all' ||
      statusFilter !== 'all' ||
      (dateRangePreset && dateRangePreset !== 'all') ||
      customDateStart ||
      customDateEnd
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setPlanFilter('all');
    setStatusFilter('all');
    setDateRangePreset('all');
    setCustomDateStart(undefined);
    setCustomDateEnd(undefined);
    setPage(0);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      window.alert('Không có dữ liệu giao dịch để xuất.');
      return;
    }
    const csvContent = exportMembershipPaymentsToCSV(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `su-ky-giao-dich-hoi-vien-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Đã xuất thành công file danh sách giao dịch hội viên.');
  };

  // Save System-Wide Perks handler (Synced immediately to Creator Channel page)
  const handleSaveSystemPerks = (customPerks: string[]) => {
    const updated = saveCustomSystemPerks(customPerks);
    setSystemPerks(updated);
    setFeedbackMessage(
      `Đã cập nhật danh sách Đặc quyền Hội viên toàn hệ thống (${updated.length} quyền lợi). Đã đồng bộ sang giao diện Kênh của Creator!`
    );
  };

  // Entrance GSAP animation sequence
  useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current || !containerRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.38, clearProps: 'transform,opacity' }
        );
      }

      if (statsRef.current) {
        tl.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (tabsRef.current) {
        tl.fromTo(
          tabsRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, clearProps: 'transform,opacity' },
          '-=0.15'
        );
      }

      if (tiersRef.current) {
        tl.fromTo(
          tiersRef.current.children,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, clearProps: 'transform,opacity' },
          '-=0.15'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Clear feedback toast after 4s
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-md animate-in slide-in-from-bottom-2 duration-200">
          {feedbackMessage}
        </div>
      )}

      {/* 1. Hero Banner */}
      <div ref={heroRef}>
        <AdminMembershipHeroBanner />
      </div>

      {/* 2. 4 Stat Cards */}
      <AdminMembershipStatCards kpis={kpis} containerRef={statsRef} />

      {/* Error alert if backend API fails */}
      {isPaymentsError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>Không thể đồng bộ dữ liệu giao dịch gói hội viên từ máy chủ.</span>
          <button
            type="button"
            onClick={() => refetchPayments()}
            className="font-bold underline ml-3"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Tabs & System Perks Configuration Toolbar */}
      <AdminMembershipTabsBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        containerRef={tabsRef}
      />

      {/* 4. System Perks & Read-Only Channel Plans (when on 'tiers' tab) */}
      {activeTab === 'tiers' && (
        <AdminMembershipTierCards
          tiers={tiers}
          systemPerks={systemPerks}
          onEditTier={() => setIsConfigModalOpen(true)}
          onFilterByTier={(title) => {
            setPlanFilter(title);
            setActiveTab('history');
            setPage(0);
          }}
          containerRef={tiersRef}
        />
      )}

      {/* 5. Filter Toolbar */}
      <AdminMembershipFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setPage(0);
        }}
        planFilter={planFilter}
        onPlanFilterChange={(v) => {
          setPlanFilter(v);
          setPage(0);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPage(0);
        }}
        dateRange={dateRangePreset}
        dateRangeLabel={dateBounds.label}
        customStartDate={customDateStart}
        customEndDate={customDateEnd}
        onDateRangeChange={(preset, start, end) => {
          setDateRangePreset(preset);
          setCustomDateStart(start);
          setCustomDateEnd(end);
          setPage(0);
        }}
        onExport={handleExportCSV}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
      />

      {/* 6. Transactions Table */}
      <AdminMembershipTransactionsTable
        items={paginatedRows}
        totalElements={totalElements}
        page={page}
        size={size}
        totalPages={totalPages}
        onPageChange={setPage}
        onSizeChange={(newSize) => {
          setSize(newSize);
          setPage(0);
        }}
        onViewDetail={(item) => {
          setSelectedPayment(item);
          setIsDetailModalOpen(true);
        }}
        isLoading={isPaymentsLoading}
      />

      {/* 7. Detail Modal */}
      <AdminMembershipDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
      />

      {/* 8. System-Wide Membership Perks Configuration Modal */}
      <AdminMembershipPlanConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        systemPerks={systemPerks}
        onSaveSystemPerks={handleSaveSystemPerks}
      />
    </div>
  );
};

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';

import { AdminModerationHeroBanner } from './components/AdminModerationHeroBanner';
import { AdminModerationStatCards } from './components/AdminModerationStatCards';
import { AdminModerationFilterTabs } from './components/AdminModerationFilterTabs';
import { AdminModerationSearchToolbar } from './components/AdminModerationSearchToolbar';
import { AdminModerationTable } from './components/AdminModerationTable';
import { AdminModerationDetailModal } from './components/AdminModerationDetailModal';
import { AdminModerationBatchBar } from './components/AdminModerationBatchBar';
import { calculateModerationStats } from './moderationLogic';

import { moderationApi, ModerationQueryParams } from '@/services/api/moderation';
import { AdminModerationItem } from '@/types/moderation';

export const ModerationQueuePage: React.FC = () => {
  const queryClient = useQueryClient();

  // Animation Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  // Filter & Pagination States
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [decision, setDecision] = useState('');
  const [tier, setTier] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<AdminModerationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query Params for Table
  const queryParams: ModerationQueryParams = useMemo(
    () => ({
      page,
      size,
      search: debouncedSearch.trim() || undefined,
      decision: decision || undefined,
      tier: tier || undefined,
      sortBy: 'id',
      sortDir: 'desc',
    }),
    [page, size, debouncedSearch, decision, tier]
  );

  // 1. Primary Table Query (Real live backend data)
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-moderation-reviews', queryParams],
    queryFn: () => moderationApi.getReviews(queryParams),
  });

  // 2. Count Queries for accurate tabs & KPI stats
  const { data: allCountData } = useQuery({
    queryKey: ['admin-moderation-count-all'],
    queryFn: () => moderationApi.getReviews({ size: 1 }),
    staleTime: 30000,
  });

  const { data: pendingCountData } = useQuery({
    queryKey: ['admin-moderation-count-pending'],
    queryFn: () => moderationApi.getReviews({ decision: 'PENDING', size: 1 }),
    staleTime: 30000,
  });

  const { data: approvedCountData } = useQuery({
    queryKey: ['admin-moderation-count-approved'],
    queryFn: () => moderationApi.getReviews({ decision: 'APPROVED', size: 1 }),
    staleTime: 30000,
  });

  const { data: rejectedCountData } = useQuery({
    queryKey: ['admin-moderation-count-rejected'],
    queryFn: () => moderationApi.getReviews({ decision: 'REJECTED', size: 1 }),
    staleTime: 30000,
  });

  const pageData = data?.data;
  const items = pageData?.items || pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  // Counts from queries
  const allCount = allCountData?.data?.totalElements ?? totalElements;
  const pendingCount = pendingCountData?.data?.totalElements ?? 0;
  const approvedCount = approvedCountData?.data?.totalElements ?? 0;
  const rejectedCount = rejectedCountData?.data?.totalElements ?? 0;

  // Operational stats calculated strictly from real data
  const stats = useMemo(() => {
    return calculateModerationStats(items, {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: allCount,
    });
  }, [items, pendingCount, approvedCount, rejectedCount, allCount]);

  // Decision Mutation (Approve / Reject)
  const decisionMutation = useMutation({
    mutationFn: ({ id, decision, reason }: { id: number; decision: 'APPROVED' | 'REJECTED'; reason: string }) =>
      moderationApi.submitDecision(id, { decision, reason }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-approved'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-rejected'] });

      // Update active modal item if open
      if (detailModalItem && detailModalItem.reviewId === vars.id) {
        setDetailModalItem(res.data);
      }

      setActionMessage(
        vars.decision === 'APPROVED'
          ? 'Đã phê duyệt video thành công!'
          : 'Đã từ chối video và gửi phản hồi cho tác giả.'
      );
      setTimeout(() => setActionMessage(null), 3500);
    },
  });

  // Batch Operations
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);
    try {
      for (const id of selectedIds) {
        await moderationApi.submitDecision(id, {
          decision: 'APPROVED',
          reason: 'Phê duyệt hàng loạt bởi Quản trị viên',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-approved'] });
      setSelectedIds([]);
      setActionMessage(`Đã phê duyệt thành công ${selectedIds.length} video!`);
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);
    try {
      for (const id of selectedIds) {
        await moderationApi.submitDecision(id, {
          decision: 'REJECTED',
          reason: 'Từ chối hàng loạt do chưa đạt yêu cầu thẩm định',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-count-rejected'] });
      setSelectedIds([]);
      setActionMessage(`Đã từ chối ${selectedIds.length} video.`);
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (items.length === 0) return;
    const currentIds = items.map((i) => i.reviewId);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDecision('');
    setTier('');
    setTimeRange('all');
    setPage(0);
  };

  // Detail Modal Openers
  const handleViewDetail = (item: AdminModerationItem) => {
    setDetailModalItem(item);
    setIsModalOpen(true);
  };

  const handleQuickApprove = (item: AdminModerationItem) => {
    decisionMutation.mutate({
      id: item.reviewId,
      decision: 'APPROVED',
      reason: 'Phê duyệt nhanh qua danh sách hàng đợi',
    });
  };

  const handleQuickReject = (item: AdminModerationItem) => {
    setDetailModalItem(item);
    setIsModalOpen(true);
  };

  // GSAP Entrance Motion Sequence
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
          statsRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.36, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (tabsRef.current) {
        tl.fromTo(
          tabsRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.34, clearProps: 'transform,opacity' },
          '-=0.18'
        );
      }

      if (tableRef.current) {
        tl.fromTo(
          tableRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' },
          '-=0.18'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-7 pb-12 max-w-[1600px] mx-auto">
      {/* Feedback Toast Notification */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {actionMessage}
        </div>
      )}

      {/* 1. Hero Banner */}
      <div ref={heroRef}>
        <AdminModerationHeroBanner />
      </div>

      {/* 2. Four Operational Stat Cards */}
      <div ref={statsRef}>
        <AdminModerationStatCards
          stats={stats}
          selectedDecision={decision}
          onSelectDecision={(dec) => {
            setDecision(dec);
            setPage(0);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Filter Tabs & Search Controls */}
      <div ref={tabsRef} className="space-y-4">
        {/* Tab Selection Row */}
        <AdminModerationFilterTabs
          decision={decision}
          onDecisionChange={(dec) => {
            setDecision(dec);
            setPage(0);
          }}
          counts={{
            all: allCount,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
          }}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
        />

        {/* Search, Dropdowns & Refresh Row */}
        <AdminModerationSearchToolbar
          search={search}
          onSearchChange={setSearch}
          tier={tier}
          onTierChange={(t) => {
            setTier(t);
            setPage(0);
          }}
          decision={decision}
          onDecisionChange={(d) => {
            setDecision(d);
            setPage(0);
          }}
          timeRange={timeRange}
          onTimeRangeChange={(tr) => {
            setTimeRange(tr);
            setPage(0);
          }}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          showAdvanced={showAdvanced}
          onResetFilters={handleClearFilters}
        />
      </div>

      {/* 4. Main Video Moderation Table */}
      <div ref={tableRef}>
        {isError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
            <span>Không thể kết nối đến máy chủ kiểm duyệt. Vui lòng thử lại.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 font-semibold text-rose-800 shadow-2xs hover:bg-rose-100"
            >
              Tải lại
            </button>
          </div>
        )}

        <AdminModerationTable
          items={items}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewDetail={handleViewDetail}
          onQuickApprove={handleQuickApprove}
          onQuickReject={handleQuickReject}
          page={page}
          size={size}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          onSizeChange={(newSize) => {
            setSize(newSize);
            setPage(0);
          }}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Floating Batch Action Bar */}
      <AdminModerationBatchBar
        selectedCount={selectedIds.length}
        onApproveBatch={handleBatchApprove}
        onRejectBatch={handleBatchReject}
        onClearSelection={() => setSelectedIds([])}
        isProcessing={isBatchProcessing}
      />

      {/* Review & Detail Modal */}
      <AdminModerationDetailModal
        item={detailModalItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDetailModalItem(null);
        }}
        onApprove={(id, reason) => decisionMutation.mutate({ id, decision: 'APPROVED', reason })}
        onReject={(id, reason) => decisionMutation.mutate({ id, decision: 'REJECTED', reason })}
        isSubmitting={decisionMutation.isPending}
      />
    </div>
  );
};

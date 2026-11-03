import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';

import { AdminKycHeroBanner } from './components/AdminKycHeroBanner';
import { AdminKycStatCards } from './components/AdminKycStatCards';
import { AdminKycFilterTabs } from './components/AdminKycFilterTabs';
import { AdminKycSearchToolbar } from './components/AdminKycSearchToolbar';
import { AdminKycTable } from './components/AdminKycTable';
import { AdminKycDetailModal } from './components/AdminKycDetailModal';
import { AdminKycBatchBar } from './components/AdminKycBatchBar';

import {
  calculateKycStats,
  filterKycProfiles,
  downloadKycProfilesCSV,
} from './kycLogic';
import { kycApi } from '@/services/api/kyc';
import type { KycProfile, KycQueryParams } from '@/types/kyc';

export const KycQueuePage: React.FC = () => {
  const navigate = useNavigate();
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
  const [size, setSize] = useState(6); // Default 6 to match mockup (Hiển thị 1-6 trong tổng số 24 hồ sơ)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<KycProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query Params for Live Backend
  const queryParams: KycQueryParams = useMemo(
    () => ({
      page,
      size,
      status: status || undefined,
    }),
    [page, size, status]
  );

  // 1. Primary Table Query (Live backend data)
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-kyc-profiles', queryParams],
    queryFn: () => kycApi.getKycProfiles(queryParams),
  });

  // 2. Count Queries for accurate status tabs & KPI stats
  const { data: allCountData } = useQuery({
    queryKey: ['admin-kyc-count-all'],
    queryFn: () => kycApi.getKycProfiles({ size: 1 }),
    staleTime: 30000,
  });

  const { data: pendingCountData } = useQuery({
    queryKey: ['admin-kyc-count-pending'],
    queryFn: () => kycApi.getKycProfiles({ status: 'PENDING', size: 1 }),
    staleTime: 30000,
  });

  const { data: approvedCountData } = useQuery({
    queryKey: ['admin-kyc-count-approved'],
    queryFn: () => kycApi.getKycProfiles({ status: 'APPROVED', size: 1 }),
    staleTime: 30000,
  });

  const { data: rejectedCountData } = useQuery({
    queryKey: ['admin-kyc-count-rejected'],
    queryFn: () => kycApi.getKycProfiles({ status: 'REJECTED', size: 1 }),
    staleTime: 30000,
  });

  const pageData = data?.data;
  const rawItems = pageData?.items || pageData?.content || [];
  const backendTotalElements = pageData?.totalElements || 0;
  const backendTotalPages = pageData?.totalPages || 0;

  // Real Counts from queries
  const allCount = allCountData?.data?.totalElements ?? backendTotalElements;
  const pendingCount = pendingCountData?.data?.totalElements ?? 0;
  const approvedCount = approvedCountData?.data?.totalElements ?? 0;
  const rejectedCount = rejectedCountData?.data?.totalElements ?? 0;

  // Calculate Operational Stats strictly from backend counts
  const stats = useMemo(() => {
    return calculateKycStats(rawItems, {
      total: allCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    });
  }, [rawItems, allCount, pendingCount, approvedCount, rejectedCount]);

  // Client-side filtering for search & method on fetched page/list
  const displayedItems = useMemo(() => {
    return filterKycProfiles(rawItems, {
      search: debouncedSearch,
      status: '', // status already applied via API query
      method,
      dateRange,
    });
  }, [rawItems, debouncedSearch, method, dateRange]);

  const totalElements = debouncedSearch || method ? displayedItems.length : backendTotalElements;
  const totalPages =
    debouncedSearch || method
      ? Math.max(1, Math.ceil(displayedItems.length / size))
      : Math.max(1, backendTotalPages);

  // Status Mutation (Approve / Reject)
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      targetStatus,
      rejectionReason,
    }: {
      id: number;
      targetStatus: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) => kycApi.updateKycStatus(id, { status: targetStatus, rejectionReason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-count-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-count-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-count-approved'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-count-rejected'] });

      const msg =
        variables.targetStatus === 'APPROVED'
          ? `Đã phê duyệt thành công hồ sơ #${variables.id}. Tài khoản đã được nâng cấp vai trò CREATOR!`
          : `Đã từ chối hồ sơ #${variables.id}.`;
      setActionFeedback(msg);
      setTimeout(() => setActionFeedback(null), 4000);

      setIsModalOpen(false);
      setDetailModalItem(null);
    },
  });

  // Batch Selection Handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (displayedItems.length === 0) return;
    const currentIds = displayedItems.map((i) => i.id);
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
    setStatus('');
    setMethod('');
    setDateRange('all');
    setPage(0);
    setSelectedIds([]);
  };

  // Detail Modal Openers
  const handleViewDetail = (item: KycProfile) => {
    setDetailModalItem(item);
    setIsModalOpen(true);
  };

  const handleQuickApprove = (item: KycProfile) => {
    statusMutation.mutate({
      id: item.id,
      targetStatus: 'APPROVED',
    });
  };

  const handleQuickReject = (item: KycProfile) => {
    setDetailModalItem(item);
    setIsModalOpen(true);
  };

  const handleApproveFromModal = (id: number) => {
    statusMutation.mutate({
      id,
      targetStatus: 'APPROVED',
    });
  };

  const handleRejectFromModal = (id: number, reason: string) => {
    statusMutation.mutate({
      id,
      targetStatus: 'REJECTED',
      rejectionReason: reason,
    });
  };

  // Export handlers
  const handleExportAll = () => {
    downloadKycProfilesCSV(rawItems);
  };

  const handleNavigateWorkbench = (id: number) => {
    if ('startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        navigate(`/admin/kyc/${id}`);
      });
    } else {
      navigate(`/admin/kyc/${id}`);
    }
  };

  const handleBatchExport = () => {
    const selectedItems = rawItems.filter((i) => selectedIds.includes(i.id));
    downloadKycProfilesCSV(selectedItems, 'danh-sach-kyc-da-chon.csv');
  };

  const handleBatchApprove = async () => {
    for (const id of selectedIds) {
      await statusMutation.mutateAsync({ id, targetStatus: 'APPROVED' });
    }
    setSelectedIds([]);
  };

  const handleBatchReject = async () => {
    for (const id of selectedIds) {
      await statusMutation.mutateAsync({
        id,
        targetStatus: 'REJECTED',
        rejectionReason: 'Hồ sơ không đáp ứng tiêu chuẩn định danh',
      });
    }
    setSelectedIds([]);
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
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.32, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (tableRef.current) {
        tl.fromTo(
          tableRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' },
          '-=0.15'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-5 pb-16">
      {/* 1. Hero Banner */}
      <div ref={heroRef}>
        <AdminKycHeroBanner />
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className="rounded-xl border border-[#059669]/30 bg-[#ECFDF5] px-4 py-3 text-xs font-medium text-[#065F46] flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs text-[#059669] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] p-4 text-xs text-[#991B1B] flex items-center justify-between">
          <span>Không thể tải danh sách hồ sơ KYC từ máy chủ. Vui lòng thử lại.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg border border-[#FECACA] bg-white text-xs font-semibold hover:bg-[#FEF2F2] transition-colors"
          >
            Tải lại
          </button>
        </div>
      )}

      {/* 2. Stat Cards (4 Cards) */}
      <div ref={statsRef}>
        <AdminKycStatCards
          stats={stats}
          activeStatus={status}
          onSelectStatus={(newStatus) => {
            setStatus(newStatus);
            setPage(0);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Filter Tabs (Tất cả, Chờ duyệt, Đã phê duyệt, Bị từ chối) & Export Button */}
      <div ref={tabsRef} className="space-y-4 pt-1">
        <AdminKycFilterTabs
          activeStatus={status}
          onSelectStatus={(newStatus) => {
            setStatus(newStatus);
            setPage(0);
          }}
          stats={stats}
          onExport={handleExportAll}
        />

        {/* 4. Search & Filter Controls Toolbar */}
        <AdminKycSearchToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={(s) => {
            setStatus(s);
            setPage(0);
          }}
          method={method}
          onMethodChange={(m) => {
            setMethod(m);
            setPage(0);
          }}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onReset={handleClearFilters}
          isFetching={isFetching}
        />
      </div>

      {/* 5. Data Table Container */}
      <div ref={tableRef}>
        <AdminKycTable
          items={displayedItems}
          totalElements={totalElements}
          totalPages={totalPages}
          page={page}
          size={size}
          onPageChange={setPage}
          onSizeChange={(newSize) => {
            setSize(newSize);
            setPage(0);
          }}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewDetail={handleViewDetail}
          onQuickApprove={handleQuickApprove}
          onQuickReject={handleQuickReject}
          onNavigateWorkbench={handleNavigateWorkbench}
          isLoading={isLoading}
          onResetFilters={handleClearFilters}
        />
      </div>

      {/* 6. Detail Modal */}
      <AdminKycDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDetailModalItem(null);
        }}
        item={detailModalItem}
        onApprove={handleApproveFromModal}
        onReject={handleRejectFromModal}
        onOpenWorkbench={handleNavigateWorkbench}
        isSubmitting={statusMutation.isPending}
      />

      {/* 7. Floating Batch Bar for Bulk Selection */}
      <AdminKycBatchBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBatchApprove={handleBatchApprove}
        onBatchReject={handleBatchReject}
        onBatchExport={handleBatchExport}
        isProcessing={statusMutation.isPending}
      />
    </div>
  );
};

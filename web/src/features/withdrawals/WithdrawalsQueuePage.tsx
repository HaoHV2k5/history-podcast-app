import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { usersApi } from '@/services/api/users';
import {
  AdminWithdrawalRow,
  buildAdminWithdrawalRows,
  calculateWithdrawalKPIs,
  filterAdminWithdrawalRows,
  exportWithdrawalsToCSV,
} from './withdrawalsLogic';
import { AdminWithdrawalsHeroBanner } from './components/AdminWithdrawalsHeroBanner';
import { AdminWithdrawalsStatCards } from './components/AdminWithdrawalsStatCards';
import { AdminWithdrawalsStatusTabs } from './components/AdminWithdrawalsStatusTabs';
import { AdminWithdrawalsFilterToolbar } from './components/AdminWithdrawalsFilterToolbar';
import { AdminWithdrawalsTable } from './components/AdminWithdrawalsTable';
import { AdminWithdrawalDetailModal } from './components/AdminWithdrawalDetailModal';
import { AdminWithdrawalReasonModal } from './components/AdminWithdrawalReasonModal';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCw, CheckCircle2 } from 'lucide-react';

export const WithdrawalsQueuePage: React.FC = () => {
  const queryClient = useQueryClient();

  // GSAP animation refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [bankFilter, setBankFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>(undefined);
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>(undefined);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal inspection states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawalRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Action reason prompt modal state (for Reject or Fail)
  const [reasonModalState, setReasonModalState] = useState<{
    isOpen: boolean;
    withdrawal: AdminWithdrawalRow | null;
    mode: 'REJECT' | 'FAIL';
  }>({
    isOpen: false,
    withdrawal: null,
    mode: 'REJECT',
  });

  // Action feedback message state
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // 1. Fetch Live Withdrawals from Backend (Zero Fake Data)
  const {
    data: withdrawalsResponse,
    isLoading: isWithdrawalsLoading,
    isError: isWithdrawalsError,
    refetch: refetchWithdrawals,
    isFetching: isWithdrawalsFetching,
  } = useQuery({
    queryKey: ['admin-withdrawals-all'],
    queryFn: () => withdrawalsApi.getAllWithdrawals(0, 100),
  });

  // 2. Fetch Live Users to join user profile information
  const { data: usersResponse } = useQuery({
    queryKey: ['admin-withdrawals-users'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 100 }),
    staleTime: 60000,
  });

  const rawWithdrawals = useMemo(() => {
    const pageData = withdrawalsResponse?.data;
    return pageData?.items || pageData?.content || [];
  }, [withdrawalsResponse]);

  const userList = useMemo(() => {
    const pageData = usersResponse?.data;
    return pageData?.items || pageData?.content || [];
  }, [usersResponse]);

  // Join withdrawals with live user profiles strictly from real data
  const allRows: AdminWithdrawalRow[] = useMemo(() => {
    return buildAdminWithdrawalRows(rawWithdrawals, userList);
  }, [rawWithdrawals, userList]);

  // Calculate live financial KPIs strictly from real backend records
  const kpis = useMemo(() => {
    const totalElements = withdrawalsResponse?.data?.totalElements;
    return calculateWithdrawalKPIs(rawWithdrawals, totalElements);
  }, [rawWithdrawals, withdrawalsResponse]);

  // Filtered rows based on current filters
  const filteredRows = useMemo(() => {
    return filterAdminWithdrawalRows(allRows, {
      searchQuery,
      status: statusTab,
      bankName: bankFilter,
      datePreset: dateRangePreset,
      startDate: customDateStart,
      endDate: customDateEnd,
    });
  }, [allRows, searchQuery, statusTab, bankFilter, dateRangePreset, customDateStart, customDateEnd]);

  // Paginated slice for current page
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Reset page when any filter changes
  const handleTabChange = (newTab: string) => {
    setStatusTab(newTab);
    setPage(0);
  };

  const handleBankChange = (newBank: string) => {
    setBankFilter(newBank);
    setPage(0);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(0);
  };

  const handleDateRangePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    setPage(0);
  };

  const handleCustomDateChange = (start?: string, end?: string) => {
    setCustomDateStart(start);
    setCustomDateEnd(end);
    setPage(0);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const csvContent = exportWithdrawalsToCSV(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `su_ky_yeu_cau_rut_tien_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open detail modal
  const handleViewDetail = (row: AdminWithdrawalRow) => {
    setSelectedWithdrawal(row);
    setIsDetailModalOpen(true);
  };

  // --- MUTATIONS: Admin Backend Transitions ---
  // 1. Process Request: PENDING -> PROCESSING
  const processMutation = useMutation({
    mutationFn: (id: number) => withdrawalsApi.processWithdrawal(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-all'] });
      setIsDetailModalOpen(false);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Tiếp nhận xử lý yêu cầu rút tiền thành công',
      });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi tiếp nhận yêu cầu',
      });
    },
  });

  // 2. Complete Request: PROCESSING -> COMPLETED
  const completeMutation = useMutation({
    mutationFn: (id: number) => withdrawalsApi.completeWithdrawal(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-all'] });
      setIsDetailModalOpen(false);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Xác nhận chuyển tiền thành công',
      });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi hoàn tất đơn',
      });
    },
  });

  // 3. Reject Request: PENDING -> REJECTED (Refunds wallet)
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      withdrawalsApi.rejectWithdrawal(id, { reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-all'] });
      setReasonModalState({ isOpen: false, withdrawal: null, mode: 'REJECT' });
      setIsDetailModalOpen(false);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Từ chối yêu cầu rút tiền thành công, đã hoàn tiền vào ví',
      });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi từ chối yêu cầu',
      });
    },
  });

  // 4. Fail Request: PROCESSING -> FAILED (Refunds wallet)
  const failMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      withdrawalsApi.failWithdrawal(id, { reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-all'] });
      setReasonModalState({ isOpen: false, withdrawal: null, mode: 'FAIL' });
      setIsDetailModalOpen(false);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Đã ghi nhận lỗi chuyển khoản và hoàn tiền vào ví',
      });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi báo lỗi đơn',
      });
    },
  });

  // Modal Action Handlers
  const handleProcessAction = (row: AdminWithdrawalRow) => {
    processMutation.mutate(row.id);
  };

  const handleCompleteAction = (row: AdminWithdrawalRow) => {
    completeMutation.mutate(row.id);
  };

  const handleOpenRejectModal = (row: AdminWithdrawalRow) => {
    setReasonModalState({
      isOpen: true,
      withdrawal: row,
      mode: 'REJECT',
    });
  };

  const handleOpenFailModal = (row: AdminWithdrawalRow) => {
    setReasonModalState({
      isOpen: true,
      withdrawal: row,
      mode: 'FAIL',
    });
  };

  const handleConfirmReasonAction = (reason: string) => {
    if (!reasonModalState.withdrawal) return;
    const id = reasonModalState.withdrawal.id;

    if (reasonModalState.mode === 'REJECT') {
      rejectMutation.mutate({ id, reason });
    } else {
      failMutation.mutate({ id, reason });
    }
  };

  // GSAP entrance animation
  useEffect(() => {
    if (pageContainerRef.current) {
      const targets = [
        heroRef.current,
        statsRef.current,
        tabsRef.current,
        toolbarRef.current,
        tableRef.current,
      ].filter(Boolean);

      gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  const isAnyActionPending =
    processMutation.isPending ||
    completeMutation.isPending ||
    rejectMutation.isPending ||
    failMutation.isPending;

  return (
    <div ref={pageContainerRef} className="space-y-6 pb-12 select-text font-sans">
      {/* 1. Hero Banner: 3 Layers matching reference mockup 100% */}
      <div ref={heroRef}>
        <AdminWithdrawalsHeroBanner />
      </div>

      {/* 2. 4 Stat Cards: Financial metrics calculated strictly from live data */}
      <div ref={statsRef}>
        <AdminWithdrawalsStatCards kpis={kpis} isLoading={isWithdrawalsLoading} />
      </div>

      {/* Feedback Banner (Success or Error Alert) */}
      {actionFeedback && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-stone-700 ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner with Retry */}
      {isWithdrawalsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Không thể tải danh sách yêu cầu rút tiền. Vui lòng kiểm tra kết nối mạng hoặc thử lại.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchWithdrawals()}
            className="h-8 px-3 text-xs border-rose-300 text-rose-800 hover:bg-rose-100 cursor-pointer"
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Tải lại
          </Button>
        </div>
      )}

      {/* 3. Status Tabs Row */}
      <div ref={tabsRef}>
        <AdminWithdrawalsStatusTabs
          activeTab={statusTab}
          onTabChange={handleTabChange}
          kpis={kpis}
        />
      </div>

      {/* 4. Filter Toolbar: Search, Status, Bank, Date Range with Toggle-off, Refresh, Export (relative z-30) */}
      <div ref={toolbarRef} className="relative z-30">
        <AdminWithdrawalsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusTab}
          onStatusFilterChange={handleTabChange}
          bankFilter={bankFilter}
          onBankFilterChange={handleBankChange}
          dateRangePreset={dateRangePreset}
          onDateRangePresetChange={handleDateRangePresetChange}
          customDateStart={customDateStart}
          customDateEnd={customDateEnd}
          onCustomDateChange={handleCustomDateChange}
          onRefresh={() => refetchWithdrawals()}
          isRefreshing={isWithdrawalsFetching}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* 5. Data Table: 100% Fit, Zero horizontal scroll on desktop (relative z-10) */}
      <div ref={tableRef} className="relative z-10">
        <AdminWithdrawalsTable
          rows={paginatedRows}
          totalElements={filteredRows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isLoading={isWithdrawalsLoading}
          onViewDetail={handleViewDetail}
          onProcessRequest={handleProcessAction}
          onCompleteRequest={handleCompleteAction}
          onRejectRequest={handleOpenRejectModal}
          onFailRequest={handleOpenFailModal}
        />
      </div>

      {/* 6. Detail Modal (React Portal z-[999]) */}
      <AdminWithdrawalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        withdrawal={selectedWithdrawal}
        onProcess={handleProcessAction}
        onComplete={handleCompleteAction}
        onReject={handleOpenRejectModal}
        onFail={handleOpenFailModal}
        isProcessingAction={isAnyActionPending}
      />

      {/* 7. Action Reason Prompt Modal (React Portal z-[1000]) */}
      <AdminWithdrawalReasonModal
        isOpen={reasonModalState.isOpen}
        onClose={() => setReasonModalState({ isOpen: false, withdrawal: null, mode: 'REJECT' })}
        withdrawal={reasonModalState.withdrawal}
        mode={reasonModalState.mode}
        onConfirm={handleConfirmReasonAction}
        isSubmitting={isAnyActionPending}
      />
    </div>
  );
};

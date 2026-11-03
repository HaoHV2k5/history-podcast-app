import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import { narratorsApi } from '@/services/api/narrators';
import { usersApi } from '@/services/api/users';
import {
  AdminNarratorRow,
  buildAdminNarratorRows,
  calculateNarratorKPIs,
  filterAdminNarratorRows,
  exportNarratorsToCSV,
} from './narratorsLogic';
import { AdminNarratorsHeroBanner } from './components/AdminNarratorsHeroBanner';
import { AdminNarratorsStatCards } from './components/AdminNarratorsStatCards';
import { AdminNarratorsStatusTabs } from './components/AdminNarratorsStatusTabs';
import { AdminNarratorsFilterToolbar } from './components/AdminNarratorsFilterToolbar';
import { AdminNarratorsTable } from './components/AdminNarratorsTable';
import { AdminNarratorDetailModal } from './components/AdminNarratorDetailModal';
import { AdminNarratorReasonModal } from './components/AdminNarratorReasonModal';
import { AlertCircle, RotateCw, CheckCircle2 } from 'lucide-react';

export const NarratorsListPage: React.FC = () => {
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
  const [voiceFilter, setVoiceFilter] = useState('all');
  const [statusDropdown, setStatusDropdown] = useState('ALL');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>(undefined);
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>(undefined);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal inspection states
  const [selectedNarrator, setSelectedNarrator] = useState<AdminNarratorRow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Action reason prompt modal state (for Reject)
  const [reasonModalState, setReasonModalState] = useState<{
    isOpen: boolean;
    narrator: AdminNarratorRow | null;
  }>({
    isOpen: false,
    narrator: null,
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

  // 1. Fetch Live Narrator Profiles from Backend (Zero Fake Data)
  const {
    data: narratorsResponse,
    isLoading: isNarratorsLoading,
    isError: isNarratorsError,
    refetch: refetchNarrators,
    isFetching: isNarratorsFetching,
  } = useQuery({
    queryKey: ['admin-narrators'],
    queryFn: () => narratorsApi.getAllNarrators(),
  });

  // 2. Fetch Live Audio Demos from Backend
  const { data: demosResponse } = useQuery({
    queryKey: ['admin-narrator-demos'],
    queryFn: () => narratorsApi.getAllDemos(),
  });

  // 3. Fetch Live Users to join user profile information
  const { data: usersResponse } = useQuery({
    queryKey: ['admin-narrators-users'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 100 }),
    staleTime: 60000,
  });

  const rawNarrators = useMemo(() => {
    return narratorsResponse?.data || [];
  }, [narratorsResponse]);

  const rawDemos = useMemo(() => {
    return demosResponse?.data || [];
  }, [demosResponse]);

  const userList = useMemo(() => {
    const pageData = usersResponse?.data;
    return pageData?.items || pageData?.content || [];
  }, [usersResponse]);

  // Join narrators with live user profiles & audio demos strictly from real backend data (Zero Fake Data)
  const allRows: AdminNarratorRow[] = useMemo(() => {
    return buildAdminNarratorRows(rawNarrators, userList, rawDemos);
  }, [rawNarrators, userList, rawDemos]);

  // Calculate live financial KPIs strictly from real records
  const kpis = useMemo(() => {
    return calculateNarratorKPIs(allRows);
  }, [allRows]);

  // Filtered rows based on current filters
  const filteredRows = useMemo(() => {
    return filterAdminNarratorRows(allRows, {
      searchQuery,
      statusTab,
      voiceGender: voiceFilter,
      statusDropdown,
      dateRangePreset,
      customDateStart,
      customDateEnd,
    });
  }, [allRows, searchQuery, statusTab, voiceFilter, statusDropdown, dateRangePreset, customDateStart, customDateEnd]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusTab, voiceFilter, statusDropdown, dateRangePreset, customDateStart, customDateEnd]);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.45 } });

      if (heroRef.current) {
        tl.from(heroRef.current, { y: -15, opacity: 0 });
      }
      if (statsRef.current) {
        tl.from(statsRef.current.children, { y: 15, opacity: 0, stagger: 0.08 }, '-=0.2');
      }
      if (tabsRef.current) {
        tl.from(tabsRef.current, { y: 10, opacity: 0 }, '-=0.15');
      }
      if (toolbarRef.current) {
        tl.from(toolbarRef.current, { y: 10, opacity: 0 }, '-=0.15');
      }
      if (tableRef.current) {
        tl.from(tableRef.current, { y: 15, opacity: 0 }, '-=0.15');
      }
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (row: AdminNarratorRow) => {
      return narratorsApi.updateNarrator(row.id, {
        userId: row.userId,
        bio: row.bio,
        languages: row.languagesRaw,
        baseRate: row.baseRate,
        status: 'APPROVED',
      });
    },
    onSuccess: (_, row) => {
      queryClient.invalidateQueries({ queryKey: ['admin-narrators'] });
      setActionFeedback({
        type: 'success',
        message: `Đã phê duyệt thành công hồ sơ của Thuyết minh viên "${row.fullName}" (#${row.id}).`,
      });
      setIsDetailModalOpen(false);
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Vui lòng thử lại.';
      setActionFeedback({
        type: 'error',
        message: `Lỗi phê duyệt hồ sơ: ${errorMsg}`,
      });
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ row, reason: _reason }: { row: AdminNarratorRow; reason: string }) => {
      return narratorsApi.updateNarrator(row.id, {
        userId: row.userId,
        bio: row.bio,
        languages: row.languagesRaw,
        baseRate: row.baseRate,
        status: 'REJECTED',
      });
    },
    onSuccess: (_, { row }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-narrators'] });
      setActionFeedback({
        type: 'success',
        message: `Đã cập nhật trạng thái từ chối hồ sơ "${row.fullName}" (#${row.id}).`,
      });
      setReasonModalState({ isOpen: false, narrator: null });
      setIsDetailModalOpen(false);
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Vui lòng thử lại.';
      setActionFeedback({
        type: 'error',
        message: `Lỗi từ chối hồ sơ: ${errorMsg}`,
      });
    },
  });

  const handleOpenDetail = (row: AdminNarratorRow) => {
    setSelectedNarrator(row);
    setIsDetailModalOpen(true);
  };

  const handleApprove = (row: AdminNarratorRow) => {
    approveMutation.mutate(row);
  };

  const handleRejectPrompt = (row: AdminNarratorRow) => {
    setReasonModalState({
      isOpen: true,
      narrator: row,
    });
  };

  const handleRejectSubmit = (row: AdminNarratorRow, reason: string) => {
    rejectMutation.mutate({ row, reason });
  };

  const handleExportCSV = () => {
    const csvContent = exportNarratorsToCSV(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_ba_thuyet_minh_su_ky_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={pageContainerRef} className="space-y-6 pb-12 font-sans">
      {/* 1. Hero Banner */}
      <div ref={heroRef}>
        <AdminNarratorsHeroBanner />
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium border shadow-xs transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-stone-700 ml-4 font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {isNarratorsError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Không thể kết nối máy chủ để tải danh bạ thuyết minh viên. Vui lòng thử lại.</span>
          </div>
          <button
            type="button"
            onClick={() => refetchNarrators()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <RotateCw className="h-3 w-3" />
            <span>Tải lại</span>
          </button>
        </div>
      )}

      {/* 2. Stat Cards */}
      <div ref={statsRef}>
        <AdminNarratorsStatCards kpis={kpis} isLoading={isNarratorsLoading} />
      </div>

      {/* 3. Status Tabs */}
      <div ref={tabsRef}>
        <AdminNarratorsStatusTabs activeTab={statusTab} onTabChange={setStatusTab} kpis={kpis} />
      </div>

      {/* 4. Filter Toolbar */}
      <div ref={toolbarRef}>
        <AdminNarratorsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          voiceGenderFilter={voiceFilter}
          onVoiceGenderChange={setVoiceFilter}
          statusFilter={statusDropdown}
          onStatusFilterChange={setStatusDropdown}
          dateRangePreset={dateRangePreset}
          onDateRangePresetChange={setDateRangePreset}
          customDateStart={customDateStart}
          customDateEnd={customDateEnd}
          onCustomDateChange={(start, end) => {
            setCustomDateStart(start);
            setCustomDateEnd(end);
          }}
          onRefresh={() => {
            refetchNarrators();
          }}
          isRefreshing={isNarratorsFetching}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* 5. Data Table */}
      <div ref={tableRef}>
        <AdminNarratorsTable
          rows={paginatedRows}
          totalElements={filteredRows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onViewDetail={handleOpenDetail}
          onApprove={handleApprove}
          onReject={handleRejectPrompt}
          isLoading={isNarratorsLoading}
        />
      </div>

      {/* Detail Inspection Modal */}
      <AdminNarratorDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        narrator={selectedNarrator}
        onApprove={handleApprove}
        onReject={handleRejectPrompt}
        isProcessing={approveMutation.isPending || rejectMutation.isPending}
      />

      {/* Rejection Reason Modal */}
      <AdminNarratorReasonModal
        isOpen={reasonModalState.isOpen}
        onClose={() => setReasonModalState({ isOpen: false, narrator: null })}
        narrator={reasonModalState.narrator}
        onSubmit={handleRejectSubmit}
        isSubmitting={rejectMutation.isPending}
      />
    </div>
  );
};

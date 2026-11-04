import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import {
  AlertCircle,
  CheckCircle2,
  RotateCw,
} from 'lucide-react';
import { auditApi } from '@/services/api/audit';
import { usersApi } from '@/services/api/users';
import { moderationApi } from '@/services/api/moderation';
import { kycApi } from '@/services/api/kyc';
import { contractsApi } from '@/services/api/contracts';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { disputesApi } from '@/services/api/disputes';
import {
  AdminAuditLogRow,
  AuditActionFilter,
  AuditActionKind,
  AuditLogCategoryFilter,
  RealDomainAuditSources,
  buildUnifiedRealAuditLogRows,
  calculateAuditLogKpis,
  extractUniqueActors,
  filterAuditLogRows,
  generateAuditLogsCsv,
} from './auditLogsLogic';
import { AdminAuditLogsHeroBanner } from './components/AdminAuditLogsHeroBanner';
import { AdminAuditLogsStatCards } from './components/AdminAuditLogsStatCards';
import { AdminAuditLogsToolbar } from './components/AdminAuditLogsToolbar';
import { AdminAuditLogsTable } from './components/AdminAuditLogsTable';
import { AdminAuditLogDetailModal } from './components/AdminAuditLogDetailModal';

export const AuditLogsPage: React.FC = () => {
  const navigate = useNavigate();

  // Tham chiếu hiệu ứng chuyển động GSAP (Quy tắc 7 AGENTS.md)
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Trạng thái bộ lọc và phân trang
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState<AuditLogCategoryFilter>('ALL');
  const [actionFilter, setActionFilter] = useState<AuditActionFilter>('ALL');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>(
    undefined
  );
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Trạng thái hộp thoại chi tiết bản ghi & tác nhân
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<
    'detail' | 'actorHistory'
  >('detail');

  // Trạng thái thông báo nhanh
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // 1. Truy vấn bảng Nhật ký kiểm toán chuyên biệt (GET /api/v1/audit-logs)
  const {
    data: auditRes,
    isLoading: isAuditLoading,
    isError: isAuditError,
    refetch: refetchAuditLogs,
    isFetching: isAuditFetching,
  } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => auditApi.getAllAuditLogs(),
  });

  // 2. Truy vấn danh sách Tài khoản thực tế (GET /api/v1/admin/users)
  const {
    data: usersRes,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
    isFetching: isUsersFetching,
  } = useQuery({
    queryKey: ['admin-audit-users-lookup'],
    queryFn: () =>
      usersApi.searchUsers({
        page: 0,
        size: 1000,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    staleTime: 60000,
  });

  // 3. Truy vấn dữ liệu vận hành & bảo mật thực tế từ các phân hệ Backend (100% Real Data)
  const {
    data: domainSourcesRes,
    refetch: refetchDomainSources,
    isFetching: isDomainFetching,
  } = useQuery<RealDomainAuditSources>({
    queryKey: ['admin-audit-domain-sources'],
    queryFn: async (): Promise<RealDomainAuditSources> => {
      const [
        refreshTokensRes,
        policyConfigsRes,
        systemConfigsRes,
        moderationReviewsRes,
        kycProfilesRes,
        contractsRes,
        withdrawalsRes,
        disputesRes,
      ] = await Promise.all([
        auditApi.getRefreshTokens().catch(() => null),
        moderationApi.getPolicyConfigs().catch(() => null),
        auditApi.getSystemConfigs().catch(() => null),
        moderationApi.getReviews({ page: 0, size: 100 }).catch(() => null),
        kycApi.getKycProfiles({ page: 0, size: 100 }).catch(() => null),
        contractsApi.getAllContracts('ALL', { page: 0, size: 100 }).catch(() => null),
        withdrawalsApi.getAllWithdrawals(0, 100).catch(() => null),
        disputesApi.getAllDisputes('ALL').catch(() => null),
      ]);

      const extractList = <T,>(payload: unknown): T[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload as T[];
        if (typeof payload === 'object') {
          const obj = payload as { items?: T[]; content?: T[] };
          if (Array.isArray(obj.items)) return obj.items;
          if (Array.isArray(obj.content)) return obj.content;
        }
        return [];
      };

      return {
        refreshTokens: extractList(refreshTokensRes?.data),
        policyConfigs: extractList(policyConfigsRes?.data),
        systemConfigs: extractList(systemConfigsRes?.data),
        moderationReviews: extractList(moderationReviewsRes?.data),
        kycProfiles: extractList(kycProfilesRes?.data),
        contracts: extractList(contractsRes?.data),
        withdrawals: extractList(withdrawalsRes?.data),
        disputes: extractList(disputesRes?.data),
      };
    },
    staleTime: 60000,
  });

  const rawLogs = useMemo(() => auditRes?.data || [], [auditRes?.data]);
  const rawUsers = useMemo(
    () => usersRes?.data?.items || usersRes?.data?.content || [],
    [usersRes?.data]
  );

  // Tổng hợp 100% dữ liệu thực từ máy chủ (Tuyệt đối không dùng dữ liệu mẫu hay giả lập)
  const baseRows: AdminAuditLogRow[] = useMemo(
    () =>
      buildUnifiedRealAuditLogRows({
        auditLogs: rawLogs,
        users: rawUsers,
        refreshTokens: domainSourcesRes?.refreshTokens ?? [],
        policyConfigs: domainSourcesRes?.policyConfigs ?? [],
        systemConfigs: domainSourcesRes?.systemConfigs ?? [],
        moderationReviews: domainSourcesRes?.moderationReviews ?? [],
        kycProfiles: domainSourcesRes?.kycProfiles ?? [],
        contracts: domainSourcesRes?.contracts ?? [],
        withdrawals: domainSourcesRes?.withdrawals ?? [],
        disputes: domainSourcesRes?.disputes ?? [],
      }),
    [rawLogs, rawUsers, domainSourcesRes]
  );

  // Danh sách người thực hiện thực tế cho thanh bộ lọc
  const actorOptions = useMemo(() => extractUniqueActors(baseRows), [baseRows]);

  // Chỉ số thống kê thực tế (Zero Fake Data)
  const kpis = useMemo(() => calculateAuditLogKpis(baseRows), [baseRows]);

  // Lọc danh sách bản ghi
  const filteredRows = useMemo(
    () =>
      filterAuditLogRows(baseRows, {
        searchQuery,
        categoryFilter,
        actionFilter,
        actorFilter,
        dateRangePreset,
        customDateStart,
        customDateEnd,
      }),
    [
      baseRows,
      searchQuery,
      categoryFilter,
      actionFilter,
      actorFilter,
      dateRangePreset,
      customDateStart,
      customDateEnd,
    ]
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      categoryFilter !== 'ALL' ||
      actionFilter !== 'ALL' ||
      actorFilter !== 'ALL' ||
      dateRangePreset !== 'all'
  );

  // Phân trang
  const totalElements = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Đưa về trang đầu khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(0);
  }, [
    searchQuery,
    categoryFilter,
    actionFilter,
    actorFilter,
    dateRangePreset,
    customDateStart,
    customDateEnd,
    pageSize,
  ]);

  // Bản ghi đang mở trong hộp thoại chi tiết
  const activeDetailRow = useMemo(
    () => baseRows.find((r) => r.id === detailTargetId) || null,
    [baseRows, detailTargetId]
  );

  // Hiệu ứng xuất hiện tuần tự từ dưới lên bằng GSAP (Quy tắc 7 AGENTS.md)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const targets = [
        heroRef.current,
        statsRef.current,
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
          clearProps: 'all',
        }
      );
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refetchAuditLogs(),
      refetchUsers(),
      refetchDomainSources(),
    ]);
    setToast({
      type: 'success',
      message: 'Đã đồng bộ dữ liệu nhật ký hệ thống mới nhất từ máy chủ',
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setActionFilter('ALL');
    setActorFilter('ALL');
    setDateRangePreset('all');
    setCustomDateStart(undefined);
    setCustomDateEnd(undefined);
    setCurrentPage(0);
  };

  const handleFilterByActor = (row: AdminAuditLogRow) => {
    const key =
      row.actorId !== null
        ? `id:${row.actorId}`
        : `name:${row.actorName.toLowerCase()}`;
    setActorFilter((prev) => (prev === key ? 'ALL' : key));
    setToast({
      type: 'success',
      message: `Đang lọc nhật ký của người thực hiện: ${row.actorName}`,
    });
  };

  const handleFilterByAction = (actionKind: AuditActionKind) => {
    setActionFilter((prev) => (prev === actionKind ? 'ALL' : actionKind));
  };

  const handleCopyLogSummary = (row: AdminAuditLogRow) => {
    const summary = `[#${row.id}] ${row.fullDateTime} | ${row.actorName} (${row.actorEmail}) | ${row.actionLabel} -> ${row.targetLabel} (${row.targetSubtitle}) | ${row.detailText}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary);
    }
    setToast({
      type: 'success',
      message: `Đã sao chép thông tin bản ghi nhật ký #${row.id}`,
    });
  };

  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      setToast({
        type: 'error',
        message: 'Không có bản ghi nhật ký nào để xuất tệp báo cáo',
      });
      return;
    }
    const csvContent = generateAuditLogsCsv(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `nhat-ky-he-thong-su-ky-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      type: 'success',
      message: `Đã xuất ${filteredRows.length} bản ghi nhật ký ra tệp báo cáo`,
    });
  };

  const isLoading = isAuditLoading && isUsersLoading;
  const isRefreshing =
    isAuditFetching || isUsersFetching || isDomainFetching;

  return (
    <div
      ref={pageContainerRef}
      className="space-y-4 sm:space-y-5 pb-8 font-sans"
    >
      {/* Thông báo trạng thái thao tác */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-[1050] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FFF0F2] border-[#FECDD3] text-[#991B1B]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Khung tiêu đề Hero Banner (3 Lớp Bóc Tách chuẩn Sử Ký) */}
      <div ref={heroRef}>
        <AdminAuditLogsHeroBanner />
      </div>

      {/* 2. Thẻ Thống Kê (4 Thẻ Ngang Chuẩn Ảnh Mẫu) */}
      <div ref={statsRef}>
        <AdminAuditLogsStatCards
          kpis={kpis}
          activeCategory={categoryFilter}
          onSelectCategory={setCategoryFilter}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Thanh Bộ Lọc & Tìm Kiếm */}
      <div ref={toolbarRef}>
        <AdminAuditLogsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          actorFilter={actorFilter}
          onActorFilterChange={setActorFilter}
          actorOptions={actorOptions}
          dateRangePreset={dateRangePreset}
          onDateRangePresetChange={setDateRangePreset}
          customDateStart={customDateStart}
          customDateEnd={customDateEnd}
          onCustomDateChange={(start, end) => {
            setCustomDateStart(start);
            setCustomDateEnd(end);
          }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onExportCsv={handleExportCsv}
        />
      </div>

      {/* Thông báo lỗi kết nối */}
      {isAuditError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Không thể tải dữ liệu nhật ký hệ thống từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleRefresh()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 font-semibold transition-colors cursor-pointer shrink-0"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 4. Bảng Dữ Liệu Nhật Ký Hệ Thống & Phân Trang */}
      <div ref={tableRef}>
        <AdminAuditLogsTable
          rows={paginatedRows}
          totalElements={totalElements}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onViewDetail={(row) => {
            setDetailInitialTab('detail');
            setDetailTargetId(row.id);
          }}
          onViewActor={(row) => {
            setDetailInitialTab('actorHistory');
            setDetailTargetId(row.id);
          }}
          onFilterByActor={handleFilterByActor}
          onFilterByAction={handleFilterByAction}
          onCopyLogSummary={handleCopyLogSummary}
          onNavigateTarget={(route) => navigate(route)}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
        />
      </div>

      {/* 5. Hộp Thoại Chi Tiết Bản Ghi & Hồ Sơ Tác Nhân (Chỉ Đọc) */}
      <AdminAuditLogDetailModal
        logRow={activeDetailRow}
        initialTab={detailInitialTab}
        allRows={baseRows}
        onClose={() => setDetailTargetId(null)}
        onSelectLogRow={(row) => {
          setDetailInitialTab('detail');
          setDetailTargetId(row.id);
        }}
        onFilterByActor={handleFilterByActor}
        onNavigateTarget={(route) => navigate(route)}
      />
    </div>
  );
};

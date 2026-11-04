import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { transactionsApi } from '@/services/api/transactions';
import { usersApi } from '@/services/api/users';
import {
  AdminTransactionRow,
  buildAdminTransactionRows,
  calculateTransactionsKPIs,
  calculateDateRangeBounds,
  filterAdminTransactionRows,
  exportTransactionsToCSV,
} from './transactionsLogic';
import { AdminTransactionsHeroBanner } from './components/AdminTransactionsHeroBanner';
import { AdminTransactionsStatCards } from './components/AdminTransactionsStatCards';
import { AdminTransactionsFilterToolbar } from './components/AdminTransactionsFilterToolbar';
import { AdminTransactionsTable } from './components/AdminTransactionsTable';
import { AdminTransactionDetailModal } from './components/AdminTransactionDetailModal';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCw } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  // GSAP animation container
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>(undefined);
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>(undefined);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal inspection state
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransactionRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch Live Wallet Transactions (Zero Fake Data)
  const {
    data: txResponse,
    isLoading: isTxLoading,
    isError: isTxError,
    refetch: refetchTx,
    isFetching: isTxFetching,
  } = useQuery({
    queryKey: ['admin-wallet-transactions'],
    queryFn: () => transactionsApi.getAllTransactions(),
  });

  // 2. Fetch Live Users to join user profile information
  const { data: usersResponse } = useQuery({
    queryKey: ['admin-transactions-users'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 200 }),
    staleTime: 60000,
  });

  const rawTransactions = useMemo(() => txResponse?.data || [], [txResponse]);
  const userList = useMemo(() => {
    const pageData = usersResponse?.data;
    return pageData?.items || pageData?.content || [];
  }, [usersResponse]);

  // Join raw transactions with user profiles
  const allRows: AdminTransactionRow[] = useMemo(() => {
    return buildAdminTransactionRows(rawTransactions, userList);
  }, [rawTransactions, userList]);

  // Calculate live financial KPIs strictly from backend data
  const kpis = useMemo(() => {
    return calculateTransactionsKPIs(rawTransactions);
  }, [rawTransactions]);

  // Date bounds calculation
  const dateBounds = useMemo(() => {
    return calculateDateRangeBounds(dateRangePreset, customDateStart, customDateEnd);
  }, [dateRangePreset, customDateStart, customDateEnd]);

  // Date range label for the toolbar popover button
  const dateRangeLabel = useMemo(() => {
    if (dateRangePreset === '7d') return '7 ngày qua';
    if (dateRangePreset === '30d') return '30 ngày qua';
    if (dateRangePreset === '90d') return '90 ngày qua';
    if (dateRangePreset === 'custom') {
      if (customDateStart && customDateEnd) return `${customDateStart} → ${customDateEnd}`;
      if (customDateStart) return `Từ ${customDateStart}`;
      if (customDateEnd) return `Đến ${customDateEnd}`;
      return 'Tùy chỉnh';
    }
    return 'Khoảng thời gian';
  }, [dateRangePreset, customDateStart, customDateEnd]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return filterAdminTransactionRows(allRows, searchQuery, typeFilter, statusFilter, dateBounds);
  }, [allRows, searchQuery, typeFilter, statusFilter, dateBounds]);

  // Paginated rows
  const totalElements = filteredRows.length;
  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  }, [filteredRows, page, pageSize]);

  // Filter status flag
  const isFiltered = Boolean(
    searchQuery.trim() ||
      typeFilter !== 'all' ||
      statusFilter !== 'all' ||
      dateRangePreset !== 'all'
  );

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateRangePreset('all');
    setCustomDateStart(undefined);
    setCustomDateEnd(undefined);
    setPage(0);
  };

  // Date range change handler (with toggle-off support)
  const handleDateRangeChange = (preset: string, start?: string, end?: string) => {
    setDateRangePreset(preset);
    setCustomDateStart(start);
    setCustomDateEnd(end);
    setPage(0);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const csvContent = exportTransactionsToCSV(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `su_ky_bien_dong_so_du_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open detail modal
  const handleSelectRow = (row: AdminTransactionRow) => {
    setSelectedTransaction(row);
    setIsModalOpen(true);
  };

  // GSAP entrance animation
  useEffect(() => {
    if (pageContainerRef.current) {
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
        }
      );
    }
  }, []);

  return (
    <div ref={pageContainerRef} className="space-y-6 pb-12 select-text font-sans">
      {/* 1. Hero Banner: 3 Layers matching reference mockup 100% */}
      <div ref={heroRef}>
        <AdminTransactionsHeroBanner />
      </div>

      {/* 2. 4 Stat Cards: Financial metrics calculated strictly from live data */}
      <div ref={statsRef}>
        <AdminTransactionsStatCards kpis={kpis} />
      </div>

      {/* Error Banner with Retry */}
      {isTxError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Không thể tải dữ liệu sổ cái biến động số dư ví. Vui lòng kiểm tra kết nối mạng hoặc thử lại.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchTx()}
            className="h-8 px-3 text-xs border-rose-300 text-rose-800 hover:bg-rose-100"
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Tải lại
          </Button>
        </div>
      )}

      {/* 3. Filter Toolbar: Search, Type, Status, Date Range with Toggle-off, Refresh, Export */}
      <div ref={toolbarRef}>
        <AdminTransactionsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setPage(0);
          }}
          typeFilter={typeFilter}
          onTypeFilterChange={(v) => {
            setTypeFilter(v);
            setPage(0);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
          dateRange={dateRangePreset}
          dateRangeLabel={dateRangeLabel}
          customStartDate={customDateStart}
          customEndDate={customDateEnd}
          onDateRangeChange={handleDateRangeChange}
          onRefresh={() => refetchTx()}
          isRefreshing={isTxFetching}
          onExport={handleExportCSV}
        />
      </div>

      {/* 4. Transactions Table & Pagination */}
      <div ref={tableRef}>
        <AdminTransactionsTable
          rows={paginatedRows}
          isLoading={isTxLoading}
          onSelectRow={handleSelectRow}
          page={page}
          pageSize={pageSize}
          totalElements={totalElements}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* 5. Transaction Detail Modal (React Portal z-[999]) */}
      <AdminTransactionDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </div>
  );
};
export default TransactionsPage;

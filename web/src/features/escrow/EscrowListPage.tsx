import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RotateCw } from 'lucide-react';
import { escrowApi } from '@/services/api/escrow';
import { EscrowTransactionItem } from '@/types/escrow';
import {
  AdminEscrowRow,
  EscrowTabFilter,
  EscrowFilterOptions,
  mapBackendItemToEscrowRow,
  calculateEscrowKpis,
  filterEscrowRows,
  generateEscrowCsv,
  downloadCsvFile,
} from './escrowLogic';
import { AdminEscrowHeroBanner } from './components/AdminEscrowHeroBanner';
import { AdminEscrowStatCards } from './components/AdminEscrowStatCards';
import { AdminEscrowStatusTabs } from './components/AdminEscrowStatusTabs';
import { AdminEscrowFilterToolbar } from './components/AdminEscrowFilterToolbar';
import { AdminEscrowTable } from './components/AdminEscrowTable';
import { AdminEscrowDetailModal } from './components/AdminEscrowDetailModal';
import { EscrowMilestoneBreakdownDialog } from './EscrowMilestoneBreakdownDialog';

export const EscrowListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  // Filter states
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [statusTab, setStatusTab] = useState<EscrowTabFilter>('ALL');
  const [statusSelect, setStatusSelect] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [dateRangePreset, setDateRangePreset] = useState('ALL');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Selected row for modals
  const [selectedRow, setSelectedRow] = useState<AdminEscrowRow | null>(null);
  const [breakdownEscrowItem, setBreakdownEscrowItem] = useState<EscrowTransactionItem | null>(null);

  // Sync state if URL query param changes
  useEffect(() => {
    setSearchQuery((prev) => {
      if (prev !== urlSearch) {
        setCurrentPage(0);
        return urlSearch;
      }
      return prev;
    });
  }, [urlSearch]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
    if (val.trim()) {
      setSearchParams({ search: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // 1. Fetch Milestone Revenue & Escrow Summary (4 KPIs)
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['admin-escrow-summary'],
    queryFn: () => escrowApi.getMilestoneRevenueSummary(),
  });

  // 2. Fetch Milestone Revenue & Escrow Ledger (V2)
  const {
    data: ledgerData,
    isLoading: isLedgerLoading,
    isError: isLedgerError,
    refetch: refetchLedger,
    isFetching: isLedgerFetching,
  } = useQuery({
    queryKey: ['admin-escrow-ledger'],
    queryFn: () =>
      escrowApi.getMilestoneRevenueLedger({
        page: 0,
        size: 100, // Fetch up to 100 to enable client-side instant filtering & sorting
      }),
  });

  const handleRefresh = async () => {
    await Promise.all([refetchSummary(), refetchLedger()]);
  };

  // Process live data from Backend API
  const rawBackendItems = ledgerData?.data?.items;
  const hasRealBackendData = Array.isArray(rawBackendItems) && rawBackendItems.length > 0;

  // Base rows determination: strictly 100% Real Live Data
  const baseRows: AdminEscrowRow[] = useMemo(() => {
    if (hasRealBackendData) {
      return rawBackendItems.map((item, idx) => mapBackendItemToEscrowRow(item, idx));
    }
    return [];
  }, [hasRealBackendData, rawBackendItems]);

  // Active filter options
  const filterOptions: EscrowFilterOptions = useMemo(
    () => ({
      searchQuery,
      statusTab,
      statusSelect,
      paymentMethod,
      datePreset: dateRangePreset as EscrowFilterOptions['datePreset'],
      customStartDate: customDateStart,
      customEndDate: customDateEnd,
    }),
    [searchQuery, statusTab, statusSelect, paymentMethod, dateRangePreset, customDateStart, customDateEnd]
  );

  // Filtered rows
  const filteredRows = useMemo(() => {
    return filterEscrowRows(baseRows, filterOptions);
  }, [baseRows, filterOptions]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    return calculateEscrowKpis(baseRows, hasRealBackendData ? summaryData?.data : undefined);
  }, [baseRows, hasRealBackendData, summaryData]);

  // Paginated rows
  const totalElements = filteredRows.length;
  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [statusTab, statusSelect, paymentMethod, dateRangePreset, customDateStart, customDateEnd]);

  // CSV Export handler
  const handleExportCSV = async () => {
    try {
      if (hasRealBackendData) {
        const blob = await escrowApi.exportRevenueCsv({
          status: statusTab === 'ALL' ? undefined : statusTab,
          search: searchQuery.trim() || undefined,
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `So_cai_Ky_quy_Escrow_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const csvString = generateEscrowCsv(filteredRows);
        downloadCsvFile(`So_cai_Ky_quy_Escrow_${new Date().toISOString().slice(0, 10)}.csv`, csvString);
      }
    } catch {
      const csvString = generateEscrowCsv(filteredRows);
      downloadCsvFile(`So_cai_Ky_quy_Escrow_${new Date().toISOString().slice(0, 10)}.csv`, csvString);
    }
  };

  // Open milestone breakdown dialog
  const handleViewMilestones = (row: AdminEscrowRow) => {
    setBreakdownEscrowItem({
      id: row.milestoneId || row.rawId,
      contractId: row.contractId,
      amount: row.grossAmount,
      commissionAmount: row.platformFee,
      status: row.status,
      lockedAt: row.fundedAt,
      releasedAt: row.releasedAt,
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 1. Header / Hero Banner (3 Lớp Chuẩn Sử Ký) */}
      <AdminEscrowHeroBanner />

      {/* 2. Thẻ Thống Kê (4 Stat Cards - Bố cục ngang chuẩn mockup) */}
      <AdminEscrowStatCards kpis={kpis} />

      {/* 3. Dải Tabs Trạng Thái (Status Pills) */}
      <AdminEscrowStatusTabs
        activeTab={statusTab}
        onChange={setStatusTab}
        kpis={kpis}
      />

      {/* 4. Thanh Bộ Lọc & Tìm Kiếm (Filter Toolbar) */}
      <AdminEscrowFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusSelect}
        onStatusFilterChange={setStatusSelect}
        paymentMethodFilter={paymentMethod}
        onPaymentMethodFilterChange={setPaymentMethod}
        dateRangePreset={dateRangePreset}
        onDateRangePresetChange={setDateRangePreset}
        customDateStart={customDateStart}
        customDateEnd={customDateEnd}
        onCustomDateChange={(start, end) => {
          setCustomDateStart(start);
          setCustomDateEnd(end);
        }}
        onRefresh={handleRefresh}
        isRefreshing={isLedgerFetching}
        onExportCSV={handleExportCSV}
      />


      {/* Network Error Alert */}
      {isLedgerError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Không thể kết nối đến máy chủ sổ cái ký quỹ. Vui lòng bấm thử lại.</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-800 hover:bg-rose-50 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </button>
        </div>
      )}

      {/* 5. Bảng Dữ Liệu Ký Quỹ Escrow (Admin Data Table - 100% Fit) */}
      <AdminEscrowTable
        rows={paginatedRows}
        totalElements={totalElements}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(0);
        }}
        isLoading={isLedgerLoading}
        onViewDetail={setSelectedRow}
        onViewContract={(contractId) => navigate(`/admin/contracts?search=HD${String(contractId).padStart(5, '0')}`)}
        onViewMilestones={handleViewMilestones}
      />

      {/* 6. Modal Chi Tiết Giao Dịch Ký Quỹ */}
      {selectedRow && (
        <AdminEscrowDetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onViewContract={(contractId) => navigate(`/admin/contracts?search=HD${String(contractId).padStart(5, '0')}`)}
          onViewMilestoneBreakdown={handleViewMilestones}
        />
      )}

      {/* 7. Dialog Đối Soát Lộ Trình Milestone Hợp Đồng */}
      {breakdownEscrowItem && (
        <EscrowMilestoneBreakdownDialog
          escrowItem={breakdownEscrowItem}
          onClose={() => setBreakdownEscrowItem(null)}
        />
      )}
    </div>
  );
};

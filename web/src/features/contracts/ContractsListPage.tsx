import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { contractsApi } from '@/services/api/contracts';
import { usersApi } from '@/services/api/users';
import {
  AdminContractRow,
  UserLookupBasic,
  buildAdminContractRows,
  calculateContractKPIs,
  filterAdminContractRows,
  exportContractsToCSV,
  formatContractCode,
} from './contractsLogic';
import { AdminContractsHeroBanner } from './components/AdminContractsHeroBanner';
import { AdminContractsStatCards } from './components/AdminContractsStatCards';
import { AdminContractsStatusTabs } from './components/AdminContractsStatusTabs';
import { AdminContractsFilterToolbar } from './components/AdminContractsFilterToolbar';
import { AdminContractsTable } from './components/AdminContractsTable';
import { AdminContractDetailModal } from './components/AdminContractDetailModal';
import { AlertCircle, RotateCw } from 'lucide-react';

export const ContractsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawUrlSearch = searchParams.get('search') || '';
  const initialSearch = useMemo(() => {
    if (!rawUrlSearch) return '';
    // Convert plain numeric contract ID (e.g. "3") from Dispute link to "HD00003" if appropriate
    if (/^\d+$/.test(rawUrlSearch.trim())) {
      return formatContractCode(rawUrlSearch.trim());
    }
    return rawUrlSearch.trim();
  }, [rawUrlSearch]);

  // GSAP animation refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusTab, setStatusTab] = useState('ALL');
  const [statusDropdown, setStatusDropdown] = useState('ALL');
  const [narratorFilter, setNarratorFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>(undefined);
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>(undefined);

  // Sync URL search param if changed externally
  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ search: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [selectedContract, setSelectedContract] = useState<AdminContractRow | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [initialDetailTab, setInitialDetailTab] = useState<'milestones' | 'terms'>('milestones');

  // 1. Fetch live contracts from Backend (Page 0, Size 100 for comprehensive admin view)
  const {
    data: contractsResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-contracts-list'],
    queryFn: () => contractsApi.getAllContracts(undefined, { page: 0, size: 100 }),
  });

  // 1b. Fetch live users directory to enrich contracts with 100% real user emails & fullNames
  const { data: usersResponse } = useQuery({
    queryKey: ['admin-users-lookup'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 200 }),
    staleTime: 60 * 1000,
  });

  const userMap = useMemo(() => {
    const map = new Map<number, UserLookupBasic>();
    const rawU = usersResponse?.data;
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
        map.set(u.id, {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl,
        });
      }
    }
    return map;
  }, [usersResponse]);

  // Extract raw contracts safely
  const rawApiData = contractsResponse?.data;
  const realContracts = useMemo(() => {
    if (!rawApiData) return [];
    if (Array.isArray(rawApiData)) return rawApiData;
    if ('items' in rawApiData && Array.isArray(rawApiData.items)) return rawApiData.items;
    return [];
  }, [rawApiData]);

  // 2. Build rows strictly from real backend data + real user emails (100% Zero Fake Data)
  const allRows: AdminContractRow[] = useMemo(() => {
    return buildAdminContractRows(realContracts, userMap);
  }, [realContracts, userMap]);

  // Calculate live KPIs strictly from real contracts
  const kpis = useMemo(() => {
    return calculateContractKPIs(allRows);
  }, [allRows]);

  // Extract distinct customers for the dropdown filter
  const availableNarrators = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRows) {
      if (r.narratorName) set.add(r.narratorName);
    }
    return Array.from(set).sort();
  }, [allRows]);

  // Filtered rows based on user input
  const filteredRows = useMemo(() => {
    return filterAdminContractRows(allRows, {
      searchQuery,
      statusTab,
      statusDropdown,
      narratorFilter,
      dateRangePreset,
      customDateStart,
      customDateEnd,
    });
  }, [
    allRows,
    searchQuery,
    statusTab,
    statusDropdown,
    narratorFilter,
    dateRangePreset,
    customDateStart,
    customDateEnd,
  ]);

  // Paginated slice for current page
  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [
    searchQuery,
    statusTab,
    statusDropdown,
    narratorFilter,
    dateRangePreset,
    customDateStart,
    customDateEnd,
    pageSize,
  ]);

  // Subtle natural GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.4 } });
      tl.from(heroRef.current, { opacity: 0, y: -8 })
        .from(statsRef.current, { opacity: 0, y: 10 }, '-=0.25')
        .from(tabsRef.current, { opacity: 0, y: 8 }, '-=0.2')
        .from(toolbarRef.current, { opacity: 0, y: 8 }, '-=0.2')
        .from(tableRef.current, { opacity: 0, y: 12 }, '-=0.15');
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  // Handlers
  const handleViewDetail = (contract: AdminContractRow, tab: 'milestones' | 'terms' = 'milestones') => {
    setSelectedContract(contract);
    setInitialDetailTab(tab);
    setDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvContent = exportContractsToCSV(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `hop-dong-san-xuat-su-ky-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={pageContainerRef} className="space-y-5 pb-12 font-sans">
      {/* 1. Header / Hero Banner */}
      <div ref={heroRef}>
        <AdminContractsHeroBanner />
      </div>

      {/* 2. Stat Cards */}
      <div ref={statsRef}>
        <AdminContractsStatCards kpis={kpis} />
      </div>

      {/* 3. Status Tabs */}
      <div ref={tabsRef}>
        <AdminContractsStatusTabs
          activeTab={statusTab}
          onTabChange={setStatusTab}
          kpis={kpis}
        />
      </div>

      {/* 4. Filter Toolbar */}
      <div ref={toolbarRef}>
        <AdminContractsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusDropdown}
          onStatusFilterChange={setStatusDropdown}
          narratorFilter={narratorFilter}
          onNarratorFilterChange={setNarratorFilter}
          availableNarrators={availableNarrators}
          dateRangePreset={dateRangePreset}
          onDateRangePresetChange={setDateRangePreset}
          customDateStart={customDateStart}
          customDateEnd={customDateEnd}
          onCustomDateChange={(start, end) => {
            setCustomDateStart(start);
            setCustomDateEnd(end);
          }}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* API Error Alert if network error occurs */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Lỗi tải dữ liệu từ máy chủ. Đang hiển thị bản ghi an toàn.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-900 font-medium transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 5. Contracts Data Table */}
      <div ref={tableRef}>
        <AdminContractsTable
          rows={paginatedRows}
          totalElements={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onViewDetail={handleViewDetail}
          isLoading={isLoading}
        />
      </div>

      {/* 6. Contract Detail & Milestone Modal */}
      <AdminContractDetailModal
        contract={allRows.find((r) => r.id === selectedContract?.id) || selectedContract}
        initialTab={initialDetailTab}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
};

export default ContractsListPage;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { AlertCircle, RotateCw } from 'lucide-react';
import { disputesApi } from '@/services/api/disputes';
import { contractsApi } from '@/services/api/contracts';
import { usersApi } from '@/services/api/users';
import type { DisputeItem } from '@/types/dispute';
import type { ContractItem } from '@/types/contract';
import {
  AdminDisputeRow,
  DisputeStatusFilter,
  DisputeUserLookup,
  mapBackendItemToDisputeRow,
  calculateDisputeKpis,
  filterDisputeRows,
  generateDisputeCsv,
  downloadCsvFile,
} from './disputesLogic';
import { AdminDisputeHeroBanner } from './components/AdminDisputeHeroBanner';
import { AdminDisputeStatCards } from './components/AdminDisputeStatCards';
import { AdminDisputeStatusTabs } from './components/AdminDisputeStatusTabs';
import { AdminDisputeFilterToolbar } from './components/AdminDisputeFilterToolbar';
import { AdminDisputeTable } from './components/AdminDisputeTable';
import { AdminDisputeDetailModal } from './AdminDisputeDetailModal';

export const DisputesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  // GSAP animation refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [statusTab, setStatusTab] = useState<DisputeStatusFilter>('ALL');
  const [disputeTypeFilter, setDisputeTypeFilter] = useState('ALL');
  const [statusSelectFilter, setStatusSelectFilter] = useState('ALL');
  const [dateRangePreset, setDateRangePreset] = useState('ALL');
  const [customDateStart, setCustomDateStart] = useState<string | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<string | undefined>();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Selected dispute row for modals
  const [selectedDisputeRow, setSelectedDisputeRow] = useState<AdminDisputeRow | null>(null);

  // Sync state if URL search query changes
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

  // 1. Fetch live disputes from Backend API (API-First Validation & Zero Fake Data)
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => disputesApi.getAllDisputes(),
  });

  // 2. Fetch contracts lookup to accurately resolve senderRole (Creator vs Khách hàng)
  const { data: contractsData } = useQuery({
    queryKey: ['admin-contracts-lookup'],
    queryFn: () => contractsApi.getAllContracts(undefined, { page: 0, size: 100 }),
  });

  // 2b. Fetch users lookup to enrich dispute participants with real emails & fullNames
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-lookup'],
    queryFn: () => usersApi.searchUsers({ page: 0, size: 200 }),
    staleTime: 60 * 1000,
  });

  const userMap = useMemo(() => {
    const map = new Map<number, DisputeUserLookup>();
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
        map.set(u.id, {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl,
        });
      }
    }
    return map;
  }, [usersData]);

  const contractMap = useMemo(() => {
    const map = new Map<number, ContractItem>();
    const rawC = contractsData?.data;
    const list: ContractItem[] = !rawC
      ? []
      : Array.isArray(rawC)
      ? rawC
      : 'content' in rawC && Array.isArray((rawC as any).content)
      ? (rawC as any).content
      : 'items' in rawC && Array.isArray((rawC as any).items)
      ? (rawC as any).items
      : [];
    for (const c of list) {
      map.set(c.id, c);
    }
    return map;
  }, [contractsData]);

  // Extract raw backend items
  const rawData = data?.data;
  const rawItems: DisputeItem[] = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if ('content' in rawData && Array.isArray((rawData as any).content)) {
      return (rawData as any).content;
    }
    if ('items' in rawData && Array.isArray((rawData as any).items)) {
      return (rawData as any).items;
    }
    return [];
  }, [rawData]);

  // Map real backend items to AdminDisputeRow (100% Real Live Data)
  const liveRows: AdminDisputeRow[] = useMemo(() => {
    return rawItems.map((item, idx) =>
      mapBackendItemToDisputeRow(item, idx, contractMap.get(item.contractId), userMap)
    );
  }, [rawItems, contractMap, userMap]);

  // Aggregate live KPIs strictly from real backend records (Zero Fake Data)
  const kpis = useMemo(() => {
    return calculateDisputeKpis(liveRows);
  }, [liveRows]);

  // Filtered dispute rows
  const filteredRows = useMemo(() => {
    return filterDisputeRows(liveRows, {
      searchQuery,
      statusTab,
      disputeType: disputeTypeFilter,
      statusSelect: statusSelectFilter,
      dateRangePreset,
      customDateStart,
      customDateEnd,
    });
  }, [
    liveRows,
    searchQuery,
    statusTab,
    disputeTypeFilter,
    statusSelectFilter,
    dateRangePreset,
    customDateStart,
    customDateEnd,
  ]);

  // Pagination calculations
  const totalElements = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset to first page when any filter criteria changes
  useEffect(() => {
    setCurrentPage(0);
  }, [
    statusTab,
    disputeTypeFilter,
    statusSelectFilter,
    dateRangePreset,
    customDateStart,
    customDateEnd,
  ]);

  // Handlers
  const handleRefresh = async () => {
    await refetch();
  };

  const handleExportCSV = () => {
    const csvContent = generateDisputeCsv(filteredRows);
    const filename = `Khieu_nai_tranh_chap_Su_Ky_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(csvContent, filename);
  };

  const handleNavigateContract = (contractId: number) => {
    navigate(`/admin/contracts?search=HD${String(contractId).padStart(5, '0')}`);
  };

  // Subtle natural GSAP staggered entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
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
          clearProps: 'all',
        }
      );
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageContainerRef} className="space-y-5 sm:space-y-6 font-sans">
      {/* 1. Header / Hero Banner (3-layer design) */}
      <div ref={heroRef}>
        <AdminDisputeHeroBanner />
      </div>

      {/* 2. Thẻ Thống Kê (Stat Cards - Horizontal Squircle Layout) */}
      <div ref={statsRef}>
        <AdminDisputeStatCards kpis={kpis} isLoading={isLoading} />
      </div>

      {/* 3. Status Filter Tabs (Above filter toolbar) */}
      <div ref={tabsRef}>
        <AdminDisputeStatusTabs
          activeTab={statusTab}
          onTabChange={(tab) => {
            setStatusTab(tab);
            if (tab === 'ALL') {
              setStatusSelectFilter('ALL');
            } else {
              setStatusSelectFilter(tab);
            }
          }}
          kpis={kpis}
        />
      </div>

      {/* 4. Thanh Bộ Lọc & Tìm Kiếm (Filter Toolbar) & Popover Thời Gian (Radix Portal z-[999]) */}
      <div ref={toolbarRef}>
        <AdminDisputeFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          disputeTypeFilter={disputeTypeFilter}
          onDisputeTypeFilterChange={setDisputeTypeFilter}
          statusSelectFilter={statusSelectFilter}
          onStatusSelectFilterChange={(val) => {
            setStatusSelectFilter(val);
            if (val === 'ALL') {
              setStatusTab('ALL');
            } else if (val === 'OPEN' || val === 'RESOLVED' || val === 'CANCELLED') {
              setStatusTab(val);
            }
          }}
          dateRangePreset={dateRangePreset}
          onDateRangePresetChange={setDateRangePreset}
          customDateStart={customDateStart}
          customDateEnd={customDateEnd}
          onCustomDateChange={(start, end) => {
            setCustomDateStart(start);
            setCustomDateEnd(end);
          }}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Backend API Error Notice */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Không thể kết nối đến máy chủ quản lý khiếu nại. Vui lòng bấm thử lại.</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-800 hover:bg-rose-50 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </button>
        </div>
      )}

      {/* 5. Bảng Dữ Liệu Khiếu Nại (Admin Data Table - 100% Fit, Anti-Orphan Word) */}
      <div ref={tableRef}>
        <AdminDisputeTable
          rows={paginatedRows}
          totalElements={totalElements}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(0);
          }}
          onViewDetail={setSelectedDisputeRow}
          onResolveDispute={(row) => setSelectedDisputeRow(row)}
          onNavigateContract={handleNavigateContract}
          isLoading={isLoading}
        />
      </div>

      {/* 6. Modal Chi Tiết Khiếu Nại & Phân Xử Ban Quản Trị */}
      {selectedDisputeRow && (
        <AdminDisputeDetailModal
          dispute={selectedDisputeRow}
          onClose={() => setSelectedDisputeRow(null)}
        />
      )}
    </div>
  );
};

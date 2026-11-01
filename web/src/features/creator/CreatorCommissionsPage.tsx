import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  FileText,
  Layers,
  Search,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { commissionsApi } from '@/services/api/commissions';
import { contractsApi } from '@/services/api/contracts';
import { CommissionItem } from '@/types/commission';
import { ContractItem } from '@/types/contract';
import { cn } from '@/utils/cn';
import { isReducedMotion, createSafeMotionContext } from '@/utils/motion';

// Compound Components
import { CreatorCommissionsHeroBanner } from './components/CreatorCommissionsHeroBanner';
import { CommissionsKpiCards } from './components/CommissionsKpiCards';
import { CommissionCard } from './components/CommissionCard';
import { ContractCard } from './components/ContractCard';
import { CreatorRejectCommissionModal } from './components/CreatorRejectCommissionModal';
import { CreatorMilestoneRoadmapModal } from './components/CreatorMilestoneRoadmapModal';
import { CreatorContractDetailDrawer } from './components/CreatorContractDetailDrawer';
import { CreatorCommissionChatModal } from './components/CreatorCommissionChatModal';

export const CreatorCommissionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Active Tab: 'commissions' (Yêu cầu đặt làm nội dung) | 'contracts' (Lộ trình Milestone & Hợp đồng)
  const [activeTab, setActiveTab] = useState<'commissions' | 'contracts'>('commissions');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected entities for modals
  const [selectedCommissionForReject, setSelectedCommissionForReject] =
    useState<CommissionItem | null>(null);
  const [selectedCommissionForRoadmap, setSelectedCommissionForRoadmap] =
    useState<CommissionItem | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [activeChatCommission, setActiveChatCommission] = useState<CommissionItem | null>(null);

  // Reset page when tab, filter, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, search]);

  // 1. Fetch Received Commissions
  const {
    data: commissionsData,
    isLoading: isCommissionsLoading,
    refetch: refetchCommissions,
  } = useQuery({
    queryKey: ['creator-commissions-received', statusFilter],
    queryFn: () =>
      commissionsApi.getMyReceivedRequests(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  // 2. Fetch Creator Contracts
  const {
    data: contractsData,
    isLoading: isContractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['creator-contracts-me', statusFilter],
    queryFn: () => contractsApi.getAllContracts(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  // 3. Fetch Milestone Financials
  const { data: financialsData } = useQuery({
    queryKey: ['creator-milestone-financials'],
    queryFn: () => contractsApi.getMyMilestoneFinancials(),
  });

  const financials = financialsData?.data;

  // Accept Commission Mutation
  const acceptMutation = useMutation({
    mutationFn: (commissionId: number) => commissionsApi.acceptCommission(commissionId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['creator-commissions-received'] });
      // Automatically prompt Creator to set up Milestone Roadmap
      if (res.data) {
        setSelectedCommissionForRoadmap(res.data);
      }
    },
  });

  // Items extraction
  const rawCommissions: CommissionItem[] =
    commissionsData?.data?.items ||
    (Array.isArray(commissionsData?.data) ? commissionsData.data : []) ||
    [];

  const filteredCommissions = rawCommissions.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.requesterFullName && c.requesterFullName.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedCommissions = [...filteredCommissions].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const rawContracts: ContractItem[] = Array.isArray(contractsData?.data)
    ? contractsData.data
    : contractsData?.data && 'items' in contractsData.data && Array.isArray(contractsData.data.items)
      ? contractsData.data.items
      : [];

  const filteredContracts = rawContracts.filter(
    (c) =>
      (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
      (c.requesterFullName && c.requesterFullName.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Pagination calculation
  const totalItems = activeTab === 'commissions' ? sortedCommissions.length : sortedContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCommissions = sortedCommissions.slice(startIndex, startIndex + pageSize);
  const paginatedContracts = sortedContracts.slice(startIndex, startIndex + pageSize);
  const displayStart = totalItems === 0 ? 0 : startIndex + 1;
  const displayEnd = Math.min(startIndex + pageSize, totalItems);

  // ─── GSAP Entrance Motion ─────────────────────────────────────────────────
  useEffect(() => {
    if (isReducedMotion()) return;

    const cleanup = createSafeMotionContext(pageContainerRef, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (kpiSectionRef.current) {
        tl.fromTo(
          kpiSectionRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35 }
        );
      }

      if (contentSectionRef.current) {
        tl.fromTo(
          contentSectionRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.15'
        );
      }
    });

    return cleanup;
  }, []);

  // ─── GSAP Stagger Animation for Cards List ────────────────────────────────
  useEffect(() => {
    if (isReducedMotion() || !cardsContainerRef.current) return;
    const children = cardsContainerRef.current.children;
    if (!children || children.length === 0) return;

    gsap.fromTo(
      children,
      { opacity: 0, y: 12, scale: 0.99 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.32,
        stagger: 0.04,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }
    );
  }, [activeTab, statusFilter, sortBy, currentPage, paginatedCommissions.length, paginatedContracts.length]);

  return (
    <div ref={pageContainerRef} className="space-y-6 max-w-7xl mx-auto pb-14 font-sans">
      {/* 1. Hero Masthead Banner Matching Exact Historical Artwork & Title */}
      <CreatorCommissionsHeroBanner />

      {/* 2. Top 4 KPI Cards */}
      <div ref={kpiSectionRef}>
        <CommissionsKpiCards
          totalCommissions={rawCommissions.length}
          pendingCommissions={rawCommissions.filter((c) => c.status === 'PENDING').length}
          activeContracts={rawContracts.filter((c) => c.status === 'ACTIVE').length}
          activeMilestonesCount={financials?.activeMilestonesCount || 0}
          financials={financials}
        />
      </div>

      {/* 3. Main Workspace Container with Warm Styling */}
      <section
        ref={contentSectionRef}
        className="rounded-2xl border border-[#EBE4D8] bg-white p-5 sm:p-6 shadow-xs space-y-6"
      >
        {/* Navigation Tabs Header with Underline Active Indicator */}
        <div
          role="tablist"
          aria-label="Điều hướng đơn đặt hàng và hợp đồng"
          className="flex items-center gap-6 border-b border-[#EBE4D8] pb-0 -mx-1 px-1 overflow-x-auto"
        >
          {/* Tab 1: Yêu cầu đặt làm nội dung */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'commissions'}
            onClick={() => {
              setActiveTab('commissions');
              setStatusFilter('ALL');
            }}
            className={cn(
              'relative pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]',
              activeTab === 'commissions'
                ? 'text-[#1C1615] font-bold'
                : 'text-stone-500 hover:text-stone-800'
            )}
          >
            <FileText
              className={cn(
                'h-4 w-4 transition-colors',
                activeTab === 'commissions' ? 'text-[#A31D24]' : 'text-stone-400'
              )}
            />
            <span>Yêu cầu đặt làm nội dung</span>
            {rawCommissions.filter((c) => c.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#A31D24] text-white">
                {rawCommissions.filter((c) => c.status === 'PENDING').length}
              </span>
            )}

            {/* Red Underline Active Indicator Bar */}
            {activeTab === 'commissions' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#A31D24] rounded-full" />
            )}
          </button>

          {/* Tab 2: Lộ trình Milestone & Hợp đồng */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'contracts'}
            onClick={() => {
              setActiveTab('contracts');
              setStatusFilter('ALL');
            }}
            className={cn(
              'relative pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]',
              activeTab === 'contracts'
                ? 'text-[#1C1615] font-bold'
                : 'text-stone-500 hover:text-stone-800'
            )}
          >
            <Layers
              className={cn(
                'h-4 w-4 transition-colors',
                activeTab === 'contracts' ? 'text-[#A31D24]' : 'text-stone-400'
              )}
            />
            <span>Lộ trình Milestone &amp; Hợp đồng</span>
            <span className="text-xs text-stone-400 font-mono">({rawContracts.length})</span>

            {/* Red Underline Active Indicator Bar */}
            {activeTab === 'contracts' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#A31D24] rounded-full" />
            )}
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-stone-500 text-xs font-medium mr-1.5 select-none">
              Trạng thái:
            </span>

            {activeTab === 'commissions' ? (
              // Status Filters for Commissions Tab
              [
                { value: 'ALL', label: 'Tất cả' },
                { value: 'PENDING', label: 'Chờ duyệt' },
                { value: 'ACCEPTED', label: 'Đã chấp nhận' },
                { value: 'CONTRACT_SENT', label: 'Đã gửi hợp đồng' },
                { value: 'COMPLETED', label: 'Hoàn thành' },
                { value: 'REJECTED', label: 'Đã từ chối' },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer',
                    statusFilter === f.value
                      ? 'bg-[#1C1615] text-white shadow-2xs font-semibold'
                      : 'bg-[#F7F4EF] text-stone-700 hover:bg-[#EBE5DB]'
                  )}
                >
                  {f.label}
                </button>
              ))
            ) : (
              // Status Filters for Contracts Tab
              [
                { value: 'ALL', label: 'Tất cả' },
                { value: 'ACTIVE', label: 'Đang thực hiện' },
                { value: 'PENDING', label: 'Chờ khách duyệt' },
                { value: 'COMPLETED', label: 'Đã hoàn tất' },
                { value: 'REJECTED', label: 'Khách từ chối' },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer',
                    statusFilter === f.value
                      ? 'bg-[#1C1615] text-white shadow-2xs font-semibold'
                      : 'bg-[#F7F4EF] text-stone-700 hover:bg-[#EBE5DB]'
                  )}
                >
                  {f.label}
                </button>
              ))
            )}
          </div>

          {/* Right: Search & Sort Dropdown */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, người đặt..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E0D8] bg-white text-[#1C1615] placeholder-stone-400 focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all shadow-2xs"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="h-9 px-3 text-xs rounded-xl border border-[#E5E0D8] bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 font-medium transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-stone-500" />
                <span>
                  {sortBy === 'newest' && 'Mới nhất'}
                  {sortBy === 'oldest' && 'Cũ nhất'}
                  {sortBy === 'title' && 'Tiêu đề A-Z'}
                </span>
                <ChevronDown className="h-3 w-3 text-stone-400" />
              </button>

              {sortDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-stone-200 bg-white p-1 shadow-lg text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {[
                    { key: 'newest', label: 'Mới nhất' },
                    { key: 'oldest', label: 'Cũ nhất' },
                    { key: 'title', label: 'Tiêu đề A-Z' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.key as any);
                        setSortDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-2.5 py-1.5 rounded-lg text-left transition-colors',
                        sortBy === opt.key
                          ? 'bg-rose-50 text-[#A31D24] font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── TAB 1: YÊU CẦU ĐẶT LÀM NỘI DUNG ───────────────────────────────── */}
        {activeTab === 'commissions' && (
          <div className="space-y-4">
            {isCommissionsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-xs text-stone-400">
                <RefreshCw className="h-6 w-6 animate-spin text-[#A31D24]" />
                <span>Đang tải danh sách yêu cầu đặt làm nội dung...</span>
              </div>
            ) : paginatedCommissions.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#EBE4D8] bg-[#FAF8F5]/60 p-8 space-y-2.5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-200/80 text-stone-500">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-[#1C1615] font-sans">
                  Không tìm thấy yêu cầu nào
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Hiện chưa có khán giả nào gửi yêu cầu đặt nội dung khớp với bộ lọc này.
                </p>
                {statusFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="mt-2 text-xs font-semibold text-[#A31D24] hover:underline"
                  >
                    Xem tất cả yêu cầu
                  </button>
                )}
              </div>
            ) : (
              <div ref={cardsContainerRef} className="space-y-3.5">
                {paginatedCommissions.map((comm) => (
                  <CommissionCard
                    key={comm.id}
                    commission={comm}
                    onAccept={(id) => acceptMutation.mutate(id)}
                    onReject={(c) => setSelectedCommissionForReject(c)}
                    onOpenChat={(c) => setActiveChatCommission(c)}
                    onOpenRoadmap={(c) => setSelectedCommissionForRoadmap(c)}
                    onViewContract={(contractId) => setSelectedContractId(contractId)}
                    isAccepting={acceptMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: LỘ TRÌNH MILESTONE & HỢP ĐỒNG ─────────────────────────── */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {isContractsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-xs text-stone-400">
                <RefreshCw className="h-6 w-6 animate-spin text-[#A31D24]" />
                <span>Đang tải danh sách hợp đồng lộ trình...</span>
              </div>
            ) : paginatedContracts.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-[#EBE4D8] bg-[#FAF8F5]/60 p-8 space-y-2.5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-200/80 text-stone-500">
                  <Layers className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-[#1C1615] font-sans">
                  Chưa có hợp đồng lộ trình nào
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Sau khi chấp nhận yêu cầu của khán giả trong phòng Chat, bạn có thể lập lộ trình Milestone để bắt đầu.
                </p>
                {statusFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="mt-2 text-xs font-semibold text-[#A31D24] hover:underline"
                  >
                    Xem tất cả hợp đồng
                  </button>
                )}
              </div>
            ) : (
              <div ref={cardsContainerRef} className="space-y-3.5">
                {paginatedContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onViewDetail={(id) => setSelectedContractId(id)}
                    onEditRoadmap={() => {
                      setSelectedContractId(contract.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── PAGINATION FOOTER ────────────────────────────────────────────── */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EBE4D8] text-xs text-stone-500">
            {/* Left: Summary text */}
            <div>
              Hiển thị{' '}
              <span className="font-semibold text-stone-800">
                {displayStart} – {displayEnd}
              </span>{' '}
              trên{' '}
              <span className="font-semibold text-stone-800">{totalItems}</span>{' '}
              {activeTab === 'commissions' ? 'yêu cầu' : 'hợp đồng'}
            </div>

            {/* Right: Controls & Page Size */}
            <div className="flex items-center gap-3">
              {/* Pagination Arrows & Numbers */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Trang trước"
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center',
                      currentPage === page
                        ? 'bg-[#A31D24] text-white shadow-xs'
                        : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Trang sau"
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Page size dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                  className="h-8 px-2.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 text-xs font-medium transition-colors"
                >
                  <span>{pageSize} / trang</span>
                  <ChevronDown className="h-3 w-3 text-stone-400" />
                </button>

                {pageSizeDropdownOpen && (
                  <div
                    className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-1 sm:mb-0 sm:mt-1 z-30 w-28 rounded-xl border border-stone-200 bg-white p-1 shadow-lg text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[10, 20, 50].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setPageSize(size);
                          setPageSizeDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full px-2.5 py-1.5 rounded-lg text-left transition-colors',
                          pageSize === size
                            ? 'bg-rose-50 text-[#A31D24] font-bold'
                            : 'text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        {size} / trang
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── MODALS & DRAWERS ──────────────────────────────────────────────── */}
      {/* 1. Modal Từ chối đơn đặt làm nội dung */}
      <CreatorRejectCommissionModal
        commission={selectedCommissionForReject}
        isOpen={Boolean(selectedCommissionForReject)}
        onClose={() => setSelectedCommissionForReject(null)}
        onSuccess={() => refetchCommissions()}
      />

      {/* 2. Modal Lập lộ trình Milestone (Tạo mới từ Commission) */}
      <CreatorMilestoneRoadmapModal
        commission={selectedCommissionForRoadmap}
        isOpen={Boolean(selectedCommissionForRoadmap)}
        onClose={() => setSelectedCommissionForRoadmap(null)}
        onSuccess={(contract) => {
          setSelectedCommissionForRoadmap(null);
          refetchCommissions();
          refetchContracts();
          if (contract.id) {
            setSelectedContractId(contract.id);
          }
        }}
      />

      {/* 3. Drawer Chi tiết Hợp đồng & Tiến độ từng Milestone */}
      <CreatorContractDetailDrawer
        contractId={selectedContractId}
        isOpen={Boolean(selectedContractId)}
        onClose={() => {
          setSelectedContractId(null);
          refetchContracts();
        }}
      />

      {/* 4. Modal Phòng Chat 1-1 (Kết nối Firestore & thông tin đối tác) */}
      {activeChatCommission && (
        <CreatorCommissionChatModal
          commissionId={activeChatCommission.id}
          topicTitle={activeChatCommission.title}
          isOpen={Boolean(activeChatCommission)}
          onClose={() => setActiveChatCommission(null)}
          onOpenRoadmap={() => {
            const comm = activeChatCommission;
            setActiveChatCommission(null);
            setSelectedCommissionForRoadmap(comm);
          }}
        />
      )}
    </div>
  );
};

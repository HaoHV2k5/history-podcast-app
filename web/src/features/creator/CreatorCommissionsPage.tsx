import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  FileText,
  Layers,
  MessageSquare,
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
import { CreatorCommissionDetailModal } from './components/CreatorCommissionDetailModal';
import { CreatorCustomerMessenger } from './components/CreatorCustomerMessenger';

export const CreatorCommissionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Active Tab: 'commissions' | 'contracts' | 'messages' (Facebook Messenger-style Customer Chat)
  const [activeTab, setActiveTab] = useState<'commissions' | 'contracts' | 'messages'>(
    'commissions'
  );
  const [selectedMessengerThreadKey, setSelectedMessengerThreadKey] = useState<string | null>(
    null
  );

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // Pagination state (Default 5 items per page so full list fits inside 1 viewport)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Selected entities for modals
  const [selectedCommissionForReject, setSelectedCommissionForReject] =
    useState<CommissionItem | null>(null);
  const [selectedCommissionForRoadmap, setSelectedCommissionForRoadmap] =
    useState<CommissionItem | null>(null);
  const [selectedCommissionForDetail, setSelectedCommissionForDetail] =
    useState<CommissionItem | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // 1. Fetch All Received Commissions (size: 500 so Creators with many orders see all of them in list & chat)
  const {
    data: commissionsData,
    isLoading: isCommissionsLoading,
    refetch: refetchCommissions,
  } = useQuery({
    queryKey: ['creator-commissions-received'],
    queryFn: () => commissionsApi.getMyReceivedRequests('ALL', { page: 0, size: 500 }),
  });

  // 2. Fetch All Creator Contracts (size: 500 so Creators with multiple concurrent contracts see all of them)
  const {
    data: contractsData,
    isLoading: isContractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['creator-contracts-me'],
    queryFn: () => contractsApi.getAllContracts('ALL', { page: 0, size: 500 }),
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

  const rawContracts: ContractItem[] = Array.isArray(contractsData?.data)
    ? contractsData.data
    : contractsData?.data && 'items' in contractsData.data && Array.isArray(contractsData.data.items)
      ? contractsData.data.items
      : [];

  // Determine the highest-priority thread key so switching to 'messages' selects it in the same render batch (zero double-render stutter)
  const preferredDefaultThreadKey = useMemo<string | null>(() => {
    const activeContract = rawContracts.find((c) => {
      const s = (c.status || '').toUpperCase();
      return s === 'ACTIVE' || s === 'IN_PROGRESS' || s === 'PENDING';
    });
    if (activeContract) return `contract-${activeContract.id}`;

    const activeComm = rawCommissions.find((cm) => {
      const s = (cm.status || '').toUpperCase();
      return s === 'ACCEPTED' || s === 'PENDING' || s === 'CONTRACT_SENT';
    });
    if (activeComm) {
      const linked = rawContracts.find(
        (c) => c.id === activeComm.contractId || c.commissionId === activeComm.id
      );
      return linked ? `contract-${linked.id}` : `commission-${activeComm.id}`;
    }

    if (rawContracts.length > 0) return `contract-${rawContracts[0].id}`;
    if (rawCommissions.length > 0) return `commission-${rawCommissions[0].id}`;
    return null;
  }, [rawContracts, rawCommissions]);

  // Distance-aware smooth GSAP scroll helper (eliminates integer-pixel crawl on short deltas and layout-shift stutters)
  const scrollToWorkspace = useCallback((fromModal = false) => {
    const delayMs = fromModal ? 110 : 16;
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const sectionEl = contentSectionRef.current;
        if (!sectionEl) return;

        const scrollContainer = sectionEl.closest('main') as HTMLElement | null;
        if (!scrollContainer) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        const containerRect = scrollContainer.getBoundingClientRect();
        const sectionRect = sectionEl.getBoundingClientRect();

        // Target aligns the workspace section header right at the top of <main> with 8px breathing room
        const topAlignedTarget =
          scrollContainer.scrollTop + (sectionRect.top - containerRect.top) - 8;
        const bottomAlignedTarget =
          scrollContainer.scrollTop + (sectionRect.bottom - containerRect.bottom) + 12;

        const maxScrollTop = Math.max(
          0,
          scrollContainer.scrollHeight - scrollContainer.clientHeight
        );
        const targetScrollTop = Math.min(
          maxScrollTop,
          Math.max(0, Math.max(topAlignedTarget, bottomAlignedTarget))
        );

        const distance = Math.abs(targetScrollTop - scrollContainer.scrollTop);
        // If already aligned within 8px, avoid micro-tweening integer scrollTop (which causes visual stutter)
        if (distance <= 8) {
          scrollContainer.scrollTop = targetScrollTop;
          return;
        }

        // Scale duration smoothly with distance: ~0.95s-1.1s for full scroll, shorter for small adjustments
        const duration = Math.min(1.05, Math.max(0.38, (distance / 280) * 0.95));

        gsap.killTweensOf(scrollContainer);
        gsap.to(scrollContainer, {
          scrollTop: targetScrollTop,
          duration,
          ease: 'sine.inOut',
          overwrite: true,
          autoKill: false,
        });
      });
    }, delayMs);
  }, []);

  const handleSelectTab = useCallback(
    (tab: 'commissions' | 'contracts' | 'messages') => {
      if (tab === 'messages' && !selectedMessengerThreadKey && preferredDefaultThreadKey) {
        setSelectedMessengerThreadKey(preferredDefaultThreadKey);
      }
      setActiveTab(tab);
      if (tab !== 'messages') {
        setStatusFilter('ALL');
      }
      scrollToWorkspace(false);
    },
    [scrollToWorkspace, selectedMessengerThreadKey, preferredDefaultThreadKey]
  );

  // Reset page when tab, filter, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, search]);

  // Open Messenger for a specific Commission
  const handleOpenCommissionChat = useCallback(
    (comm: CommissionItem, fromModal = false) => {
      const matchedContract = rawContracts.find(
        (c) => c.id === comm.contractId || c.commissionId === comm.id
      );
      if (matchedContract) {
        setSelectedMessengerThreadKey(`contract-${matchedContract.id}`);
      } else {
        setSelectedMessengerThreadKey(`commission-${comm.id}`);
      }
      setActiveTab('messages');
      scrollToWorkspace(fromModal);
    },
    [rawContracts, scrollToWorkspace]
  );

  // Open Messenger for a specific Contract
  const handleOpenContractChat = useCallback(
    (contract: ContractItem, fromModal = false) => {
      setSelectedMessengerThreadKey(`contract-${contract.id}`);
      setActiveTab('messages');
      scrollToWorkspace(fromModal);
    },
    [scrollToWorkspace]
  );

  const filteredCommissions = rawCommissions.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.requesterFullName && c.requesterFullName.toLowerCase().includes(q))
    );
  });

  const sortedCommissions = [...filteredCommissions].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredContracts = rawContracts.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.requesterFullName && c.requesterFullName.toLowerCase().includes(q))
    );
  });

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

  // Count unique customer conversations for Messenger badge
  const totalConversationCount =
    rawContracts.length +
    rawCommissions.filter(
      (cm) =>
        !cm.contractId && !rawContracts.some((c) => c.commissionId === cm.id)
    ).length;

  // ─── GSAP Entrance Motion ─────────────────────────────────────────────────
  useEffect(() => {
    if (isReducedMotion()) return;

    const cleanup = createSafeMotionContext(pageContainerRef, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (kpiSectionRef.current) {
        tl.fromTo(
          kpiSectionRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.3 }
        );
      }

      if (contentSectionRef.current) {
        tl.fromTo(
          contentSectionRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.3 },
          '-=0.15'
        );
      }
    });

    return cleanup;
  }, []);

  // ─── GSAP Stagger Animation for Cards List ────────────────────────────────
  useEffect(() => {
    if (isReducedMotion() || !cardsContainerRef.current || activeTab === 'messages') return;
    const children = cardsContainerRef.current.children;
    if (!children || children.length === 0) return;

    gsap.fromTo(
      children,
      { opacity: 0, y: 10, scale: 0.995 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.28,
        stagger: 0.035,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }
    );
  }, [
    activeTab,
    statusFilter,
    sortBy,
    currentPage,
    paginatedCommissions.length,
    paginatedContracts.length,
  ]);

  return (
    <div ref={pageContainerRef} className="space-y-4 sm:space-y-5 max-w-7xl mx-auto pb-4 font-sans">
      {/* 1. Compact Hero Masthead Banner */}
      <CreatorCommissionsHeroBanner />

      {/* 2. Compact Top 4 KPI Cards */}
      <div ref={kpiSectionRef}>
        <CommissionsKpiCards
          totalCommissions={rawCommissions.length}
          pendingCommissions={rawCommissions.filter((c) => c.status === 'PENDING').length}
          activeContracts={rawContracts.filter((c) => c.status === 'ACTIVE').length}
          activeMilestonesCount={financials?.activeMilestonesCount || 0}
          financials={financials}
        />
      </div>

      {/* 3. Main Workspace Container with Stable Viewport Height & Smooth Auto-Scroll */}
      <section
        ref={contentSectionRef}
        className="scroll-mt-2 min-h-[calc(100dvh-105px)] rounded-2xl border border-[#EBE4D8] bg-white p-4 sm:p-5 shadow-xs space-y-4"
      >
        {/* Navigation Tabs Header with Underline Active Indicator */}
        <div
          role="tablist"
          aria-label="Điều hướng đơn đặt hàng, hợp đồng và tin nhắn khách hàng"
          className="flex items-center gap-4 sm:gap-6 border-b border-[#EBE4D8] pb-0 -mx-1 px-1 overflow-x-auto"
        >
          {/* Tab 1: Yêu cầu đặt làm nội dung */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'commissions'}
            onClick={() => handleSelectTab('commissions')}
            className={cn(
              'relative pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]',
              activeTab === 'commissions'
                ? 'text-[#1C1615] font-bold'
                : 'text-stone-500 hover:text-stone-800'
            )}
          >
            <FileText
              className={cn(
                'h-4 w-4 transition-colors shrink-0',
                activeTab === 'commissions' ? 'text-[#8B2635]' : 'text-stone-400'
              )}
            />
            <span>Yêu cầu đặt làm nội dung</span>
            {rawCommissions.filter((c) => c.status === 'PENDING').length > 0 ? (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#8B2635] text-white">
                {rawCommissions.filter((c) => c.status === 'PENDING').length}
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-mono">({rawCommissions.length})</span>
            )}

            {activeTab === 'commissions' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#8B2635] rounded-full" />
            )}
          </button>

          {/* Tab 2: Lộ trình Milestone & Hợp đồng */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'contracts'}
            onClick={() => handleSelectTab('contracts')}
            className={cn(
              'relative pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]',
              activeTab === 'contracts'
                ? 'text-[#1C1615] font-bold'
                : 'text-stone-500 hover:text-stone-800'
            )}
          >
            <Layers
              className={cn(
                'h-4 w-4 transition-colors shrink-0',
                activeTab === 'contracts' ? 'text-[#8B2635]' : 'text-stone-400'
              )}
            />
            <span>Lộ trình Milestone &amp; Hợp đồng</span>
            <span className="text-xs text-stone-400 font-mono">({rawContracts.length})</span>

            {activeTab === 'contracts' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#8B2635] rounded-full" />
            )}
          </button>

          {/* Tab 3: Tin nhắn khách hàng (Facebook Messenger-style Workspace) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'messages'}
            onClick={() => handleSelectTab('messages')}
            className={cn(
              'relative pb-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]',
              activeTab === 'messages'
                ? 'text-[#1C1615] font-bold'
                : 'text-stone-500 hover:text-stone-800'
            )}
          >
            <MessageSquare
              className={cn(
                'h-4 w-4 transition-colors shrink-0',
                activeTab === 'messages' ? 'text-[#8B2635]' : 'text-stone-400'
              )}
            />
            <span>Tin nhắn khách hàng</span>
            <span className="text-xs text-stone-400 font-mono">
              ({totalConversationCount})
            </span>

            {activeTab === 'messages' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#8B2635] rounded-full" />
            )}
          </button>
        </div>

        {/* Filter & Search Toolbar (Only shown on Commissions & Contracts tabs) */}
        {activeTab !== 'messages' && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-500 text-xs font-medium mr-1 select-none">
                Trạng thái:
              </span>

              {activeTab === 'commissions' ? (
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
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer',
                      statusFilter === f.value
                        ? 'bg-[#1C1615] text-white shadow-2xs font-semibold'
                        : 'bg-[#F7F4EF] text-stone-700 hover:bg-[#EBE5DB]'
                    )}
                  >
                    {f.label}
                  </button>
                ))
              ) : (
                [
                  { value: 'ALL', label: 'Tất cả' },
                  { value: 'ACTIVE', label: 'Đang thực hiện' },
                  { value: 'PENDING', label: 'Chờ khách duyệt' },
                  { value: 'COMPLETED', label: 'Đã hoàn tất' },
                  { value: 'REJECTED', label: 'Khách từ chối' },
                  { value: 'CANCELLED', label: 'Đã hủy' },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer',
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
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tiêu đề, người đặt..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-[#E5E0D8] bg-white text-[#1C1615] placeholder-stone-400 focus:border-[#8B2635] focus:ring-1 focus:ring-[#8B2635] outline-hidden transition-all shadow-2xs"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="h-8 px-3 text-xs rounded-xl border border-[#E5E0D8] bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 font-medium transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
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
                          setSortBy(opt.key as 'newest' | 'oldest' | 'title');
                          setSortDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full px-2.5 py-1.5 rounded-lg text-left transition-colors',
                          sortBy === opt.key
                            ? 'bg-[#FBF2EE] text-[#8B2635] font-bold'
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
        )}

        {/* ─── TAB 1: YÊU CẦU ĐẶT LÀM NỘI DUNG ───────────────────────────────── */}
        {activeTab === 'commissions' && (
          <div className="space-y-3">
            {isCommissionsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                <RefreshCw className="h-6 w-6 animate-spin text-[#8B2635]" />
                <span>Đang tải danh sách yêu cầu đặt làm nội dung...</span>
              </div>
            ) : paginatedCommissions.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-[#EBE4D8] bg-[#FAF8F5]/60 p-6 space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-200/80 text-stone-500">
                  <FileCheck className="h-5 w-5" />
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
                    className="mt-1 text-xs font-semibold text-[#8B2635] hover:underline cursor-pointer"
                  >
                    Xem tất cả yêu cầu
                  </button>
                )}
              </div>
            ) : (
              <div ref={cardsContainerRef} className="space-y-2.5">
                {paginatedCommissions.map((comm) => (
                  <CommissionCard
                    key={comm.id}
                    commission={comm}
                    onAccept={(id) => acceptMutation.mutate(id)}
                    onReject={(c) => setSelectedCommissionForReject(c)}
                    onOpenChat={(c) => handleOpenCommissionChat(c)}
                    onOpenRoadmap={(c) => setSelectedCommissionForRoadmap(c)}
                    onViewContract={(contractId) => setSelectedContractId(contractId)}
                    onViewDetail={(c) => setSelectedCommissionForDetail(c)}
                    isAccepting={acceptMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: LỘ TRÌNH MILESTONE & HỢP ĐỒNG ─────────────────────────── */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            {isContractsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                <RefreshCw className="h-6 w-6 animate-spin text-[#8B2635]" />
                <span>Đang tải danh sách hợp đồng lộ trình...</span>
              </div>
            ) : paginatedContracts.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-[#EBE4D8] bg-[#FAF8F5]/60 p-6 space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-stone-200/80 text-stone-500">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-[#1C1615] font-sans">
                  Chưa có hợp đồng lộ trình nào
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Sau khi chấp nhận yêu cầu của khán giả và thống nhất qua tin nhắn, bạn có thể lập lộ trình Milestone để bắt đầu.
                </p>
                {statusFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="mt-1 text-xs font-semibold text-[#8B2635] hover:underline cursor-pointer"
                  >
                    Xem tất cả hợp đồng
                  </button>
                )}
              </div>
            ) : (
              <div ref={cardsContainerRef} className="space-y-2.5">
                {paginatedContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onViewDetail={(id) => setSelectedContractId(id)}
                    onOpenChat={(c) => handleOpenContractChat(c)}
                    onEditRoadmap={() => {
                      setSelectedContractId(contract.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: TIN NHẮN KHÁCH HÀNG (FACEBOOK MESSENGER WORKSPACE) ────── */}
        {activeTab === 'messages' && (
          <CreatorCustomerMessenger
            commissions={rawCommissions}
            contracts={rawContracts}
            selectedThreadKey={selectedMessengerThreadKey}
            onSelectThreadKey={(key) => setSelectedMessengerThreadKey(key)}
            onViewContract={(contractId) => setSelectedContractId(contractId)}
            onOpenRoadmap={(comm) => setSelectedCommissionForRoadmap(comm)}
            onViewCommissionDetail={(comm) => setSelectedCommissionForDetail(comm)}
          />
        )}

        {/* ─── PAGINATION FOOTER (Commissions & Contracts Tabs) ─────────────── */}
        {activeTab !== 'messages' && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EBE4D8] text-xs text-stone-500">
            <div>
              Hiển thị{' '}
              <span className="font-semibold text-stone-800">
                {displayStart} – {displayEnd}
              </span>{' '}
              trên{' '}
              <span className="font-semibold text-stone-800">{totalItems}</span>{' '}
              {activeTab === 'commissions' ? 'yêu cầu' : 'hợp đồng'}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    scrollToWorkspace();
                  }}
                  disabled={currentPage <= 1}
                  aria-label="Trang trước"
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      setCurrentPage(page);
                      scrollToWorkspace();
                    }}
                    className={cn(
                      'h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer',
                      currentPage === page
                        ? 'bg-[#8B2635] text-white shadow-xs'
                        : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    scrollToWorkspace();
                  }}
                  disabled={currentPage >= totalPages}
                  aria-label="Trang sau"
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                  className="h-8 px-2.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <span>{pageSize} / trang</span>
                  <ChevronDown className="h-3 w-3 text-stone-400" />
                </button>

                {pageSizeDropdownOpen && (
                  <div
                    className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-1 sm:mb-0 sm:mt-1 z-30 w-28 rounded-xl border border-stone-200 bg-white p-1 shadow-lg text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[5, 10, 20].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setPageSize(size);
                          setPageSizeDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer',
                          pageSize === size
                            ? 'bg-[#FBF2EE] text-[#8B2635] font-bold'
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

      {/* 3. Popup Chi tiết Hợp đồng & Tiến độ từng Milestone */}
      <CreatorContractDetailDrawer
        contractId={selectedContractId}
        isOpen={Boolean(selectedContractId)}
        onClose={() => {
          setSelectedContractId(null);
        }}
        onMilestoneActionSuccess={() => {
          refetchContracts();
        }}
        onOpenCustomerChat={(contract) => {
          handleOpenContractChat(contract, true);
        }}
      />

      {/* 4. Modal Chi tiết Yêu cầu đặt làm nội dung */}
      <CreatorCommissionDetailModal
        commission={selectedCommissionForDetail}
        isOpen={Boolean(selectedCommissionForDetail)}
        onClose={() => setSelectedCommissionForDetail(null)}
        onOpenChat={(comm) => {
          setSelectedCommissionForDetail(null);
          handleOpenCommissionChat(comm, true);
        }}
        onOpenRoadmap={(comm) => {
          setSelectedCommissionForDetail(null);
          setSelectedCommissionForRoadmap(comm);
        }}
        onViewContract={(contractId) => {
          setSelectedCommissionForDetail(null);
          setSelectedContractId(contractId);
        }}
        onAccept={(id) => {
          setSelectedCommissionForDetail(null);
          acceptMutation.mutate(id);
        }}
        onReject={(comm) => {
          setSelectedCommissionForDetail(null);
          setSelectedCommissionForReject(comm);
        }}
      />
    </div>
  );
};

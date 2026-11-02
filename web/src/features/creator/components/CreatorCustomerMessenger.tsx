import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MessageSquare,
  FileText,
  Layers,
  Send,
  ImagePlus,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  User,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { chatsApi, ChatConversationItem } from '@/services/api/chats';
import { CommissionItem } from '@/types/commission';
import { ContractItem } from '@/types/contract';
import { formatVND, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useFirestoreChat } from '../hooks/useFirestoreChat';

export interface CustomerChatThread {
  key: string;
  contractId?: number;
  commissionId?: number;
  contract?: ContractItem;
  commission?: CommissionItem;
  customerName: string;
  customerEmail: string;
  customerAvatarUrl?: string | null;
  title: string;
  totalAmount: number;
  milestoneCount: number;
  statusCode: string;
  statusLabel: string;
  statusTone: 'active' | 'pending' | 'completed' | 'cancelled';
  updatedAt: string;
}

interface CreatorCustomerMessengerProps {
  commissions: CommissionItem[];
  contracts: ContractItem[];
  selectedThreadKey: string | null;
  onSelectThreadKey: (key: string) => void;
  onViewContract: (contractId: number) => void;
  onOpenRoadmap: (commission: CommissionItem) => void;
  onViewCommissionDetail?: (commission: CommissionItem) => void;
}

const THREAD_PAGE_STEP = 15;

function getContractVietnameseStatus(status?: string): {
  label: string;
  tone: 'active' | 'pending' | 'completed' | 'cancelled';
} {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return { label: 'Đang thực hiện', tone: 'active' };
    case 'PENDING':
      return { label: 'Chờ khách duyệt lộ trình', tone: 'pending' };
    case 'COMPLETED':
      return { label: 'Đã hoàn tất', tone: 'completed' };
    case 'REJECTED':
      return { label: 'Khách yêu cầu sửa lộ trình', tone: 'pending' };
    case 'CANCELLED':
      return { label: 'Đã hủy', tone: 'cancelled' };
    default:
      return { label: status || 'Đang xử lý', tone: 'pending' };
  }
}

function getCommissionVietnameseStatus(status?: string): {
  label: string;
  tone: 'active' | 'pending' | 'completed' | 'cancelled';
} {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return { label: 'Mới gửi yêu cầu', tone: 'pending' };
    case 'ACCEPTED':
      return { label: 'Đang thương lượng', tone: 'active' };
    case 'CONTRACT_SENT':
      return { label: 'Đã gửi lộ trình', tone: 'active' };
    case 'COMPLETED':
      return { label: 'Đã hoàn tất', tone: 'completed' };
    case 'REJECTED':
      return { label: 'Đã từ chối', tone: 'cancelled' };
    case 'CANCELLED':
      return { label: 'Đã hủy', tone: 'cancelled' };
    default:
      return { label: status || 'Đang trao đổi', tone: 'pending' };
  }
}

export const CreatorCustomerMessenger: React.FC<CreatorCustomerMessengerProps> = ({
  commissions,
  contracts,
  selectedThreadKey,
  onSelectThreadKey,
  onViewContract,
  onOpenRoadmap,
  onViewCommissionDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'ALL' | 'BY_CUSTOMER' | 'ACTIVE_ONLY' | 'CONTRACTS' | 'CLOSED'
  >('ALL');
  const [visibleThreadCount, setVisibleThreadCount] = useState<number>(THREAD_PAGE_STEP);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showCustomerContractsDropdown, setShowCustomerContractsDropdown] = useState(false);

  const [chatInputText, setChatInputText] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const sidebarListRef = useRef<HTMLDivElement | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Track scroll restoration when loading older messages on scroll-up
  const pendingPrependScrollRef = useRef<{
    prevScrollHeight: number;
    prevScrollTop: number;
  } | null>(null);
  const prevThreadKeyRef = useRef<string | null>(null);
  const prevTotalMessagesCountRef = useRef<number>(0);

  // Reset sidebar pagination when search or filter changes
  useEffect(() => {
    setVisibleThreadCount(THREAD_PAGE_STEP);
  }, [searchQuery, filterMode]);

  // Build unified list of Customer Contract & Commission threads
  const threads = useMemo<CustomerChatThread[]>(() => {
    const map = new Map<string, CustomerChatThread>();
    const linkedCommissionIds = new Set<number>();

    // 1. Add all Contracts first (linking matching Commission if present)
    contracts.forEach((c) => {
      const matchedCommission = commissions.find(
        (cm) => cm.id === c.commissionId || cm.contractId === c.id
      );
      if (matchedCommission) {
        linkedCommissionIds.add(matchedCommission.id);
      }
      const st = getContractVietnameseStatus(c.status);
      const key = `contract-${c.id}`;
      map.set(key, {
        key,
        contractId: c.id,
        commissionId: c.commissionId || matchedCommission?.id,
        contract: c,
        commission: matchedCommission,
        customerName:
          c.requesterFullName ||
          matchedCommission?.requesterFullName ||
          c.freelancerFullName ||
          'Khách hàng',
        customerEmail: c.requesterEmail || matchedCommission?.requesterEmail || '',
        customerAvatarUrl: matchedCommission?.requesterAvatarUrl || null,
        title: c.title || matchedCommission?.title || `Hợp đồng #${c.id}`,
        totalAmount: c.totalAmount || 0,
        milestoneCount: c.milestones?.length || 0,
        statusCode: c.status,
        statusLabel: st.label,
        statusTone: st.tone,
        updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
      });
    });

    // 2. Add remaining standalone Commissions that don't have a Contract yet
    // Rule #3: Lock 1-1 Chat before Creator accepts the commission (exclude standalone PENDING / REJECTED)
    commissions.forEach((cm) => {
      if (linkedCommissionIds.has(cm.id)) return;
      if (cm.contractId && contracts.some((c) => c.id === cm.contractId)) return;
      const cmStatus = (cm.status || '').toUpperCase();
      if (cmStatus === 'PENDING' || cmStatus === 'REJECTED') return;

      const st = getCommissionVietnameseStatus(cm.status);
      const key = `commission-${cm.id}`;
      map.set(key, {
        key,
        contractId: cm.contractId || undefined,
        commissionId: cm.id,
        commission: cm,
        customerName: cm.requesterFullName || 'Khách hàng',
        customerEmail: cm.requesterEmail || '',
        customerAvatarUrl: cm.requesterAvatarUrl || null,
        title: cm.title || `Yêu cầu đặt nội dung #${cm.id}`,
        totalAmount: 0,
        milestoneCount: 0,
        statusCode: cm.status,
        statusLabel: st.label,
        statusTone: st.tone,
        updatedAt: cm.updatedAt || cm.createdAt || new Date().toISOString(),
      });
    });

    const getToneWeight = (tone: CustomerChatThread['statusTone']) => {
      switch (tone) {
        case 'active':
          return 3;
        case 'pending':
          return 2;
        case 'completed':
          return 1;
        case 'cancelled':
          return 0;
      }
    };

    return Array.from(map.values()).sort((a, b) => {
      const weightDiff = getToneWeight(b.statusTone) - getToneWeight(a.statusTone);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [commissions, contracts]);

  // Group threads by customer identity (email or normalized name) so Creators can see when 1 customer has multiple contracts
  const getCustomerIdentityKey = (t: CustomerChatThread) =>
    (t.customerEmail || t.customerName || 'khach-hang').trim().toLowerCase();

  const customerThreadsMap = useMemo(() => {
    const grouped = new Map<string, CustomerChatThread[]>();
    threads.forEach((t) => {
      const idKey = getCustomerIdentityKey(t);
      const list = grouped.get(idKey) || [];
      list.push(t);
      grouped.set(idKey, list);
    });
    return grouped;
  }, [threads]);

  const activeThreadsCount = useMemo(
    () => threads.filter((t) => t.statusTone === 'active' || t.statusTone === 'pending').length,
    [threads]
  );

  // Filter threads by search query & filter mode
  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const seenCustomers = new Set<string>();

    return threads.filter((t) => {
      if (
        filterMode === 'ACTIVE_ONLY' &&
        t.statusTone !== 'active' &&
        t.statusTone !== 'pending'
      ) {
        return false;
      }
      if (filterMode === 'CONTRACTS' && !t.contractId) return false;
      if (
        filterMode === 'CLOSED' &&
        t.statusTone !== 'completed' &&
        t.statusTone !== 'cancelled'
      ) {
        return false;
      }

      if (q) {
        const matchName = t.customerName.toLowerCase().includes(q);
        const matchEmail = t.customerEmail.toLowerCase().includes(q);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchContractId = t.contractId
          ? `#${t.contractId}`.includes(q) || String(t.contractId).includes(q)
          : false;
        const matchCommissionId = t.commissionId
          ? `#${t.commissionId}`.includes(q) || String(t.commissionId).includes(q)
          : false;

        if (!matchName && !matchEmail && !matchTitle && !matchContractId && !matchCommissionId) {
          return false;
        }
      }

      if (filterMode === 'BY_CUSTOMER') {
        const customerKey = getCustomerIdentityKey(t);
        if (seenCustomers.has(customerKey)) {
          return false;
        }
        seenCustomers.add(customerKey);
      }

      return true;
    });
  }, [threads, searchQuery, filterMode]);

  const visibleThreads = useMemo(
    () => filteredThreads.slice(0, visibleThreadCount),
    [filteredThreads, visibleThreadCount]
  );
  const hasMoreThreads = filteredThreads.length > visibleThreadCount;

  // Ensure selectedThreadKey is visible in the left sidebar and scrolled into view when jumped to
  useEffect(() => {
    if (!selectedThreadKey) return;
    setShowCustomerContractsDropdown(false);

    const idx = filteredThreads.findIndex((t) => t.key === selectedThreadKey);
    if (idx >= visibleThreadCount) {
      setVisibleThreadCount(idx + THREAD_PAGE_STEP);
    }

    const timer = window.setTimeout(() => {
      const container = sidebarListRef.current;
      if (!container) return;
      const el = container.querySelector<HTMLElement>(
        `[data-thread-key="${selectedThreadKey}"]`
      );
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 60);

    return () => window.clearTimeout(timer);
  }, [selectedThreadKey, filteredThreads, visibleThreadCount]);

  // Auto-select first thread if none selected or if selected thread does not exist
  useEffect(() => {
    if (threads.length === 0) return;
    const exists = selectedThreadKey && threads.some((t) => t.key === selectedThreadKey);
    if (!exists) {
      onSelectThreadKey(threads[0].key);
    }
  }, [threads, selectedThreadKey, onSelectThreadKey]);

  const activeThread = useMemo(
    () => threads.find((t) => t.key === selectedThreadKey) || filteredThreads[0] || null,
    [threads, filteredThreads, selectedThreadKey]
  );

  // Other contracts/commissions belonging to the same customer as activeThread
  const relatedCustomerThreads = useMemo(() => {
    if (!activeThread) return [];
    const idKey = getCustomerIdentityKey(activeThread);
    return customerThreadsMap.get(idKey) || [activeThread];
  }, [activeThread, customerThreadsMap]);

  // Resolve conversationId from backend API
  const { data: chatRes } = useQuery({
    queryKey: [
      'messenger-conversation',
      activeThread?.contractId || null,
      activeThread?.commissionId || null,
    ],
    queryFn: () =>
      chatsApi.getOrCreateConversation({
        contractId: activeThread?.contractId,
        hireRequestId: activeThread?.commissionId,
      }),
    enabled: Boolean(activeThread),
  });

  const conversation: ChatConversationItem | null = chatRes?.data || null;

  const fallbackConvId = activeThread?.commissionId
    ? `hire_request_${activeThread.commissionId}`
    : activeThread?.contractId
    ? `contract_${activeThread.contractId}`
    : null;

  const {
    messages: allMessages,
    visibleMessages,
    hasMoreOlder,
    olderHiddenCount,
    isLoadingOlder,
    loadOlderMessages,
    isLoadingMessages,
    isSending: isSendingChat,
    isUploadingImage,
    chatError,
    setChatError,
    sendMessage: sendFirestoreChat,
    isOwnMessage,
  } = useFirestoreChat({
    conversationId: conversation?.conversationId,
    fallbackConversationId: fallbackConvId,
    enabled: Boolean(activeThread),
    initialPageSize: 15,
    pageStep: 15,
  });

  // Preserve scroll position when prepending older messages; scroll to bottom via RAF on new message or thread change
  useLayoutEffect(() => {
    const container = scrollViewportRef.current;
    if (!container) return;

    if (pendingPrependScrollRef.current) {
      const { prevScrollHeight, prevScrollTop } = pendingPrependScrollRef.current;
      const heightDiff = container.scrollHeight - prevScrollHeight;
      container.scrollTop = prevScrollTop + Math.max(0, heightDiff);
      pendingPrependScrollRef.current = null;
      return;
    }

    const threadChanged = prevThreadKeyRef.current !== (activeThread?.key || null);
    const newMsgArrived = allMessages.length > prevTotalMessagesCountRef.current;

    if (threadChanged || newMsgArrived) {
      window.requestAnimationFrame(() => {
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
      });
    }

    prevThreadKeyRef.current = activeThread?.key || null;
    prevTotalMessagesCountRef.current = allMessages.length;
  }, [visibleMessages.length, allMessages.length, activeThread?.key]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleTriggerLoadOlder = () => {
    const container = scrollViewportRef.current;
    if (!container || !hasMoreOlder || isLoadingOlder) return;
    pendingPrependScrollRef.current = {
      prevScrollHeight: container.scrollHeight,
      prevScrollTop: container.scrollTop,
    };
    loadOlderMessages();
  };

  const handleViewportScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 28 && hasMoreOlder && !isLoadingOlder) {
      handleTriggerLoadOlder();
    }
  };

  const handleThreadListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      hasMoreThreads &&
      target.scrollHeight - target.scrollTop - target.clientHeight <= 36
    ) {
      setVisibleThreadCount((prev) => prev + THREAD_PAGE_STEP);
    }
  };

  const handleSelectChatImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setChatError('Vui lòng chỉ chọn tệp hình ảnh (.jpg, .png, .webp)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setChatError('Kích thước ảnh đính kèm tối đa là 10MB');
      return;
    }

    setChatError(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleClearChatImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInputText.trim() && !selectedImageFile) || isSendingChat) return;

    const ok = await sendFirestoreChat(chatInputText, selectedImageFile);
    if (ok) {
      setChatInputText('');
      handleClearChatImage();
    }
  };

  const getToneBadgeClasses = (tone: CustomerChatThread['statusTone']) => {
    switch (tone) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'completed':
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
      case 'cancelled':
        return 'bg-stone-100 text-stone-600 border-stone-200/80';
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-[#E6DFD3] bg-white shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100dvh-185px)] min-h-[500px] max-h-[680px] font-sans">
        {/* ─── LEFT PANE: CUSTOMER & CONTRACT CONVERSATION LIST (MESSENGER SIDEBAR) ─── */}
        <div
          className={cn(
            'w-full md:w-[295px] lg:w-[330px] xl:w-[360px] shrink-0 border-b md:border-b-0 md:border-r border-[#E6DFD3] flex flex-col bg-[#FAF9F6]/80 h-full self-stretch',
            mobileShowChat ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Sidebar Header + Search */}
          <div className="p-3 sm:p-3.5 border-b border-[#E6DFD3] bg-white space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-[#F9ECEC] border border-[#E8C5C5] flex items-center justify-center text-[#9B2C2C] shrink-0">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#262522] leading-tight truncate">
                    Tin nhắn khách hàng
                  </h3>
                  <p className="text-[10px] text-[#696660] truncate">
                    Ưu tiên hợp đồng đang chạy lên đầu
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F4] text-[#4A4640] border border-[#E6DFD3] shrink-0">
                {threads.length} hội thoại
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, email, mã HĐ..."
                className="w-full h-8 pl-8 pr-7 text-xs rounded-xl border border-[#E6DFD3] bg-[#FAF8F4] text-[#262522] placeholder-stone-400 focus:bg-white focus:border-[#9B2C2C] focus:ring-1 focus:ring-[#9B2C2C] outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills (Single-line compact strip, zero horizontal scroll) */}
            <div className="flex items-center justify-between gap-1">
              {(
                [
                  { id: 'ALL', label: 'Tất cả', count: threads.length },
                  { id: 'BY_CUSTOMER', label: 'Theo khách', count: customerThreadsMap.size },
                  { id: 'ACTIVE_ONLY', label: 'Đang chạy', count: activeThreadsCount },
                  { id: 'CLOSED', label: 'Kết thúc' },
                ] as const
              ).map((tab) => {
                const isActive = filterMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id)}
                    className={cn(
                      'flex-1 px-1.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap',
                      isActive
                        ? 'bg-[#262522] text-white shadow-2xs'
                        : 'bg-[#F5F2EB] text-[#5C5852] hover:bg-[#EBE5DA]'
                    )}
                  >
                    <span>{tab.label}</span>
                    {'count' in tab && tab.count > 0 && (
                      <span
                        className={cn(
                          'px-1 py-0.2 rounded text-[9px] font-mono',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/80 text-[#696660]'
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation Thread List (With Lazy Scroll Pagination) */}
          <div
            ref={sidebarListRef}
            onScroll={handleThreadListScroll}
            className="flex-1 overflow-y-auto divide-y divide-[#EFEAE0]"
          >
            {filteredThreads.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="h-9 w-9 rounded-full bg-stone-100 border border-stone-200/80 flex items-center justify-center mx-auto text-stone-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-stone-700">
                  Không tìm thấy cuộc trò chuyện phù hợp
                </p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Thử tìm theo tên khách hàng, email hoặc chuyển bộ lọc trạng thái.
                </p>
              </div>
            ) : (
              <>
                {visibleThreads.map((thread) => {
                  const isSelected =
                    activeThread?.key === thread.key ||
                    (filterMode === 'BY_CUSTOMER' &&
                      activeThread &&
                      getCustomerIdentityKey(activeThread) === getCustomerIdentityKey(thread));
                  const customerTotalThreads =
                    customerThreadsMap.get(getCustomerIdentityKey(thread))?.length || 1;
                  return (
                    <button
                      key={thread.key}
                      data-thread-key={thread.key}
                      type="button"
                      onClick={() => {
                        onSelectThreadKey(thread.key);
                        setMobileShowChat(true);
                      }}
                      className={cn(
                        'w-full p-3 text-left transition-all flex items-start gap-2.5 cursor-pointer hover:bg-[#FAF8F4]',
                        isSelected
                          ? 'bg-[#FDF4F4] hover:bg-[#FBECEC] border-l-[3px] border-l-[#9B2C2C]'
                          : 'bg-white'
                      )}
                    >
                      {/* Customer Avatar */}
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={cn(
                            'h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border shadow-2xs overflow-hidden',
                            isSelected
                              ? 'bg-[#9B2C2C] text-white border-[#9B2C2C]'
                              : 'bg-[#F5F2EB] text-[#4A4640] border-[#E2D9CA]'
                          )}
                        >
                          {thread.customerAvatarUrl ? (
                            <img
                              src={thread.customerAvatarUrl}
                              alt={thread.customerName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (thread.customerName || 'K')[0].toUpperCase()
                          )}
                        </div>
                      </div>

                      {/* Thread Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-[#262522] truncate">
                              {thread.customerName}
                            </span>
                            {customerTotalThreads > 1 && (
                              <span
                                className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#F5F2EB] text-[#696660] border border-[#E2D9CA] shrink-0 whitespace-nowrap"
                                title={`Khách hàng này có ${customerTotalThreads} hợp đồng / đơn đặt hàng với bạn`}
                              >
                                {customerTotalThreads} HĐ/đơn
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {formatDate(thread.updatedAt)}
                          </span>
                        </div>

                        {/* Contract / Commission Badge + Title + Status Pill (Clean 2-line Messenger Row) */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border whitespace-nowrap',
                                thread.contractId
                                  ? 'bg-[#F9ECEC] text-[#9B2C2C] border-[#E8C5C5]'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              )}
                            >
                              {thread.contractId
                                ? `HĐ #${thread.contractId}`
                                : `Đơn #${thread.commissionId}`}
                            </span>
                            <span className="text-xs font-medium text-[#4A4640] truncate">
                              {thread.title}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0',
                              getToneBadgeClasses(thread.statusTone)
                            )}
                          >
                            {thread.statusLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {hasMoreThreads && (
                  <div className="p-2.5 text-center bg-stone-50/60">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleThreadCount((prev) => prev + THREAD_PAGE_STEP)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A31D24] hover:underline cursor-pointer"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>
                        Xem thêm {filteredThreads.length - visibleThreadCount} cuộc hội thoại
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANE: ACTIVE CUSTOMER CONVERSATION VIEWPORT ─── */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 bg-stone-50/30 h-full self-stretch',
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          )}
        >
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2.5">
              <div className="h-11 w-11 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-stone-800">
                  Chọn một khách hàng để bắt đầu trò chuyện
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Mọi trao đổi kịch bản, hình ảnh minh họa và thông báo lộ trình Milestone đều được đồng bộ qua Firebase Cloud.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Conversation Header */}
              <div className="px-4 py-2.5 border-b border-stone-200/80 bg-white flex items-center justify-between gap-2.5 flex-wrap shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden h-8 w-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer shrink-0"
                    aria-label="Quay lại danh sách hội thoại"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="h-9 w-9 rounded-full bg-[#FFF0F0] border border-[#FECDD3] flex items-center justify-center shrink-0 text-[#A31D24] font-bold text-xs shadow-2xs overflow-hidden">
                    {activeThread.customerAvatarUrl || conversation?.partnerAvatarUrl ? (
                      <img
                        src={
                          (activeThread.customerAvatarUrl ||
                            conversation?.partnerAvatarUrl) as string
                        }
                        alt={activeThread.customerName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (activeThread.customerName || 'K')[0].toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-[#262522] truncate">
                        {activeThread.customerName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#696660] truncate">
                      {activeThread.customerEmail && (
                        <>
                          <span className="truncate">{activeThread.customerEmail}</span>
                          <span>•</span>
                        </>
                      )}
                      <span className="font-medium text-[#4A4640] truncate">
                        {activeThread.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Contract / Commission Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeThread.contractId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewContract(activeThread.contractId!)}
                      className="h-8 px-3 text-xs rounded-xl border-stone-200 bg-white text-stone-800 hover:border-[#A31D24] hover:text-[#A31D24] flex items-center gap-1.5 font-semibold cursor-pointer shadow-2xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#A31D24]" />
                      <span>Chi tiết Hợp đồng #{activeThread.contractId}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Button>
                  ) : activeThread.commission ? (
                    <>
                      {onViewCommissionDetail && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewCommissionDetail(activeThread.commission!)}
                          className="h-8 px-2.5 text-xs rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 font-medium cursor-pointer"
                        >
                          <User className="h-3.5 w-3.5 text-stone-500" />
                          <span>Xem yêu cầu</span>
                        </Button>
                      )}
                      {activeThread.commission.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          onClick={() => onOpenRoadmap(activeThread.commission!)}
                          className="h-8 px-3 text-xs rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] flex items-center gap-1.5 font-semibold cursor-pointer shadow-2xs"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>Lập lộ trình Milestone</span>
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* 2. Pinned Contract / Commission Summary Bar (+ Multi-Contract Switcher if customer has >1 contracts) */}
              <div className="px-4 py-2 bg-[#FAF8F4] border-b border-[#E6DFD3] space-y-1.5 text-xs shrink-0">
                <div className="flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 whitespace-nowrap',
                        activeThread.contractId
                          ? 'bg-[#F9ECEC] text-[#9B2C2C] border-[#E8C5C5]'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      )}
                    >
                      {activeThread.contractId
                        ? `Hợp đồng #${activeThread.contractId}`
                        : `Đơn đặt làm #${activeThread.commissionId}`}
                    </span>
                    <span className="font-semibold text-[#262522] truncate text-xs">
                      {activeThread.title}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 whitespace-nowrap',
                        getToneBadgeClasses(activeThread.statusTone)
                      )}
                    >
                      {activeThread.statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] text-[#5C5852] shrink-0">
                    <span>
                      Giá trị:{' '}
                      <strong className="text-[#262522] font-bold font-mono tabular-nums">
                        {activeThread.totalAmount > 0
                          ? formatVND(activeThread.totalAmount)
                          : 'Đang thương lượng báo giá'}
                      </strong>
                    </span>
                    {activeThread.milestoneCount > 0 && (
                      <span>
                        • <strong>{activeThread.milestoneCount}</strong> mốc bàn giao
                      </span>
                    )}
                    <span className="hidden lg:inline-flex items-center gap-1 text-[#166534] font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#166534]" />
                      Bảo vệ bởi Escrow
                    </span>
                  </div>
                </div>

                {relatedCustomerThreads.length > 1 && (
                  <div className="relative flex items-center justify-between gap-2 pt-1 border-t border-[#EAE3D5]">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <span className="text-[10px] font-semibold text-[#696660] shrink-0 whitespace-nowrap">
                        Cùng khách hàng ({relatedCustomerThreads.length}):
                      </span>
                      {(relatedCustomerThreads.length <= 3
                        ? relatedCustomerThreads
                        : [
                            activeThread,
                            ...relatedCustomerThreads
                              .filter((r) => r.key !== activeThread.key)
                              .slice(0, 1),
                          ]
                      ).map((rel) => {
                        const isCurrent = rel.key === activeThread.key;
                        return (
                          <button
                            key={rel.key}
                            type="button"
                            onClick={() => onSelectThreadKey(rel.key)}
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0',
                              isCurrent
                                ? 'bg-[#9B2C2C] text-white border-[#9B2C2C] shadow-2xs'
                                : 'bg-white text-[#4A4640] border-[#E2D9CA] hover:border-[#9B2C2C]/50 hover:text-[#9B2C2C]'
                            )}
                          >
                            <span>
                              {rel.contractId ? `HĐ #${rel.contractId}` : `Đơn #${rel.commissionId}`}
                            </span>
                            <span className="opacity-75">• {rel.statusLabel}</span>
                          </button>
                        );
                      })}
                    </div>

                    {relatedCustomerThreads.length > 3 && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setShowCustomerContractsDropdown((prev) => !prev)
                          }
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F3EFE6] text-[#262522] border border-[#DFD6C7] hover:bg-[#EAE3D5] transition-all cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <span>+{relatedCustomerThreads.length - 2} hợp đồng khác</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>

                        {showCustomerContractsDropdown && (
                          <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-[#DFD6C7] bg-white shadow-xl z-30 p-1.5 space-y-1 max-h-60 overflow-y-auto">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#696660] border-b border-[#EFEAE0] flex items-center justify-between">
                              <span>Tất cả hợp đồng ({relatedCustomerThreads.length})</span>
                              <button
                                type="button"
                                onClick={() => setShowCustomerContractsDropdown(false)}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            {relatedCustomerThreads.map((rel) => {
                              const isCurrent = rel.key === activeThread.key;
                              return (
                                <button
                                  key={rel.key}
                                  type="button"
                                  onClick={() => {
                                    onSelectThreadKey(rel.key);
                                    setShowCustomerContractsDropdown(false);
                                  }}
                                  className={cn(
                                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer',
                                    isCurrent
                                      ? 'bg-[#FDF4F4] text-[#9B2C2C] font-bold'
                                      : 'hover:bg-[#FAF8F4] text-[#262522]'
                                  )}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold">
                                        {rel.contractId
                                          ? `HĐ #${rel.contractId}`
                                          : `Đơn #${rel.commissionId}`}
                                      </span>
                                      <span className="truncate text-[11px]">{rel.title}</span>
                                    </div>
                                    <span className="text-[10px] text-[#696660]">
                                      {rel.statusLabel}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold shrink-0">
                                    {rel.totalAmount > 0 ? formatVND(rel.totalAmount) : '—'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {chatError && (
                <div className="mx-4 mt-2.5 p-2 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatError(null)}
                    className="text-rose-500 hover:text-rose-800 p-0.5 cursor-pointer"
                    aria-label="Đóng thông báo lỗi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* 3. Message Stream with Scroll-Up Lazy Pagination */}
              <div
                ref={scrollViewportRef}
                onScroll={handleViewportScroll}
                className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-2.5"
              >
                {isLoadingMessages && allMessages.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#A31D24]" />
                    <span>Đang tải tin nhắn với {activeThread.customerName}...</span>
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="py-12 text-center space-y-2 max-w-md mx-auto">
                    <div className="h-10 w-10 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-center mx-auto text-[#A31D24]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-stone-800">
                      Bắt đầu trao đổi với khách hàng {activeThread.customerName}
                    </p>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Thống nhất kịch bản, tư liệu lịch sử, thời hạn bàn giao và gửi hình ảnh minh họa trực tiếp tại đây.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Top Lazy Load Banner (Messenger style: scroll up or click to load older messages) */}
                    {hasMoreOlder ? (
                      <div className="flex justify-center py-1">
                        <button
                          type="button"
                          onClick={handleTriggerLoadOlder}
                          disabled={isLoadingOlder}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200/90 hover:border-stone-300 text-stone-700 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
                        >
                          {isLoadingOlder ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-[#A31D24]" />
                              <span>Đang tải tin nhắn cũ hơn...</span>
                            </>
                          ) : (
                            <>
                              <ChevronUp className="h-3 w-3 text-stone-500" />
                              <span>
                                Cuộn lên hoặc bấm để xem {olderHiddenCount} tin nhắn cũ hơn
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center py-0.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-200/60 text-stone-500 text-[10px] font-medium">
                          Đã hiển thị toàn bộ lịch sử trò chuyện ({allMessages.length} tin nhắn)
                        </span>
                      </div>
                    )}

                    {/* Visible Windowed Messages */}
                    {visibleMessages.map((msg) => {
                      const mine = isOwnMessage(msg);
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex flex-col space-y-0.5',
                            mine ? 'items-end' : 'items-start'
                          )}
                        >
                          {!mine && (
                            <span className="text-[10px] font-semibold text-stone-500 px-1">
                              {msg.senderName || activeThread.customerName}
                            </span>
                          )}
                          <div
                            className={cn(
                              'max-w-[82%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-2xs break-words space-y-1.5',
                              mine
                                ? 'bg-[#A31D24] text-white rounded-br-xs'
                                : 'bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs'
                            )}
                          >
                            {msg.imageUrl && (
                              <button
                                type="button"
                                onClick={() => setLightboxImageUrl(msg.imageUrl)}
                                className="block overflow-hidden rounded-xl border border-black/10 hover:opacity-95 transition-opacity cursor-pointer"
                                title="Bấm để xem ảnh phóng to"
                              >
                                <img
                                  src={msg.imageUrl}
                                  alt="Ảnh đính kèm trong cuộc trò chuyện"
                                  loading="lazy"
                                  className="max-h-52 w-auto object-cover rounded-xl"
                                />
                              </button>
                            )}
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                          </div>
                          <span className="text-[10px] text-stone-400 px-1">
                            {msg.timeFormatted}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatMessagesEndRef} />
                  </>
                )}
              </div>

              {/* 4 & 5. Message Composer OR Read-Only Archive Banner (when Contract/Commission is CANCELLED or COMPLETED) */}
              {activeThread.statusTone === 'cancelled' ||
              activeThread.statusTone === 'completed' ? (
                <div className="px-4 py-3 border-t border-[#E6DFD3] bg-[#FAF8F4] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-7 w-7 rounded-lg bg-[#EFEAE0] text-[#696660] flex items-center justify-center shrink-0">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#262522]">
                        {activeThread.statusTone === 'completed'
                          ? 'Hợp đồng này đã hoàn tất — Chế độ lưu trữ chỉ đọc'
                          : 'Hợp đồng / Đơn đặt này đã hủy — Chế độ lưu trữ chỉ đọc'}
                      </p>
                      <p className="text-[11px] text-[#696660] truncate">
                        Bạn vẫn có thể xem lại toàn bộ lịch sử tin nhắn và hình ảnh cũ, nhưng không thể gửi thêm tin nhắn mới.
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const activeSibling = relatedCustomerThreads.find(
                      (t) =>
                        t.key !== activeThread.key &&
                        (t.statusTone === 'active' || t.statusTone === 'pending')
                    );
                    if (!activeSibling) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => onSelectThreadKey(activeSibling.key)}
                        className="px-3 py-1.5 rounded-lg bg-[#9B2C2C] text-white hover:bg-[#822424] text-[11px] font-semibold transition-all cursor-pointer shrink-0"
                      >
                        Chuyển sang {activeSibling.contractId ? `HĐ #${activeSibling.contractId}` : `Đơn #${activeSibling.commissionId}`} đang chạy →
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <>
                  {/* 4. Image Attachment Preview Strip */}
                  {imagePreviewUrl && (
                    <div className="px-4 py-2 bg-stone-100/90 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-10 w-10 rounded-xl overflow-hidden border border-stone-300 bg-white shrink-0">
                          <img
                            src={imagePreviewUrl}
                            alt="Xem trước ảnh gửi"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">
                            {selectedImageFile?.name || 'Ảnh đính kèm'}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {isUploadingImage
                              ? 'Đang tải ảnh lên Cloud Storage...'
                              : 'Sẵn sàng gửi cho khách hàng'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearChatImage}
                        disabled={isSendingChat}
                        aria-label="Hủy ảnh đính kèm"
                        className="h-6 w-6 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 5. Message Composer */}
                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-3 border-t border-stone-200/80 bg-white flex items-center gap-2 shrink-0"
                  >
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleSelectChatImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={isSendingChat}
                      aria-label="Gửi hình ảnh"
                      title="Đính kèm hình ảnh minh họa / tư liệu"
                      className="h-9 w-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-[#A31D24] flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-[0.97] disabled:opacity-50"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>

                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      disabled={isSendingChat}
                      placeholder={`Nhắn tin cho ${activeThread.customerName}...`}
                      className="flex-1 h-9 px-3.5 text-xs sm:text-[13px] rounded-xl border border-stone-200 bg-stone-50/60 text-stone-800 placeholder-stone-400 focus:bg-white focus:border-[#A31D24] focus:ring-1 focus:ring-[#A31D24] outline-hidden transition-all"
                    />

                    <button
                      type="submit"
                      disabled={
                        (!chatInputText.trim() && !selectedImageFile) || isSendingChat
                      }
                      className="h-9 px-3.5 rounded-xl bg-[#A31D24] text-white hover:bg-[#8F181E] disabled:opacity-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-[0.97]"
                    >
                      {isSendingChat ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>{isUploadingImage ? 'Đang tải...' : 'Gửi tin nhắn'}</span>
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox Image Modal */}
      {lightboxImageUrl && (
        <Dialog
          open={Boolean(lightboxImageUrl)}
          onOpenChange={(open) => !open && setLightboxImageUrl(null)}
        >
          <DialogContent className="max-w-4xl p-2 bg-stone-950/95 border border-stone-800 rounded-2xl flex items-center justify-center overflow-hidden z-[70]">
            <DialogTitle className="sr-only">Xem ảnh đính kèm phóng to</DialogTitle>
            <DialogDescription className="sr-only">
              Hình ảnh đính kèm trong cuộc trò chuyện với khách hàng
            </DialogDescription>
            <img
              src={lightboxImageUrl}
              alt="Ảnh phóng to"
              className="max-h-[82vh] max-w-full object-contain rounded-xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

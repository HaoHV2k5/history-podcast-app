import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, Calendar, Layers } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { escrowApi } from '@/services/api/escrow';
import { EscrowTransactionItem } from '@/types/escrow';
import { formatDateTime, formatVND } from '@/utils/formatters';
import { EscrowMilestoneBreakdownDialog } from './EscrowMilestoneBreakdownDialog';

type EscrowFilterStatus = 'ALL' | 'HELD' | 'FROZEN' | 'RELEASED' | 'REFUNDED';

const STATUS_TABS: { value: EscrowFilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'HELD', label: 'Đang giữ (HELD)' },
  { value: 'FROZEN', label: 'Đóng băng (FROZEN)' },
  { value: 'RELEASED', label: 'Đã giải ngân (RELEASED)' },
  { value: 'REFUNDED', label: 'Đã hoàn (REFUNDED)' },
];

export const EscrowListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<EscrowFilterStatus>('ALL');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransactionItem | null>(null);

  // Sync state if URL query param changes
  useEffect(() => {
    setSearch((prev) => {
      if (prev !== urlSearch) {
        setPage(0);
        return urlSearch;
      }
      return prev;
    });
  }, [urlSearch]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-escrow-transactions'],
    queryFn: () => escrowApi.getAllEscrowTransactions(),
  });

  const rawItems = useMemo(() => data?.data || [], [data?.data]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<EscrowFilterStatus, number> = {
      ALL: rawItems.length,
      HELD: 0,
      FROZEN: 0,
      RELEASED: 0,
      REFUNDED: 0,
    };
    rawItems.forEach((item) => {
      const st = (item.status || '').toUpperCase() as EscrowFilterStatus;
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [rawItems]);

  const filteredItems = rawItems.filter((e) => {
    const matchesSearch =
      !search.trim() ||
      e.id.toString().includes(search.trim()) ||
      e.contractId.toString().includes(search.trim()) ||
      (e.status && e.status.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || (e.status || '').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
    if (val.trim()) {
      setSearchParams({ search: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const columns: Column<EscrowTransactionItem>[] = [
    {
      key: 'id',
      header: 'Giao dịch Ký quỹ',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span
              className="font-semibold text-ink hover:underline cursor-pointer"
              onClick={() => setSelectedEscrow(item)}
            >
              Ký quỹ #{item.id}
            </span>
            <span className="text-[11px] text-muted">
              Hợp đồng ID #{item.contractId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền ký quỹ',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-ink">
          {formatVND(item.amount)}
        </span>
      ),
    },
    {
      key: 'commissionAmount',
      header: 'Phí dịch vụ nền tảng',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs text-muted">
          {formatVND(item.commissionAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái Ký quỹ',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'lockedAt',
      header: 'Thời điểm khóa tiền',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          <span>{item.lockedAt ? formatDateTime(item.lockedAt) : '—'}</span>
        </div>
      ),
    },
    {
      key: 'releasedAt',
      header: 'Thời điểm giải ngân',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          <span>{item.releasedAt ? formatDateTime(item.releasedAt) : 'Chưa giải ngân'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Đối soát',
      stickyRight: true,
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          onClick={() => setSelectedEscrow(item)}
          className="min-h-[44px] px-3 text-xs text-ink hover:text-accent hover:border-accent"
        >
          <Layers className="h-3.5 w-3.5 mr-1 text-accent" />
          <span>Đối soát Milestone</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ký quỹ Escrow"
        description="Sổ cái vận hành giám sát các khoản tiền bảo chứng và ký quỹ hợp đồng thu âm an toàn"
      />

      {/* Filter Tabs & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-surface-subtle text-xs overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-surface text-ink shadow-xs font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {statusCounts[tab.value] > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.value
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'bg-border/60 text-muted'
                  }`}
                >
                  {statusCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        <FilterToolbar
          searchPlaceholder="Tìm theo mã giao dịch ký quỹ hoặc mã hợp đồng..."
          searchValue={search}
          onSearchChange={handleSearchChange}
          showReset={Boolean(search || statusFilter !== 'ALL')}
          onReset={() => {
            handleSearchChange('');
            setStatusFilter('ALL');
            setPage(0);
          }}
        />
      </div>

      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải dữ liệu ký quỹ Escrow. Vui lòng thử lại.</span>
          <Button variant="outline" onClick={() => refetch()} className="min-h-[44px] px-3 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginatedItems}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Chưa có giao dịch ký quỹ"
        emptyDescription="Khoản ký quỹ liên quan đến hợp đồng sẽ xuất hiện tại đây."
        pagination={
          <PaginationBar
            embedded
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={size}
            onPageChange={setPage}
          />
        }
      />

      {/* Escrow Milestone Breakdown Dialog */}
      {selectedEscrow && (
        <EscrowMilestoneBreakdownDialog
          escrowItem={selectedEscrow}
          onClose={() => setSelectedEscrow(null)}
        />
      )}
    </div>
  );
};

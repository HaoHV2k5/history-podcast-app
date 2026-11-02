import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
  Calendar,
  Layers,
  Coins,
  ShieldCheck,
  TrendingUp,
  Download,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { escrowApi } from '@/services/api/escrow';
import {
  EscrowTransactionItem,
  AdminMilestoneRevenueItem,
} from '@/types/escrow';
import { formatDateTime, formatVND } from '@/utils/formatters';
import { downloadCSV } from '@/features/contracts/milestoneFinanceLogic';
import { EscrowMilestoneBreakdownDialog } from './EscrowMilestoneBreakdownDialog';

type EscrowFilterStatus = 'ALL' | 'HELD' | 'FROZEN' | 'RELEASED' | 'REFUNDED';

const STATUS_TABS: { value: EscrowFilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'HELD', label: 'Đang giữ (HELD)' },
  { value: 'FROZEN', label: 'Đóng băng (FROZEN)' },
  { value: 'RELEASED', label: 'Đã giải ngân (RELEASED)' },
  { value: 'REFUNDED', label: 'Đã hoàn trả (REFUNDED)' },
];

export const EscrowListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<EscrowFilterStatus>('ALL');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransactionItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  // 1. Fetch Milestone Revenue & Escrow Summary (4 KPIs)
  const { data: summaryData } = useQuery({
    queryKey: ['admin-escrow-summary'],
    queryFn: () => escrowApi.getMilestoneRevenueSummary(),
  });

  const summary = summaryData?.data;

  // 2. Fetch Milestone Revenue & Escrow Ledger (V2)
  const {
    data: ledgerData,
    isLoading: isLedgerLoading,
    isError: isLedgerError,
    refetch: refetchLedger,
  } = useQuery({
    queryKey: ['admin-escrow-ledger', statusFilter, search, page, size],
    queryFn: () =>
      escrowApi.getMilestoneRevenueLedger({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search.trim() || undefined,
        page,
        size,
      }),
  });

  // Extract ledger items with graceful fallback
  const ledgerPage = ledgerData?.data;
  const items: AdminMilestoneRevenueItem[] = useMemo(() => {
    if (ledgerPage && Array.isArray(ledgerPage.items)) {
      return ledgerPage.items;
    }
    return [];
  }, [ledgerPage]);

  const totalElements = ledgerPage?.totalElements ?? items.length;
  const totalPages = ledgerPage?.totalPages ?? Math.ceil(totalElements / size);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
    if (val.trim()) {
      setSearchParams({ search: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const csvData = await escrowApi.exportRevenueCsv({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      downloadCSV(`So_cai_Ky_quy_Milestone_${new Date().toISOString().slice(0, 10)}.csv`, url);
    } catch {
      // If server export fails, silent graceful fallback
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<AdminMilestoneRevenueItem>[] = [
    {
      key: 'milestone',
      header: 'Giai đoạn & Hợp đồng',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex flex-col font-mono text-xs min-w-0 max-w-xs">
            <span
              className="font-semibold text-ink hover:underline cursor-pointer truncate"
              title={item.milestoneTitle || `Mốc #${item.milestoneId}`}
              onClick={() =>
                setSelectedEscrow({
                  id: item.milestoneId,
                  contractId: item.contractId,
                  amount: item.grossAmount,
                  commissionAmount: item.platformFee ?? Math.round(item.grossAmount * 0.05),
                  status: item.status,
                  lockedAt: item.fundedAt,
                  releasedAt: item.releasedAt,
                })
              }
            >
              Mốc #{item.milestoneOrderNo ?? item.milestoneId}: {item.milestoneTitle || 'Nghiệm thu'}
            </span>
            <span className="text-[11px] text-muted truncate">
              Hợp đồng #{item.contractId} {item.contractTitle ? `• ${item.contractTitle}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Các bên tham gia',
      render: (item) => (
        <div className="flex flex-col text-xs font-mono min-w-0 max-w-[180px]">
          <span className="text-ink font-semibold truncate" title={item.creatorName || undefined}>
            Creator: {item.creatorName || `ID #${item.creatorId ?? '—'}`}
          </span>
          <span className="text-[11px] text-muted truncate" title={item.requesterName || item.freelancerName || undefined}>
            Khách: {item.requesterName || item.freelancerName || `ID #${item.requesterId ?? '—'}`}
          </span>
        </div>
      ),
    },
    {
      key: 'grossAmount',
      header: 'Số tiền ký quỹ (Gross)',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-ink">
          {formatVND(item.grossAmount)}
        </span>
      ),
    },
    {
      key: 'feeAndNet',
      header: 'Phí sàn (5%) / Thực nhận (95%)',
      align: 'right',
      render: (item) => {
        const fee = item.platformFee ?? Math.round(item.grossAmount * 0.05);
        const net = item.netAmount ?? (item.grossAmount - fee);
        return (
          <div className="flex flex-col font-mono tabular-nums text-right text-xs">
            <span className="text-muted text-[11px]">Phí: {formatVND(fee)}</span>
            <span className="text-status-success-text font-semibold text-xs">
              Thực nhận: {formatVND(net)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái Ký quỹ',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'timeline',
      header: 'Thời điểm',
      render: (item) => (
        <div className="flex flex-col text-xs text-muted font-mono tabular-nums">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted" />
            <span>Khóa: {item.fundedAt ? formatDateTime(item.fundedAt) : '—'}</span>
          </div>
          {item.releasedAt && (
            <span className="text-[10px] text-status-success-text">
              Giải ngân: {formatDateTime(item.releasedAt)}
            </span>
          )}
          {item.refundedAt && (
            <span className="text-[10px] text-status-error-text">
              Hoàn: {formatDateTime(item.refundedAt)}
            </span>
          )}
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
          onClick={() =>
            setSelectedEscrow({
              id: item.milestoneId,
              contractId: item.contractId,
              amount: item.grossAmount,
              commissionAmount: item.platformFee ?? Math.round(item.grossAmount * 0.05),
              status: item.status,
              lockedAt: item.fundedAt,
              releasedAt: item.releasedAt,
            })
          }
          className="min-h-[44px] px-3 text-xs text-ink hover:text-accent hover:border-accent active:scale-[0.98] transition-transform duration-150"
        >
          <Layers className="h-3.5 w-3.5 mr-1 text-accent" />
          <span>Đối soát HĐ #{item.contractId}</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Ký quỹ Escrow & Đối soát Doanh thu"
          description="Sổ cái vận hành giám sát tiền bảo chứng và giải ngân 95% - 5% theo từng giai đoạn Milestone"
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="min-h-[40px] px-3.5 text-xs text-ink hover:text-accent border-border shadow-xs active:scale-[0.98] transition-transform duration-150"
        >
          <Download className="h-4 w-4 mr-1.5 text-accent" />
          <span>{isExporting ? 'Đang xuất CSV...' : 'Xuất CSV đối soát'}</span>
        </Button>
      </div>

      {/* 4-KPI Escrow Financial Summary Banner */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Escrow Held */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-medium">Tiền đang giữ trong Escrow</span>
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <div className="text-xl font-bold font-mono text-ink tabular-nums">
              {formatVND(summary.totalEscrowHeld)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-status-success-text" />
              <span>{summary.heldMilestonesCount ?? 0} giai đoạn đang khóa tiền</span>
            </div>
          </div>

          {/* KPI 2: Realized Revenue */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-medium">Phí sàn thực thu (5%)</span>
              <Coins className="h-4 w-4 text-status-success-text" />
            </div>
            <div className="text-xl font-bold font-mono text-status-success-text tabular-nums">
              {formatVND(summary.totalRealizedRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              <span>{summary.releasedMilestonesCount ?? 0} giai đoạn đã giải ngân</span>
            </div>
          </div>

          {/* KPI 3: Gross Volume */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-medium">Tổng giá trị GMV giao dịch</span>
              <Layers className="h-4 w-4 text-ink" />
            </div>
            <div className="text-xl font-bold font-mono text-ink tabular-nums">
              {formatVND(summary.totalGrossVolume)}
            </div>
            <div className="text-[11px] text-muted">
              {summary.totalMilestonesCount ?? 0} tổng mốc phát sinh
            </div>
          </div>

          {/* KPI 4: Refunded Volume */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-medium">Tổng tiền đã hoàn trả</span>
              <FileCheck2 className="h-4 w-4 text-status-error-text" />
            </div>
            <div className="text-xl font-bold font-mono text-ink tabular-nums">
              {formatVND(summary.totalRefundedVolume)}
            </div>
            <div className="text-[11px] text-status-error-text">
              {summary.refundedMilestonesCount ?? 0} mốc hoàn cọc cho Khách
            </div>
          </div>
        </div>
      )}

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
              className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-[0.98] ${
                statusFilter === tab.value
                  ? 'bg-surface text-ink shadow-xs font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <FilterToolbar
          searchPlaceholder="Tìm theo mã hợp đồng, tên giai đoạn, Creator hoặc Khách hàng..."
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

      {isLedgerError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Không thể kết nối đến máy chủ sổ cái ký quỹ. Vui lòng bấm thử lại.</span>
          </div>
          <Button variant="outline" onClick={() => refetchLedger()} className="min-h-[38px] px-3 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => `${item.contractId}-${item.milestoneId}`}
        isLoading={isLedgerLoading}
        emptyTitle="Chưa có giao dịch ký quỹ nào"
        emptyDescription="Các giai đoạn Milestone được nạp cọc (UNFUNDED -> HELD) sẽ hiển thị trong sổ cái đối soát tại đây."
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

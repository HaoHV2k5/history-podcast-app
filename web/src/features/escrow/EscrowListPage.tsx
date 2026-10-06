import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { escrowApi } from '@/services/api/escrow';
import { EscrowTransactionItem } from '@/types/escrow';
import { formatDateTime, formatVND } from '@/utils/formatters';

export const EscrowListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-escrow-transactions'],
    queryFn: () => escrowApi.getAllEscrowTransactions(),
  });

  const rawItems = data?.data || [];

  const filteredItems = search.trim()
    ? rawItems.filter(
        (e) =>
          e.id.toString().includes(search.trim()) ||
          e.contractId.toString().includes(search.trim())
      )
    : rawItems;

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

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
            <span className="font-semibold text-ink">
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
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-ink">
          {formatVND(item.amount)}
        </span>
      ),
    },
    {
      key: 'commissionAmount',
      header: 'Phí dịch vụ nền tảng',
      render: (item) => (
        <span className="font-mono text-xs text-muted">
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
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <Calendar className="h-3.5 w-3.5 text-border" />
          <span>{item.lockedAt ? formatDateTime(item.lockedAt) : '—'}</span>
        </div>
      ),
    },
    {
      key: 'releasedAt',
      header: 'Thời điểm giải ngân',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <Calendar className="h-3.5 w-3.5 text-border" />
          <span>{item.releasedAt ? formatDateTime(item.releasedAt) : 'Chưa giải ngân'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ký quỹ Escrow"
        description="Sổ cái vận hành giám sát các khoản tiền bảo chứng và ký quỹ hợp đồng thu âm an toàn"
      />

      <FilterToolbar
        searchPlaceholder="Tìm theo mã giao dịch ký quỹ hoặc mã hợp đồng..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        showReset={Boolean(search)}
        onReset={() => {
          setSearch('');
          setPage(0);
        }}
      />

      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải dữ liệu ký quỹ Escrow. Vui lòng thử lại.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginatedItems}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Chưa có giao dịch ký quỹ nào"
        emptyDescription="Hiện chưa có bản ghi ký quỹ hợp đồng nào được khởi tạo trên hệ thống."
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        size={size}
        onPageChange={setPage}
      />
    </div>
  );
};

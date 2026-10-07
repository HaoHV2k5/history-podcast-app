import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { transactionsApi } from '@/services/api/transactions';
import { WalletTransactionItem } from '@/types/transaction';
import { formatDateTime, formatVND } from '@/utils/formatters';

const formatTxnType = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'TOPUP':
      return 'Nạp tiền vào ví';
    case 'WITHDRAW':
      return 'Rút tiền về ngân hàng';
    case 'MEMBERSHIP':
      return 'Đăng ký Hội viên';
    case 'DONATION':
      return 'Ủng hộ tác giả';
    case 'ESCROW_LOCK':
      return 'Ký quỹ Hợp đồng';
    case 'ESCROW_RELEASE':
      return 'Giải ngân Hợp đồng';
    case 'REFUND':
      return 'Hoàn trả tiền';
    default:
      return type || 'Khác';
  }
};

export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-wallet-transactions'],
    queryFn: () => transactionsApi.getAllTransactions(),
  });

  const rawItems = data?.data || [];

  const filteredItems = search.trim()
    ? rawItems.filter(
        (t) =>
          t.id.toString().includes(search.trim()) ||
          t.walletId.toString().includes(search.trim()) ||
          t.merchantTxnRef?.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : rawItems;

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const columns: Column<WalletTransactionItem>[] = [
    {
      key: 'id',
      header: 'Mã GD & Ví',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-muted">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="font-semibold text-ink">GD #{item.id}</span>
            <span className="text-[11px] text-muted">Ví ID #{item.walletId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại biến động',
      render: (item) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-ink">{formatTxnType(item.type)}</span>
          <span className="font-mono text-[10px] text-muted uppercase">{item.type}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-ink">
          {formatVND(item.amount)}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Tham chiếu & Cổng',
      render: (item) => (
        <div className="flex flex-col text-xs max-w-xs">
          <span className="font-mono text-[11px] text-ink truncate">
            {item.merchantTxnRef || item.gatewayTxnNo || '—'}
          </span>
          <span className="text-[11px] text-muted truncate">
            {item.gatewayProvider || item.description || 'Hệ thống nội bộ'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Thời điểm ghi sổ',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          <span>{formatDateTime(item.createdAt)}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biến động số dư"
        description="Sổ cái vận hành ghi nhận toàn bộ biến động tài chính nạp, rút, ký quỹ và phân phối doanh thu trên ví hệ thống"
      />

      <FilterToolbar
        searchPlaceholder="Tìm theo mã giao dịch, mã ví, mã đối tác..."
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
          <span>Không thể tải dữ liệu sổ cái giao dịch ví. Vui lòng thử lại.</span>
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
        emptyTitle="Chưa có biến động số dư"
        emptyDescription="Các giao dịch ví sẽ xuất hiện tại đây khi phát sinh."
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
    </div>
  );
};

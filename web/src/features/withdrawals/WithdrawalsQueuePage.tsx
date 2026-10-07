import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Wallet, Landmark, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { WithdrawalItem } from '@/types/withdrawal';
import { formatDateTime, formatVND, maskIdentifier } from '@/utils/formatters';

const STATUS_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ xét duyệt' },
  { id: 'PROCESSING', label: 'Đang xử lý' },
  { id: 'COMPLETED', label: 'Đã hoàn tất' },
  { id: 'REJECTED', label: 'Bị từ chối' },
];

export const WithdrawalsQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-withdrawals', page, size],
    queryFn: () => withdrawalsApi.getAllWithdrawals(page, size),
  });

  const pageData = data?.data;
  const rawItems = pageData?.items || pageData?.content || [];

  const filteredItems = rawItems.filter((item) => {
    const matchesStatus = !status || item.status?.toUpperCase() === status;
    const matchesSearch =
      !search.trim() ||
      item.id.toString().includes(search.trim()) ||
      item.accountHolderName?.toLowerCase().includes(search.toLowerCase()) ||
      item.bankName?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalElements = pageData?.totalElements || filteredItems.length;
  const totalPages = pageData?.totalPages || Math.ceil(totalElements / size);

  const columns: Column<WithdrawalItem>[] = [
    {
      key: 'id',
      header: 'Yêu cầu rút tiền',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span
              className="font-mono text-xs font-semibold text-ink hover:underline cursor-pointer"
              onClick={() => navigate(`/admin/withdrawals/${item.id}`)}
            >
              Yêu cầu #{item.id}
            </span>
            <span className="font-mono text-[11px] text-muted">
              Ví Creator ID #{item.walletId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền yêu cầu rút',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-ink">
          {formatVND(item.amount)}
        </span>
      ),
    },
    {
      key: 'destination',
      header: 'Tài khoản thụ hưởng (Đã che)',
      render: (item) => (
        <div className="flex flex-col text-xs max-w-xs">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            <Landmark className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="truncate">{item.bankName}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5 font-mono tabular-nums">
            <span>{maskIdentifier(item.accountNumber)}</span>
            <span>•</span>
            <span className="uppercase">{item.accountHolderName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái xử lý',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'requestedAt',
      header: 'Thời điểm tạo yêu cầu',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          <span>{formatDateTime(item.requestedAt)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      stickyRight: true,
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/withdrawals/${item.id}`);
          }}
          className="min-h-[44px] px-3.5 text-xs text-ink hover:text-accent hover:border-accent"
        >
          <span>Xem xét</span>
          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yêu cầu rút tiền"
        description="Thẩm định các yêu cầu rút tiền về tài khoản ngân hàng của Nhà sáng tạo (Creator)"
      />

      {/* Status Tabs */}
      <div className="flex border-b border-border space-x-1">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id);
                setPage(0);
              }}
              className={`min-h-[44px] px-4 text-xs font-medium border-b-2 transition-colors duration-150 ${
                isActive
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:text-ink hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        searchPlaceholder="Tìm kiếm theo mã yêu cầu, tên chủ tài khoản, ngân hàng..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        showReset={Boolean(search || status)}
        onReset={() => {
          setSearch('');
          setStatus('');
          setPage(0);
        }}
      />

      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải danh sách yêu cầu rút tiền. Vui lòng thử lại.</span>
          <Button variant="outline" onClick={() => refetch()} className="min-h-[44px] px-3 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/admin/withdrawals/${item.id}`)}
        emptyTitle="Chưa có yêu cầu rút tiền"
        emptyDescription="Các yêu cầu rút tiền từ tài khoản Nhà sáng tạo sẽ xuất hiện tại đây khi phát sinh."
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

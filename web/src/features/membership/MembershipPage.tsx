import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { membershipApi } from '@/services/api/membership';
import { MembershipPaymentItem } from '@/types/membership';
import { formatDateTime, formatVND } from '@/utils/formatters';

export const MembershipPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-membership-payments'],
    queryFn: () => membershipApi.getAllPayments(),
  });

  const rawItems = data?.data || [];

  const filteredItems = search.trim()
    ? rawItems.filter(
        (p) =>
          p.id.toString().includes(search.trim()) ||
          p.membershipId.toString().includes(search.trim())
      )
    : rawItems;

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const columns: Column<MembershipPaymentItem>[] = [
    {
      key: 'paymentId',
      header: 'Giao dịch thanh toán',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-semibold text-ink">
              Thanh toán #{item.id}
            </span>
            <span className="font-mono text-[11px] text-muted">
              Gói Hội viên ID #{item.membershipId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số tiền thanh toán',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-ink">
          {formatVND(item.amount)}
        </span>
      ),
    },
    {
      key: 'creatorEarning',
      header: 'Thu nhập Creator (80%)',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs text-status-success-text font-medium">
          {formatVND(item.creatorEarning)}
        </span>
      ),
    },
    {
      key: 'commissionAmount',
      header: 'Phí nền tảng (20%)',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs text-muted">
          {formatVND(item.commissionAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'paidAt',
      header: 'Thời điểm thanh toán',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          <span>{item.paidAt ? formatDateTime(item.paidAt) : 'Chưa ghi nhận'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gói Hội viên & Thanh toán"
        description="Theo dõi lịch sử thanh toán đăng ký gói hội viên của người ủng hộ và tỷ lệ phân bổ doanh thu Creator"
      />

      <FilterToolbar
        searchPlaceholder="Tìm theo mã thanh toán hoặc mã gói hội viên..."
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
          <span>Không thể tải dữ liệu thanh toán gói hội viên. Vui lòng thử lại.</span>
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
        emptyTitle="Chưa có giao dịch hội viên"
        emptyDescription="Chưa phát sinh thanh toán hội viên trong dữ liệu hiện tại."
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

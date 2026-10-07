import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, User, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { disputesApi } from '@/services/api/disputes';
import { DisputeItem } from '@/types/dispute';
import { formatDateTime } from '@/utils/formatters';

export const DisputesListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => disputesApi.getAllDisputes(),
  });

  const rawData = data?.data;
  const rawItems: DisputeItem[] = Array.isArray(rawData)
    ? rawData
    : rawData && 'items' in rawData && Array.isArray(rawData.items)
      ? rawData.items
      : [];

  const filteredItems = search.trim()
    ? rawItems.filter(
        (d) =>
          d.id.toString().includes(search.trim()) ||
          d.contractId.toString().includes(search.trim()) ||
          (d.contractTitle && d.contractTitle.toLowerCase().includes(search.toLowerCase())) ||
          (d.reason && d.reason.toLowerCase().includes(search.toLowerCase()))
      )
    : rawItems;

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const columns: Column<DisputeItem>[] = [
    {
      key: 'id',
      header: 'Khiếu nại hợp đồng',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-status-error-bg text-status-error-text">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span
              className="font-semibold text-ink hover:underline cursor-pointer"
              onClick={() => setSelectedDispute(item)}
            >
              Khiếu nại #{item.id}
            </span>
            <span className="text-[11px] text-muted">
              Hợp đồng ID #{item.contractId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'raisedBy',
      header: 'Bên khởi tạo',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-ink font-mono">
          <User className="h-3.5 w-3.5 text-muted" />
          <span>User ID #{item.raisedByUserId}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Nội dung tranh chấp',
      render: (item) => (
        <p className="text-xs text-muted max-w-xs truncate" title={item.reason}>
          {item.reason}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'resolvedAt',
      header: 'Thời điểm giải quyết',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <Calendar className="h-3.5 w-3.5 text-border" />
          <span>{item.resolvedAt ? formatDateTime(item.resolvedAt) : 'Đang thụ lý'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Chi tiết',
      stickyRight: true,
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          onClick={() => setSelectedDispute(item)}
          className="min-h-[44px] px-3 text-xs text-ink hover:text-accent hover:border-accent"
        >
          <span>Xem thụ lý</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xử lý Khiếu nại"
        description="Sổ theo dõi và giải quyết tranh chấp hợp đồng thu âm giữa Nhà sáng tạo và Thuyết minh viên"
      />

      <FilterToolbar
        searchPlaceholder="Tìm theo mã khiếu nại, mã hợp đồng hoặc nội dung lý do..."
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
          <span>Không thể tải danh sách khiếu nại. Vui lòng thử lại.</span>
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
        emptyTitle="Chưa có khiếu nại"
        emptyDescription="Hiện không có tranh chấp hợp đồng cần theo dõi."
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

      {/* Dispute Details Dialog */}
      {selectedDispute && (
        <Dialog open={Boolean(selectedDispute)} onOpenChange={(open) => !open && setSelectedDispute(null)}>
          <DialogContent maxWidth="max-w-xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Khiếu nại #{selectedDispute.id}</DialogTitle>
              <DialogDescription>
                Hợp đồng liên quan: <strong className="font-mono text-ink">ID #{selectedDispute.contractId}</strong> • Khởi tạo bởi: <strong className="font-mono text-ink">User #{selectedDispute.raisedByUserId}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
                  Lý do khởi tạo tranh chấp:
                </span>
                <div className="rounded-lg border border-border bg-canvas p-4 text-ink leading-relaxed whitespace-pre-line">
                  {selectedDispute.reason}
                </div>
              </div>

              {selectedDispute.resolution && (
                <div>
                  <span className="font-semibold text-status-success-text block mb-1 text-[11px] uppercase tracking-wider">
                    Kết luận giải quyết từ ban quản trị:
                  </span>
                  <div className="rounded-lg border border-border bg-surface-subtle p-4 text-ink leading-relaxed whitespace-pre-line">
                    {selectedDispute.resolution}
                  </div>
                  {selectedDispute.resolvedAt && (
                    <p className="mt-1 text-[11px] text-muted font-mono">
                      Thời điểm kết luận: {formatDateTime(selectedDispute.resolvedAt)} • Bởi Quản trị viên ID #{selectedDispute.resolvedByUserId}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

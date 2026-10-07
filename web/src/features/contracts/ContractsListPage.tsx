import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, CheckCircle2, Clock } from 'lucide-react';
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
import { contractsApi } from '@/services/api/contracts';
import { ContractItem } from '@/types/contract';
import { formatDateTime, formatDate, formatVND } from '@/utils/formatters';

export const ContractsListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: () => contractsApi.getAllContracts(),
  });

  const rawData = data?.data;
  const rawItems: ContractItem[] = Array.isArray(rawData)
    ? rawData
    : rawData && 'items' in rawData && Array.isArray(rawData.items)
      ? rawData.items
      : [];

  const filteredItems = search.trim()
    ? rawItems.filter(
        (c) =>
          c.id.toString().includes(search.trim()) ||
          (c.hireRequestId != null && c.hireRequestId.toString().includes(search.trim())) ||
          (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
          (c.termsText && c.termsText.toLowerCase().includes(search.toLowerCase()))
      )
    : rawItems;

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const columns: Column<ContractItem>[] = [
    {
      key: 'id',
      header: 'Hợp đồng thu âm',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span
              className="font-semibold text-ink hover:underline cursor-pointer"
              onClick={() => setSelectedContract(item)}
            >
              Hợp đồng #{item.id}
            </span>
            <span className="text-[11px] text-muted">
              Yêu cầu thuê ID #{item.hireRequestId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá trị hợp đồng',
      align: 'right',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-ink">
          {formatVND(item.price)}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Hạn giao bài',
      render: (item) => (
        <span className="font-mono tabular-nums text-xs text-ink">
          {item.deadline ? formatDate(item.deadline) : 'Không ghi nhận'}
        </span>
      ),
    },
    {
      key: 'signingStatus',
      header: 'Chữ ký các bên',
      render: (item) => (
        <div className="flex flex-col text-[11px] space-y-1">
          <div className="flex items-center gap-1.5">
            {item.creatorSignedAt ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-status-success-text" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-muted" />
            )}
            <span className={item.creatorSignedAt ? 'text-status-success-text' : 'text-muted'}>
              Creator {item.creatorSignedAt ? 'đã ký' : 'chưa ký'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.narratorSignedAt ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-status-success-text" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-muted" />
            )}
            <span className={item.narratorSignedAt ? 'text-status-success-text' : 'text-muted'}>
              Thuyết minh {item.narratorSignedAt ? 'đã ký' : 'chưa ký'}
            </span>
          </div>
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
      header: 'Thời điểm tạo',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-muted" />
          <span>{formatDateTime(item.createdAt)}</span>
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
          onClick={() => setSelectedContract(item)}
          className="min-h-[44px] px-3 text-xs text-ink hover:text-accent hover:border-accent"
        >
          <span>Xem điều khoản</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hợp đồng thu âm"
        description="Sổ lưu trữ và tra cứu hợp đồng thỏa thuận sản xuất âm thanh giữa Nhà sáng tạo và Thuyết minh viên"
      />

      <FilterToolbar
        searchPlaceholder="Tìm theo mã hợp đồng hoặc mã yêu cầu thuê..."
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
          <span>Không thể tải danh sách hợp đồng. Vui lòng thử lại.</span>
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
        emptyTitle="Chưa có hợp đồng thu âm"
        emptyDescription="Các hợp đồng giữa Nhà sáng tạo và Thuyết minh viên sẽ được theo dõi tại đây."
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

      {/* Contract Terms Dialog */}
      {selectedContract && (
        <Dialog open={Boolean(selectedContract)} onOpenChange={(open) => !open && setSelectedContract(null)}>
          <DialogContent maxWidth="max-w-xl">
            <DialogHeader>
              <DialogTitle>Điều khoản Hợp đồng #{selectedContract.id}</DialogTitle>
              <DialogDescription>
                Giá trị: <strong className="text-ink">{formatVND(selectedContract.price)}</strong> • Hạn giao bài:{' '}
                {selectedContract.deadline ? formatDate(selectedContract.deadline) : 'Không'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                <span className="text-muted block text-[11px] font-semibold uppercase tracking-wider">
                  Trạng thái ký kết điện tử:
                </span>
                <p className="text-ink font-mono text-[11px]">
                  Creator ký:{' '}
                  {selectedContract.creatorSignedAt
                    ? formatDateTime(selectedContract.creatorSignedAt)
                    : 'Chưa ký'}{' '}
                  • Thuyết minh ký:{' '}
                  {selectedContract.narratorSignedAt
                    ? formatDateTime(selectedContract.narratorSignedAt)
                    : 'Chưa ký'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
                  Nội dung điều khoản thỏa thuận:
                </span>
                <div className="rounded-lg border border-border bg-canvas p-4 text-ink leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                  {selectedContract.termsText || 'Không có văn bản điều khoản chi tiết.'}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

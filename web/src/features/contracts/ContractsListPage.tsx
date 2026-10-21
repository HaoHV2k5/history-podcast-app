import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  User,
  Coins,
} from 'lucide-react';
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
import { ContractMilestoneTimeline } from './ContractMilestoneTimeline';

export const ContractsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState(urlSearch);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [detailTab, setDetailTab] = useState<'milestones' | 'terms'>('milestones');

  useEffect(() => {
    setSearch((prev) => {
      if (prev !== urlSearch) {
        setPage(0);
        return urlSearch;
      }
      return prev;
    });
  }, [urlSearch]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
    if (val.trim()) {
      setSearchParams({ search: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: () => contractsApi.getAllContracts(),
  });

  // Query full contract details when a contract is selected
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-contract-detail', selectedContract?.id],
    queryFn: () => contractsApi.getContractById(selectedContract!.id),
    enabled: Boolean(selectedContract?.id),
  });

  const activeContract: ContractItem | null =
    detailData?.data || selectedContract || null;

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
          (c.termsText && c.termsText.toLowerCase().includes(search.toLowerCase())) ||
          (c.creatorFullName && c.creatorFullName.toLowerCase().includes(search.toLowerCase())) ||
          (c.freelancerFullName && c.freelancerFullName.toLowerCase().includes(search.toLowerCase()))
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
              onClick={() => {
                setSelectedContract(item);
                setDetailTab('milestones');
              }}
            >
              Hợp đồng #{item.id}
            </span>
            <span className="text-[11px] text-muted">
              {item.title ? item.title : `Yêu cầu thuê ID #${item.hireRequestId ?? '—'}`}
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
          {formatVND(item.totalAmount ?? item.price)}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Hạn hoàn thành',
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
            {item.creatorSignedAt || item.acceptedAt ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-status-success-text" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-muted" />
            )}
            <span
              className={
                item.creatorSignedAt || item.acceptedAt
                  ? 'text-status-success-text'
                  : 'text-muted'
              }
            >
              Creator {item.creatorSignedAt || item.acceptedAt ? 'đã ký' : 'chưa ký'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {item.narratorSignedAt || item.acceptedAt ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-status-success-text" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-muted" />
            )}
            <span
              className={
                item.narratorSignedAt || item.acceptedAt
                  ? 'text-status-success-text'
                  : 'text-muted'
              }
            >
              Thuyết minh {item.narratorSignedAt || item.acceptedAt ? 'đã ký' : 'chưa ký'}
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
      header: 'Chi tiết & Milestone',
      stickyRight: true,
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedContract(item);
            setDetailTab('milestones');
          }}
          className="min-h-[44px] px-3 text-xs text-ink hover:text-accent hover:border-accent"
        >
          <Layers className="h-3.5 w-3.5 mr-1 text-accent" />
          <span>Cột mốc & Điều khoản</span>
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
        searchPlaceholder="Tìm theo mã hợp đồng, tiêu đề hoặc đối tác..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        showReset={Boolean(search)}
        onReset={() => {
          handleSearchChange('');
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

      {/* Contract Milestone & Terms Dialog */}
      {selectedContract && activeContract && (
        <Dialog
          open={Boolean(selectedContract)}
          onOpenChange={(open) => !open && setSelectedContract(null)}
        >
          <DialogContent maxWidth="max-w-3xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span>Hợp đồng #{activeContract.id}</span>
                  {activeContract.title && (
                    <span className="text-sm font-sans font-normal text-muted truncate max-w-xs">
                      — {activeContract.title}
                    </span>
                  )}
                  {isDetailLoading && (
                    <Clock className="h-3.5 w-3.5 animate-spin text-accent" />
                  )}
                </DialogTitle>
                <StatusBadge status={activeContract.status} />
              </div>
              <DialogDescription>
                Giá trị: <strong className="text-ink font-mono">{formatVND(activeContract.totalAmount ?? activeContract.price)}</strong> • Hạn hoàn thành:{' '}
                {activeContract.deadline ? formatDate(activeContract.deadline) : 'Không ghi nhận'}
              </DialogDescription>
            </DialogHeader>

            {/* Contract Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-border bg-surface-subtle p-3 text-xs">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted block uppercase">Creator (Nhà sáng tạo)</span>
                  <span className="font-semibold text-ink">
                    {activeContract.creatorFullName || `ID #${activeContract.creatorId ?? '—'}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-status-processing-text shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted block uppercase">Thuyết minh viên</span>
                  <span className="font-semibold text-ink">
                    {activeContract.freelancerFullName || `ID #${activeContract.freelancerId ?? '—'}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-status-success-text shrink-0" />
                <div>
                  <span className="text-[10px] text-muted block uppercase">Phí sàn / Thực nhận</span>
                  <span className="font-mono text-ink">
                    {activeContract.platformFee != null ? formatVND(activeContract.platformFee) : (activeContract.platformFeePercent != null ? `${activeContract.platformFeePercent}%` : 'Theo HĐ')} / {activeContract.netAmount != null ? formatVND(activeContract.netAmount) : 'Chưa tất toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border text-xs gap-2">
              <button
                type="button"
                onClick={() => setDetailTab('milestones')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium transition-colors border-b-2 ${
                  detailTab === 'milestones'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tiến trình Cột mốc & Ký quỹ (Milestones)</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('terms')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium transition-colors border-b-2 ${
                  detailTab === 'terms'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>Điều khoản & Chữ ký điện tử</span>
              </button>
            </div>

            {/* Tab Contents with Scrollable Container */}
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {detailTab === 'milestones' && (
                <ContractMilestoneTimeline
                  contractId={activeContract.id}
                  initialMilestones={activeContract.milestones}
                  contractTitle={activeContract.title}
                />
              )}

              {detailTab === 'terms' && (
                <div className="space-y-4 py-2 text-xs">
                  <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                    <span className="text-muted block text-[11px] font-semibold uppercase tracking-wider">
                      Trạng thái ký kết điện tử:
                    </span>
                    <p className="text-ink font-mono text-[11px]">
                      Creator ký:{' '}
                      {activeContract.creatorSignedAt
                        ? formatDateTime(activeContract.creatorSignedAt)
                        : activeContract.acceptedAt
                          ? formatDateTime(activeContract.acceptedAt)
                          : 'Chưa ký'}{' '}
                      • Thuyết minh ký:{' '}
                      {activeContract.narratorSignedAt
                        ? formatDateTime(activeContract.narratorSignedAt)
                        : activeContract.acceptedAt
                          ? formatDateTime(activeContract.acceptedAt)
                          : 'Chưa ký'}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-ink block mb-1 text-[11px] uppercase tracking-wider text-muted">
                      Nội dung điều khoản thỏa thuận:
                    </span>
                    <div className="rounded-lg border border-border bg-canvas p-4 text-ink leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                      {activeContract.termsText || 'Không có văn bản điều khoản chi tiết.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

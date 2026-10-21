import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, Gavel, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { disputesApi } from '@/services/api/disputes';
import { DisputeItem } from '@/types/dispute';
import { formatDateTime } from '@/utils/formatters';
import { AdminDisputeDetailModal } from './AdminDisputeDetailModal';
import { formatDisputeResult } from './disputeResolutionLogic';

export const DisputesListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

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
    queryKey: ['admin-disputes', statusFilter],
    queryFn: () => disputesApi.getAllDisputes(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  const rawData = data?.data;
  const rawItems: DisputeItem[] = Array.isArray(rawData)
    ? rawData
    : rawData && 'items' in rawData && Array.isArray(rawData.items)
      ? rawData.items
      : [];

  const filteredItems = rawItems.filter((d) => {
    // Search match
    const matchesSearch =
      !search.trim() ||
      d.id.toString().includes(search.trim()) ||
      d.contractId.toString().includes(search.trim()) ||
      (d.contractTitle && d.contractTitle.toLowerCase().includes(search.toLowerCase())) ||
      (d.milestoneTitle && d.milestoneTitle.toLowerCase().includes(search.toLowerCase())) ||
      (d.raisedByUserFullName && d.raisedByUserFullName.toLowerCase().includes(search.toLowerCase())) ||
      (d.reason && d.reason.toLowerCase().includes(search.toLowerCase()));

    // Status filter match (if API returns mixed or for client safety)
    const matchesStatus =
      statusFilter === 'ALL' || (d.status || '').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const columns: Column<DisputeItem>[] = [
    {
      key: 'id',
      header: 'Khiếu nại hợp đồng',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
              item.status === 'OPEN'
                ? 'bg-status-error-bg text-status-error-text'
                : 'bg-status-success-bg text-status-success-text'
            }`}
          >
            {item.status === 'OPEN' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
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
              {item.milestoneId ? ` • Milestone #${item.milestoneId}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'raisedBy',
      header: 'Bên khởi tạo',
      render: (item) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="font-semibold text-ink">
            {item.raisedByUserFullName || `User #${item.raisedByUserId}`}
          </span>
          <span className="text-[10px] text-muted">
            ID: #{item.raisedByUserId}
          </span>
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
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={item.status} />
          {item.result && (
            <span className="text-[10px] text-muted font-mono">
              {formatDisputeResult(item.result).label}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời điểm',
      render: (item) => (
        <div className="flex flex-col text-xs text-muted font-mono">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted" />
            <span>Tạo: {item.createdAt ? formatDateTime(item.createdAt) : '—'}</span>
          </div>
          {item.resolvedAt && (
            <span className="text-[10px] text-status-success-text">
              Xong: {formatDateTime(item.resolvedAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      stickyRight: true,
      align: 'right',
      render: (item) => {
        const isOpen = (item.status || '').toUpperCase() === 'OPEN';
        return (
          <Button
            variant="outline"
            onClick={() => setSelectedDispute(item)}
            className={`min-h-[44px] px-3 text-xs ${
              isOpen
                ? 'text-accent border-accent/40 hover:bg-accent-soft hover:border-accent font-semibold'
                : 'text-ink hover:text-accent'
            }`}
          >
            {isOpen ? (
              <>
                <Gavel className="h-3.5 w-3.5 mr-1" />
                <span>Phân xử</span>
              </>
            ) : (
              <span>Xem kết quả</span>
            )}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xử lý Khiếu nại & Tranh chấp"
        description="Sổ theo dõi và phân xử tranh chấp hợp đồng thu âm, bảo chứng giải ngân hoặc hoàn tiền ký quỹ"
      />

      {/* Filter Toolbar & Status Filter Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-surface-subtle text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-surface text-ink shadow-xs font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Tất cả tranh chấp
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('OPEN');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === 'OPEN'
                  ? 'bg-status-error-bg text-status-error-text shadow-xs font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Đang thụ lý (Chờ phân xử)
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('RESOLVED');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === 'RESOLVED'
                  ? 'bg-status-success-bg text-status-success-text shadow-xs font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Đã giải quyết
            </button>
          </div>
        </div>

        <FilterToolbar
          searchPlaceholder="Tìm theo mã khiếu nại, mã hợp đồng, bên khởi tạo hoặc lý do..."
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
        emptyDescription={
          statusFilter === 'OPEN'
            ? 'Hiện không có tranh chấp nào đang chờ phân xử.'
            : 'Hiện không có tranh chấp hợp đồng cần theo dõi.'
        }
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

      {/* Upgraded Admin Dispute Detail & Resolution Modal */}
      {selectedDispute && (
        <AdminDisputeDetailModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
        />
      )}
    </div>
  );
};

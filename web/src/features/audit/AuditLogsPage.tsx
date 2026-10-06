import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, User, Calendar, Tag } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { Button } from '@/components/ui/button';
import { auditApi } from '@/services/api/audit';
import { AuditLogItem } from '@/types/audit';
import { formatDateTime } from '@/utils/formatters';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => auditApi.getAllAuditLogs(),
  });

  const rawItems = data?.data || [];

  const filteredItems = search.trim()
    ? rawItems.filter(
        (log) =>
          log.id.toString().includes(search.trim()) ||
          log.actionType?.toLowerCase().includes(search.toLowerCase()) ||
          log.targetType?.toLowerCase().includes(search.toLowerCase()) ||
          log.note?.toLowerCase().includes(search.toLowerCase()) ||
          log.actorId?.toString().includes(search.trim())
      )
    : rawItems;

  const totalElements = filteredItems.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedItems = filteredItems.slice(page * size, (page + 1) * size);

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'id',
      header: 'Mã ghi nhận',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-muted">
            <History className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-semibold text-ink">
            LOG #{item.id}
          </span>
        </div>
      ),
    },
    {
      key: 'actorId',
      header: 'Tác tử thực hiện',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-ink font-mono">
          <User className="h-3.5 w-3.5 text-muted shrink-0" />
          <span>User ID #{item.actorId}</span>
        </div>
      ),
    },
    {
      key: 'actionType',
      header: 'Hành động',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-sm">
          {item.actionType}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Đối tượng tác động',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-ink font-mono">
          <Tag className="h-3 w-3 text-muted" />
          <span>{item.targetType} #{item.targetId}</span>
        </div>
      ),
    },
    {
      key: 'note',
      header: 'Chi tiết / Ghi chú',
      render: (item) => (
        <p className="text-xs text-muted max-w-sm truncate" title={item.note}>
          {item.note || '—'}
        </p>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời điểm ghi sổ',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <Calendar className="h-3.5 w-3.5 text-border" />
          <span>{formatDateTime(item.createdAt)}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hệ thống"
        description="Sổ lưu trữ toàn bộ lịch sử thao tác hành chính và biến động dữ liệu quan trọng trên nền tảng Sử Ký"
      />

      <FilterToolbar
        searchPlaceholder="Tìm kiếm theo mã log, hành động, đối tượng hoặc ghi chú..."
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
          <span>Không thể tải dữ liệu nhật ký hệ thống. Vui lòng thử lại.</span>
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
        emptyTitle="Chưa có bản ghi nhật ký"
        emptyDescription="Hiện chưa có nhật ký thao tác nào được ghi nhận trên hệ thống."
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

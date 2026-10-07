import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, User, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { UsersChannelsNav } from '../users/components/UsersChannelsNav';
import { channelsApi } from '@/services/api/channels';
import { ChannelItem } from '@/types/channel';
import { formatDateTime } from '@/utils/formatters';

export const ChannelsListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-channels-list', page, size],
    queryFn: () => channelsApi.getAllChannels(page, size),
  });

  const pageData = data?.data;
  const rawItems = pageData?.items || pageData?.content || [];

  const items = search.trim()
    ? rawItems.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : rawItems;

  const totalElements = pageData?.totalElements || items.length;
  const totalPages = pageData?.totalPages || Math.ceil(totalElements / size);

  const columns: Column<ChannelItem>[] = [
    {
      key: 'channel',
      header: 'Kênh Podcast',
      render: (item) => (
        <div className="flex items-start gap-3 max-w-sm">
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.name}
              className="h-10 w-10 shrink-0 rounded-md object-cover border border-border"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Radio className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-ink truncate leading-tight">
              {item.name}
            </span>
            <p className="text-xs text-muted truncate mt-0.5 max-w-[260px]">
              {item.description || 'Chưa có mô tả kênh'}
            </p>
            <span className="font-mono text-[10px] text-muted">ID #{item.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'creatorId',
      header: 'Chủ sở hữu Kênh',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-ink font-mono">
          <User className="h-3.5 w-3.5 text-muted" />
          <span>Creator ID #{item.creatorId}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái kênh',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Ngày khởi tạo',
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
        title="Danh mục Kênh Podcast"
        description="Tra cứu các kênh podcast của Nhà sáng tạo đã được xuất bản và hoạt động trên Sử Ký"
      />

      {/* Sub-navigation between Users and Channels */}
      <UsersChannelsNav />

      {/* Filter Toolbar */}
      <FilterToolbar
        searchPlaceholder="Tìm kiếm theo tên kênh hoặc nội dung mô tả..."
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

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải danh sách kênh podcast. Vui lòng thử lại.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="min-h-[44px] px-3.5 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      {/* Data Table with embedded Pagination */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Chưa có kênh podcast nào"
        emptyDescription="Hiện chưa có kênh podcast nào hoạt động hoặc khớp với từ khóa tìm kiếm."
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

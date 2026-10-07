import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Video } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AiShieldBadge } from './components/AiShieldBadge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { moderationApi, ModerationQueryParams } from '@/services/api/moderation';
import { AdminModerationItem } from '@/types/moderation';
import { formatDateTime, formatDuration } from '@/utils/formatters';

const DECISION_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã xuất bản' },
  { id: 'REJECTED', label: 'Từ chối' },
];

export const ModerationQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [decision, setDecision] = useState('');
  const [tier, setTier] = useState('');

  const queryParams: ModerationQueryParams = {
    page,
    size,
    search: search.trim() || undefined,
    decision: decision || undefined,
    tier: tier || undefined,
    sortBy: 'id',
    sortDir: 'desc',
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-moderation-reviews', queryParams],
    queryFn: () => moderationApi.getReviews(queryParams),
  });

  const pageData = data?.data;
  const items = pageData?.items || pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  const handleReset = () => {
    setSearch('');
    setDecision('');
    setTier('');
    setPage(0);
  };

  const columns: Column<AdminModerationItem>[] = [
    {
      key: 'title',
      header: 'Tiêu đề & Thời lượng',
      render: (item) => (
        <div className="flex items-start gap-3 max-w-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-muted">
            <Video className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-ink truncate leading-tight hover:underline cursor-pointer" onClick={() => navigate(`/admin/moderation/${item.reviewId}`)}>
              {item.title}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted">
              {item.durationSeconds ? (
                <span className="font-mono">{formatDuration(item.durationSeconds)}</span>
              ) : (
                <span>Không có độ dài</span>
              )}
              <span>•</span>
              <span className="font-mono text-[11px]">ID #{item.reviewId}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Kênh & Tác giả',
      render: (item) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-ink truncate">{item.channelName || 'Chưa đặt tên'}</span>
          <span className="text-xs text-muted truncate font-mono">{item.creatorEmail}</span>
        </div>
      ),
    },
    {
      key: 'aiShield',
      header: 'Thẩm định AI Shield',
      render: (item) => (
        <div className="flex flex-col gap-1 items-start">
          <AiShieldBadge tier={item.aiShieldTier} label={item.aiShieldTierLabel} />
          {item.aiShieldReason && (
            <span className="text-[11px] text-muted truncate max-w-[200px]" title={item.aiShieldReason}>
              {item.aiShieldReason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'decision',
      header: 'Trạng thái duyệt',
      render: (item) => <StatusBadge status={item.decision} />,
    },
    {
      key: 'createdAt',
      header: 'Thời gian gửi',
      render: (item) => (
        <span className="text-xs text-muted font-mono">
          {formatDateTime(item.createdAt)}
        </span>
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
            navigate(`/admin/moderation/${item.reviewId}`);
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
        title="Kiểm duyệt nội dung"
        description="Hàng đợi kiểm duyệt video và thẩm định học thuật với sự hỗ trợ của AI Shield"
      />

      {/* Decision Tabs */}
      <div className="flex border-b border-border space-x-1" role="tablist">
        {DECISION_TABS.map((tab) => {
          const isActive = decision === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setDecision(tab.id);
                setPage(0);
              }}
              className={`min-h-[44px] px-4 text-xs font-medium border-b-2 transition-colors duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-sm ${
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
        searchPlaceholder="Tìm kiếm theo tiêu đề video hoặc tên kênh..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        showReset={Boolean(search || decision || tier)}
        onReset={handleReset}
        filters={
          <div className="w-48">
            <Select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Tất cả phân tầng AI</option>
              <option value="RED_ALERT">Báo động đỏ (Vi phạm)</option>
              <option value="FAIR">Khá (Cần lưu ý)</option>
              <option value="GOOD">Tốt (Đạt chuẩn)</option>
              <option value="EXCELLENT">Xuất sắc</option>
            </Select>
          </div>
        }
      />

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải danh sách hàng đợi kiểm duyệt. Vui lòng thử lại.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="min-h-[44px] px-3.5 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      {/* Data Table with embedded Pagination */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.reviewId}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/admin/moderation/${item.reviewId}`)}
        emptyTitle="Hàng đợi kiểm duyệt trống"
        emptyDescription="Hiện không có video nào cần kiểm duyệt hoặc khớp với bộ lọc hiện tại."
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

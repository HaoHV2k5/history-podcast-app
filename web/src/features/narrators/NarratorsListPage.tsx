import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mic, Play, Volume2, Globe } from 'lucide-react';
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
import { narratorsApi } from '@/services/api/narrators';
import { NarratorProfileItem, NarratorDemoItem } from '@/types/narrator';
import { formatDateTime } from '@/utils/formatters';

export const NarratorsListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');

  // Selected Narrator for Audio Demo Preview
  const [selectedNarrator, setSelectedNarrator] = useState<NarratorProfileItem | null>(null);

  const { data: narratorsData, isLoading: narratorsLoading, isError, refetch } = useQuery({
    queryKey: ['admin-narrators'],
    queryFn: () => narratorsApi.getAllNarrators(),
  });

  const { data: demosData } = useQuery({
    queryKey: ['admin-narrator-demos'],
    queryFn: () => narratorsApi.getAllDemos(),
  });

  const rawNarrators = narratorsData?.data || [];
  const allDemos = demosData?.data || [];

  const filteredNarrators = search.trim()
    ? rawNarrators.filter(
        (n) =>
          n.id.toString().includes(search.trim()) ||
          n.userId.toString().includes(search.trim()) ||
          n.languages?.toLowerCase().includes(search.toLowerCase()) ||
          n.bio?.toLowerCase().includes(search.toLowerCase())
      )
    : rawNarrators;

  const totalElements = filteredNarrators.length;
  const totalPages = Math.ceil(totalElements / size);
  const paginatedNarrators = filteredNarrators.slice(page * size, (page + 1) * size);

  // Find demos for selected narrator
  const currentDemos: NarratorDemoItem[] = selectedNarrator
    ? allDemos.filter((d) => d.narratorProfileId === selectedNarrator.id)
    : [];

  const columns: Column<NarratorProfileItem>[] = [
    {
      key: 'identity',
      header: 'Thuyết minh viên',
      render: (item) => {
        const demoCount = allDemos.filter((d) => d.narratorProfileId === item.id).length;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Mic className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-xs font-semibold text-ink">
                Hồ sơ Thuyết minh #{item.id}
              </span>
              <span className="text-xs text-muted font-mono">
                User ID #{item.userId}
              </span>
              {demoCount > 0 && (
                <span className="text-[10px] text-accent font-medium mt-0.5 inline-flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  {demoCount} tệp ghi âm mẫu
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'languages',
      header: 'Chuyên môn & Giọng đọc',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-ink">
          <Globe className="h-3.5 w-3.5 text-muted shrink-0" />
          <span>{item.languages || 'Tiếng Việt (Toàn quốc)'}</span>
        </div>
      ),
    },
    {
      key: 'bio',
      header: 'Tiểu sử tóm tắt',
      render: (item) => (
        <p className="text-xs text-muted max-w-xs truncate" title={item.bio}>
          {item.bio || 'Chưa cung cấp thông tin giới thiệu'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Ngày gia nhập',
      render: (item) => (
        <span className="text-xs text-muted font-mono">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Bản thu mẫu',
      stickyRight: true,
      align: 'right',
      render: (item) => {
        const demoCount = allDemos.filter((d) => d.narratorProfileId === item.id).length;
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={demoCount === 0}
            onClick={() => setSelectedNarrator(item)}
            className="h-8 px-2.5 text-xs text-muted hover:text-ink hover:border-accent disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            <span>Nghe mẫu ({demoCount})</span>
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh bạ Thuyết minh viên"
        description="Tra cứu danh bạ nghệ sĩ giọng đọc và thẩm định các tệp demo ghi âm phục vụ sản xuất nội dung"
      />

      <FilterToolbar
        searchPlaceholder="Tìm theo mã hồ sơ, mã user, giọng đọc, ngôn ngữ..."
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
          <span>Không thể tải danh bạ thuyết minh viên. Vui lòng thử lại.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginatedNarrators}
        keyExtractor={(item) => item.id}
        isLoading={narratorsLoading}
        emptyTitle="Không tìm thấy thuyết minh viên nào"
        emptyDescription="Hiện chưa có hồ sơ thuyết minh viên nào được đăng ký hoặc khớp với bộ lọc."
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        size={size}
        onPageChange={setPage}
      />

      {/* Audio Demo Player Modal */}
      {selectedNarrator && (
        <Dialog open={Boolean(selectedNarrator)} onOpenChange={(open) => !open && setSelectedNarrator(null)}>
          <DialogContent maxWidth="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-accent" />
                <span>Bản thu mẫu của Thuyết minh #{selectedNarrator.id}</span>
              </DialogTitle>
              <DialogDescription>
                Danh sách các tệp demo giọng đọc đã được tải lên phục vụ đối soát chất lượng âm thanh.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {currentDemos.length > 0 ? (
                currentDemos.map((demo) => (
                  <div key={demo.id} className="rounded-lg border border-border bg-surface-subtle p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-ink truncate max-w-[200px]">
                        {demo.title || `Bản thu #${demo.id}`}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {formatDateTime(demo.uploadedAt)}
                      </span>
                    </div>

                    <audio controls className="w-full h-8" preload="none">
                      <source src={demo.fileUrl} type="audio/mpeg" />
                      Trình duyệt không hỗ trợ phát âm thanh.
                    </audio>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted text-center py-4">
                  Không có tệp thu âm mẫu nào khả dụng.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

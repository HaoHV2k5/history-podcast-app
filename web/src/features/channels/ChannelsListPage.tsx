import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, User, Calendar, Search, Eye, X } from 'lucide-react';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import { channelsApi } from '@/services/api/channels';
import { ChannelItem } from '@/types/channel';
import { formatDateTime } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { AdminUsersHeroBanner } from '../users/components/AdminUsersHeroBanner';
import { AdminUsersTabs } from '../users/components/AdminUsersTabs';

export const ChannelsListPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [detailChannel, setDetailChannel] = useState<ChannelItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-channels-list', page, size],
    queryFn: () => channelsApi.getAllChannels(page, size),
  });

  const pageData = data?.data;
  const rawItems: ChannelItem[] = pageData?.items || pageData?.content || [];

  const items = useMemo(() => {
    if (!search.trim()) return rawItems;
    const s = search.toLowerCase();
    return rawItems.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s) ||
        String(c.creatorId).includes(s) ||
        String(c.id).includes(s)
    );
  }, [rawItems, search]);

  const totalElements = pageData?.totalElements || items.length;
  const totalPages = pageData?.totalPages || Math.ceil(totalElements / size) || 1;

  // Entrance GSAP animation
  useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current || !containerRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(heroRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' });
      }
      if (tabsRef.current) {
        tl.fromTo(tabsRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, clearProps: 'transform,opacity' }, '-=0.15');
      }
      if (contentRef.current) {
        tl.fromTo(contentRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' }, '-=0.1');
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* 1. Unified Hero Banner */}
      <div ref={heroRef}>
        <AdminUsersHeroBanner />
      </div>

      {/* 2. Sub-navigation tabs: activeTab="channels" */}
      <div ref={tabsRef}>
        <AdminUsersTabs activeTab="channels" />
      </div>

      {/* 3. Toolbar & Content Table */}
      <div ref={contentRef} className="space-y-4">
        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên kênh, mô tả hoặc Creator ID..."
              className="h-10 w-full rounded-xl border border-[#E7E5E4] bg-white pl-10 pr-9 text-xs text-[#1F1612] placeholder-stone-400 transition-colors focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-stone-500 font-medium">
            <span>Tổng số: <strong>{totalElements}</strong> kênh</span>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-[#DC2626] flex items-center justify-between">
            <span>Không thể tải danh sách kênh podcast. Vui lòng thử lại.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
              Tải lại
            </Button>
          </div>
        )}

        {/* Channels Data Table */}
        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white p-8 space-y-4 shadow-2xs">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-stone-100 animate-pulse">
                <div className="h-12 w-12 bg-stone-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-stone-100 rounded" />
                  <div className="h-3 w-64 bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E5E4] bg-white p-12 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF5F5] text-[#991B1B] mb-3">
              <Radio className="h-7 w-7 opacity-80" />
            </div>
            <h3 className="text-base font-bold text-[#1F1612]">Chưa có kênh podcast nào</h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm">
              Hiện chưa có kênh podcast nào hoạt động hoặc khớp với từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5]/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider select-none">
                    <th scope="col" className="px-5 py-3.5">Kênh Podcast</th>
                    <th scope="col" className="px-5 py-3.5">Chủ sở hữu Kênh</th>
                    <th scope="col" className="px-5 py-3.5">Trạng thái kênh</th>
                    <th scope="col" className="px-5 py-3.5">Ngày khởi tạo</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE6] text-xs">
                  {items.map((channel) => (
                    <tr
                      key={channel.id}
                      className="group transition-colors duration-150 hover:bg-[#FAF8F5]/80"
                    >
                      {/* Channel Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3.5 max-w-md">
                          {channel.avatarUrl ? (
                            <img
                              src={channel.avatarUrl}
                              alt={channel.name}
                              className="h-11 w-11 shrink-0 rounded-xl object-cover border border-[#E7E5E4] shadow-2xs"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#991B1B] border border-[#FFE4E6]">
                              <Radio className="h-5 w-5" />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[#1F1612] text-sm truncate">
                              {channel.name}
                            </span>
                            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5 max-w-sm">
                              {channel.description || 'Chưa có mô tả kênh podcast'}
                            </p>
                            <span className="font-mono text-[10px] text-stone-400 mt-1">
                              Channel ID: #{channel.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Creator ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-stone-700 font-mono">
                          <User className="h-3.5 w-3.5 text-stone-400" />
                          <span>Creator ID #{channel.creatorId}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          <span>Đang phát sóng</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-stone-400" />
                          <span>{formatDateTime(channel.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailChannel(channel)}
                          className="h-8 rounded-lg border-[#E7E5E4] px-3 text-xs text-stone-700 hover:text-[#991B1B] hover:border-[#991B1B] hover:bg-[#FFF5F5]"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>Xem chi tiết</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-[#F0EBE6] px-5 py-3 select-none text-xs text-stone-600">
              <span>Trang {page + 1} / {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="h-8 rounded-lg text-xs"
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-lg text-xs"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Detail Modal */}
      {detailChannel && (
        <Dialog open={Boolean(detailChannel)} onOpenChange={(open) => !open && setDetailChannel(null)}>
          <DialogContent maxWidth="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#1F1612]">
                Chi tiết Kênh Podcast
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Thông tin kênh phát thanh đã đăng ký trên Sử Ký.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center gap-3.5 p-3 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]">
                {detailChannel.avatarUrl ? (
                  <img
                    src={detailChannel.avatarUrl}
                    alt={detailChannel.name}
                    className="h-14 w-14 rounded-xl object-cover border border-[#E7E5E4]"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#991B1B]">
                    <Radio className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#1F1612]">{detailChannel.name}</h4>
                  <p className="font-mono text-[11px] text-stone-400">ID #{detailChannel.id}</p>
                  <p className="text-[11px] text-stone-600 font-mono mt-0.5">
                    Chủ kênh: Creator #{detailChannel.creatorId}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-stone-700 block">Mô tả kênh:</span>
                <p className="rounded-xl border border-[#F0EBE6] bg-white p-3 text-stone-600 leading-relaxed">
                  {detailChannel.description || 'Chưa có thông tin mô tả giới thiệu kênh.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-stone-500 pt-1">
                <span>Ngày tạo kênh:</span>
                <span className="font-mono">{formatDateTime(detailChannel.createdAt)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailChannel(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

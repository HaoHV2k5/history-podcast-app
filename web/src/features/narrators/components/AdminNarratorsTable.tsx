import React, { useState, useRef } from 'react';
import {
  Eye,
  MoreVertical,
  Mail,
  Phone,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Mic,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminNarratorRow } from '../narratorsLogic';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';

export interface AdminNarratorsTableProps {
  rows: AdminNarratorRow[];
  totalElements: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onViewDetail: (row: AdminNarratorRow) => void;
  onApprove: (row: AdminNarratorRow) => void;
  onReject: (row: AdminNarratorRow) => void;
  isLoading?: boolean;
}

export const AdminNarratorsTable: React.FC<AdminNarratorsTableProps> = ({
  rows,
  totalElements,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  // Audio playback state for demo clips
  const [playingDemoId, setPlayingDemoId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const startIndex = totalElements > 0 ? page * pageSize + 1 : 0;
  const endIndex = Math.min((page + 1) * pageSize, totalElements);

  const handleTogglePlay = (row: AdminNarratorRow) => {
    if (playingDemoId === row.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingDemoId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // If demo fileUrl exists, play it
      const demoUrl = row.primaryDemo?.fileUrl;
      if (demoUrl) {
        const audio = new Audio(demoUrl);
        audioRef.current = audio;
        audio.play().catch(() => {
          // If browser blocks autoplay or mock URL fails, keep playing state for visual feedback
        });
        audio.onended = () => setPlayingDemoId(null);
      }
      setPlayingDemoId(row.id);
    }
  };

  return (
    <div className="relative z-10 w-full space-y-4">
      {/* 1. Main Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs">
        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="table-auto sm:table-fixed w-full border-collapse text-left font-sans text-xs sm:text-[13px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5] text-stone-500 font-semibold select-none">
                <th className="w-12 px-2.5 py-3.5 text-center whitespace-nowrap">#</th>
                <th className="w-[18%] min-w-[160px] px-3 py-3.5 whitespace-nowrap">Thuyết minh viên</th>
                <th className="w-[18%] min-w-[160px] px-3 py-3.5 whitespace-nowrap">Thông tin liên hệ</th>
                <th className="w-[11%] min-w-[110px] px-3 py-3.5 whitespace-nowrap">Giọng đọc</th>
                <th className="w-[12%] min-w-[110px] px-3 py-3.5 whitespace-nowrap">Ngôn ngữ</th>
                <th className="w-[15%] min-w-[140px] px-3 py-3.5 whitespace-nowrap">Hồ sơ demo</th>
                <th className="w-[12%] min-w-[110px] px-3 py-3.5 whitespace-nowrap">Ngày đăng ký</th>
                <th className="w-[14%] min-w-[135px] px-3 py-3.5 whitespace-nowrap">Trạng thái</th>
                <th className="w-[160px] min-w-[160px] px-3 py-3.5 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#F0EBE6] text-stone-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#991B1B] border-t-transparent" />
                      <span>Đang tải danh bạ thuyết minh viên...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-stone-400 space-y-2.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                        <Mic className="h-6 w-6 stroke-[1.5]" />
                      </div>
                      <span className="font-semibold text-stone-700 text-sm">Chưa có hồ sơ thuyết minh viên nào</span>
                      <p className="text-xs text-stone-400 leading-relaxed text-pretty">
                        Không tìm thấy hồ sơ nghệ sĩ giọng đọc phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const isPlaying = playingDemoId === row.id;
                  const rowNumber = page * pageSize + idx + 1;

                  return (
                    <tr
                      key={row.id}
                      className="group transition-colors duration-150 hover:bg-[#FAF8F5]/80"
                    >
                      {/* # (Row Index) */}
                      <td className="px-2.5 py-3 text-center text-stone-400 font-mono text-xs tabular-nums select-none whitespace-nowrap">
                        {rowNumber}
                      </td>

                      {/* Thuyết minh viên */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {row.avatarUrl ? (
                            <img
                              src={row.avatarUrl}
                              alt={row.fullName}
                              className="h-9 w-9 shrink-0 rounded-full object-cover border border-stone-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#E7E5E4] text-xs font-bold text-[#991B1B] select-none">
                              {row.initials}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-stone-900 truncate group-hover:text-[#991B1B] transition-colors">
                              {row.fullName}
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono tabular-nums truncate">
                              User ID #{row.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Thông tin liên hệ */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-stone-600 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <span className="truncate text-xs">{row.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-stone-500 truncate">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <span className="font-mono text-[11px] tabular-nums truncate">{row.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Giọng đọc */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${row.voiceGenderBadgeClass}`}
                        >
                          <span className="font-bold text-xs">{row.voiceGenderSymbol}</span>
                          <span className="whitespace-nowrap">{row.voiceGenderLabel}</span>
                        </span>
                      </td>

                      {/* Ngôn ngữ */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-xs text-stone-800 font-medium">
                          <span className="text-sm leading-none" role="img" aria-label={row.languageLabel}>
                            {row.languageFlag}
                          </span>
                          <span className="whitespace-nowrap">{row.languageLabel}</span>
                        </div>
                      </td>

                      {/* Hồ sơ demo (Interactive Audio Player Pill) */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#F0EBE6] text-stone-700 hover:border-stone-300 transition-colors">
                          <button
                            type="button"
                            onClick={() => handleTogglePlay(row)}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                              isPlaying
                                ? 'bg-[#991B1B] text-white shadow-xs scale-105'
                                : 'bg-[#FFF0F2] text-[#991B1B] hover:bg-[#991B1B] hover:text-white'
                            }`}
                            title={isPlaying ? 'Tạm dừng nghe mẫu' : 'Phát bản thu âm mẫu'}
                          >
                            {isPlaying ? (
                              <Pause className="h-3 w-3 fill-current" />
                            ) : (
                              <Play className="h-3 w-3 fill-current ml-0.5" />
                            )}
                          </button>

                          {/* Soundwave bars graphic */}
                          <div className="flex items-center gap-0.5 h-3 px-0.5" aria-hidden="true">
                            <span
                              className={`w-0.5 rounded-full transition-all duration-300 ${
                                isPlaying ? 'h-3 bg-[#991B1B] animate-pulse' : 'h-1.5 bg-stone-300'
                              }`}
                            />
                            <span
                              className={`w-0.5 rounded-full transition-all duration-300 ${
                                isPlaying ? 'h-2 bg-[#991B1B] animate-pulse delay-75' : 'h-2.5 bg-stone-300'
                              }`}
                            />
                            <span
                              className={`w-0.5 rounded-full transition-all duration-300 ${
                                isPlaying ? 'h-3 bg-[#991B1B] animate-pulse delay-150' : 'h-1 bg-stone-300'
                              }`}
                            />
                            <span
                              className={`w-0.5 rounded-full transition-all duration-300 ${
                                isPlaying ? 'h-2.5 bg-[#991B1B] animate-pulse delay-100' : 'h-2 bg-stone-300'
                              }`}
                            />
                          </div>

                          {/* Duration */}
                          <span className="font-mono text-[11px] tabular-nums text-stone-500">
                            {row.primaryDemoDurationStr}
                          </span>
                        </div>
                      </td>

                      {/* Ngày đăng ký */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex flex-col text-xs leading-tight">
                          <span className="font-sans tabular-nums text-stone-800 whitespace-nowrap">
                            {row.dateStr}
                          </span>
                          <span className="font-mono tabular-nums text-stone-400 text-[11px] whitespace-nowrap">
                            {row.timeStr}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái (1 HÀNG DUY NHẤT whitespace-nowrap) */}
                      <td className="w-[14%] min-w-[135px] px-3 py-3 whitespace-nowrap">
                        <span
                          style={{
                            backgroundColor: row.statusConfig.bg,
                            borderColor: row.statusConfig.border,
                            color: row.statusConfig.text,
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap select-none"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${row.statusConfig.dot}`}
                            aria-hidden="true"
                          />
                          <span className="whitespace-nowrap">{row.statusConfig.label}</span>
                        </span>
                      </td>

                      {/* Thao tác (1 HÀNG DUY NHẤT whitespace-nowrap) */}
                      <td className="w-[160px] min-w-[160px] px-3 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* Nút [👁 Xem chi tiết] */}
                          <button
                            type="button"
                            onClick={() => onViewDetail(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-medium text-stone-700 hover:bg-[#FAF8F5] hover:border-stone-300 hover:text-stone-900 transition-colors shadow-none shrink-0 whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            <span className="whitespace-nowrap">Xem chi tiết</span>
                          </button>

                          {/* Nút Ba Chấm [...] Menu Thao Tác Nhanh */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E5E4] bg-white text-stone-500 hover:bg-[#FAF8F5] hover:text-stone-900 hover:border-stone-300 transition-colors shrink-0"
                                aria-label="Thao tác khác"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              sideOffset={4}
                              className="w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg z-[999]"
                            >
                              <DropdownMenuItem
                                onClick={() => onViewDetail(row)}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-stone-700 rounded-lg cursor-pointer hover:bg-stone-50"
                              >
                                <Eye className="h-4 w-4 text-stone-400" />
                                <span>Xem toàn bộ hồ sơ</span>
                              </DropdownMenuItem>

                              {row.status !== 'APPROVED' && (
                                <DropdownMenuItem
                                  onClick={() => onApprove(row)}
                                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-emerald-700 rounded-lg cursor-pointer hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span>Phê duyệt hồ sơ</span>
                                </DropdownMenuItem>
                              )}

                              {row.status !== 'REJECTED' && (
                                <DropdownMenuItem
                                  onClick={() => onReject(row)}
                                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-700 rounded-lg cursor-pointer hover:bg-rose-50"
                                >
                                  <XCircle className="h-4 w-4 text-rose-600" />
                                  <span>Từ chối hồ sơ</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator className="my-1 border-stone-100" />

                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `mailto:${row.email}?subject=Sử Ký - Phản hồi về hồ sơ Thuyết minh viên #${row.id}`;
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-stone-600 rounded-lg cursor-pointer hover:bg-stone-50"
                              >
                                <Mail className="h-4 w-4 text-stone-400" />
                                <span>Gửi email liên hệ</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Pagination Footer chuẩn Sử Ký */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#F0EBE6] bg-[#FAF8F5] px-4 py-3 select-none text-xs text-stone-600">
          {/* Left: Summary counter */}
          <div>
            <span>Hiển thị </span>
            <span className="font-semibold text-stone-900 tabular-nums">
              {startIndex}–{endIndex}
            </span>
            <span> trong tổng số </span>
            <span className="font-semibold text-stone-900 tabular-nums">{totalElements}</span>
            <span> thuyết minh viên</span>
          </div>

          {/* Right: Page size select & pagination buttons */}
          <div className="flex items-center gap-3">
            {/* Page Size Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(0);
                }}
                className="rounded-lg border border-[#E7E5E4] bg-white px-2 py-1 text-xs font-medium text-stone-700 focus:border-[#991B1B] focus:outline-none"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => onPageChange(page - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                // Show pages around current page if many pages
                if (totalPages > 7) {
                  if (i !== 0 && i !== totalPages - 1 && Math.abs(i - page) > 1) {
                    if (i === 1 || i === totalPages - 2) {
                      return (
                        <span key={i} className="px-1 text-stone-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                }

                const isActive = page === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onPageChange(i)}
                    className={`h-7 min-w-7 px-1.5 rounded-lg text-xs font-medium tabular-nums transition-colors ${
                      isActive
                        ? 'bg-[#991B1B] text-white font-semibold shadow-xs'
                        : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

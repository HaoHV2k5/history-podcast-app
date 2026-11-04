import React, { useState } from 'react';
import {
  Eye,
  Pencil,
  Check,
  ArrowRight,
  Plus,
  Trash2,
  XCircle,
  KeyRound,
  LogOut,
  FileText,
  Settings,
  User,
  Shield,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  ArrowUpRight,
  History,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import type {
  AdminAuditLogRow,
  AuditActionKind,
  AuditActorBadgeTone,
  AuditLogCategory,
  AuditTargetIconKind,
} from '../auditLogsLogic';

interface AdminAuditLogsTableProps {
  rows: AdminAuditLogRow[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (row: AdminAuditLogRow) => void;
  onViewActor?: (row: AdminAuditLogRow) => void;
  onFilterByActor: (row: AdminAuditLogRow) => void;
  onFilterByAction: (actionKind: AuditActionKind) => void;
  onCopyLogSummary: (row: AdminAuditLogRow) => void;
  onNavigateTarget: (route: string) => void;
  onResetFilters: () => void;
  hasActiveFilters?: boolean;
  isLoading?: boolean;
}

function getActorInitialsBadgeClass(tone: AuditActorBadgeTone): string {
  switch (tone) {
    case 'amber':
      return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
    case 'rose':
      return 'bg-[#FFE4E6] text-[#BE123C] border-[#FECDD3]';
    case 'purple':
      return 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]';
    case 'emerald':
      return 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]';
    case 'blue':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

function getActorStatusDotClass(tone: AdminAuditLogRow['actorStatusTone']): string {
  if (tone === 'emerald') return 'bg-[#059669]';
  if (tone === 'rose') return 'bg-[#E11D48]';
  return 'bg-stone-400';
}

export function renderAuditActionIcon(kind: AuditActionKind) {
  switch (kind) {
    case 'UPDATE':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706]">
          <Pencil className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
      );
    case 'APPROVE':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669]">
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      );
    case 'LOGIN':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.4]" />
        </span>
      );
    case 'CREATE':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] border border-[#D1FAE5] text-[#059669]">
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      );
    case 'DELETE':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#EA580C]">
          <Trash2 className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
      );
    case 'REJECT':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <XCircle className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
      );
    case 'GRANT_ROLE':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB]">
          <KeyRound className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
      );
    case 'LOGOUT':
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-[#E11D48]">
          <LogOut className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
      );
    default:
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 border border-stone-200 text-stone-600">
          <History className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
      );
  }
}

export function renderAuditTargetIcon(kind: AuditTargetIconKind) {
  switch (kind) {
    case 'settings':
      return <Settings className="h-4 w-4 text-stone-500 shrink-0 stroke-[1.9]" />;
    case 'user':
      return <User className="h-4 w-4 text-stone-500 shrink-0 stroke-[1.9]" />;
    case 'shield':
      return <Shield className="h-4 w-4 text-stone-500 shrink-0 stroke-[1.9]" />;
    default:
      return <FileText className="h-4 w-4 text-stone-500 shrink-0 stroke-[1.9]" />;
  }
}

export function renderAuditCategoryBadge(
  category: AuditLogCategory,
  label: string
) {
  if (category === 'SYSTEM') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]/80 text-[#059669] text-xs font-semibold whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-[#059669] shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </span>
    );
  }
  if (category === 'SECURITY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF0F2] border border-[#FECDD3]/80 text-[#E11D48] text-xs font-semibold whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E11D48] shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]/80 text-[#2563EB] text-xs font-semibold whitespace-nowrap">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

const ActorAvatar: React.FC<{ row: AdminAuditLogRow }> = ({ row }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative shrink-0">
      {row.actorAvatarUrl && !imgError ? (
        <img
          src={row.actorAvatarUrl}
          alt={row.actorName}
          onError={() => setImgError(true)}
          className="h-9 w-9 shrink-0 rounded-full object-cover border border-stone-200/80"
        />
      ) : (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold tracking-tight ${getActorInitialsBadgeClass(
            row.actorBadgeTone
          )}`}
          aria-hidden="true"
        >
          {row.actorInitials}
        </div>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${getActorStatusDotClass(
          row.actorStatusTone
        )}`}
        title={`Trạng thái tài khoản: ${row.actorStatusLabel}`}
      />
    </div>
  );
};

export const AdminAuditLogsTable: React.FC<AdminAuditLogsTableProps> = ({
  rows,
  totalElements,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onViewActor,
  onFilterByActor,
  onFilterByAction,
  onCopyLogSummary,
  onNavigateTarget,
  onResetFilters,
  hasActiveFilters = false,
  isLoading = false,
}) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (row: AdminAuditLogRow) => {
    onCopyLogSummary(row);
    setCopiedId(row.id);
    setOpenMenuId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push('...');
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
    }
    return pages;
  };

  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min(totalElements, (currentPage + 1) * pageSize);

  return (
    <div className="relative z-10 w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs font-sans select-none">
      <div
        tabIndex={0}
        role="region"
        aria-label="Bảng danh sách nhật ký hệ thống"
        className="w-full overflow-x-auto lg:overflow-x-visible focus:outline-none"
      >
        <table className="table-auto sm:table-fixed w-full border-collapse font-sans text-left text-xs sm:text-[13px] text-stone-700">
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5] text-stone-500 font-semibold text-xs">
              {/* 1. # (w-12 px-2.5 text-center chuẩn Quy tắc 4 AGENTS.md) */}
              <th className="w-12 px-2.5 py-3.5 text-center whitespace-nowrap">#</th>
              {/* 2. Thời gian */}
              <th className="w-[10%] px-2.5 py-3.5 text-left whitespace-nowrap">
                Thời gian
              </th>
              {/* 3. Người thực hiện */}
              <th className="w-[18%] px-3 py-3.5 text-left whitespace-nowrap">
                Người thực hiện
              </th>
              {/* 4. Hành động */}
              <th className="w-[12%] px-2.5 py-3.5 text-left whitespace-nowrap">
                Hành động
              </th>
              {/* 5. Đối tượng */}
              <th className="w-[14%] px-2.5 py-3.5 text-left whitespace-nowrap">
                Đối tượng
              </th>
              {/* 6. Chi tiết */}
              <th className="w-[20%] px-3 py-3.5 text-left whitespace-nowrap">
                Chi tiết
              </th>
              {/* 7. Phân loại (1 hàng duy nhất, w-[13%] min-w-[135px] chuẩn Quy tắc 4 AGENTS.md) */}
              <th className="w-[13%] min-w-[135px] px-2.5 py-3.5 text-left whitespace-nowrap">
                Phân loại
              </th>
              {/* 8. Địa chỉ mạng */}
              <th className="w-[10%] px-2.5 py-3.5 text-left whitespace-nowrap">
                Địa chỉ mạng
              </th>
              {/* 9. Thao tác (1 hàng duy nhất, w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 chuẩn Quy tắc 4 AGENTS.md) */}
              <th className="w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap shrink-0">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3EFEA]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-2.5 py-4 text-center">
                    <div className="mx-auto h-4 w-4 rounded bg-stone-100" />
                  </td>
                  <td className="px-2.5 py-4">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-16 rounded bg-stone-100" />
                      <div className="h-3 w-12 rounded bg-stone-100" />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-stone-100 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-24 rounded bg-stone-100" />
                        <div className="h-3 w-28 rounded bg-stone-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-stone-100 shrink-0" />
                      <div className="h-3.5 w-16 rounded bg-stone-100" />
                    </div>
                  </td>
                  <td className="px-2.5 py-4">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-stone-100" />
                      <div className="h-3 w-16 rounded bg-stone-100" />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-3.5 w-4/5 rounded bg-stone-100" />
                  </td>
                  <td className="px-2.5 py-4">
                    <div className="h-6 w-20 rounded-full bg-stone-100" />
                  </td>
                  <td className="px-2.5 py-4">
                    <div className="h-3.5 w-20 rounded bg-stone-100" />
                  </td>
                  <td className="pl-2 pr-4 sm:pr-5 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="h-8 w-20 rounded-xl bg-stone-100" />
                      <div className="h-8 w-8 rounded-lg bg-stone-100" />
                    </div>
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-14 text-center">
                  <div className="mx-auto max-w-md space-y-3">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] flex items-center justify-center">
                      <History className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-stone-900">
                        {hasActiveFilters
                          ? 'Không tìm thấy bản ghi nhật ký phù hợp'
                          : 'Chưa có bản ghi nhật ký hệ thống'}
                      </h3>
                      <p className="text-xs text-stone-500 leading-relaxed text-pretty">
                        {hasActiveFilters
                          ? 'Không có bản ghi nào khớp với từ khóa hoặc tiêu chí lọc hiện tại. Hãy thử đặt lại bộ lọc để xem toàn bộ lịch sử.'
                          : 'Sổ lưu trữ nhật ký hiện đang trống. Các thao tác quản trị, cấu hình hệ thống và bảo mật sẽ tự động được ghi nhận tại đây.'}
                      </p>
                    </div>
                    {hasActiveFilters && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#991B1B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7F1D1D] active:scale-[0.97] transition-all cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Đặt lại bộ lọc</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowNumber = currentPage * pageSize + index + 1;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onViewDetail(row)}
                    className="group hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer"
                  >
                    {/* 1. # */}
                    <td className="w-12 px-2.5 py-3.5 text-center font-semibold text-stone-700 whitespace-nowrap tabular-nums">
                      {rowNumber}
                    </td>

                    {/* 2. Thời gian */}
                    <td className="px-2.5 py-3.5 whitespace-nowrap tabular-nums">
                      <span className="text-xs font-medium text-stone-700 block whitespace-nowrap tabular-nums">
                        {row.datePart}
                      </span>
                      <span className="text-[11px] text-stone-400 block whitespace-nowrap tabular-nums mt-0.5">
                        {row.timePart}
                      </span>
                    </td>

                    {/* 3. Người thực hiện (Nhấp trực tiếp mở hồ sơ & lịch sử tác nhân) */}
                    <td
                      className="px-3 py-3.5"
                      onClick={(e) => {
                        if (onViewActor) {
                          e.stopPropagation();
                          onViewActor(row);
                        }
                      }}
                    >
                      <div
                        className="flex items-center gap-2.5 min-w-0 group/actor"
                        title={`Xem chi tiết người thực hiện: ${row.actorName} (${row.actorRoleLabel})`}
                      >
                        <ActorAvatar row={row} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="font-semibold text-stone-900 group-hover/actor:text-[#991B1B] transition-colors text-xs sm:text-[13px] truncate"
                              title={row.actorName}
                            >
                              {row.actorName}
                            </span>
                          </div>
                          <span
                            className="text-[11px] text-stone-400 block truncate mt-0.5"
                            title={row.actorEmail}
                          >
                            {row.actorEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Hành động */}
                    <td className="px-2.5 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 whitespace-nowrap">
                        {renderAuditActionIcon(row.actionKind)}
                        <span className="font-bold text-stone-800 text-xs sm:text-[13px] whitespace-nowrap">
                          {row.actionLabel}
                        </span>
                      </div>
                    </td>

                    {/* 5. Đối tượng */}
                    <td className="px-2.5 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderAuditTargetIcon(row.targetIconKind)}
                        <div className="min-w-0 flex-1">
                          <span
                            className="font-semibold text-stone-800 text-xs sm:text-[13px] block truncate"
                            title={row.targetLabel}
                          >
                            {row.targetLabel}
                          </span>
                          <span
                            className="text-[11px] text-stone-400 tabular-nums block truncate mt-0.5"
                            title={row.targetSubtitle}
                          >
                            {row.targetSubtitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 6. Chi tiết */}
                    <td className="px-3 py-3.5">
                      <p
                        className="text-xs sm:text-[13px] text-stone-600 leading-relaxed line-clamp-2 break-words"
                        title={row.detailText}
                      >
                        {row.detailText}
                      </p>
                    </td>

                    {/* 7. Phân loại (1 hàng duy nhất, w-[13%] min-w-[135px] whitespace-nowrap) */}
                    <td className="w-[13%] min-w-[135px] px-2.5 py-3.5 whitespace-nowrap">
                      {renderAuditCategoryBadge(row.category, row.categoryLabel)}
                    </td>

                    {/* 8. Địa chỉ mạng */}
                    <td className="px-2.5 py-3.5 whitespace-nowrap tabular-nums">
                      {row.ipAddress ? (
                        <span className="text-xs font-medium text-stone-600 tabular-nums whitespace-nowrap">
                          {row.ipAddress}
                        </span>
                      ) : (
                        <span
                          className="text-xs text-stone-400 tabular-nums whitespace-nowrap"
                          title="Máy chủ hiện chưa lưu trữ trường địa chỉ mạng máy trạm cho bản ghi này"
                        >
                          Chưa ghi nhận
                        </span>
                      )}
                    </td>

                    {/* 9. Thao tác (1 hàng duy nhất: Nút Xem chi tiết + Nút 3 chấm dọc Ghost Icon Button) */}
                    <td
                      className="w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewDetail(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] text-xs font-semibold whitespace-nowrap shrink-0 transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                          <span className="whitespace-nowrap">Xem chi tiết</span>
                        </button>

                        <DropdownMenu
                          open={openMenuId === row.id}
                          onOpenChange={(open) =>
                            setOpenMenuId(open ? row.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Tùy chọn cho bản ghi nhật ký #${row.id}`}
                              className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4 shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-60 p-1.5 rounded-xl bg-white border border-[#F0EBE6] shadow-xl z-[999] duration-200 ease-out font-sans text-xs space-y-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onViewDetail(row);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                              <span>Xem chi tiết bản ghi (#{row.id})</span>
                            </button>

                            {onViewActor && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onViewActor(row);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                              >
                                <UserCheck className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                                <span className="truncate">
                                  Hồ sơ &amp; lịch sử của {row.actorName}
                                </span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onFilterByActor(row);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                            >
                              <Filter className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                              <span className="truncate">
                                Lọc theo {row.actorName}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onFilterByAction(row.actionKind);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                            >
                              <History className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                              <span>
                                Lọc hành động &ldquo;{row.actionLabel}&rdquo;
                              </span>
                            </button>

                            {row.targetRoute && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  if (row.targetRoute) {
                                    onNavigateTarget(row.targetRoute);
                                  }
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                                <span className="truncate">
                                  Đi tới trang {row.targetLabel}
                                </span>
                              </button>
                            )}

                            <div className="my-1 border-t border-[#F0EBE6]" />

                            <button
                              type="button"
                              onClick={() => handleCopy(row)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                              )}
                              <span>Sao chép thông tin bản ghi</span>
                            </button>
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

      {/* Thanh phân trang chuẩn Sử Ký dưới chân bảng */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-[#F0EBE6] bg-[#FAF8F5]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 select-none">
        <div>
          Hiển thị{' '}
          <strong className="font-bold text-stone-900 tabular-nums">
            {startItem}-{endItem}
          </strong>{' '}
          trong tổng số{' '}
          <strong className="font-bold text-stone-900 tabular-nums">
            {totalElements.toLocaleString('vi-VN')}
          </strong>{' '}
          bản ghi
        </div>

        <div className="flex items-center gap-2.5">
          {/* Chọn số lượng hiển thị trên mỗi trang */}
          <div className="relative">
            <select
              aria-label="Số lượng bản ghi hiển thị trên mỗi trang"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none rounded-xl border border-[#E7E5E4] bg-white pl-3 pr-8 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:border-[#991B1B] cursor-pointer shadow-2xs"
            >
              <option value={5}>Hiển thị 5 / trang</option>
              <option value={10}>Hiển thị 10 / trang</option>
              <option value={20}>Hiển thị 20 / trang</option>
              <option value={50}>Hiển thị 50 / trang</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rotate-90 text-stone-400" />
          </div>

          {/* Dãy nút số trang */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              aria-label="Trang trước"
              className="h-8 w-8 rounded-lg border border-[#E7E5E4] bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {getPageNumbers().map((p, idx) =>
              typeof p === 'string' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-stone-400 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {(p + 1).toLocaleString('vi-VN')}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() =>
                onPageChange(Math.min(totalPages - 1, currentPage + 1))
              }
              aria-label="Trang tiếp theo"
              className="h-8 w-8 rounded-lg border border-[#E7E5E4] bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Eye,
  Pencil,
  Mic,
  Settings,
  Briefcase,
  Shield,
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Copy,
  Trash2,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown';
import type { AdminRoleRow, RoleIconKind } from '../rolesLogic';

interface AdminRolesTableProps {
  rows: AdminRoleRow[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (row: AdminRoleRow) => void;
  onEditRole: (row: AdminRoleRow) => void;
  onAssignRoleToUser: (row: AdminRoleRow) => void;
  onDeleteRole: (row: AdminRoleRow) => void;
  onCopyRoleCode: (row: AdminRoleRow) => void;
  onOpenCreateRole: () => void;
  isLoading?: boolean;
}

function renderRoleIcon(kind: RoleIconKind) {
  switch (kind) {
    case 'eye':
      return <Eye className="h-4 w-4 stroke-[2]" />;
    case 'pencil':
      return <Pencil className="h-4 w-4 stroke-[2]" />;
    case 'mic':
      return <Mic className="h-4 w-4 stroke-[2]" />;
    case 'settings':
      return <Settings className="h-4 w-4 stroke-[2]" />;
    case 'briefcase':
      return <Briefcase className="h-4 w-4 stroke-[2]" />;
    default:
      return <Shield className="h-4 w-4 stroke-[2]" />;
  }
}

export const AdminRolesTable: React.FC<AdminRolesTableProps> = ({
  rows,
  totalElements,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEditRole,
  onAssignRoleToUser,
  onDeleteRole,
  onCopyRoleCode,
  onOpenCreateRole,
  isLoading = false,
}) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (row: AdminRoleRow) => {
    onCopyRoleCode(row);
    setCopiedId(row.id);
    setOpenMenuId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pagination page numbers
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
    <div className="relative z-10 w-full overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-xs font-sans">
      <div
        tabIndex={0}
        role="region"
        aria-label="Bảng danh sách vai trò và phân quyền"
        className="overflow-x-auto lg:overflow-x-visible focus:outline-none"
      >
        <table className="table-auto sm:table-fixed w-full border-collapse font-sans text-xs sm:text-[13px] text-stone-700 select-none">
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FAF8F5] text-stone-500 font-semibold text-xs">
              {/* # */}
              <th className="w-12 px-2.5 py-3.5 text-center whitespace-nowrap">#</th>
              {/* Tên vai trò */}
              <th className="w-[17%] min-w-[155px] px-3 py-3.5 text-left whitespace-nowrap">
                Tên vai trò
              </th>
              {/* Mô tả */}
              <th className="w-[23%] min-w-[190px] px-3 py-3.5 text-left whitespace-nowrap">
                Mô tả
              </th>
              {/* Phạm vi quyền hạn */}
              <th className="w-[25%] min-w-[215px] px-3 py-3.5 text-left whitespace-nowrap">
                Phạm vi quyền hạn
              </th>
              {/* Trạng thái */}
              <th className="w-[13%] min-w-[135px] px-3 py-3.5 text-left whitespace-nowrap">
                Trạng thái
              </th>
              {/* Số người dùng */}
              <th className="w-[10%] min-w-[95px] px-3 py-3.5 text-center whitespace-nowrap">
                Số người dùng
              </th>
              {/* Thao tác */}
              <th className="w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 py-3.5 text-right whitespace-nowrap shrink-0">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3EFEA]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-2.5 py-4 text-center">
                    <div className="mx-auto h-4 w-4 rounded bg-stone-100" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-stone-100 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-20 rounded bg-stone-100" />
                        <div className="h-3 w-12 rounded bg-stone-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-3.5 w-4/5 rounded bg-stone-100" />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex gap-1.5">
                      <div className="h-6 w-20 rounded-lg bg-stone-100" />
                      <div className="h-6 w-20 rounded-lg bg-stone-100" />
                      <div className="h-6 w-16 rounded-lg bg-stone-100" />
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="h-6 w-28 rounded-full bg-stone-100" />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="mx-auto h-4 w-8 rounded bg-stone-100" />
                  </td>
                  <td className="pl-2 pr-4 sm:pr-5 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="h-8 w-24 rounded-xl bg-stone-100" />
                      <div className="h-8 w-8 rounded-lg bg-stone-100" />
                    </div>
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="mx-auto max-w-sm space-y-3">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B] flex items-center justify-center">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-stone-900">
                        Không tìm thấy vai trò phù hợp
                      </h3>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Chưa có bản ghi vai trò nào khớp với bộ lọc hiện tại hoặc cơ sở dữ liệu đang trống.
                      </p>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onOpenCreateRole}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#991B1B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7F1D1D] active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <span>+ Thêm vai trò mới</span>
                      </button>
                    </div>
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
                    <td className="w-12 px-2.5 py-4 text-center font-bold text-stone-800 whitespace-nowrap tabular-nums">
                      {rowNumber}
                    </td>

                    {/* 2. Tên vai trò */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F2] border border-[#FFE4E6]/80 text-[#E11D48] transition-transform duration-200 group-hover:scale-105">
                          {renderRoleIcon(row.iconKind)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-stone-900 text-xs sm:text-[13px] uppercase tracking-tight block truncate">
                            {row.name}
                          </span>
                          <span className="text-[11px] text-stone-400 font-medium tabular-nums block truncate mt-0.5">
                            Mã #{row.id} • {row.shortLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Mô tả */}
                    <td className="px-3 py-4">
                      <p
                        className="text-xs sm:text-[13px] text-stone-600 leading-relaxed line-clamp-2 break-words"
                        title={row.description}
                      >
                        {row.description}
                      </p>
                    </td>

                    {/* 4. Phạm vi quyền hạn */}
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {row.permissionScopes.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F5F5F4] border border-[#E7E5E4]/80 text-stone-700 text-[11px] font-medium whitespace-nowrap"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 5. Trạng thái (1 hàng duy nhất, whitespace-nowrap) */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]/80 text-[#059669] text-xs font-semibold whitespace-nowrap">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-[#059669] text-white shrink-0" />
                        <span className="whitespace-nowrap">{row.statusLabel}</span>
                      </span>
                    </td>

                    {/* 6. Số người dùng (Real live count, tabular-nums, whitespace-nowrap) */}
                    <td
                      className="px-3 py-4 text-center whitespace-nowrap tabular-nums"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(row);
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(row);
                        }}
                        title={`Xem ${row.userCount} tài khoản thuộc vai trò ${row.shortLabel}`}
                        className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg font-bold text-stone-800 hover:bg-stone-100 hover:text-[#991B1B] tabular-nums transition-colors cursor-pointer"
                      >
                        {row.userCount.toLocaleString('vi-VN')}
                      </button>
                    </td>

                    {/* 7. Thao tác (1 hàng duy nhất, w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5) */}
                    <td
                      className="w-[170px] min-w-[170px] pl-2 pr-4 sm:pr-5 py-4 text-right whitespace-nowrap shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
                        {/* Nút Chỉnh sửa chuẩn mockup */}
                        <button
                          type="button"
                          onClick={() => onEditRole(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] text-xs font-semibold whitespace-nowrap shrink-0 transition-all shadow-2xs cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                          <span className="whitespace-nowrap">Chỉnh sửa</span>
                        </button>

                        {/* Nút 3 chấm dọc Ghost Icon Button */}
                        <DropdownMenu
                          open={openMenuId === row.id}
                          onOpenChange={(open) => setOpenMenuId(open ? row.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Tùy chọn thao tác cho vai trò ${row.shortLabel}`}
                              className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4 shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-56 p-1.5 rounded-xl bg-white border border-[#F0EBE6] shadow-xl z-[999] duration-200 ease-out font-sans text-xs space-y-0.5"
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
                              <span>Xem chi tiết &amp; Tài khoản ({row.userCount})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onAssignRoleToUser(row);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                            >
                              <UserPlus className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                              <span>Gán vai trò cho tài khoản</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEditRole(row);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                              <span>Chỉnh sửa mô tả vai trò</span>
                            </button>

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
                              <span>Sao chép mã định danh</span>
                            </button>

                            <div className="my-1 border-t border-[#F0EBE6]" />

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDeleteRole(row);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-rose-700 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span>Xóa vai trò</span>
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

      {/* Footer Pagination Bar matching mockup */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-[#F0EBE6] bg-[#FAF8F5]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 select-none">
        <div>
          Hiển thị{' '}
          <strong className="font-bold text-stone-900 tabular-nums">
            {startItem}-{endItem}
          </strong>{' '}
          trong tổng số{' '}
          <strong className="font-bold text-stone-900 tabular-nums">
            {totalElements}
          </strong>{' '}
          vai trò
        </div>

        <div className="flex items-center gap-2.5">
          {/* Page size selector: Hiển thị 10 / trang */}
          <div className="relative">
            <select
              aria-label="Số lượng vai trò hiển thị trên mỗi trang"
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

          {/* Page navigation buttons */}
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
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {p + 1}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
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

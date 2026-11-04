import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import {
  X,
  History,
  Copy,
  Check,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  Clock,
  Globe,
  FileText,
  Server,
  UserCheck,
} from 'lucide-react';
import { auditApi } from '@/services/api/audit';
import {
  normalizeAuditNoteToVietnamese,
  type AdminAuditLogRow,
} from '../auditLogsLogic';
import {
  renderAuditActionIcon,
  renderAuditCategoryBadge,
  renderAuditTargetIcon,
} from './AdminAuditLogsTable';

interface AdminAuditLogDetailModalProps {
  logRow: AdminAuditLogRow | null;
  initialTab?: 'detail' | 'actorHistory';
  allRows: AdminAuditLogRow[];
  onClose: () => void;
  onSelectLogRow: (row: AdminAuditLogRow) => void;
  onFilterByActor: (row: AdminAuditLogRow) => void;
  onNavigateTarget: (route: string) => void;
}

function getStatusDotClass(tone: AdminAuditLogRow['actorStatusTone']): string {
  if (tone === 'emerald') return 'bg-[#059669]';
  if (tone === 'rose') return 'bg-[#E11D48]';
  return 'bg-stone-400';
}

function getStatusBadgeClass(tone: AdminAuditLogRow['actorStatusTone']): string {
  if (tone === 'emerald') {
    return 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]/70';
  }
  if (tone === 'rose') {
    return 'bg-[#FFF0F2] text-[#E11D48] border-[#FECDD3]/80';
  }
  return 'bg-stone-100 text-stone-600 border-stone-200';
}

function getRoleBadgeClass(tone: 'crimson' | 'amber' | 'emerald' | 'stone'): string {
  switch (tone) {
    case 'crimson':
      return 'bg-[#FFF0F2] text-[#991B1B] border-[#FECDD3]';
    case 'amber':
      return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
    case 'emerald':
      return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
    default:
      return 'bg-white text-stone-700 border-[#E7E5E4]';
  }
}

export const AdminAuditLogDetailModal: React.FC<AdminAuditLogDetailModalProps> = ({
  logRow,
  initialTab = 'detail',
  allRows,
  onClose,
  onSelectLogRow,
  onFilterByActor,
  onNavigateTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'actorHistory'>(initialTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Chỉ gọi API chi tiết nhật ký gốc khi bản ghi thực sự nằm trong bảng audit_logs (rawAuditLogId !== null)
  const rawAuditId = logRow?.rawAuditLogId ?? null;
  const { data: detailRes, isFetching: isDetailFetching } = useQuery({
    queryKey: ['admin-audit-log-detail', rawAuditId],
    queryFn: () => auditApi.getAuditLogById(rawAuditId!),
    enabled: Boolean(rawAuditId !== null && rawAuditId > 0),
    staleTime: 30000,
  });

  const liveDetail = detailRes?.data;

  // Toàn bộ hoạt động thực tế của cùng người thực hiện này
  const relatedActorLogs = useMemo(() => {
    if (!logRow) return [];
    return allRows.filter((item) => {
      if (logRow.actorId !== null && item.actorId !== null) {
        return item.actorId === logRow.actorId;
      }
      return item.actorName === logRow.actorName;
    });
  }, [allRows, logRow]);

  useEffect(() => {
    if (!logRow) return;
    setActiveTab(initialTab);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logRow?.id, initialTab, onClose]);

  // Hiệu ứng GSAP 60fps trên GPU khi mở hộp thoại (Quy tắc 8 AGENTS.md)
  useEffect(() => {
    if (!logRow) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: 'power2.out' }
        );
      }
      if (panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 12, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.26,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        );
      }
    });

    return () => ctx.revert();
  }, [logRow?.id]);

  // Hiệu ứng GSAP nối tiếp cho các dòng bên trong hộp thoại khi chuyển thẻ
  useEffect(() => {
    if (!logRow || !contentContainerRef.current) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const items = contentContainerRef.current?.querySelectorAll('[data-gsap-row]');
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.025,
            ease: 'power2.out',
            clearProps: 'transform',
          }
        );
      }
    }, contentContainerRef);

    return () => ctx.revert();
  }, [logRow?.id, activeTab]);

  if (!logRow || typeof document === 'undefined') return null;

  const handleCopy = (value: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resolvedNote =
    liveDetail?.note && liveDetail.note.trim()
      ? normalizeAuditNoteToVietnamese(liveDetail.note.trim())
      : logRow.detailText;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-3 sm:p-4 overflow-hidden overscroll-contain font-sans select-none"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-log-detail-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-[#F0EBE6] bg-white shadow-2xl overflow-hidden overscroll-contain"
      >
        {/* 1. Đầu hộp thoại */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#F0EBE6] bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F2] border border-[#FFE4E6] text-[#991B1B]">
              <History className="h-5 w-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="audit-log-detail-modal-title"
                  className="text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate"
                >
                  Chi tiết nhật ký #{logRow.id}
                </h2>
                {renderAuditCategoryBadge(logRow.category, logRow.categoryLabel)}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200/80 text-stone-600 text-[11px] font-semibold whitespace-nowrap">
                  <ShieldCheck className="h-3 w-3 text-[#991B1B] shrink-0" />
                  <span>Chỉ đọc</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 tabular-nums truncate">
                Ghi nhận lúc {logRow.fullDateTime}
                {isDetailFetching
                  ? ' • Đang đồng bộ máy chủ...'
                  : ` • ${logRow.sourceModuleLabel}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại chi tiết nhật ký"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Thanh điều hướng chuyển thẻ gọn gàng kèm chỉ số tóm tắt (Quy tắc 8 AGENTS.md) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b border-[#F0EBE6] bg-white shrink-0">
          <div className="inline-flex items-center rounded-xl bg-[#FAF8F5] p-1 border border-[#F0EBE6]">
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'detail'
                  ? 'bg-[#991B1B] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Chi tiết bản ghi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actorHistory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer tabular-nums ${
                activeTab === 'actorHistory'
                  ? 'bg-[#991B1B] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hồ sơ &amp; lịch sử tác nhân ({relatedActorLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-500 tabular-nums">
            <span>Định danh đối tượng:</span>
            <strong className="font-semibold text-stone-800">
              {logRow.targetSubtitle}
            </strong>
          </div>
        </div>

        {/* 3. Nội dung hộp thoại */}
        <div
          ref={contentContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4"
        >
          {/* Dòng thông tin Người thực hiện chuẩn 1 hàng ngang duy nhất (~54px) theo Quy tắc 8 AGENTS.md */}
          <div
            data-gsap-row
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/80 min-h-[54px]"
          >
            {/* Bên trái (flex-1 min-w-0): Ảnh đại diện + chấm trạng thái + Họ tên (truncate) + #Mã + Huy hiệu trạng thái + Thư điện tử (truncate) */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                {logRow.actorAvatarUrl ? (
                  <img
                    src={logRow.actorAvatarUrl}
                    alt={logRow.actorName}
                    className="h-9 w-9 rounded-full object-cover border border-stone-200"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF0F2] border border-[#FFE4E6] text-xs font-bold text-[#991B1B]">
                    {logRow.actorInitials}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${getStatusDotClass(
                    logRow.actorStatusTone
                  )}`}
                  title={`Trạng thái tài khoản: ${logRow.actorStatusLabel}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="font-bold text-stone-900 text-xs sm:text-[13px] truncate"
                    title={logRow.actorName}
                  >
                    {logRow.actorName}
                  </span>
                  {logRow.actorId !== null && (
                    <span className="text-[11px] font-semibold text-stone-400 tabular-nums shrink-0">
                      #{logRow.actorId}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold shrink-0 whitespace-nowrap ${getStatusBadgeClass(
                      logRow.actorStatusTone
                    )}`}
                  >
                    {logRow.actorStatusLabel}
                  </span>
                </div>
                <span
                  className="text-xs text-stone-500 block truncate"
                  title={logRow.actorEmail}
                >
                  {logRow.actorEmail}
                </span>
              </div>
            </div>

            {/* Bên phải (shrink-0): Các huy hiệu vai trò thuần Việt + nút thao tác gọn */}
            <div className="flex items-center gap-1.5 shrink-0">
              {logRow.actorRoleBadges.slice(0, 2).map((badge) => (
                <span
                  key={badge.label}
                  className={`inline-flex items-center px-2 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 ${getRoleBadgeClass(
                    badge.tone
                  )}`}
                >
                  {badge.label}
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  onFilterByActor(logRow);
                  onClose();
                }}
                title="Lọc toàn bộ nhật ký của người thực hiện này trên bảng chính"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF0F2] hover:bg-[#FFE4E6] text-[#991B1B] text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Filter className="h-3 w-3 shrink-0" />
                <span className="hidden sm:inline">Lọc tác nhân</span>
              </button>
            </div>
          </div>

          {activeTab === 'detail' ? (
            <>
              {/* Lưới 2 cột: Hành động thực thi & Đối tượng bị tác động */}
              <div
                data-gsap-row
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {/* Cột 1: Hành động */}
                <div className="rounded-xl border border-[#F0EBE6] bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-semibold text-stone-400 block">
                    Hành động thực thi
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      {renderAuditActionIcon(logRow.actionKind)}
                      <span className="font-bold text-stone-900 text-sm truncate">
                        {logRow.actionLabel}
                      </span>
                    </div>
                    {renderAuditCategoryBadge(logRow.category, logRow.categoryLabel)}
                  </div>
                  <p className="text-[11px] text-stone-500 tabular-nums">
                    Phân nhóm nghiệp vụ:{' '}
                    <strong className="text-stone-700">{logRow.categoryLabel}</strong>
                  </p>
                </div>

                {/* Cột 2: Đối tượng tác động */}
                <div className="rounded-xl border border-[#F0EBE6] bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-semibold text-stone-400 block">
                    Đối tượng bị tác động
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {renderAuditTargetIcon(logRow.targetIconKind)}
                      <span className="font-bold text-stone-900 text-sm truncate">
                        {logRow.targetLabel}
                      </span>
                    </div>
                    {logRow.targetRoute && (
                      <button
                        type="button"
                        onClick={() => {
                          if (logRow.targetRoute) {
                            onNavigateTarget(logRow.targetRoute);
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E7E5E4] bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <span>Mở phân hệ</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 tabular-nums">
                    Định danh đối tượng:{' '}
                    <strong className="text-stone-700">{logRow.targetSubtitle}</strong>
                  </p>
                </div>
              </div>

              {/* Nội dung chi tiết / Ghi chú biến động dữ liệu */}
              <div
                data-gsap-row
                className="rounded-xl border border-[#F0EBE6] bg-[#FAF8F5]/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <FileText className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                    <span>Nội dung thay đổi &amp; Ghi chú kiểm toán</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(resolvedNote, 'note')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E7E5E4] bg-white hover:bg-stone-50 text-stone-600 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {copiedField === 'note' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép nội dung</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-[13px] text-stone-800 leading-relaxed select-text wrap-anywhere bg-white rounded-lg border border-[#F0EBE6] p-3">
                  {resolvedNote}
                </p>
              </div>

              {/* Luồng xử lý & Cơ chế ghi nhận tại Máy chủ */}
              <div
                data-gsap-row
                className="rounded-xl border border-[#F0EBE6] bg-white p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Server className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                    <span>Luồng xử lý &amp; Nguồn dữ liệu máy chủ</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E5E4] text-stone-700 text-[11px] font-semibold whitespace-nowrap">
                    {logRow.sourceModuleLabel}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {logRow.backendFlowSummary}
                </p>
              </div>

              {/* Thông số truy vết kỹ thuật */}
              <div
                data-gsap-row
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0EBE6] bg-white">
                  <Clock className="h-4 w-4 text-stone-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-400 block">
                      Thời điểm ghi sổ
                    </span>
                    <span className="font-semibold text-stone-800 tabular-nums block truncate">
                      {logRow.fullDateTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0EBE6] bg-white">
                  <Globe className="h-4 w-4 text-stone-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-400 block">
                      Địa chỉ mạng máy trạm
                    </span>
                    <span
                      className="font-semibold text-stone-800 tabular-nums block truncate"
                      title={
                        logRow.ipAddress
                          ? logRow.ipAddress
                          : 'Máy chủ hiện chưa lưu trữ trường địa chỉ mạng máy trạm cho bản ghi này'
                      }
                    >
                      {logRow.ipDisplayLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0EBE6] bg-white">
                  <ShieldCheck className="h-4 w-4 text-[#059669] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-400 block">
                      Chế độ bảo toàn
                    </span>
                    <span className="font-semibold text-[#059669] block truncate">
                      Bất biến • Chỉ đọc
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Thẻ 2: Hồ sơ vai trò & Danh sách hoạt động cùng tác nhân */
            <div className="space-y-3">
              {/* Thanh tóm tắt quyền hạn & điều hướng tài khoản người thực hiện */}
              <div
                data-gsap-row
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-[#F0EBE6] bg-white text-xs"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#991B1B] shrink-0" />
                  <span className="text-stone-500">Vai trò trên hệ thống:</span>
                  {logRow.actorRoleBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${getRoleBadgeClass(
                        badge.tone
                      )}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>

                {logRow.actorId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTarget('/admin/accounts');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E7E5E4] bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <span>Mở quản lý tài khoản</span>
                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                  </button>
                )}
              </div>

              {/* Danh sách từng bản ghi của người thực hiện (Compact 1-Row Item Layout ~54px) */}
              <div className="space-y-2">
                {relatedActorLogs.map((item) => {
                  const isCurrent = item.id === logRow.id;
                  return (
                    <div
                      key={item.id}
                      data-gsap-row
                      onClick={() => {
                        onSelectLogRow(item);
                        setActiveTab('detail');
                      }}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border min-h-[54px] transition-colors cursor-pointer ${
                        isCurrent
                          ? 'border-[#FECDD3] bg-[#FFF0F2]/40'
                          : 'border-[#F0EBE6] bg-white hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {renderAuditActionIcon(item.actionKind)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-stone-900 text-xs shrink-0">
                              {item.actionLabel}
                            </span>
                            <span className="text-[11px] text-stone-400 shrink-0">
                              •
                            </span>
                            <span className="font-semibold text-stone-700 text-xs truncate">
                              {item.targetLabel} ({item.targetSubtitle})
                            </span>
                            <span className="text-[11px] font-semibold text-stone-400 tabular-nums shrink-0">
                              #{item.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {item.detailText}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {renderAuditCategoryBadge(item.category, item.categoryLabel)}
                        <span className="text-[11px] text-stone-400 tabular-nums whitespace-nowrap hidden sm:inline">
                          {item.datePart} {item.timePart}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-[#991B1B] text-white text-[10px] font-semibold whitespace-nowrap">
                            Đang xem
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Chân hộp thoại */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[#F0EBE6] bg-[#FAF8F5] shrink-0">
          <button
            type="button"
            onClick={() =>
              handleCopy(
                `[#${logRow.id}] ${logRow.fullDateTime} | ${logRow.actorName} (${logRow.actorEmail}) | ${logRow.actionLabel} -> ${logRow.targetLabel} (${logRow.targetSubtitle}) | ${resolvedNote}`,
                'summary'
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E7E5E4] bg-white hover:bg-stone-50 active:scale-[0.97] text-xs font-semibold text-stone-700 transition-all cursor-pointer"
          >
            {copiedField === 'summary' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép bản ghi</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-stone-500" />
                <span>Sao chép toàn bộ bản ghi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.97] text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

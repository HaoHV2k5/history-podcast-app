import React from 'react';
import {
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { KycProfile } from '@/types/kyc';
import { Button } from '@/components/ui/button';
import { KycSecurityBanner } from './KycSecurityBanner';

interface KycRejectedViewProps {
  profile: KycProfile;
  rejectionReason?: string;
  onStartResubmit: () => void;
  onOpenSecurity: () => void;
}

export const KycRejectedView: React.FC<KycRejectedViewProps> = ({
  profile,
  rejectionReason,
  onStartResubmit,
  onOpenSecurity,
}) => {
  return (
    <div className="space-y-3 sm:space-y-3.5 w-full" data-motion-target="rejected-view">
      {/* Rejection Alert Banner */}
      <section
        aria-label="Thông báo từ chối hồ sơ KYC"
        className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-3.5 sm:p-4.5 shadow-2xs"
      >
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div
            className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"
            aria-hidden="true"
          >
            <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10.5px] sm:text-[11px] font-bold text-[#B91C1C] border border-[#FCA5A5]">
                <AlertCircle className="h-3 w-3" />
                <span>BỊ TỪ CHỐI (REJECTED)</span>
              </span>
              {profile.id ? (
                <span className="text-[10.5px] sm:text-[11px] font-mono text-[#736B66]">
                  Hồ sơ #{profile.id}
                </span>
              ) : null}
            </div>

            <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold tracking-tight text-[#1C1615]">
              Lý do từ chối từ Ban Biên tập Sử Ký
            </h2>

            <div className="rounded-lg sm:rounded-xl border border-[#FCA5A5]/60 bg-white/80 p-3 max-w-2xl">
              <p className="text-xs sm:text-[12.5px] font-medium text-[#1C1615] italic leading-relaxed">
                "{rejectionReason || 'Thông tin tài khoản hoặc định danh chưa đầy đủ, vui lòng bổ sung.'}"
              </p>
            </div>

            <p className="text-xs text-[#5C524F] leading-relaxed max-w-2xl">
              Hệ thống Sử Ký cho phép bạn cập nhật lại thông tin hồ sơ và gửi lại ngay lập tức mà không cần tạo tài khoản mới.
            </p>

            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={onStartResubmit}
                className="gap-1.5 bg-[#A31D24] hover:bg-[#881313] text-white shadow-xs text-xs h-8 px-3"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Chỉnh sửa và Nộp lại hồ sơ</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Guidance Info Card */}
      <article className="w-full rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1615] flex items-center gap-2 border-b border-[#F0EBE1] pb-2.5">
          <FileText className="h-4 w-4 text-[#A31D24]" />
          <span>Lưu ý khi nộp lại hồ sơ</span>
        </h3>

        <ul className="space-y-2 text-xs text-[#5C524F] list-disc list-inside leading-relaxed">
          <li>Đảm bảo Tên chủ tài khoản ngân hàng khớp 100% với Họ và tên tác giả.</li>
          <li>Kiểm tra lại số tài khoản ngân hàng thụ hưởng chính xác.</li>
          <li>Số điện thoại và email liên hệ phải là thông tin chính chủ, có khả năng nhận OTP và thông báo đối soát.</li>
        </ul>
      </article>

      {/* Bottom Security Banner */}
      <KycSecurityBanner onOpenSecurity={onOpenSecurity} />
    </div>
  );
};

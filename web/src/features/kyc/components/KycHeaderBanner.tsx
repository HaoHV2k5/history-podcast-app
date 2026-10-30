import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, UserCheck } from 'lucide-react';

interface KycHeaderBannerProps {
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'FORM';
  customTitle?: string;
  customSubtitle?: string;
  customDescription?: string;
}

export const KycHeaderBanner: React.FC<KycHeaderBannerProps> = ({
  status = 'APPROVED',
  customTitle,
  customSubtitle,
  customDescription,
}) => {
  const getBannerMeta = () => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: <ShieldCheck className="h-4 w-4 shrink-0 text-[#A31D24]" />,
          eyebrow: 'XÁC THỰC DANH TÍNH NHÀ SÁNG TẠO',
          eyebrowClass: 'text-[#A31D24]',
          title: customTitle || 'Hồ Sơ KYC Đã Được Phê Duyệt',
          subtitle:
            customSubtitle || 'Tài khoản của bạn đã được Ban Quản trị Sử Ký xác thực đầy đủ.',
          description:
            customDescription ||
            'Bạn có thể truy cập tất cả các tính năng và bắt đầu sáng tạo nội dung trên nền tảng.',
        };
      case 'PENDING':
        return {
          icon: <Clock className="h-4 w-4 shrink-0 text-[#B45309]" />,
          eyebrow: 'ĐANG THẨM ĐỊNH SỬ LIỆU & PHÁP LÝ',
          eyebrowClass: 'text-[#B45309]',
          title: customTitle || 'Hồ Sơ Đang Chờ Phê Duyệt',
          subtitle:
            customSubtitle ||
            'Hồ sơ KYC của bạn đã được ghi nhận trên hệ thống và đang trong hàng đợi xét duyệt.',
          description:
            customDescription ||
            'Ban Biên tập Sử Ký đang tiến hành đối soát thông tin pháp lý và tài khoản thụ hưởng.',
        };
      case 'REJECTED':
        return {
          icon: <ShieldAlert className="h-4 w-4 shrink-0 text-[#DC2626]" />,
          eyebrow: 'KẾT QUẢ XÉT DUYỆT KYC',
          eyebrowClass: 'text-[#DC2626]',
          title: customTitle || 'Hồ Sơ Cần Điều Chỉnh',
          subtitle:
            customSubtitle ||
            'Hồ sơ đăng ký Nhà sáng tạo của bạn cần bổ sung hoặc hiệu chỉnh thông tin.',
          description:
            customDescription ||
            'Vui lòng xem lý do chi tiết từ Ban Biên tập và cập nhật lại hồ sơ để tiếp tục.',
        };
      default:
        return {
          icon: <UserCheck className="h-4 w-4 shrink-0 text-[#A31D24]" />,
          eyebrow: 'QUY TRÌNH ĐỊNH DANH TÁC GIẢ',
          eyebrowClass: 'text-[#A31D24]',
          title: customTitle || 'Đăng Ký Định Danh Nhà Sáng Tạo (KYC)',
          subtitle:
            customSubtitle ||
            'Hoàn tất xác thực danh tính để kích hoạt tính năng tạo kênh podcast và xuất bản tác phẩm.',
          description:
            customDescription ||
            'Quy trình xác thực an toàn, bảo vệ quyền tác giả và quyền lợi thu nhập của bạn trên Sử Ký.',
        };
    }
  };

  const meta = getBannerMeta();

  return (
    <header
      aria-label="Tiêu đề Xác thực KYC"
      className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-[#FAF8F5] px-4 sm:px-6 py-3.5 sm:py-4 min-h-[110px] sm:min-h-[120px] md:min-h-[125px] flex flex-col justify-center shadow-2xs"
      data-motion-target="header"
    >
      {/* Historical Landscape Panorama Artwork - Flush right and bottom to bleed naturally across the header card */}
      <div
        className="absolute inset-y-0 right-0 h-full flex items-end justify-end pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/assets/studio/kyc-header-artwork.png"
          alt=""
          className="h-full w-auto max-w-none object-contain object-right-bottom pointer-events-none select-none"
        />
      </div>

      {/* Protective Left Gradient Wash for Text Readability */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-3/5 md:w-1/2 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-1 max-w-lg lg:max-w-xl">
        {/* Eyebrow Label */}
        <div className={`flex items-center gap-1.5 ${meta.eyebrowClass}`}>
          {meta.icon}
          <span className="font-serif text-[10.5px] sm:text-[11px] font-bold tracking-wider uppercase">
            {meta.eyebrow}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#1C1615] leading-snug">
          {meta.title}
        </h1>

        {/* Subtitle */}
        <div className="space-y-0.5 text-[11px] sm:text-xs text-[#5C524F] leading-relaxed">
          <p>{meta.subtitle}</p>
          {meta.description && <p className="hidden sm:block">{meta.description}</p>}
        </div>
      </div>
    </header>
  );
};

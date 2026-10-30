import React from 'react';
import {
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  Landmark,
  CreditCard,
  UserCheck,
  BookOpen,
  Link2,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { KycProfile } from '@/types/kyc';
import { maskAccountNumber } from '@/utils/formatters';

interface KycVerifiedInfoGridProps {
  profile: KycProfile;
  onEditBio: () => void;
}

export const KycVerifiedInfoGrid: React.FC<KycVerifiedInfoGridProps> = ({
  profile,
  onEditBio,
}) => {
  const verifiedDate = profile.otpVerifiedAt
    ? new Date(profile.otpVerifiedAt).toLocaleDateString('vi-VN')
    : profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
    : 'Vừa cập nhật';

  const authorName = profile.fullName?.trim() || 'Chưa cập nhật';
  const authorEmail = (profile.contactEmail || profile.userEmail)?.trim() || 'Chưa cập nhật';
  const authorPhone = profile.phone?.trim() || 'Chưa cập nhật';
  const bankName = profile.bankName?.trim() || 'Chưa cập nhật';
  const bankAccount = profile.bankAccountNumber
    ? maskAccountNumber(profile.bankAccountNumber)
    : 'Chưa cập nhật';
  const accountHolder = profile.bankAccountHolder?.trim()
    ? profile.bankAccountHolder.trim().toUpperCase()
    : 'CHƯA CẬP NHẬT';

  const authorBio = profile.bio?.trim() || 'Chưa cập nhật tiểu sử tác giả.';
  const portfolioUrl = profile.portfolioUrl?.trim() || '';

  const fields = [
    {
      id: 'fullName',
      label: 'Họ và tên tác giả',
      value: authorName,
      icon: User,
      isMono: false,
    },
    {
      id: 'email',
      label: 'Email liên hệ đã xác minh',
      value: authorEmail,
      icon: Mail,
      isMono: true,
    },
    {
      id: 'phone',
      label: 'Số điện thoại',
      value: authorPhone,
      icon: Phone,
      isMono: true,
    },
    {
      id: 'bankName',
      label: 'Ngân hàng thụ hưởng',
      value: bankName,
      icon: Landmark,
      isMono: false,
    },
    {
      id: 'bankAccountNumber',
      label: 'Số tài khoản ngân hàng',
      value: bankAccount,
      icon: CreditCard,
      isMono: true,
    },
    {
      id: 'bankAccountHolder',
      label: 'Chủ tài khoản thụ hưởng',
      value: accountHolder,
      icon: UserCheck,
      isMono: true,
    },
  ];

  return (
    <article
      aria-label="Thông báo thông tin định danh đã xác thực"
      className="rounded-xl sm:rounded-2xl border border-[#EBE4D8] bg-white p-3.5 sm:p-4 shadow-2xs space-y-3"
      data-motion-target="info-grid"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EBE1] pb-2.5">
        <h3 className="font-serif text-sm sm:text-base font-bold text-[#1C1615] flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#A31D24]" />
          <span>Thông tin định danh đã xác thực</span>
        </h3>
        <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-[#736B66]">
          <Calendar className="h-3 w-3" />
          <span>Xác thực lúc: {verifiedDate}</span>
        </div>
      </div>

      {/* 2x3 Grid of 6 Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {fields.map((field) => {
          const IconComponent = field.icon;
          return (
            <div
              key={field.id}
              className="group rounded-lg sm:rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] hover:bg-[#F7F5EE] p-2.5 sm:p-3 flex items-center justify-between gap-2 transition-colors duration-150"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-white border border-[#EBE4D8] text-[#736B66] shadow-2xs group-hover:text-[#A31D24] transition-colors"
                  aria-hidden="true"
                >
                  <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] sm:text-[10.5px] text-[#736B66] font-medium block truncate">
                    {field.label}
                  </span>
                  <span
                    className={`text-xs sm:text-[13px] font-semibold text-[#1C1615] block truncate ${
                      field.isMono ? 'font-mono' : ''
                    }`}
                    title={field.value}
                  >
                    {field.value}
                  </span>
                </div>
              </div>

              {/* Verified Pill Badge */}
              <span className="inline-flex items-center rounded-full bg-[#E7F6ED] px-2 py-0.5 text-[10px] sm:text-[10.5px] font-semibold text-[#168A4E] border border-[#BCE7CE]/70 shrink-0">
                Đã xác thực
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 7: Tiểu sử tác giả */}
      <div className="group rounded-lg sm:rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] hover:bg-[#F7F5EE] p-2.5 sm:p-3 flex items-start justify-between gap-2.5 transition-colors duration-150">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div
            className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-white border border-[#EBE4D8] text-[#736B66] shadow-2xs mt-0.5 group-hover:text-[#A31D24] transition-colors"
            aria-hidden="true"
          >
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0 space-y-0.5 flex-1">
            <span className="text-[10px] sm:text-[10.5px] text-[#736B66] font-medium block">
              Tiểu sử tác giả
            </span>
            <p className="text-xs sm:text-[12.5px] text-[#1C1615] leading-relaxed break-words">
              {authorBio}
            </p>
          </div>
        </div>

        <button
          id="kyc-edit-bio-btn"
          type="button"
          onClick={onEditBio}
          className="p-1 rounded-md text-[#736B66] hover:text-[#A31D24] hover:bg-white border border-transparent hover:border-[#EBE4D8] transition-all cursor-pointer shrink-0"
          title="Chỉnh sửa tiểu sử tác giả"
          aria-label="Chỉnh sửa tiểu sử tác giả"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Row 8: Hồ sơ năng lực / Kênh cá nhân */}
      <div className="group rounded-lg sm:rounded-xl border border-[#F0EBE1] bg-[#FAFAF7] hover:bg-[#F7F5EE] p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-colors duration-150">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-white border border-[#EBE4D8] text-[#736B66] shadow-2xs group-hover:text-[#A31D24] transition-colors"
            aria-hidden="true"
          >
            <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0 space-y-0.5 flex-1">
            <span className="text-[10px] sm:text-[10.5px] text-[#736B66] font-medium block">
              Hồ sơ năng lực / Kênh cá nhân
            </span>
            {portfolioUrl ? (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-[12.5px] font-mono text-[#A31D24] hover:underline block truncate"
                title={portfolioUrl}
              >
                {portfolioUrl}
              </a>
            ) : (
              <span className="text-xs sm:text-[12.5px] text-[#736B66] italic block">
                Chưa cập nhật liên kết hồ sơ
              </span>
            )}
          </div>
        </div>

        {portfolioUrl ? (
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-[#736B66] hover:text-[#A31D24] hover:bg-white border border-transparent hover:border-[#EBE4D8] transition-all cursor-pointer shrink-0"
            title="Mở liên kết trong tab mới"
            aria-label="Mở liên kết hồ sơ năng lực trong tab mới"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <button
            type="button"
            onClick={onEditBio}
            className="p-1 rounded-md text-[#736B66] hover:text-[#A31D24] hover:bg-white border border-transparent hover:border-[#EBE4D8] transition-all cursor-pointer shrink-0"
            title="Thêm liên kết hồ sơ cá nhân"
            aria-label="Thêm liên kết hồ sơ cá nhân"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};

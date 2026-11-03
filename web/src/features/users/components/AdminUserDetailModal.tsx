import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, Shield, Radio, Lock, Unlock } from 'lucide-react';
import { UserResponse } from '@/types/auth';
import {
  getStatusPillConfig,
  formatUserProfileDetail,
} from '../usersLogic';
import { cn } from '@/utils/cn';

interface AdminUserDetailModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  channelCount?: number;
  onChangeRole: (user: UserResponse) => void;
  onToggleStatus: (user: UserResponse) => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  channelCount = 0,
  onChangeRole,
  onToggleStatus,
}) => {
  if (!user) return null;

  const profile = formatUserProfileDetail(user, channelCount);
  const statusConfig = getStatusPillConfig(user.status);
  const isLocked = user.status === 'LOCKED';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        maxWidth="max-w-2xl"
        className="rounded-[28px] border-[#EFEBE4] bg-[#FCFAF7] p-6 sm:p-7 shadow-2xl overflow-hidden"
      >
        {/* Header with Title, Red Accent Line, Subtitle and Heritage Pagoda Background Artwork */}
        <DialogHeader className="relative pr-10 pb-1">
          {/* Heritage Pagoda Background Artwork matching mockup - positioned strictly on the right */}
          <div className="absolute right-0 top-0 bottom-0 w-[200px] sm:w-[250px] pointer-events-none select-none overflow-hidden flex items-center justify-end">
            <img
              src="/assets/studio/user-detail-header-heritage-art.png"
              alt=""
              aria-hidden="true"
              className="h-full w-auto max-h-[85px] sm:max-h-[92px] object-contain object-right opacity-90 sm:opacity-95"
            />
          </div>

          <div className="relative z-10 flex items-start gap-2.5 max-w-[340px] sm:max-w-[370px]">
            <span className="w-1.5 h-6 rounded-full bg-[#8B0000] shrink-0 mt-1" />
            <div>
              <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-[#2B1108] leading-tight whitespace-nowrap">
                Hồ sơ chi tiết người dùng
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-stone-600 font-normal mt-1 leading-relaxed">
                <span className="block whitespace-nowrap">Xem toàn bộ thông tin tài khoản, danh bạ liên hệ</span>
                <span className="block whitespace-nowrap">và trạng thái hệ thống.</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="space-y-4 pt-1">
          {/* Top Profile Card (Cream Card with Avatar, Name, ID, Status, Bio) */}
          <div className="relative rounded-2xl border border-[#F3EAE4] bg-[#FFF8F6] p-4 sm:p-5 shadow-2xs">
            <div className="flex items-start gap-4">
              {/* Avatar: Photo if available, or Initials with peach/red background matching mockup */}
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={profile.displayName}
                  className="h-16 w-16 rounded-full object-cover border border-[#E7E5E4] shadow-xs shrink-0"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFDFDE] text-[#8B0000] font-bold text-xl border border-[#FECDD3] shadow-xs select-none">
                  {profile.initials}
                </div>
              )}

              {/* User details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2B1108] leading-tight">
                      {profile.displayName}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
                      Mã người dùng: #{profile.id}
                    </p>
                  </div>

                  {/* Status pill matching mockup */}
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium border shrink-0 select-none shadow-2xs',
                      statusConfig.pillBg,
                      statusConfig.textColor,
                      statusConfig.borderColor
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusConfig.dotBg)} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                {/* Bio quote matching mockup */}
                <p className="italic text-xs sm:text-sm text-stone-600 font-normal leading-relaxed mt-2.5 max-w-xl">
                  “{profile.bio}”
                </p>
              </div>
            </div>
          </div>

          {/* Grid Information: 4 Cards (Email, Phone, Registration Date, Last Updated) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Địa chỉ email */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-[#EFEBE4] bg-white p-4 shadow-2xs hover:border-stone-300 transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#E11D48]">
                <Mail className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-stone-500 font-medium block">
                  Địa chỉ email
                </span>
                <span className="text-sm font-bold text-stone-900 truncate block mt-0.5 select-all">
                  {profile.email}
                </span>
              </div>
            </div>

            {/* Card 2: Số điện thoại */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-[#EFEBE4] bg-white p-4 shadow-2xs hover:border-stone-300 transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#E11D48]">
                <Phone className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-stone-500 font-medium block">
                  Số điện thoại
                </span>
                <span className="text-sm font-bold text-stone-900 truncate block mt-0.5">
                  {profile.phone}
                </span>
              </div>
            </div>

            {/* Card 3: Ngày đăng ký */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-[#EFEBE4] bg-white p-4 shadow-2xs hover:border-stone-300 transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#E11D48]">
                <Calendar className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-stone-500 font-medium block">
                  Ngày đăng ký
                </span>
                <span className="text-sm font-bold text-stone-900 block mt-0.5 font-sans">
                  {profile.createdFull}
                </span>
              </div>
            </div>

            {/* Card 4: Cập nhật gần nhất */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-[#EFEBE4] bg-white p-4 shadow-2xs hover:border-stone-300 transition-colors">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#E11D48]">
                <Calendar className="h-5 w-5 stroke-[1.75]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-stone-500 font-medium block">
                  Cập nhật gần nhất
                </span>
                <span className="text-sm font-bold text-stone-900 block mt-0.5 font-sans">
                  {profile.updatedFull}
                </span>
              </div>
            </div>
          </div>

          {/* Podcast Channel Card */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-[#EFEBE4] bg-white p-4 shadow-2xs hover:border-stone-300 transition-colors">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F2] text-[#E11D48]">
              <Radio className="h-5 w-5 stroke-[1.75]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs text-stone-500 font-medium block">
                Kênh podcast sở hữu
              </span>
              <span className="text-sm font-bold text-stone-900 block mt-0.5">
                {profile.channelText}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer matching mockup */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#EFEBE4] mt-2">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                onChangeRole(user);
              }}
              className="h-10 rounded-xl border-[#D1D5DB] bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold px-4 sm:px-5 flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Shield className="h-4 w-4 text-stone-700" />
              <span>Phân quyền</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                onToggleStatus(user);
              }}
              className={cn(
                'h-10 rounded-xl text-xs sm:text-sm font-semibold px-4 sm:px-5 flex items-center gap-2 shadow-2xs transition-colors',
                isLocked
                  ? 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
                  : 'border-[#C52227] bg-white text-[#C52227] hover:bg-[#FFF5F5]'
              )}
            >
              {isLocked ? (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Mở khóa tài khoản</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Khóa tài khoản</span>
                </>
              )}
            </Button>
          </div>

          {/* Right: Đóng button */}
          <Button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold px-6 sm:px-7 shadow-xs transition-colors"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

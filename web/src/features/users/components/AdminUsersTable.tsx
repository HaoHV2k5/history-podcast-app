import React from 'react';
import { Mail, Phone, Eye, MoreVertical, Shield, Lock, Unlock, Trash2, Radio, Check, Minus } from 'lucide-react';
import { UserResponse } from '@/types/auth';
import {
  getRoleBadgeConfig,
  getStatusPillConfig,
  formatUserDateTime,
  getAvatarInitials,
  formatChannelCount,
} from '../usersLogic';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import { cn } from '@/utils/cn';

interface AdminUsersTableProps {
  users: UserResponse[];
  channelCounts?: Record<number, number>;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onViewDetail: (user: UserResponse) => void;
  onChangeRole: (user: UserResponse) => void;
  onToggleStatus: (user: UserResponse) => void;
  onDeleteUser: (user: UserResponse) => void;
  isLoading?: boolean;
}

const AVATAR_BG_COLORS = [
  'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]', // Amber
  'bg-[#FEE2E2] text-[#DC2626] border-[#FECDD3]', // Rose
  'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]', // Indigo
  'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]', // Emerald
  'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]', // Purple
];

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  users,
  channelCounts = {},
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetail,
  onChangeRole,
  onToggleStatus,
  onDeleteUser,
  isLoading,
}) => {
  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const isIndeterminate = selectedIds.length > 0 && !allSelected;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#F0EBE6] bg-white shadow-2xs">
        <div className="p-8 space-y-4">
          <div className="h-6 w-48 bg-stone-100 rounded animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-stone-100">
              <div className="h-5 w-5 bg-stone-100 rounded" />
              <div className="h-10 w-10 bg-stone-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-stone-100 rounded" />
                <div className="h-3 w-28 bg-stone-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-stone-100 rounded-full" />
              <div className="h-6 w-24 bg-stone-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E5E4] bg-white p-12 text-center shadow-2xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF5F5] text-[#991B1B] mb-3">
          <Radio className="h-7 w-7 opacity-80" />
        </div>
        <h3 className="text-base font-bold text-[#1F1612]">Không tìm thấy người dùng</h3>
        <p className="mt-1 text-xs text-stone-500 max-w-sm">
          Không có tài khoản nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Vui lòng kiểm tra lại.
        </p>
      </div>
    );
  }

  const getChannelBadgeClass = (count: number) => {
    if (count >= 3) return 'bg-[#E0F2FE] text-[#0369A1]';
    if (count === 2) return 'bg-[#FEF3C7] text-[#B45309]';
    if (count === 1) return 'bg-[#DCFCE7] text-[#15803D]';
    return 'bg-[#FEE2E2] text-[#B91C1C]';
  };

  const resolveEffectiveRole = (u: UserResponse): string => {
    if (u.isAdmin || u.roleName === 'ADMIN' || u.roles?.some((r) => r.toUpperCase() === 'ADMIN')) return 'ADMIN';
    if (u.isCreator || u.roleName === 'CREATOR' || u.roles?.some((r) => r.toUpperCase() === 'CREATOR')) return 'CREATOR';
    if (u.isFreelancer || u.roleName === 'FREELANCER' || u.roles?.some((r) => r.toUpperCase() === 'FREELANCER')) return 'FREELANCER';
    if (u.roleName === 'NARRATOR' || u.roles?.some((r) => r.toUpperCase() === 'NARRATOR')) return 'NARRATOR';
    return u.roleName || (u.roles && u.roles[0]) || 'USER';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs">
      <div className="w-full">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-[#F0EBE6] bg-[#FBF9F6] text-xs font-medium text-stone-600 select-none whitespace-nowrap">
              <th scope="col" className="w-9 px-2.5 py-3 text-center">
                <label className="relative inline-flex items-center justify-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="sr-only"
                    aria-label="Chọn tất cả người dùng trong trang này"
                  />
                  <div
                    className={cn(
                      'w-4 h-4 rounded-[4px] border transition-colors flex items-center justify-center',
                      allSelected || isIndeterminate
                        ? 'bg-[#C52227] border-[#C52227] text-white'
                        : 'bg-white border-[#D1D5DB] hover:border-stone-400'
                    )}
                  >
                    {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {isIndeterminate && !allSelected && <Minus className="w-3 h-3 stroke-[3]" />}
                  </div>
                </label>
              </th>
              <th scope="col" className="px-2.5 py-3">Người dùng</th>
              <th scope="col" className="px-2.5 py-3">Thông tin liên hệ</th>
              <th scope="col" className="px-2 py-3">Vai trò</th>
              <th scope="col" className="px-2.5 py-3">Trạng thái</th>
              <th scope="col" className="px-2 py-3">Ngày đăng ký</th>
              <th scope="col" className="px-2 py-3">Kênh Podcast</th>
              <th scope="col" className="px-2.5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EBE6] text-xs">
            {users.map((user, idx) => {
              const isSelected = selectedIds.includes(user.id);
              const effectiveRole = resolveEffectiveRole(user);
              const roleConfig = getRoleBadgeConfig(effectiveRole);
              const statusConfig = getStatusPillConfig(user.status);
              const { date, time } = formatUserDateTime(user.createdAt);
              const displayName = user.fullName || (user.email ? user.email.split('@')[0] : 'Chưa cập nhật tên');
              const initials = getAvatarInitials(user.fullName, user.email);
              const avatarBgClass = AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length];
              const isCreator = effectiveRole === 'CREATOR';
              const rawCount = channelCounts[user.id] ?? (isCreator ? 1 : 0);
              const channelInfo = formatChannelCount(rawCount);
              const isLocked = user.status === 'LOCKED';

              return (
                <tr
                  key={user.id}
                  className={cn(
                    'group transition-colors duration-150 hover:bg-[#FAF8F5]/80',
                    isSelected ? 'bg-[#FFF8F8]' : ''
                  )}
                >
                  {/* Selection Checkbox */}
                  <td className="w-9 px-2.5 py-3 text-center whitespace-nowrap">
                    <label className="relative inline-flex items-center justify-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(user.id)}
                        className="sr-only"
                        aria-label={`Chọn người dùng ${displayName}`}
                      />
                      <div
                        className={cn(
                          'w-4 h-4 rounded-[4px] border transition-colors flex items-center justify-center',
                          isSelected
                            ? 'bg-[#C52227] border-[#C52227] text-white'
                            : 'bg-white border-[#D1D5DB] hover:border-stone-400'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </label>
                  </td>

                  {/* Column: Người dùng (Avatar + Name + ID) */}
                  <td className="px-2.5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={displayName}
                          className="h-9 w-9 shrink-0 rounded-full object-cover border border-[#E7E5E4] shadow-2xs"
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold shadow-2xs',
                            avatarBgClass
                          )}
                        >
                          {initials}
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 max-w-[130px] lg:max-w-[160px] xl:max-w-[200px]">
                        <span className="font-semibold text-stone-900 truncate text-xs sm:text-sm">
                          {displayName}
                        </span>
                        <span className="font-normal text-[11px] text-stone-400 mt-0.5">
                          ID: #{user.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column: Thông tin liên hệ (Email + Phone) */}
                  <td className="px-2.5 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5 max-w-[160px] lg:max-w-[190px] xl:max-w-[220px]">
                      <div className="flex items-center gap-1.5 text-stone-600 min-w-0">
                        <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="font-normal text-xs text-stone-700 truncate select-all">
                          {user.email || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 min-w-0">
                        <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="font-normal text-xs text-stone-500 truncate">
                          {user.phone || 'Chưa có SĐT'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column: Vai trò */}
                  <td className="px-2 py-3 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide select-none',
                        roleConfig.bg,
                        roleConfig.text
                      )}
                    >
                      {roleConfig.label}
                    </span>
                  </td>

                  {/* Column: Trạng thái (Pill with dot) */}
                  <td className="px-2.5 py-3 whitespace-nowrap">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap select-none',
                        statusConfig.pillBg,
                        statusConfig.textColor
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusConfig.dotBg)} />
                      <span className="whitespace-nowrap">{statusConfig.label}</span>
                    </div>
                  </td>

                  {/* Column: Ngày đăng ký */}
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="flex flex-col font-normal text-xs whitespace-nowrap">
                      <span className="text-stone-700 font-medium">{date}</span>
                      <span className="text-[11px] text-stone-400 mt-0.5">{time}</span>
                    </div>
                  </td>

                  {/* Column: Kênh Podcast */}
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'h-5 min-w-[20px] px-1 rounded flex items-center justify-center font-bold text-[11px] shadow-2xs shrink-0',
                          getChannelBadgeClass(channelInfo.count)
                        )}
                      >
                        {channelInfo.count}
                      </span>
                      <span className="text-stone-600 text-xs font-normal whitespace-nowrap">
                        {channelInfo.count} kênh
                      </span>
                    </div>
                  </td>

                  {/* Column: Thao tác (Xem chi tiết + ⋮ Menu) */}
                  <td className="px-2.5 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {/* Xem chi tiết button matching mockup */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetail(user)}
                        className="h-8 rounded-lg border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs transition-colors shrink-0 whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-stone-500 shrink-0" />
                        <span>Xem chi tiết</span>
                      </Button>

                      {/* Dropdown Menu ⋮ matching mockup */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg border-[#E5E7EB] bg-white text-stone-500 hover:text-stone-700 hover:bg-stone-50 shadow-2xs transition-colors shrink-0"
                            aria-label="Tùy chọn thao tác"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onViewDetail(user)}>
                            <Eye className="mr-2 h-4 w-4 text-stone-500" />
                            <span>Xem hồ sơ</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onChangeRole(user)}>
                            <Shield className="mr-2 h-4 w-4 text-stone-500" />
                            <span>Phân vai trò</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                            {isLocked ? (
                              <>
                                <Unlock className="mr-2 h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700">Mở khóa tài khoản</span>
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4 text-amber-600" />
                                <span className="text-amber-700">Khóa tài khoản</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onDeleteUser(user)}
                            className="text-[#DC2626] focus:bg-rose-50 focus:text-[#DC2626]"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Xóa tài khoản</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


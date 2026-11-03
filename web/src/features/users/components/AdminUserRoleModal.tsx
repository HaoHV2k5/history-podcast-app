import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { UserResponse } from '@/types/auth';

interface AdminUserRoleModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (targetRole: 'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER') => Promise<void>;
  isLoading?: boolean;
}

const ROLES_LIST = [
  {
    role: 'ADMIN' as const,
    label: 'ADMIN',
    title: 'Quản trị viên toàn hệ thống',
    description: 'Toàn quyền kiểm duyệt, quản trị người dùng, cấu hình và tài chính',
  },
  {
    role: 'CREATOR' as const,
    label: 'CREATOR',
    title: 'Nhà sáng tạo nội dung',
    description: 'Quyền sở hữu Kênh podcast, đăng tải tập phát thanh và mở nhận booking',
  },
  {
    role: 'NARRATOR' as const,
    label: 'NARRATOR',
    title: 'Thuyết minh viên',
    description: 'Hồ sơ giọng đọc, ứng tuyển dự án thu âm và hợp đồng thuyết minh',
  },
  {
    role: 'VIEWER' as const,
    label: 'USER / VIEWER',
    title: 'Thính giả & Người dùng',
    description: 'Tài khoản tiêu chuẩn nghe podcast, bình luận và mua gói hội viên',
  },
];

export const AdminUserRoleModal: React.FC<AdminUserRoleModalProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER'>('VIEWER');

  useEffect(() => {
    if (user) {
      const initial = (user.roleName || user.roles?.[0] || 'VIEWER').toUpperCase();
      if (['ADMIN', 'CREATOR', 'NARRATOR', 'VIEWER'].includes(initial)) {
        setSelectedRole(initial as 'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER');
      } else {
        setSelectedRole('VIEWER');
      }
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(selectedRole);
      onClose();
    } catch {
      // Handled by parent
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#991B1B]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#1F1612]">
                Thiết lập vai trò tài khoản
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Cập nhật vai trò chính cho người dùng{' '}
                <span className="font-mono text-[#1F1612] font-semibold">{user.email}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="rounded-xl border border-[#F0EBE6] bg-[#FAF8F5] p-3 text-[11px] text-stone-600 leading-relaxed">
            <strong className="text-[#1F1612] block mb-0.5">Quy tắc phân quyền:</strong>
            Khi thay đổi vai trò, hệ thống sẽ lưu vai trò này làm quyền chính và đồng bộ danh sách phân quyền của người dùng trên toàn bộ nền tảng Sử Ký.
          </div>

          <div className="space-y-2">
            {ROLES_LIST.map((item) => {
              const isSelected = selectedRole === item.role;
              return (
                <label
                  key={item.role}
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#991B1B] bg-[#FFF5F5] text-[#991B1B] ring-1 ring-[#991B1B]'
                      : 'border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="userRole"
                      value={item.role}
                      checked={isSelected}
                      onChange={() => setSelectedRole(item.role)}
                      className="mt-0.5 h-4 w-4 text-[#991B1B] focus:ring-[#991B1B]"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1F1612]">{item.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border bg-stone-100 text-stone-600 font-semibold">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-semibold"
            >
              Lưu vai trò
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

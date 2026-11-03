import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { validateCreateUserInput } from '../usersLogic';
import type { CreateUserPayload } from '@/services/api/users';

interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
  isLoading?: boolean;
}

export const AdminCreateUserModal: React.FC<AdminCreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleName, setRoleName] = useState('VIEWER');
  const [status, setStatus] = useState('ACTIVE');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRoleName('VIEWER');
    setStatus('ACTIVE');
    setBio('');
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCreateUserInput({ email, password, fullName, phone });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        roleName,
        status,
        bio: bio.trim() || undefined,
      });
      handleClose();
    } catch {
      // Parent handles error toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent maxWidth="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#991B1B]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#1F1612]">
                Thêm người dùng mới
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Khởi tạo tài khoản người dùng trực tiếp vào cơ sở dữ liệu hệ thống Sử Ký.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Email (Required) */}
          <div className="space-y-1">
            <label className="font-semibold text-stone-700 block">
              Địa chỉ Email <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="vidu@sucky.vn"
                className={`h-9 w-full rounded-xl border bg-white pl-9 pr-3 text-xs text-[#1F1612] placeholder-stone-400 transition-colors focus:outline-none focus:ring-1 ${errors.email
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                    : 'border-[#E7E5E4] focus:border-[#991B1B] focus:ring-[#991B1B]'
                  }`}
              />
            </div>
            {errors.email && <p className="text-[11px] text-[#DC2626]">{errors.email}</p>}
          </div>

          {/* Password (Required) */}
          <div className="space-y-1">
            <label className="font-semibold text-stone-700 block">
              Mật khẩu ban đầu <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Tối thiểu 6 ký tự"
                className={`h-9 w-full rounded-xl border bg-white pl-9 pr-3 text-xs text-[#1F1612] placeholder-stone-400 transition-colors focus:outline-none focus:ring-1 ${errors.password
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                    : 'border-[#E7E5E4] focus:border-[#991B1B] focus:ring-[#991B1B]'
                  }`}
              />
            </div>
            {errors.password && <p className="text-[11px] text-[#DC2626]">{errors.password}</p>}
          </div>

          {/* 2-column: Họ và tên & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Họ và tên</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white pl-9 pr-3 text-xs text-[#1F1612] placeholder-stone-400 focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Số điện thoại</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="0912 345 678"
                  className={`h-9 w-full rounded-xl border bg-white pl-9 pr-3 text-xs text-[#1F1612] placeholder-stone-400 focus:outline-none focus:ring-1 ${errors.phone
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                      : 'border-[#E7E5E4] focus:border-[#991B1B] focus:ring-[#991B1B]'
                    }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-[#DC2626]">{errors.phone}</p>}
            </div>
          </div>

          {/* 2-column: Vai trò & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Vai trò khởi tạo</label>
              <select
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white px-3 text-xs text-[#1F1612] focus:border-[#991B1B] focus:outline-none cursor-pointer"
              >
                <option value="VIEWER">Thính giả (VIEWER / USER)</option>
                <option value="CREATOR">Nhà sáng tạo (CREATOR)</option>
                <option value="NARRATOR">Thuyết minh viên (NARRATOR)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Trạng thái tài khoản</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#E7E5E4] bg-white px-3 text-xs text-[#1F1612] focus:border-[#991B1B] focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Chờ kích hoạt (INACTIVE)</option>
                <option value="LOCKED">Bị tạm khóa (LOCKED)</option>
              </select>
            </div>
          </div>

          {/* Bio (Optional) */}
          <div className="space-y-1">
            <label className="font-semibold text-stone-700 block">Tiểu sử ngắn (Tùy chọn)</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Giới thiệu sơ lược về người dùng hoặc kênh..."
              className="w-full rounded-xl border border-[#E7E5E4] bg-white p-2.5 text-xs text-[#1F1612] placeholder-stone-400 focus:border-[#991B1B] focus:outline-none focus:ring-1 focus:ring-[#991B1B] resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-semibold"
            >
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


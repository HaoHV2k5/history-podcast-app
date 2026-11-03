import React from 'react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { UserResponse } from '@/types/auth';

interface AdminUserStatusModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetStatus: 'ACTIVE' | 'LOCKED') => Promise<void>;
  isLoading?: boolean;
}

export const AdminUserStatusModal: React.FC<AdminUserStatusModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!user) return null;

  const isCurrentlyLocked = user.status === 'LOCKED';
  const targetStatus = isCurrentlyLocked ? 'ACTIVE' : 'LOCKED';

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isCurrentlyLocked
          ? 'Mở khóa tài khoản người dùng'
          : 'Xác nhận khóa tài khoản người dùng'
      }
      description={
        isCurrentlyLocked
          ? `Bạn có chắc chắn muốn mở khóa cho tài khoản ${user.email}? Người dùng sẽ có thể đăng nhập lại vào Sử Ký.`
          : `Tài khoản ${user.email} sẽ bị tạm khóa và không thể đăng nhập vào nền tảng Sử Ký cho tới khi được mở khóa trở lại.`
      }
      confirmText={isCurrentlyLocked ? 'Mở khóa ngay' : 'Khóa tài khoản'}
      variant={isCurrentlyLocked ? 'primary' : 'destructive'}
      isLoading={isLoading}
      onConfirm={async () => {
        await onConfirm(targetStatus);
        onClose();
      }}
    />
  );
};


import React from 'react';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { UserResponse } from '@/types/auth';

interface AdminDeleteUserModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const AdminDeleteUserModal: React.FC<AdminDeleteUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!user) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa vĩnh viễn tài khoản"
      description={`Hành động này sẽ xóa vĩnh viễn tài khoản của người dùng ${user.fullName || user.email} (ID: #${user.id}) khỏi hệ thống Sử Ký cùng toàn bộ phiên đăng nhập. Hành động này không thể hoàn tác.`}
      confirmText="Xóa vĩnh viễn"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={async () => {
        await onConfirm();
        onClose();
      }}
    />
  );
};


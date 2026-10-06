import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Info, Check } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { rolesApi } from '@/services/api/roles';
import { RoleItem } from '@/types/role';

export const RolesPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => rolesApi.getAllRoles(),
  });

  const roles = data?.data || [];

  const columns: Column<RoleItem>[] = [
    {
      key: 'name',
      header: 'Tên vai trò hệ thống',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-semibold text-ink">
              {item.name}
            </span>
            <span className="font-mono text-[11px] text-muted">ID #{item.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Định nghĩa quyền hạn & Phạm vi',
      render: (item) => (
        <p className="text-xs text-ink/90 max-w-lg leading-relaxed">
          {item.description || 'Chưa có mô tả cụ thể.'}
        </p>
      ),
    },
    {
      key: 'type',
      header: 'Phân loại quyền',
      render: (item) => {
        const isAdmin = item.name === 'ADMIN';
        return (
          <span
            className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium ${
              isAdmin
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-border bg-surface-subtle text-muted'
            }`}
          >
            {isAdmin ? 'Đặc quyền Quản trị' : 'Vai trò Người dùng'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân quyền & Vai trò"
        description="Định nghĩa các vai trò chuẩn của nền tảng Sử Ký và nguyên tắc quản trị đa vai trò"
      />

      {/* Semantic Guidance Card */}
      <div className="rounded-xl border border-border bg-surface-subtle p-5 shadow-xs space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Info className="h-4 w-4 text-accent" />
          <span>Nguyên tắc Phân quyền Đa vai trò (Multi-Role Architecture)</span>
        </div>
        <p className="text-muted">
          Hệ thống máy chủ Sử Ký áp dụng mô hình phân quyền đa vai trò (Many-to-Many). Một tài khoản có thể đồng thời sở hữu nhiều vai trò, ví dụ vừa là <strong>CREATOR</strong> vừa là <strong>NARRATOR</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-surface rounded-lg border border-border flex items-start gap-2">
            <Check className="h-4 w-4 text-status-success-text shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ink block">Vai trò chính (Primary Role):</span>
              <span className="text-muted">Được gán tại trường `users.role_id` xác định không gian làm việc mặc định khi người dùng đăng nhập.</span>
            </div>
          </div>
          <div className="p-3 bg-surface rounded-lg border border-border flex items-start gap-2">
            <Check className="h-4 w-4 text-status-success-text shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ink block">Tập hợp vai trò (User Roles Set):</span>
              <span className="text-muted">Lưu trong bảng liên kết `user_roles`, cho phép người dùng mở khóa đầy đủ tính năng bổ sung.</span>
            </div>
          </div>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải danh sách vai trò hệ thống. Vui lòng thử lại.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      {/* Roles Table */}
      <DataTable
        columns={columns}
        data={roles}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Chưa có dữ liệu vai trò"
        emptyDescription="Không tìm thấy danh sách vai trò hệ thống."
      />
    </div>
  );
};

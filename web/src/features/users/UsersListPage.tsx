import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Lock,
  Unlock,
  Radio,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { usersApi, UserQueryParams } from '@/services/api/users';
import { UserResponse } from '@/types/auth';
import { formatDateTime, maskPhone } from '@/utils/formatters';

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
  { value: 'CREATOR', label: 'Nhà sáng tạo (CREATOR)' },
  { value: 'NARRATOR', label: 'Thuyết minh viên (NARRATOR)' },
  { value: 'FREELANCER', label: 'Cộng tác viên (FREELANCER)' },
  { value: 'VIEWER', label: 'Thính giả (VIEWER)' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động (ACTIVE)' },
  { value: 'LOCKED', label: 'Bị tạm khóa (LOCKED)' },
  { value: 'INACTIVE', label: 'Chưa kích hoạt (INACTIVE)' },
];

export const UsersListPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  // Lock / Unlock Modal State
  const [statusTarget, setStatusTarget] = useState<UserResponse | null>(null);

  // Role Assignment Modal State
  const [roleTarget, setRoleTarget] = useState<UserResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER'>('VIEWER');

  const queryParams: UserQueryParams = {
    page,
    size,
    search: search.trim() || undefined,
    role: role || undefined,
    status: status || undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users-list', queryParams],
    queryFn: () => usersApi.searchUsers(queryParams),
  });

  const pageData = data?.data;
  const items = pageData?.items || pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, targetStatus }: { id: number; targetStatus: 'ACTIVE' | 'LOCKED' }) =>
      usersApi.updateStatus(id, targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setStatusTarget(null);
    },
  });

  // Role Mutation
  const roleMutation = useMutation({
    mutationFn: ({ id, targetRole }: { id: number; targetRole: 'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER' }) =>
      usersApi.updateRole(id, targetRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setRoleTarget(null);
    },
  });

  const handleOpenRoleModal = (user: UserResponse) => {
    setRoleTarget(user);
    const initialRole = (user.roleName || user.roles?.[0] || 'VIEWER') as 'ADMIN' | 'CREATOR' | 'NARRATOR' | 'VIEWER';
    setSelectedRole(initialRole);
  };

  const columns: Column<UserResponse>[] = [
    {
      key: 'identity',
      header: 'Tài khoản & Người dùng',
      render: (item) => (
        <div className="flex items-start gap-3 max-w-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle font-semibold text-accent border border-border">
            {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-ink truncate leading-tight">
              {item.fullName || 'Chưa cập nhật tên'}
            </span>
            <span className="text-xs text-muted truncate font-mono mt-0.5">
              {item.email}
            </span>
            <span className="font-mono text-[10px] text-muted">ID #{item.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      render: (item) => (
        <span className="text-xs text-ink font-mono">
          {item.phone ? maskPhone(item.phone) : '—'}
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'Vai trò tài khoản',
      render: (item) => {
        const rolesList = item.roles && item.roles.length > 0 ? item.roles : [item.roleName || 'VIEWER'];
        return (
          <div className="flex flex-wrap gap-1">
            {rolesList.map((r) => (
              <span
                key={r}
                className="rounded-sm border border-border bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink"
              >
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Ngày đăng ký',
      render: (item) => (
        <span className="text-xs text-muted font-mono">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      stickyRight: true,
      align: 'right',
      render: (item) => {
        const isLocked = item.status === 'LOCKED';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenRoleModal(item)}
              className="h-8 px-2 text-xs text-muted hover:text-ink hover:border-accent"
              title="Phân vai trò tài khoản"
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              <span>Vai trò</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusTarget(item)}
              className={`h-8 px-2 text-xs ${
                isLocked
                  ? 'border-status-success-text/40 text-status-success-text hover:bg-status-success-bg'
                  : 'border-status-error-text/40 text-status-error-text hover:bg-status-error-bg'
              }`}
              title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            >
              {isLocked ? (
                <>
                  <Unlock className="h-3.5 w-3.5 mr-1" />
                  <span>Mở khóa</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 mr-1" />
                  <span>Khóa</span>
                </>
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Tra cứu danh bạ người dùng, trạng thái kích hoạt và thiết lập vai trò hệ thống"
      />

      {/* Filter Toolbar */}
      <FilterToolbar
        searchPlaceholder="Tìm kiếm theo email, số điện thoại, họ tên..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        showReset={Boolean(search || role || status)}
        onReset={() => {
          setSearch('');
          setRole('');
          setStatus('');
          setPage(0);
        }}
        filters={
          <>
            <div className="w-48">
              <Select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(0);
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </>
        }
      />

      {/* Error notification */}
      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải dữ liệu danh sách người dùng. Vui lòng thử lại.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyTitle="Không tìm thấy người dùng"
        emptyDescription="Không có người dùng nào khớp với các tiêu chí tìm kiếm và bộ lọc hiện tại."
      />

      {/* Pagination Bar */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        size={size}
        onPageChange={setPage}
      />

      {/* Lock / Unlock Confirmation Modal */}
      {statusTarget && (
        <ConfirmModal
          isOpen={Boolean(statusTarget)}
          onClose={() => setStatusTarget(null)}
          title={
            statusTarget.status === 'LOCKED'
              ? 'Mở khóa tài khoản người dùng'
              : 'Xác nhận khóa tài khoản người dùng'
          }
          description={
            statusTarget.status === 'LOCKED'
              ? `Bạn có chắc muốn mở khóa cho tài khoản ${statusTarget.email}? Người dùng sẽ có thể đăng nhập lại bình thường.`
              : `Tài khoản ${statusTarget.email} sẽ bị tạm khóa và không thể đăng nhập vào nền tảng Sử Ký cho tới khi được mở lại.`
          }
          confirmText={statusTarget.status === 'LOCKED' ? 'Mở khóa ngay' : 'Khóa tài khoản'}
          variant={statusTarget.status === 'LOCKED' ? 'primary' : 'destructive'}
          isLoading={statusMutation.isPending}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.id,
              targetStatus: statusTarget.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED',
            })
          }
        />
      )}

      {/* Role Assignment Modal */}
      {roleTarget && (
        <Dialog open={Boolean(roleTarget)} onOpenChange={(open) => !open && setRoleTarget(null)}>
          <DialogContent maxWidth="max-w-md">
            <DialogHeader>
              <DialogTitle>Thiết lập vai trò tài khoản</DialogTitle>
              <DialogDescription>
                Cập nhật vai trò chính cho người dùng{' '}
                <span className="font-mono text-ink font-semibold">{roleTarget.email}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg border border-border bg-surface-subtle p-3 space-y-1">
                <span className="text-muted block text-[11px] font-semibold uppercase tracking-wider">
                  Cơ chế lưu trữ vai trò:
                </span>
                <p className="text-ink leading-relaxed">
                  Hệ thống máy chủ sẽ thiết lập vai trò được chọn làm <em>vai trò chính</em> và bổ sung vai trò này vào danh sách quyền đa vai trò của người dùng.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-ink block">Chọn vai trò cần thiết lập:</label>
                <div className="space-y-2">
                  {(['ADMIN', 'CREATOR', 'NARRATOR', 'VIEWER'] as const).map((r) => (
                    <label
                      key={r}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRole === r
                          ? 'border-accent bg-accent-soft text-accent font-semibold'
                          : 'border-border bg-surface text-ink hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Radio className="h-4 w-4" />
                        <span className="font-mono">{r}</span>
                      </div>
                      <span className="text-[11px] text-muted font-normal">
                        {r === 'ADMIN'
                          ? 'Quản trị viên toàn hệ thống'
                          : r === 'CREATOR'
                          ? 'Nhà sáng tạo nội dung'
                          : r === 'NARRATOR'
                          ? 'Thuyết minh viên'
                          : 'Thính giả / Người xem'}
                      </span>
                      <input
                        type="radio"
                        name="targetRole"
                        value={r}
                        checked={selectedRole === r}
                        onChange={() => setSelectedRole(r)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleTarget(null)}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                isLoading={roleMutation.isPending}
                onClick={() =>
                  roleMutation.mutate({
                    id: roleTarget.id,
                    targetRole: selectedRole,
                  })
                }
              >
                Lưu vai trò
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

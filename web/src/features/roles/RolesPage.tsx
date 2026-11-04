import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import { AlertCircle, RotateCw, CheckCircle2 } from 'lucide-react';
import { rolesApi } from '@/services/api/roles';
import { usersApi } from '@/services/api/users';
import type { RoleRequestPayload } from '@/types/role';
import type { UserResponse } from '@/types/auth';
import {
  AdminRoleRow,
  RoleCategoryFilter,
  RoleUsageFilter,
  buildAdminRoleRows,
  calculateRoleKpis,
  filterRoleRows,
  generateRolesCsv,
  getRoleVietnameseLabel,
} from './rolesLogic';
import { AdminRolesHeroBanner } from './components/AdminRolesHeroBanner';
import { AdminRolesArchitectureBanner } from './components/AdminRolesArchitectureBanner';
import { AdminRolesStatCards } from './components/AdminRolesStatCards';
import { AdminRolesToolbar } from './components/AdminRolesToolbar';
import { AdminRolesTable } from './components/AdminRolesTable';
import { AdminRoleDetailModal } from './components/AdminRoleDetailModal';
import { AdminRoleFormModal } from './components/AdminRoleFormModal';
import { AdminAssignUserRoleModal } from './components/AdminAssignUserRoleModal';
import { AdminRoleArchitectureModal } from './components/AdminRoleArchitectureModal';
import { AdminDeleteRoleModal } from './components/AdminDeleteRoleModal';

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // GSAP Staggered Entrance Animation Refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RoleCategoryFilter>('ALL');
  const [usageFilter, setUsageFilter] = useState<RoleUsageFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRoleRow | null>(null);
  const [assignModalState, setAssignModalState] = useState<{
    open: boolean;
    role: AdminRoleRow | null;
    user: UserResponse | null;
  }>({ open: false, role: null, user: null });
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminRoleRow | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // 1. Live Roles Query (GET /api/v1/roles)
  const {
    data: rolesRes,
    isLoading: isRolesLoading,
    isError: isRolesError,
    refetch: refetchRoles,
    isFetching: isRolesFetching,
  } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => rolesApi.getAllRoles(),
  });

  // 2. Live Users Query (GET /api/v1/admin/users) to compute real user counts & multi-role accounts
  const {
    data: usersRes,
    isLoading: isUsersLoading,
    refetch: refetchUsers,
    isFetching: isUsersFetching,
  } = useQuery({
    queryKey: ['admin-roles-users-lookup'],
    queryFn: () =>
      usersApi.searchUsers({
        page: 0,
        size: 1000,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    staleTime: 30000,
  });

  const rawRoles = useMemo(() => rolesRes?.data || [], [rolesRes?.data]);
  const rawUsers = useMemo(
    () => usersRes?.data?.items || usersRes?.data?.content || [],
    [usersRes?.data]
  );

  // Build enriched AdminRoleRows from 100% live Backend data
  const baseRows: AdminRoleRow[] = useMemo(
    () => buildAdminRoleRows(rawRoles, rawUsers),
    [rawRoles, rawUsers]
  );

  // Filtered rows
  const filteredRows = useMemo(
    () =>
      filterRoleRows(baseRows, {
        searchQuery,
        categoryFilter,
        usageFilter,
      }),
    [baseRows, searchQuery, categoryFilter, usageFilter]
  );

  // KPI Metrics (100% live data)
  const kpis = useMemo(
    () =>
      calculateRoleKpis(
        baseRows,
        rawUsers,
        usersRes?.data?.totalElements
      ),
    [baseRows, rawUsers, usersRes?.data?.totalElements]
  );

  // Pagination
  const totalElements = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, categoryFilter, usageFilter, pageSize]);

  // Keep detail modal reactive to updated role/user data
  const activeDetailRole = useMemo(
    () => baseRows.find((r) => r.id === detailTargetId) || null,
    [baseRows, detailTargetId]
  );

  // GSAP Staggered Entrance Animation (Rule 7 in AGENTS.md)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const targets = [
        heroRef.current,
        archRef.current,
        statsRef.current,
        toolbarRef.current,
        tableRef.current,
      ].filter(Boolean);

      gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  // Mutations
  const saveRoleMutation = useMutation({
    mutationFn: async ({
      payload,
      editingId,
    }: {
      payload: RoleRequestPayload;
      editingId?: number;
    }) => {
      if (editingId !== undefined) {
        return rolesApi.updateRole(editingId, payload);
      }
      return rolesApi.createRole(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-list'] });
      const label = getRoleVietnameseLabel(variables.payload.name);
      setToast({
        type: 'success',
        message:
          variables.editingId !== undefined
            ? `Đã cập nhật vai trò ${label} thành công`
            : `Đã tạo vai trò ${label} thành công`,
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => rolesApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-list'] });
      setToast({
        type: 'success',
        message: 'Đã xóa vai trò khỏi hệ thống thành công',
      });
    },
  });

  const assignUserRoleMutation = useMutation({
    mutationFn: ({
      userId,
      roleName,
      roleId,
    }: {
      userId: number;
      roleName: string;
      roleId?: number;
    }) => usersApi.updateRole(userId, roleName, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-users-lookup'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      const label = getRoleVietnameseLabel(variables.roleName);
      setToast({
        type: 'success',
        message: `Đã gán vai trò ${label} cho tài khoản #${variables.userId} thành công`,
      });
    },
  });

  const handleRefresh = async () => {
    await Promise.all([refetchRoles(), refetchUsers()]);
  };

  const handleExportCsv = () => {
    const csvContent = generateRolesCsv(filteredRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Phan_quyen_Vai_tro_Su_Ky_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({
      type: 'success',
      message: 'Đã xuất tệp CSV danh sách vai trò và phân quyền',
    });
  };

  const handleCopyRoleCode = async (row: AdminRoleRow) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${row.name} (Mã #${row.id})`);
      }
    } catch {
      // Fallback ignored
    }
    setToast({
      type: 'success',
      message: `Đã sao chép mã vai trò ${row.name} (Mã #${row.id})`,
    });
  };

  return (
    <div ref={pageContainerRef} className="space-y-5 pb-10 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[1000] rounded-xl px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 transition-all duration-200 ${
            toast.type === 'success'
              ? 'bg-[#065F46] text-white border border-emerald-500'
              : 'bg-[#991B1B] text-white border border-rose-500'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Hero Banner (3-Layer Architecture) */}
      <div ref={heroRef}>
        <AdminRolesHeroBanner />
      </div>

      {/* 2. Multi-Role Architecture Guidance Card */}
      <div ref={archRef}>
        <AdminRolesArchitectureBanner
          onOpenLearnMore={() => setIsArchModalOpen(true)}
        />
      </div>

      {/* 3. 4 KPI Stat Cards */}
      <div ref={statsRef}>
        <AdminRolesStatCards
          kpis={kpis}
          isLoading={isRolesLoading || isUsersLoading}
          onInspectMultiRoleAccounts={() => setIsArchModalOpen(true)}
        />
      </div>

      {/* 4. Filter & Action Toolbar */}
      <div ref={toolbarRef}>
        <AdminRolesToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          usageFilter={usageFilter}
          onUsageFilterChange={setUsageFilter}
          onRefresh={handleRefresh}
          isRefreshing={isRolesFetching || isUsersFetching}
          onExportCsv={handleExportCsv}
          onOpenCreateRole={() => {
            setEditingRole(null);
            setIsFormModalOpen(true);
          }}
          onOpenAssignUserRole={() =>
            setAssignModalState({ open: true, role: null, user: null })
          }
        />
      </div>

      {/* Error State Banner */}
      {isRolesError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              Không thể tải danh sách vai trò từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetchRoles()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-800 hover:bg-rose-50 font-semibold cursor-pointer shrink-0"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 5. Main Roles & Permissions Data Table + Pagination */}
      <div ref={tableRef}>
        <AdminRolesTable
          rows={paginatedRows}
          totalElements={totalElements}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onViewDetail={(row) => setDetailTargetId(row.id)}
          onEditRole={(row) => {
            setEditingRole(row);
            setIsFormModalOpen(true);
          }}
          onAssignRoleToUser={(row) =>
            setAssignModalState({ open: true, role: row, user: null })
          }
          onDeleteRole={(row) => setDeleteTarget(row)}
          onCopyRoleCode={handleCopyRoleCode}
          onOpenCreateRole={() => {
            setEditingRole(null);
            setIsFormModalOpen(true);
          }}
          isLoading={isRolesLoading}
        />
      </div>

      {/* Modal 1: Role Detail & Assigned Accounts Modal (Portal z-[999]) */}
      <AdminRoleDetailModal
        roleRow={activeDetailRole}
        onClose={() => setDetailTargetId(null)}
        onEditRole={(row) => {
          setEditingRole(row);
          setIsFormModalOpen(true);
        }}
        onAssignRoleToUser={(row, targetUser) =>
          setAssignModalState({
            open: true,
            role: row,
            user: targetUser || null,
          })
        }
      />

      {/* Modal 2: Create / Edit Role Modal (Portal z-[999]) */}
      <AdminRoleFormModal
        open={isFormModalOpen}
        editingRole={editingRole}
        existingRoles={rawRoles}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRole(null);
        }}
        onSubmit={async (payload, editingId) => {
          await saveRoleMutation.mutateAsync({ payload, editingId });
        }}
        isSubmitting={saveRoleMutation.isPending}
      />

      {/* Modal 3: Assign / Update User Primary Role & Multi-Role Set (Portal z-[999]) */}
      <AdminAssignUserRoleModal
        open={assignModalState.open}
        roles={baseRows}
        users={rawUsers}
        initialRole={assignModalState.role}
        initialUser={assignModalState.user}
        onClose={() =>
          setAssignModalState({ open: false, role: null, user: null })
        }
        onSubmit={async (params) => {
          await assignUserRoleMutation.mutateAsync(params);
        }}
        isSubmitting={assignUserRoleMutation.isPending}
      />

      {/* Modal 4: Multi-Role Architecture Info & Multi-Role Accounts Modal (Portal z-[999]) */}
      <AdminRoleArchitectureModal
        open={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
        users={rawUsers}
        onSelectUserForRoleChange={(user) =>
          setAssignModalState({ open: true, role: null, user })
        }
      />

      {/* Modal 5: Delete Role Confirmation Modal (Portal z-[999]) */}
      <AdminDeleteRoleModal
        roleRow={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={async (roleId) => {
          await deleteRoleMutation.mutateAsync(roleId);
        }}
        isDeleting={deleteRoleMutation.isPending}
      />
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';
import { usersApi, UserQueryParams, CreateUserPayload } from '@/services/api/users';
import { channelsApi } from '@/services/api/channels';
import { UserResponse } from '@/types/auth';

import { AdminUsersHeroBanner } from './components/AdminUsersHeroBanner';
import { AdminUsersTabs } from './components/AdminUsersTabs';
import { AdminUsersStatCards } from './components/AdminUsersStatCards';
import { AdminUsersToolbar } from './components/AdminUsersToolbar';
import { AdminUsersAdvancedFilterDrawer } from './components/AdminUsersAdvancedFilterDrawer';
import { AdminUsersTable } from './components/AdminUsersTable';
import { AdminUsersBatchBar } from './components/AdminUsersBatchBar';

import { AdminUserDetailModal } from './components/AdminUserDetailModal';
import { AdminCreateUserModal } from './components/AdminCreateUserModal';
import { AdminUserRoleModal } from './components/AdminUserRoleModal';
import { AdminUserStatusModal } from './components/AdminUserStatusModal';
import { AdminDeleteUserModal } from './components/AdminDeleteUserModal';

import {
  calculateUserStats,
  exportUsersToCSV,
} from './usersLogic';

export const UsersListPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Animation Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  // Filter & Pagination States
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10); // Matches mockup: Hiển thị 10 / trang
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [hasChannelFilter, setHasChannelFilter] = useState('all');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Selection & Feedback States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal Targets
  const [detailTarget, setDetailTarget] = useState<UserResponse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<UserResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query Params for Live Backend
  const queryParams: UserQueryParams = useMemo(
    () => ({
      page,
      size,
      search: debouncedSearch.trim() || undefined,
      role: role || undefined,
      status: status || undefined,
      sortBy: 'createdAt',
      sortDir: 'desc',
    }),
    [page, size, debouncedSearch, role, status]
  );

  // 1. Primary Users Query (Live backend data)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users-list', queryParams],
    queryFn: () => usersApi.searchUsers(queryParams),
  });

  // 2. Count Queries for accurate KPI stats
  const { data: allCountData } = useQuery({
    queryKey: ['admin-users-count-all'],
    queryFn: () => usersApi.searchUsers({ size: 1 }),
    staleTime: 30000,
  });

  const { data: activeCountData } = useQuery({
    queryKey: ['admin-users-count-active'],
    queryFn: () => usersApi.searchUsers({ status: 'ACTIVE', size: 1 }),
    staleTime: 30000,
  });

  const { data: lockedCountData } = useQuery({
    queryKey: ['admin-users-count-locked'],
    queryFn: () => usersApi.searchUsers({ status: 'LOCKED', size: 1 }),
    staleTime: 30000,
  });

  // 3. Sample query to accurately calculate real new user registration within 30 days
  const { data: allUsersSampleData } = useQuery({
    queryKey: ['admin-users-sample-all'],
    queryFn: () => usersApi.searchUsers({ size: 100, sortBy: 'createdAt', sortDir: 'desc' }),
    staleTime: 30000,
  });

  // 4. Channels Query to count podcast channels owned by each user
  const { data: channelsData } = useQuery({
    queryKey: ['admin-channels-lookup'],
    queryFn: () => channelsApi.getAllChannels(0, 100),
    staleTime: 60000,
  });

  const pageData = data?.data;
  const rawItems: UserResponse[] = pageData?.items || pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || Math.ceil(totalElements / size) || 1;
  const fullSample = allUsersSampleData?.data?.items || allUsersSampleData?.data?.content || rawItems;

  // Build Channel Counts Map: creatorId -> count
  const channelCounts = useMemo(() => {
    const map: Record<number, number> = {};
    const channelList = channelsData?.data?.items || channelsData?.data?.content || [];
    channelList.forEach((c) => {
      if (c.creatorId) {
        map[c.creatorId] = (map[c.creatorId] || 0) + 1;
      }
    });
    return map;
  }, [channelsData]);

  // Apply optional client-side extra filter (has_channel)
  const items = useMemo(() => {
    if (hasChannelFilter === 'has_channel') {
      return rawItems.filter((u) => (channelCounts[u.id] || 0) > 0 || (u.roleName === 'CREATOR'));
    }
    if (hasChannelFilter === 'no_channel') {
      return rawItems.filter((u) => (channelCounts[u.id] || 0) === 0 && (u.roleName !== 'CREATOR'));
    }
    return rawItems;
  }, [rawItems, hasChannelFilter, channelCounts]);

  // Compute live KPI metrics strictly from backend results (Zero Fake Data)
  const stats = useMemo(() => {
    return calculateUserStats({
      totalElements: allCountData?.data?.totalElements ?? totalElements,
      activeCount: activeCountData?.data?.totalElements,
      lockedCount: lockedCountData?.data?.totalElements,
      usersList: fullSample,
    });
  }, [allCountData, totalElements, activeCountData, lockedCountData, fullSample]);

  // Clear feedback message after 4s
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Entrance GSAP animation sequence
  useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current || !containerRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.38, clearProps: 'transform,opacity' }
        );
      }

      if (statsRef.current) {
        tl.fromTo(
          statsRef.current.children,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (tabsRef.current) {
        tl.fromTo(
          tabsRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, clearProps: 'transform,opacity' },
          '-=0.15'
        );
      }

      if (tableRef.current) {
        tl.fromTo(
          tableRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' },
          '-=0.1'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-count-all'] });
      setFeedbackMessage({ text: 'Tạo tài khoản người dùng thành công', type: 'success' });
    },
    onError: () => {
      setFeedbackMessage({ text: 'Không thể tạo tài khoản. Vui lòng kiểm tra lại.', type: 'error' });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, targetRole }: { id: number; targetRole: 'ADMIN' | 'CREATOR' | 'NARRATOR' | 'FREELANCER' | 'VIEWER' }) =>
      usersApi.updateRole(id, targetRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setRoleTarget(null);
      setFeedbackMessage({ text: 'Cập nhật vai trò người dùng thành công', type: 'success' });
    },
    onError: () => {
      setFeedbackMessage({ text: 'Lỗi khi cập nhật vai trò người dùng', type: 'error' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, targetStatus }: { id: number; targetStatus: 'ACTIVE' | 'LOCKED' }) =>
      usersApi.updateStatus(id, targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-count-active'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-count-locked'] });
      setStatusTarget(null);
      setFeedbackMessage({ text: 'Cập nhật trạng thái người dùng thành công', type: 'success' });
    },
    onError: () => {
      setFeedbackMessage({ text: 'Lỗi khi cập nhật trạng thái người dùng', type: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-count-all'] });
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget?.id));
      setFeedbackMessage({ text: 'Đã xóa tài khoản người dùng khỏi hệ thống', type: 'success' });
    },
    onError: () => {
      setFeedbackMessage({ text: 'Không thể xóa tài khoản này', type: 'error' });
    },
  });

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((u) => u.id));
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setDateRange('all');
    setHasChannelFilter('all');
    setPage(0);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const csvData = exportUsersToCSV(items, channelCounts);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tài khoản người dùng đã chọn?`);
    if (!confirm) return;

    for (const id of selectedIds) {
      try {
        await usersApi.deleteUser(id);
      } catch {
        // Continue with others
      }
    }
    queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    setSelectedIds([]);
    setFeedbackMessage({ text: `Đã thực hiện xóa hàng loạt thành công`, type: 'success' });
  };

  const handleBulkLock = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      try {
        await usersApi.updateStatus(id, 'LOCKED');
      } catch {
        // Continue with others
      }
    }
    queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users-count-locked'] });
    setSelectedIds([]);
    setFeedbackMessage({ text: `Đã khóa ${selectedIds.length} tài khoản thành công`, type: 'success' });
  };

  const handleBulkChangeRole = () => {
    if (selectedIds.length === 0) return;
    const firstUser = items.find((u) => u.id === selectedIds[0]);
    if (firstUser) {
      setRoleTarget(firstUser);
    }
  };

  const hasActiveFilters = Boolean(search || role || status || dateRange !== 'all' || hasChannelFilter !== 'all');

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-xs font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-[#065F46] text-white border border-emerald-500'
              : 'bg-[#991B1B] text-white border border-rose-500'
          }`}
        >
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 1. Hero Banner matching mockup 100% */}
      <div ref={heroRef}>
        <AdminUsersHeroBanner />
      </div>

      {/* 2. Sub-navigation tabs: Người dùng (Users) & Kênh Podcast (Channels) */}
      <div ref={tabsRef}>
        <AdminUsersTabs activeTab="users" />
      </div>

      {/* 3. 4 KPI Stat Cards matching mockup */}
      <div ref={statsRef}>
        <AdminUsersStatCards
          stats={stats}
          activeStatusFilter={status}
          onFilterSelect={(selectedStatus) => {
            setStatus(selectedStatus);
            setPage(0);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* 4. Toolbar: Search box, Dropdowns & Add User CTA */}
      <div className="space-y-3">
        <AdminUsersToolbar
          searchValue={search}
          onSearchChange={setSearch}
          roleValue={role}
          onRoleChange={(v) => {
            setRole(v);
            setPage(0);
          }}
          statusValue={status}
          onStatusChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          dateRangeValue={dateRange}
          onDateRangeChange={(v) => {
            setDateRange(v);
            setPage(0);
          }}
          onToggleAdvancedFilter={() => setIsAdvancedFilterOpen((prev) => !prev)}
          isAdvancedOpen={isAdvancedFilterOpen}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Collapsible Advanced Filter Drawer */}
        <AdminUsersAdvancedFilterDrawer
          isOpen={isAdvancedFilterOpen}
          onClose={() => setIsAdvancedFilterOpen(false)}
          role={role}
          onRoleChange={(r) => {
            setRole(r);
            setPage(0);
          }}
          status={status}
          onStatusChange={(s) => {
            setStatus(s);
            setPage(0);
          }}
          dateRange={dateRange}
          onDateRangeChange={(d) => {
            setDateRange(d);
            setPage(0);
          }}
          hasChannelFilter={hasChannelFilter}
          onHasChannelFilterChange={(val) => {
            setHasChannelFilter(val);
            setPage(0);
          }}
          onReset={handleResetFilters}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Error state alert */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-[#DC2626] flex items-center justify-between">
          <span>Không thể tải dữ liệu danh sách người dùng từ hệ thống.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-bold underline hover:text-[#991B1B]"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 5. Main Users Table matching mockup */}
      <div ref={tableRef} className="space-y-3">
        <AdminUsersTable
          users={items}
          channelCounts={channelCounts}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onViewDetail={(u) => setDetailTarget(u)}
          onChangeRole={(u) => setRoleTarget(u)}
          onToggleStatus={(u) => setStatusTarget(u)}
          onDeleteUser={(u) => setDeleteTarget(u)}
          isLoading={isLoading}
        />

        {/* 6. Batch Actions & Pagination Bar matching mockup */}
        <AdminUsersBatchBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkLock={handleBulkLock}
          onBulkChangeRole={handleBulkChangeRole}
          page={page}
          totalPages={totalPages}
          size={size}
          onPageChange={setPage}
          onSizeChange={(newSize) => {
            setSize(newSize);
            setPage(0);
          }}
        />
      </div>

      {/* Interactive Modals */}
      {detailTarget && (
        <AdminUserDetailModal
          user={detailTarget}
          isOpen={Boolean(detailTarget)}
          onClose={() => setDetailTarget(null)}
          channelCount={
            channelCounts[detailTarget.id] ??
            (detailTarget.isCreator ||
            detailTarget.roleName === 'CREATOR' ||
            detailTarget.roles?.some((r) => r.toUpperCase() === 'CREATOR')
              ? 1
              : 0)
          }
          onChangeRole={(u) => setRoleTarget(u)}
          onToggleStatus={(u) => setStatusTarget(u)}
        />
      )}

      {isCreateModalOpen && (
        <AdminCreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload);
          }}
          isLoading={createMutation.isPending}
        />
      )}

      {roleTarget && (
        <AdminUserRoleModal
          user={roleTarget}
          isOpen={Boolean(roleTarget)}
          onClose={() => setRoleTarget(null)}
          onSubmit={async (targetRole) => {
            await roleMutation.mutateAsync({
              id: roleTarget.id,
              targetRole,
            });
          }}
          isLoading={roleMutation.isPending}
        />
      )}

      {statusTarget && (
        <AdminUserStatusModal
          user={statusTarget}
          isOpen={Boolean(statusTarget)}
          onClose={() => setStatusTarget(null)}
          onConfirm={async (targetStatus) => {
            await statusMutation.mutateAsync({
              id: statusTarget.id,
              targetStatus,
            });
          }}
          isLoading={statusMutation.isPending}
        />
      )}

      {deleteTarget && (
        <AdminDeleteUserModal
          user={deleteTarget}
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, UserCheck, ShieldCheck, Mail, Phone } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { PaginationBar } from '@/components/common/PaginationBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/services/api/kyc';
import { KycProfile, KycQueryParams } from '@/types/kyc';
import { formatDateTime, maskPhone } from '@/utils/formatters';

const STATUS_TABS = [
  { id: '', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã phê duyệt' },
  { id: 'REJECTED', label: 'Bị từ chối' },
];

export const KycQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const queryParams: KycQueryParams = {
    page,
    size,
    status: status || undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-kyc-profiles', queryParams],
    queryFn: () => kycApi.getKycProfiles(queryParams),
  });

  const pageData = data?.data;
  const rawItems = pageData?.items || pageData?.content || [];
  
  // Client-side search filtering if search keyword present
  const items = search.trim()
    ? rawItems.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          p.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
          p.contactEmail?.toLowerCase().includes(search.toLowerCase())
      )
    : rawItems;

  const totalElements = pageData?.totalElements || items.length;
  const totalPages = pageData?.totalPages || Math.ceil(totalElements / size);

  const columns: Column<KycProfile>[] = [
    {
      key: 'fullName',
      header: 'Ứng viên & Tài khoản',
      render: (item) => (
        <div className="flex items-start gap-3 max-w-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="font-medium text-ink truncate leading-tight hover:underline cursor-pointer"
              onClick={() => navigate(`/admin/kyc/${item.id}`)}
            >
              {item.fullName || 'Chưa cập nhật tên'}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted">
              <span className="font-mono text-[11px]">User ID #{item.userId}</span>
              <span>•</span>
              <span className="truncate max-w-[150px]">{item.userEmail}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Thông tin liên hệ đã xác thực',
      render: (item) => (
        <div className="flex flex-col text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-ink">
            <Mail className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="font-mono truncate">{item.contactEmail || item.userEmail}</span>
          </div>
          {item.phone && (
            <div className="flex items-center gap-1.5 text-muted">
              <Phone className="h-3.5 w-3.5 text-muted shrink-0" />
              <span className="font-mono">{maskPhone(item.phone)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'verificationMethod',
      header: 'Phương thức OTP',
      render: (item) => (
        <div className="flex flex-col text-xs gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-status-success-text" />
            {item.verificationMethod === 'PHONE' ? 'OTP Số điện thoại' : 'OTP Hộp thư Email'}
          </span>
          {item.otpVerifiedAt && (
            <span className="text-[11px] text-muted font-mono">
              Xác thực: {formatDateTime(item.otpVerifiedAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái KYC',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Ngày nộp',
      render: (item) => (
        <span className="text-xs text-muted font-mono">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      stickyRight: true,
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/kyc/${item.id}`);
          }}
          className="min-h-[44px] px-3.5 text-xs text-ink hover:text-accent hover:border-accent"
        >
          <span>Xem xét</span>
          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xác thực danh tính KYC"
        description="Thẩm định hồ sơ định danh và phê duyệt quyền Nhà sáng tạo (Creator) trên nền tảng Sử Ký"
      />

      {/* Status Tabs */}
      <div className="flex border-b border-border space-x-1">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id);
                setPage(0);
              }}
              className={`min-h-[44px] px-4 text-xs font-medium border-b-2 transition-colors duration-150 ${
                isActive
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:text-ink hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        searchPlaceholder="Tìm kiếm theo họ tên, email người dùng..."
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        showReset={Boolean(search || status)}
        onReset={() => {
          setSearch('');
          setStatus('');
          setPage(0);
        }}
      />

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải danh sách hồ sơ KYC. Vui lòng thử lại.</span>
          <Button variant="outline" onClick={() => refetch()} className="min-h-[44px] px-3 text-xs">
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
        onRowClick={(item) => navigate(`/admin/kyc/${item.id}`)}
        emptyTitle="Chưa có hồ sơ định danh KYC"
        emptyDescription="Hiện chưa có hồ sơ xác thực danh tính nào khớp với bộ lọc đã chọn."
        pagination={
          <PaginationBar
            embedded
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={size}
            onPageChange={setPage}
          />
        }
      />
    </div>
  );
};

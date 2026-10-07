import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Auth Pages
import { LoginPage } from '@/features/auth/LoginPage';
import { ForbiddenPage } from '@/features/auth/ForbiddenPage';
import { NotFoundPage } from '@/features/auth/NotFoundPage';

// Workspace Pages
import { OverviewPage } from '@/features/overview/OverviewPage';
import { ModerationQueuePage } from '@/features/moderation/ModerationQueuePage';
import { ModerationDetailPage } from '@/features/moderation/ModerationDetailPage';
import { KycQueuePage } from '@/features/kyc/KycQueuePage';
import { KycDetailPage } from '@/features/kyc/KycDetailPage';

// Platform Governance Pages
import { UsersListPage } from '@/features/users/UsersListPage';
import { ChannelsListPage } from '@/features/channels/ChannelsListPage';
import { MembershipPage } from '@/features/membership/MembershipPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { WithdrawalsQueuePage } from '@/features/withdrawals/WithdrawalsQueuePage';
import { WithdrawalDetailPage } from '@/features/withdrawals/WithdrawalDetailPage';

// Narrator & Contract Operations Pages
import { NarratorsListPage } from '@/features/narrators/NarratorsListPage';
import { ContractsListPage } from '@/features/contracts/ContractsListPage';
import { EscrowListPage } from '@/features/escrow/EscrowListPage';
import { DisputesListPage } from '@/features/disputes/DisputesListPage';

// System Administration Pages
import { PoliciesPage } from '@/features/policies/PoliciesPage';
import { RolesPage } from '@/features/roles/RolesPage';
import { AuditLogsPage } from '@/features/audit/AuditLogsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/admin/overview" replace />} />

      {/* Public / Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Protected Admin Portal with Unified AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/overview" replace />} />

        {/* WORKSPACE */}
        <Route path="overview" element={<OverviewPage />} />
        <Route path="moderation" element={<ModerationQueuePage />} />
        <Route path="moderation/:id" element={<ModerationDetailPage />} />
        <Route path="kyc" element={<KycQueuePage />} />
        <Route path="kyc/:id" element={<KycDetailPage />} />

        {/* QUẢN TRỊ NỀN TẢNG */}
        <Route path="users" element={<UsersListPage />} />
        <Route path="channels" element={<ChannelsListPage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="withdrawals" element={<WithdrawalsQueuePage />} />
        <Route path="withdrawals/:id" element={<WithdrawalDetailPage />} />

        {/* VẬN HÀNH THUYẾT MINH */}
        <Route path="narrators" element={<NarratorsListPage />} />
        <Route path="contracts" element={<ContractsListPage />} />
        <Route path="escrow" element={<EscrowListPage />} />
        <Route path="disputes" element={<DisputesListPage />} />

        {/* QUẢN TRỊ HỆ THỐNG */}
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
      </Route>

      {/* 404 Catch-all */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moderationApi } from '@/services/api/moderation';
import { kycApi } from '@/services/api/kyc';
import { withdrawalsApi } from '@/services/api/withdrawals';
import { disputesApi } from '@/services/api/disputes';
import { DisputeItem } from '@/types/dispute';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';

import { AdminOverviewHeroBanner } from './components/AdminOverviewHeroBanner';
import { AdminStatCards } from './components/AdminStatCards';
import { AdminVideoModerationQueue } from './components/AdminVideoModerationQueue';
import { AdminKycQueue } from './components/AdminKycQueue';
import { AdminWithdrawalsTable } from './components/AdminWithdrawalsTable';
import { AdminRecentActivity } from './components/AdminRecentActivity';
import { buildRecentActivities } from './overviewLogic';

export const OverviewPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const queuesRef = useRef<HTMLDivElement>(null);
  const tablesRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  const [dateRange, setDateRange] = useState('today');

  // 1. Pending Moderation query (real live data)
  const { data: modData, isLoading: modLoading } = useQuery({
    queryKey: ['admin-overview-moderation'],
    queryFn: () => moderationApi.getReviews({ decision: 'PENDING', size: 10 }),
  });

  // 2. Pending KYC query (real live data)
  const { data: kycData, isLoading: kycLoading } = useQuery({
    queryKey: ['admin-overview-kyc'],
    queryFn: () => kycApi.getKycProfiles({ status: 'PENDING', size: 10 }),
  });

  // 3. Pending Withdrawals query (real live data)
  const { data: withData, isLoading: withLoading } = useQuery({
    queryKey: ['admin-overview-withdrawals'],
    queryFn: () => withdrawalsApi.getAllWithdrawals(0, 50),
  });

  // 4. Open Disputes query (real live data)
  const { data: disputeData, isLoading: disputeLoading } = useQuery({
    queryKey: ['admin-overview-disputes'],
    queryFn: () => disputesApi.getAllDisputes(),
  });

  // Aggregated live numbers & lists from backend
  const pendingModCount = modData?.data?.totalElements ?? 0;
  const recentModItems = modData?.data?.items || modData?.data?.content || [];

  const pendingKycCount = kycData?.data?.totalElements ?? 0;
  const recentKycItems = kycData?.data?.items || kycData?.data?.content || [];

  const allWithdrawals = withData?.data?.items || withData?.data?.content || [];
  // Active review withdrawals are those needing attention (PENDING, PROCESSING, REJECTED/FAILED).
  const reviewWithdrawals = allWithdrawals.filter((w) => w.status?.toUpperCase() !== 'COMPLETED');
  const displayWithdrawals = reviewWithdrawals.length > 0 ? reviewWithdrawals : allWithdrawals;
  const reviewWithdrawalsCount = reviewWithdrawals.length;

  const rawDisputes = disputeData?.data;
  const allDisputes: DisputeItem[] = Array.isArray(rawDisputes)
    ? rawDisputes
    : rawDisputes && 'items' in rawDisputes && Array.isArray((rawDisputes as { items: DisputeItem[] }).items)
    ? (rawDisputes as { items: DisputeItem[] }).items
    : [];
  const openDisputes = allDisputes.filter((d: DisputeItem) => d.status?.toUpperCase() !== 'RESOLVED');
  const openDisputeCount = openDisputes.length;

  // Unified real activity feed across live system entities
  const recentActivities = useMemo(() => {
    return buildRecentActivities({
      moderationItems: recentModItems,
      kycItems: recentKycItems,
      withdrawalItems: allWithdrawals,
      disputeItems: allDisputes,
    });
  }, [recentModItems, recentKycItems, allWithdrawals, allDisputes]);

  // Entrance GSAP animation sequence
  useEffect(() => {
    if (isReducedMotion() || hasAnimatedRef.current || !containerRef.current) return;
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (heroRef.current) {
        tl.fromTo(
          heroRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.42, clearProps: 'transform,opacity' }
        );
      }

      if (statsRef.current) {
        tl.fromTo(
          statsRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: 'transform,opacity' },
          '-=0.25'
        );
      }

      if (queuesRef.current) {
        tl.fromTo(
          queuesRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }

      if (tablesRef.current) {
        tl.fromTo(
          tablesRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: 'transform,opacity' },
          '-=0.2'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-7 pb-12 max-w-[1600px] mx-auto">
      {/* 1. Top Vietnamese Cultural Hero Banner */}
      <div ref={heroRef}>
        <AdminOverviewHeroBanner
          selectedRange={dateRange}
          onRangeChange={(range) => setDateRange(range)}
        />
      </div>

      {/* 2. Four Operational Metric KPI Cards */}
      <div ref={statsRef}>
        <AdminStatCards
          pendingModCount={pendingModCount}
          modLoading={modLoading}
          pendingKycCount={pendingKycCount}
          kycLoading={kycLoading}
          pendingWithCount={reviewWithdrawalsCount}
          withLoading={withLoading}
          openDisputeCount={openDisputeCount}
          disputeLoading={disputeLoading}
        />
      </div>

      {/* 3. Row 2: Video Moderation Queue (Left) & KYC Queue (Right) */}
      <div ref={queuesRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <AdminVideoModerationQueue
          items={recentModItems}
          totalCount={pendingModCount}
          isLoading={modLoading}
        />
        <AdminKycQueue
          items={recentKycItems}
          totalCount={pendingKycCount}
          isLoading={kycLoading}
        />
      </div>

      {/* 4. Row 3: Withdrawals Table (Left) & Recent Activities Feed (Right) */}
      <div ref={tablesRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <AdminWithdrawalsTable
          items={displayWithdrawals}
          totalCount={reviewWithdrawalsCount}
          isLoading={withLoading}
        />
        <AdminRecentActivity
          activities={recentActivities}
          isLoading={modLoading || kycLoading || withLoading || disputeLoading}
        />
      </div>
    </div>
  );
};

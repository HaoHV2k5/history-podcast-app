import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import { AlertCircle, AlertTriangle, RotateCw, ShieldAlert, RotateCcw } from 'lucide-react';
import { moderationApi } from '@/services/api/moderation';
import { AiShieldTier } from '@/types/moderation';
import {
  PolicyCardDraft,
  normalizePolicyConfigs,
  isPolicyDraftDirty,
  buildUpdatePolicyPayload,
  analyzeTierCoverage,
} from './policiesLogic';
import { AdminPolicyScopeBanner } from './components/AdminPolicyScopeBanner';
import { AdminPolicyTierCard } from './components/AdminPolicyTierCard';
import { AdminPolicyInfoModal } from './components/AdminPolicyInfoModal';

export const PoliciesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // GSAP Entrance Animation Refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Local Form Drafts by Tier
  const [draftMap, setDraftMap] = useState<Record<string, PolicyCardDraft>>({});
  const [savingTier, setSavingTier] = useState<AiShieldTier | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, { type: 'success' | 'error'; message: string } | null>
  >({});
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // 1. Fetch Live Policy Configs from Backend (GET /api/v1/admin/moderation/policy-configs)
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-ai-shield-policies'],
    queryFn: () => moderationApi.getPolicyConfigs(),
  });

  // Normalize live backend configs
  const serverDrafts: PolicyCardDraft[] = useMemo(() => {
    return normalizePolicyConfigs(data?.data);
  }, [data?.data]);

  // Sync server data into draftMap when server data arrives or updates
  useEffect(() => {
    if (serverDrafts.length === 0) return;
    setDraftMap((prev) => {
      const next: Record<string, PolicyCardDraft> = { ...prev };
      for (const item of serverDrafts) {
        next[item.tier] = item;
      }
      return next;
    });
  }, [serverDrafts]);

  // Ordered list of drafts to render
  const orderedDrafts: PolicyCardDraft[] = useMemo(() => {
    return serverDrafts.map((serverItem) => draftMap[serverItem.tier] || serverItem);
  }, [serverDrafts, draftMap]);

  // Cross-tier coverage analysis aligned with AiShieldPolicyServiceImpl.resolveTier(score)
  const coverageWarning = useMemo(() => {
    return analyzeTierCoverage(orderedDrafts);
  }, [orderedDrafts]);

  // Lookup map of original server items for dirty check
  const serverLookup = useMemo(() => {
    const map: Record<string, PolicyCardDraft> = {};
    for (const item of serverDrafts) {
      map[item.tier] = item;
    }
    return map;
  }, [serverDrafts]);

  // 2. Single Tier Update Mutation (PUT /api/v1/admin/moderation/policy-configs/{tier})
  const updateMutation = useMutation({
    mutationFn: async (draft: PolicyCardDraft) => {
      const payload = buildUpdatePolicyPayload(draft);
      return moderationApi.updatePolicyConfig(draft.tier, payload);
    },
    onMutate: (draft) => {
      setSavingTier(draft.tier);
      setFeedbackMap((prev) => ({ ...prev, [draft.tier]: null }));
    },
    onSuccess: (response, draft) => {
      const updated = response?.data;
      if (updated) {
        const normalized = normalizePolicyConfigs([updated])[0];
        if (normalized) {
          setDraftMap((prev) => ({ ...prev, [draft.tier]: normalized }));
        }
      }
      setFeedbackMap((prev) => ({
        ...prev,
        [draft.tier]: {
          type: 'success',
          message: 'Đã lưu cấu hình thành công',
        },
      }));
      queryClient.invalidateQueries({ queryKey: ['admin-ai-shield-policies'] });
    },
    onError: (err: any, draft) => {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu cấu hình. Vui lòng thử lại.';
      setFeedbackMap((prev) => ({
        ...prev,
        [draft.tier]: {
          type: 'error',
          message: apiMsg,
        },
      }));
    },
    onSettled: () => {
      setSavingTier(null);
    },
  });

  // 3. Reset Default Policies Mutation (POST /api/v1/admin/moderation/policy-configs/reset-defaults)
  const resetMutation = useMutation({
    mutationFn: () => moderationApi.resetDefaultPolicyConfigs(),
    onSuccess: (response) => {
      const resetItems = normalizePolicyConfigs(response?.data);
      if (resetItems.length > 0) {
        const freshMap: Record<string, PolicyCardDraft> = {};
        const freshFeedback: Record<string, { type: 'success' | 'error'; message: string }> = {};
        for (const item of resetItems) {
          freshMap[item.tier] = item;
          freshFeedback[item.tier] = {
            type: 'success',
            message: 'Đã khôi phục mặc định',
          };
        }
        setDraftMap(freshMap);
        setFeedbackMap(freshFeedback);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-ai-shield-policies'] });
    },
  });

  const handleDraftChange = (nextDraft: PolicyCardDraft) => {
    setDraftMap((prev) => ({
      ...prev,
      [nextDraft.tier]: nextDraft,
    }));
    // Clear previous save feedback when user edits
    if (feedbackMap[nextDraft.tier]) {
      setFeedbackMap((prev) => ({
        ...prev,
        [nextDraft.tier]: null,
      }));
    }
  };

  const handleSaveTier = (draft: PolicyCardDraft) => {
    updateMutation.mutate(draft);
  };

  const handleResetDefaults = async () => {
    await resetMutation.mutateAsync();
  };

  // GSAP Staggered Entrance Animation (respecting prefers-reduced-motion)
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
        headerRef.current,
        bannerRef.current,
        gridRef.current,
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

  return (
    <div ref={pageContainerRef} className="font-sans">
      <div className="rounded-2xl border border-[#EFEAE4] bg-white p-5 sm:p-7 md:p-8 shadow-2xs space-y-6">
        {/* 1. Page Header */}
        <div ref={headerRef}>
          <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-stone-900 tracking-tight leading-snug text-balance">
            Chính sách & Cấu hình Thẩm định
          </h1>
          <p className="text-xs sm:text-[13.5px] text-stone-500 mt-1 leading-relaxed text-pretty">
            Quản trị các phân tầng quy chuẩn kiểm duyệt tự động AI Shield và ngưỡng xử lý nội dung
          </p>
        </div>

        {/* 2. Scope Disclaimer Banner */}
        <div ref={bannerRef}>
          <AdminPolicyScopeBanner onOpenLearnMore={() => setInfoModalOpen(true)} />
        </div>

        {/* Cross-Tier Coverage Advisory (only visible if active tiers have gaps or overlaps) */}
        {!isLoading && coverageWarning.hasIssue && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-xs text-amber-900 space-y-1.5"
          >
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Cảnh báo tính liên tục của ngưỡng điểm AI Shield</span>
            </div>
            <ul className="list-disc pl-6 space-y-0.5 text-amber-800">
              {coverageWarning.messages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Alert Banner */}
        {isError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Không thể tải danh sách cấu hình chính sách AI Shield. Vui lòng thử lại.</span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-800 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          </div>
        )}

        {/* 3. Policy Tier Cards 2x2 Grid */}
        <div ref={gridRef} className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#EAE5DF] bg-white p-3 space-y-4 animate-pulse"
              >
                <div className="h-16 rounded-xl bg-stone-100" />
                <div className="px-3 space-y-3">
                  <div className="h-9 rounded-lg bg-stone-100" />
                  <div className="h-9 rounded-lg bg-stone-100" />
                  <div className="h-20 rounded-xl bg-stone-100" />
                </div>
                <div className="px-3 flex justify-end">
                  <div className="h-9 w-28 rounded-xl bg-stone-100" />
                </div>
              </div>
            ))
          ) : orderedDrafts.length > 0 ? (
            orderedDrafts.map((draft) => (
              <AdminPolicyTierCard
                key={draft.tier}
                draft={draft}
                isDirty={isPolicyDraftDirty(serverLookup[draft.tier], draft)}
                isSaving={savingTier === draft.tier}
                saveFeedback={feedbackMap[draft.tier]}
                onChange={handleDraftChange}
                onSave={handleSaveTier}
              />
            ))
          ) : (
            <div className="xl:col-span-2 rounded-2xl border border-[#EAE4DC] bg-[#FAF8F5] p-10 text-center space-y-3">
              <div className="mx-auto h-11 w-11 rounded-full bg-white border border-[#EAE4DC] flex items-center justify-center text-[#991B1B] shadow-2xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900">
                  Chưa có phân tầng chính sách AI Shield nào được cấu hình
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Máy chủ hiện chưa trả về dữ liệu phân tầng. Bạn có thể tải lại hoặc khởi tạo bộ ngưỡng mặc định từ hệ thống.
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D8] bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Tải lại dữ liệu</span>
                </button>
                <button
                  type="button"
                  disabled={resetMutation.isPending}
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#991B1B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7F1D1D] cursor-pointer disabled:opacity-60"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Khởi tạo mặc định</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Scope & AI Shield Info Modal (React Portal z-[999]) */}
      <AdminPolicyInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        drafts={orderedDrafts}
        onResetDefaults={handleResetDefaults}
        isResetting={resetMutation.isPending}
      />
    </div>
  );
};

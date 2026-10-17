import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import { CreatorVideoItem } from '@/types/creatorContent';
import { useAuthStore } from '@/store/authStore';

export interface ModerationDecisionEvent {
  id: string; // unique event id: `${contentId}-${decision}-${Date.now()}`
  contentId: number;
  title: string;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
  timestamp: number;
  aiShieldScore?: number | null;
  aiShieldTier?: string | null;
  aiShieldTierLabel?: string | null;
}

const DECISIONS_KEY_PREFIX = 'creator_moderation_decisions_';
const PENDING_SNAPSHOT_KEY_PREFIX = 'creator_moderation_pending_snapshot_';

function safeParseDecisions(raw: string | null): ModerationDecisionEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ModerationDecisionEvent =>
        Boolean(
          item &&
          typeof item.id === 'string' &&
          typeof item.contentId === 'number' &&
          typeof item.title === 'string' &&
          (item.decision === 'APPROVED' || item.decision === 'REJECTED') &&
          typeof item.timestamp === 'number'
        )
    );
  } catch {
    return [];
  }
}

function safeParsePendingSnapshot(raw: string | null): Map<number, { title: string; createdAt: string }> {
  const map = new Map<number, { title: string; createdAt: string }>();
  if (!raw) return map;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (item && typeof item.contentId === 'number' && typeof item.title === 'string') {
          map.set(item.contentId, {
            title: item.title,
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
          });
        }
      });
    }
  } catch {
    // ignore
  }
  return map;
}

function saveDecisions(key: string, decisions: ModerationDecisionEvent[]) {
  try {
    // Limit to 20 recent events, ensure no credentials or sensitive tokens are stored
    const sanitized = decisions.slice(0, 20).map((d) => ({
      id: d.id,
      contentId: d.contentId,
      title: d.title,
      decision: d.decision,
      reason: d.reason ? d.reason.slice(0, 250) : undefined,
      timestamp: d.timestamp,
      aiShieldScore: d.aiShieldScore,
      aiShieldTier: d.aiShieldTier,
      aiShieldTierLabel: d.aiShieldTierLabel,
    }));
    sessionStorage.setItem(key, JSON.stringify(sanitized));
  } catch {
    // Defensive against storage quota errors
  }
}

function savePendingSnapshot(key: string, map: Map<number, { title: string; createdAt: string }>) {
  try {
    const arr = Array.from(map.entries()).map(([contentId, info]) => ({
      contentId,
      title: info.title,
      createdAt: info.createdAt,
    }));
    sessionStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // Defensive against storage quota errors
  }
}

export function useModerationTracker() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Isolate storage keys strictly per authenticated Creator ID / Email
  const userIdentifier = user?.id
    ? String(user.id)
    : user?.email
      ? encodeURIComponent(user.email)
      : null;

  const decisionsKey = userIdentifier ? `${DECISIONS_KEY_PREFIX}${userIdentifier}` : null;
  const pendingSnapshotKey = userIdentifier ? `${PENDING_SNAPSHOT_KEY_PREFIX}${userIdentifier}` : null;

  // In-session recorded decisions
  const [recentDecisions, setRecentDecisions] = useState<ModerationDecisionEvent[]>(() => {
    if (!decisionsKey) return [];
    return safeParseDecisions(sessionStorage.getItem(decisionsKey));
  });

  // Track previous pending items across polling cycles
  const previousPendingMapRef = useRef<Map<number, { title: string; createdAt: string }>>(new Map());
  const isFirstRunRef = useRef(true);
  const isMountedRef = useRef(true);
  const inFlightIdsRef = useRef<Set<number>>(new Set());

  // Reset or switch state whenever authenticated user changes (Account Isolation)
  useEffect(() => {
    isMountedRef.current = true;
    isFirstRunRef.current = true;
    inFlightIdsRef.current.clear();

    if (decisionsKey && pendingSnapshotKey) {
      setRecentDecisions(safeParseDecisions(sessionStorage.getItem(decisionsKey)));
      previousPendingMapRef.current = safeParsePendingSnapshot(
        sessionStorage.getItem(pendingSnapshotKey)
      );
    } else {
      setRecentDecisions([]);
      previousPendingMapRef.current = new Map();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [userIdentifier, decisionsKey, pendingSnapshotKey]);

  // Query videos that are currently PENDING_REVIEW from backend
  const {
    data: pendingRes,
    isLoading,
    isError,
    isFetching,
    refetch: checkNow,
  } = useQuery({
    queryKey: ['creator', 'moderation-tracking', 'pending'],
    queryFn: () => creatorStudioApi.getVideos({ status: 'PENDING_REVIEW' }),
    enabled: Boolean(userIdentifier),
    // Poll every 15s when there are items awaiting review; pause when window is blurred
    refetchInterval: (query) => {
      const count = Array.isArray(query.state.data?.data) ? query.state.data.data.length : 0;
      return count > 0 ? 15000 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const pendingVideos: CreatorVideoItem[] = useMemo(
    () => (Array.isArray(pendingRes?.data) ? pendingRes.data : []),
    [pendingRes]
  );
  const pendingCount = pendingVideos.length;

  // Process status transitions
  useEffect(() => {
    // Guard: Do not process transitions during initial load or when API errors occur
    if (isLoading || isError || !pendingRes || pendingRes.success === false) {
      return;
    }

    if (!userIdentifier || !pendingSnapshotKey || !decisionsKey) {
      return;
    }

    const currentMap = new Map<number, { title: string; createdAt: string }>();
    pendingVideos.forEach((v) => {
      currentMap.set(v.contentId, { title: v.title, createdAt: v.createdAt });
    });

    if (isFirstRunRef.current) {
      // Check if a saved snapshot exists from earlier in the session (e.g. before page reload)
      const savedSnapshot = safeParsePendingSnapshot(sessionStorage.getItem(pendingSnapshotKey));

      if (savedSnapshot.size > 0) {
        // Restore saved snapshot so any resolutions that happened during reload are detected
        previousPendingMapRef.current = savedSnapshot;
      } else {
        // Clean first mount
        previousPendingMapRef.current = currentMap;
        savePendingSnapshot(pendingSnapshotKey, currentMap);
        isFirstRunRef.current = false;
        return;
      }
      isFirstRunRef.current = false;
    }

    // Check for items that were in previous pending list but are no longer in current pending list
    const previousMap = previousPendingMapRef.current;
    const resolvedIds: { contentId: number; title: string }[] = [];

    previousMap.forEach((info, contentId) => {
      if (!currentMap.has(contentId)) {
        resolvedIds.push({ contentId, title: info.title });
      }
    });

    // Update snapshot and persist for next polling cycle
    previousPendingMapRef.current = currentMap;
    savePendingSnapshot(pendingSnapshotKey, currentMap);

    // For any resolved item, fetch its current detail to detect whether it was APPROVED or REJECTED
    if (resolvedIds.length > 0) {
      resolvedIds.forEach(async ({ contentId, title }) => {
        // Guard against duplicate in-flight requests for the same contentId
        if (inFlightIdsRef.current.has(contentId)) return;
        inFlightIdsRef.current.add(contentId);

        try {
          const detailRes = await creatorStudioApi.getVideoDetail(contentId);
          if (!isMountedRef.current) return;

          const detail = detailRes?.data;
          if (!detail) return;

          let decision: 'APPROVED' | 'REJECTED' | null = null;
          if (detail.status === 'PUBLISHED' || detail.moderationDecision === 'APPROVED') {
            decision = 'APPROVED';
          } else if (detail.status === 'REJECTED' || detail.moderationDecision === 'REJECTED') {
            decision = 'REJECTED';
          }

          if (decision) {
            const newEvent: ModerationDecisionEvent = {
              id: `${contentId}-${decision}-${Date.now()}`,
              contentId,
              title: detail.title || title,
              decision,
              reason: detail.moderationReason?.trim() || undefined,
              timestamp: Date.now(),
              aiShieldScore: detail.aiShieldScore,
              aiShieldTier: detail.aiShieldTier || undefined,
              aiShieldTierLabel: detail.aiShieldTierLabel || undefined,
            };

            setRecentDecisions((prev) => {
              // Avoid duplicate event for same contentId and decision in list
              const exists = prev.some((e) => e.contentId === contentId && e.decision === decision);
              if (exists) return prev;
              const next = [newEvent, ...prev].slice(0, 20);
              saveDecisions(decisionsKey, next);
              return next;
            });

            // Automatically invalidate TanStack Query caches so UI updates seamlessly
            queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
            queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
            queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
          }
        } catch {
          // If error fetching detail, ignore gracefully without crashing
        } finally {
          inFlightIdsRef.current.delete(contentId);
        }
      });
    }
  }, [
    pendingRes,
    pendingVideos,
    isLoading,
    isError,
    userIdentifier,
    pendingSnapshotKey,
    decisionsKey,
    queryClient,
  ]);

  const dismissDecision = useCallback(
    (id: string) => {
      setRecentDecisions((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (decisionsKey) {
          saveDecisions(decisionsKey, next);
        }
        return next;
      });
    },
    [decisionsKey]
  );

  const clearAllDecisions = useCallback(() => {
    setRecentDecisions([]);
    if (decisionsKey) {
      try {
        sessionStorage.removeItem(decisionsKey);
      } catch {
        // ignore
      }
    }
  }, [decisionsKey]);

  return {
    pendingVideos,
    pendingCount,
    recentDecisions,
    isLoading,
    isFetching,
    isPolling: pendingCount > 0,
    checkNow,
    dismissDecision,
    clearAllDecisions,
  };
}

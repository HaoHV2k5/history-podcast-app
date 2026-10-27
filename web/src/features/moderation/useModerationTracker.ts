import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { creatorStudioApi, BusinessApiError } from '@/services/api/creatorStudio';
import { CreatorVideoItem } from '@/types/creatorContent';
import { useAuthStore } from '@/store/authStore';
import {
  ModerationDecisionEvent,
  UnresolvedTransition,
  DECISIONS_KEY_PREFIX,
  PENDING_SNAPSHOT_KEY_PREFIX,
  UNRESOLVED_SNAPSHOT_KEY_PREFIX,
  READ_NOTIFICATIONS_KEY_PREFIX,
  MAX_RESOLUTION_RETRIES,
  calculateBackoffDelay,
  safeParseDecisions,
  safeParsePendingSnapshot,
  safeParseUnresolved,
  safeParseReadIds,
  serializeDecisions,
  serializePendingSnapshot,
  serializeUnresolvedSnapshot,
  serializeReadIds,
  detectNewlyResolvedIds,
  selectEligibleRetryCandidates,
  evaluateDetailResponse,
  evaluateDetailError,
  appendDecisionWithoutDuplicate,
} from './moderationTrackerLogic';

export type { ModerationDecisionEvent, UnresolvedTransition };
export { MAX_RESOLUTION_RETRIES, calculateBackoffDelay };

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
  const unresolvedSnapshotKey = userIdentifier ? `${UNRESOLVED_SNAPSHOT_KEY_PREFIX}${userIdentifier}` : null;
  const readIdsKey = userIdentifier ? `${READ_NOTIFICATIONS_KEY_PREFIX}${userIdentifier}` : null;

  // Track active user in a ref to guard against cross-account race conditions during async in-flight calls
  const activeUserIdentifierRef = useRef<string | null>(userIdentifier);
  useEffect(() => {
    activeUserIdentifierRef.current = userIdentifier;
  }, [userIdentifier]);

  // In-session recorded decisions
  const [recentDecisions, setRecentDecisions] = useState<ModerationDecisionEvent[]>(() => {
    if (!decisionsKey) return [];
    return safeParseDecisions(sessionStorage.getItem(decisionsKey));
  });

  // Track read notification identifiers across sessions (persisted in localStorage)
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (!readIdsKey) return new Set();
    try {
      return safeParseReadIds(localStorage.getItem(readIdsKey));
    } catch {
      return new Set();
    }
  });

  // Track previous pending items across polling cycles
  const previousPendingMapRef = useRef<Map<number, { title: string; createdAt: string }>>(new Map());
  const unresolvedMapRef = useRef<Map<number, UnresolvedTransition>>(new Map());
  const isFirstRunRef = useRef(true);
  const isMountedRef = useRef(true);
  const inFlightIdsRef = useRef<Set<number>>(new Set());

  // Reset or switch state whenever authenticated user changes (Account Isolation)
  useEffect(() => {
    isMountedRef.current = true;
    isFirstRunRef.current = true;
    inFlightIdsRef.current.clear();

    if (decisionsKey && pendingSnapshotKey && unresolvedSnapshotKey) {
      setRecentDecisions(safeParseDecisions(sessionStorage.getItem(decisionsKey)));
      previousPendingMapRef.current = safeParsePendingSnapshot(
        sessionStorage.getItem(pendingSnapshotKey)
      );
      unresolvedMapRef.current = safeParseUnresolved(
        sessionStorage.getItem(unresolvedSnapshotKey)
      );
    } else {
      setRecentDecisions([]);
      previousPendingMapRef.current = new Map();
      unresolvedMapRef.current = new Map();
    }

    if (readIdsKey) {
      try {
        setReadIds(safeParseReadIds(localStorage.getItem(readIdsKey)));
      } catch {
        setReadIds(new Set());
      }
    } else {
      setReadIds(new Set());
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [userIdentifier, decisionsKey, pendingSnapshotKey, unresolvedSnapshotKey, readIdsKey]);

  // Query videos that are currently PENDING_REVIEW from backend
  const {
    data: pendingRes,
    isLoading,
    isError,
    isFetching,
    refetch: rawCheckNow,
  } = useQuery({
    queryKey: ['creator', 'moderation-tracking', 'pending'],
    queryFn: () => creatorStudioApi.getVideos({ status: 'PENDING_REVIEW' }),
    enabled: Boolean(userIdentifier),
    // Poll every 15s only when there are items awaiting review OR active unexhausted retries
    refetchInterval: (query) => {
      const count = Array.isArray(query.state.data?.data) ? query.state.data.data.length : 0;
      // Stop background polling if all unresolved transitions have reached MAX_RESOLUTION_RETRIES
      const hasActiveUnresolved = Array.from(unresolvedMapRef.current.values()).some(
        (item) => item.retryCount <= MAX_RESOLUTION_RETRIES
      );
      return count > 0 || hasActiveUnresolved ? 15000 : false;
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

    if (!userIdentifier || !pendingSnapshotKey || !decisionsKey || !unresolvedSnapshotKey) {
      return;
    }

    const currentMap = new Map<number, { title: string; createdAt: string }>();
    pendingVideos.forEach((v) => {
      currentMap.set(v.contentId, { title: v.title, createdAt: v.createdAt });
      // If an unresolved item reappears in pending list (transient backend glitch), remove it from unresolved
      if (unresolvedMapRef.current.has(v.contentId)) {
        unresolvedMapRef.current.delete(v.contentId);
        try {
          sessionStorage.setItem(
            unresolvedSnapshotKey,
            serializeUnresolvedSnapshot(unresolvedMapRef.current)
          );
        } catch {
          // ignore storage quota errors
        }
      }
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
        try {
          sessionStorage.setItem(pendingSnapshotKey, serializePendingSnapshot(currentMap));
        } catch {
          // ignore
        }
        isFirstRunRef.current = false;
        return;
      }
      isFirstRunRef.current = false;
    }

    // Check for items that were in previous pending list but are no longer in current pending list
    const newlyResolved = detectNewlyResolvedIds(previousPendingMapRef.current, currentMap);
    newlyResolved.forEach(({ contentId, title }) => {
      if (!unresolvedMapRef.current.has(contentId)) {
        unresolvedMapRef.current.set(contentId, {
          contentId,
          title,
          retryCount: 0,
          lastAttempt: 0,
        });
      }
    });

    // Update snapshot and persist for next polling cycle
    previousPendingMapRef.current = currentMap;
    try {
      sessionStorage.setItem(pendingSnapshotKey, serializePendingSnapshot(currentMap));
      sessionStorage.setItem(
        unresolvedSnapshotKey,
        serializeUnresolvedSnapshot(unresolvedMapRef.current)
      );
    } catch {
      // ignore
    }

    // Select candidates eligible for bounded exponential retry
    const candidates = selectEligibleRetryCandidates(
      unresolvedMapRef.current,
      Date.now(),
      MAX_RESOLUTION_RETRIES
    );

    if (candidates.length > 0) {
      const capturedUser = userIdentifier;

      candidates.forEach(async (candidate) => {
        const { contentId } = candidate;

        // Guard against duplicate concurrent in-flight requests for the same contentId
        if (inFlightIdsRef.current.has(contentId)) return;
        inFlightIdsRef.current.add(contentId);

        // Update attempt timestamp and retry count
        candidate.lastAttempt = Date.now();
        candidate.retryCount += 1;
        try {
          sessionStorage.setItem(
            unresolvedSnapshotKey,
            serializeUnresolvedSnapshot(unresolvedMapRef.current)
          );
        } catch {
          // ignore
        }

        try {
          const detailRes = await creatorStudioApi.getVideoDetail(contentId);

          // RACE GUARD: If user switched account or component unmounted during in-flight request, discard immediately
          if (!isMountedRef.current || activeUserIdentifierRef.current !== capturedUser) {
            return;
          }

          const outcome = evaluateDetailResponse(candidate, detailRes?.data);

          if (outcome.action === 'DECISION_CREATED' && outcome.decisionEvent) {
            const event = outcome.decisionEvent;

            setRecentDecisions((prev) => {
              const { updated, wasAdded } = appendDecisionWithoutDuplicate(prev, event, 20);
              if (wasAdded && decisionsKey) {
                try {
                  sessionStorage.setItem(decisionsKey, serializeDecisions(updated));
                } catch {
                  // ignore
                }
              }
              return updated;
            });

            // Successfully resolved: remove from unresolved snapshot
            unresolvedMapRef.current.delete(contentId);
            try {
              sessionStorage.setItem(
                unresolvedSnapshotKey,
                serializeUnresolvedSnapshot(unresolvedMapRef.current)
              );
            } catch {
              // ignore
            }

            // Invalidate TanStack caches to keep UI fresh
            queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
            queryClient.invalidateQueries({ queryKey: ['creator', 'studio-video', contentId] });
            queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
          } else if (outcome.action === 'TERMINAL_DISCARD') {
            // Moved to DRAFT or other terminal non-moderated state
            unresolvedMapRef.current.delete(contentId);
            try {
              sessionStorage.setItem(
                unresolvedSnapshotKey,
                serializeUnresolvedSnapshot(unresolvedMapRef.current)
              );
            } catch {
              // ignore
            }
          } else if (outcome.action === 'STILL_PENDING') {
            // Content still pending according to detail endpoint: keep in unresolved map for next cycle
          }
        } catch (err: unknown) {
          // RACE GUARD: If user switched account during error return, do not mutate state
          if (!isMountedRef.current || activeUserIdentifierRef.current !== capturedUser) {
            return;
          }

          let errorCode: string | null = null;
          let httpStatus: number | null = null;

          if (err instanceof BusinessApiError) {
            errorCode = err.errorCode || null;
            httpStatus = err.response?.status || null;
          } else if (axios.isAxiosError(err)) {
            httpStatus = err.response?.status || null;
            errorCode = (err.response?.data as { code?: string })?.code || null;
          }

          const errorOutcome = evaluateDetailError(
            candidate,
            errorCode,
            httpStatus,
            MAX_RESOLUTION_RETRIES
          );

          if (errorOutcome.action === 'TERMINAL_DISCARD') {
            // 404 (deleted) or 403 (forbidden/unauthorized): remove from unresolved
            unresolvedMapRef.current.delete(contentId);
          }
          // If RETRY_LATER or EXHAUSTED: keep in unresolvedMapRef (do NOT discard, wait for next eligible retry or manual checkNow)

          try {
            sessionStorage.setItem(
              unresolvedSnapshotKey,
              serializeUnresolvedSnapshot(unresolvedMapRef.current)
            );
          } catch {
            // ignore
          }
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
    unresolvedSnapshotKey,
    queryClient,
  ]);

  /**
   * Manual recovery path: reset retry counts on any exhausted items and re-trigger check
   */
  const checkNow = useCallback(async () => {
    unresolvedMapRef.current.forEach((item) => {
      item.retryCount = 0;
      item.lastAttempt = 0;
    });
    if (unresolvedSnapshotKey) {
      try {
        sessionStorage.setItem(
          unresolvedSnapshotKey,
          serializeUnresolvedSnapshot(unresolvedMapRef.current)
        );
      } catch {
        // ignore
      }
    }
    return rawCheckNow();
  }, [rawCheckNow, unresolvedSnapshotKey]);

  const dismissDecision = useCallback(
    (id: string) => {
      setRecentDecisions((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (decisionsKey) {
          try {
            sessionStorage.setItem(decisionsKey, serializeDecisions(next));
          } catch {
            // ignore
          }
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

  const isRead = useCallback(
    (id: string) => readIds.has(id),
    [readIds]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        if (readIdsKey) {
          try {
            localStorage.setItem(readIdsKey, serializeReadIds(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [readIdsKey]
  );

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      pendingVideos.forEach((v) => next.add(`pending-${v.contentId}`));
      recentDecisions.forEach((d) => next.add(`decision-${d.id}`));
      if (readIdsKey) {
        try {
          localStorage.setItem(readIdsKey, serializeReadIds(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [pendingVideos, recentDecisions, readIdsKey]);

  const unreadPendingCount = useMemo(
    () => pendingVideos.filter((v) => !readIds.has(`pending-${v.contentId}`)).length,
    [pendingVideos, readIds]
  );

  const unreadDecisionsCount = useMemo(
    () => recentDecisions.filter((d) => !readIds.has(`decision-${d.id}`)).length,
    [recentDecisions, readIds]
  );

  const unreadCount = unreadPendingCount + unreadDecisionsCount;

  const hasActiveUnresolved = Array.from(unresolvedMapRef.current.values()).some(
    (item) => item.retryCount <= MAX_RESOLUTION_RETRIES
  );
  const exhaustedCount = Array.from(unresolvedMapRef.current.values()).filter(
    (item) => item.retryCount > MAX_RESOLUTION_RETRIES
  ).length;

  return {
    pendingVideos,
    pendingCount,
    unreadPendingCount,
    recentDecisions,
    unreadDecisionsCount,
    unreadCount,
    readIds,
    isRead,
    markAsRead,
    markAllAsRead,
    exhaustedCount,
    isLoading,
    isFetching,
    isPolling: pendingCount > 0 || hasActiveUnresolved,
    checkNow,
    dismissDecision,
    clearAllDecisions,
  };
}

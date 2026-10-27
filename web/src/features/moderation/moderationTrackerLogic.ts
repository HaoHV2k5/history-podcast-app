/**
 * PRM232 Milestone 9.1: Core Moderation Tracker Transition & Bounded Exponential Retry Engine
 * Pure logic and algorithmic state machine separated from React lifecycle for reliable auditability.
 */

export interface ModerationDecisionEvent {
  id: string; // unique event id: `${contentId}-${decision}-${timestamp}`
  contentId: number;
  title: string;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
  timestamp: number;
  aiShieldScore?: number | null;
  aiShieldTier?: string | null;
  aiShieldTierLabel?: string | null;
}

export interface UnresolvedTransition {
  contentId: number;
  title: string;
  retryCount: number;
  lastAttempt: number;
}

export const DECISIONS_KEY_PREFIX = 'creator_moderation_decisions_';
export const PENDING_SNAPSHOT_KEY_PREFIX = 'creator_moderation_pending_snapshot_';
export const UNRESOLVED_SNAPSHOT_KEY_PREFIX = 'creator_moderation_unresolved_';
export const READ_NOTIFICATIONS_KEY_PREFIX = 'creator_moderation_read_ids_';

export const MAX_RESOLUTION_RETRIES = 5;
export const INITIAL_RETRY_DELAY_MS = 2000;
export const MAX_RETRY_DELAY_MS = 30000;

/**
 * Calculates bounded exponential backoff delay with upper ceiling.
 * Formula: delay = min(30000, 2000 * 2^(retryCount - 1))
 * retryCount = 1 -> 2000ms (2s)
 * retryCount = 2 -> 4000ms (4s)
 * retryCount = 3 -> 8000ms (8s)
 * retryCount = 4 -> 16000ms (16s)
 * retryCount >= 5 -> 30000ms (30s)
 */
export function calculateBackoffDelay(retryCount: number): number {
  if (retryCount <= 0) return 0;
  const exponent = Math.min(4, Math.max(0, retryCount - 1));
  const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, exponent);
  return Math.min(MAX_RETRY_DELAY_MS, delay);
}

/**
 * Safely parses decision events from JSON string.
 */
export function safeParseDecisions(raw: string | null): ModerationDecisionEvent[] {
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

/**
 * Safely parses pending items snapshot from JSON string.
 */
export function safeParsePendingSnapshot(raw: string | null): Map<number, { title: string; createdAt: string }> {
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

/**
 * Safely parses unresolved transitions snapshot from JSON string.
 */
export function safeParseUnresolved(raw: string | null): Map<number, UnresolvedTransition> {
  const map = new Map<number, UnresolvedTransition>();
  if (!raw) return map;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (item && typeof item.contentId === 'number' && typeof item.title === 'string') {
          map.set(item.contentId, {
            contentId: item.contentId,
            title: item.title,
            retryCount: typeof item.retryCount === 'number' ? item.retryCount : 0,
            lastAttempt: typeof item.lastAttempt === 'number' ? item.lastAttempt : 0,
          });
        }
      });
    }
  } catch {
    // ignore
  }
  return map;
}

/**
 * Serializes decision events into a sanitized JSON string.
 */
export function serializeDecisions(decisions: ModerationDecisionEvent[]): string {
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
  return JSON.stringify(sanitized);
}

/**
 * Serializes pending map into JSON string.
 */
export function serializePendingSnapshot(map: Map<number, { title: string; createdAt: string }>): string {
  const arr = Array.from(map.entries()).map(([contentId, info]) => ({
    contentId,
    title: info.title,
    createdAt: info.createdAt,
  }));
  return JSON.stringify(arr);
}

/**
 * Serializes unresolved transitions into JSON string.
 */
export function serializeUnresolvedSnapshot(map: Map<number, UnresolvedTransition>): string {
  return JSON.stringify(Array.from(map.values()));
}

/**
 * Compares previous pending map with current pending map to detect newly disappeared items.
 */
export function detectNewlyResolvedIds(
  previousMap: Map<number, { title: string; createdAt: string }>,
  currentMap: Map<number, { title: string; createdAt: string }>
): { contentId: number; title: string }[] {
  const resolved: { contentId: number; title: string }[] = [];
  previousMap.forEach((info, contentId) => {
    if (!currentMap.has(contentId)) {
      resolved.push({ contentId, title: info.title });
    }
  });
  return resolved;
}

/**
 * Selects candidate transitions eligible for retry based on bounded exponential backoff.
 * Allows MAX_RESOLUTION_RETRIES (5) full retries:
 * retryCount 0 -> initial attempt (0s delay)
 * retryCount 1 -> retry 1 (2s delay)
 * retryCount 2 -> retry 2 (4s delay)
 * retryCount 3 -> retry 3 (8s delay)
 * retryCount 4 -> retry 4 (16s delay)
 * retryCount 5 -> retry 5 (30s delay - explicitly reachable before exhaustion)
 * retryCount > 5 -> EXHAUSTED
 */
export function selectEligibleRetryCandidates(
  unresolvedMap: Map<number, UnresolvedTransition>,
  now: number = Date.now(),
  maxRetries: number = MAX_RESOLUTION_RETRIES
): UnresolvedTransition[] {
  return Array.from(unresolvedMap.values()).filter((item) => {
    if (item.retryCount > maxRetries) return false;
    const requiredDelay = calculateBackoffDelay(item.retryCount);
    return now - item.lastAttempt >= requiredDelay;
  });
}

export type ResolutionAction = 'DECISION_CREATED' | 'RETRY_LATER' | 'TERMINAL_DISCARD' | 'STILL_PENDING';

export interface ResolutionOutcome {
  action: ResolutionAction;
  decisionEvent?: ModerationDecisionEvent;
}

/**
 * Evaluates server content detail response and determines state action.
 */
export function evaluateDetailResponse(
  candidate: UnresolvedTransition,
  detail: {
    status?: string | null;
    moderationDecision?: string | null;
    moderationReason?: string | null;
    aiShieldScore?: number | null;
    aiShieldTier?: string | null;
    aiShieldTierLabel?: string | null;
  } | null | undefined
): ResolutionOutcome {
  if (!detail) {
    return { action: 'RETRY_LATER' };
  }

  let decision: 'APPROVED' | 'REJECTED' | null = null;
  if (detail.status === 'PUBLISHED' || detail.moderationDecision === 'APPROVED') {
    decision = 'APPROVED';
  } else if (detail.status === 'REJECTED' || detail.moderationDecision === 'REJECTED') {
    decision = 'REJECTED';
  }

  if (decision) {
    const event: ModerationDecisionEvent = {
      id: `${candidate.contentId}-${decision}-${Date.now()}`,
      contentId: candidate.contentId,
      title: candidate.title,
      decision,
      reason: detail.moderationReason?.trim() || undefined,
      timestamp: Date.now(),
      aiShieldScore: detail.aiShieldScore ?? null,
      aiShieldTier: detail.aiShieldTier ?? null,
      aiShieldTierLabel: detail.aiShieldTierLabel ?? null,
    };
    return { action: 'DECISION_CREATED', decisionEvent: event };
  }

  if (detail.status === 'PENDING_REVIEW') {
    return { action: 'STILL_PENDING' };
  }

  // Moved to DRAFT or other terminal state
  return { action: 'TERMINAL_DISCARD' };
}

/**
 * Evaluates detail lookup error (distinguishing 404/403 terminal vs temporary network errors).
 */
export function evaluateDetailError(
  candidate: UnresolvedTransition,
  errorCode?: string | null,
  httpStatus?: number | null,
  maxRetries: number = MAX_RESOLUTION_RETRIES
): { action: 'TERMINAL_DISCARD' | 'RETRY_LATER' | 'EXHAUSTED' } {
  // 404 Not Found (ERR_1002): Content deleted
  if (errorCode === 'ERR_1002' || httpStatus === 404) {
    return { action: 'TERMINAL_DISCARD' };
  }

  // 403 Forbidden (ERR_1004): Unauthorized / Channel mismatch
  if (errorCode === 'ERR_1004' || httpStatus === 403) {
    return { action: 'TERMINAL_DISCARD' };
  }

  // Temporary network or 500 server error
  // Exhausted only when all maxRetries (5 retries) have completed and failed
  if (candidate.retryCount > maxRetries) {
    return { action: 'EXHAUSTED' };
  }

  return { action: 'RETRY_LATER' };
}

/**
 * Appends a decision event preventing duplicates for the same contentId & decision.
 */
export function appendDecisionWithoutDuplicate(
  existing: ModerationDecisionEvent[],
  newEvent: ModerationDecisionEvent,
  maxKeep: number = 20
): { updated: ModerationDecisionEvent[]; wasAdded: boolean } {
  const exists = existing.some(
    (e) => e.contentId === newEvent.contentId && e.decision === newEvent.decision
  );
  if (exists) {
    return { updated: existing, wasAdded: false };
  }
  return { updated: [newEvent, ...existing].slice(0, maxKeep), wasAdded: true };
}

/**
 * Safely parses read notification IDs from JSON array string.
 */
export function safeParseReadIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

/**
 * Serializes read notification IDs set to JSON array string.
 */
export function serializeReadIds(set: Set<string>): string {
  return JSON.stringify(Array.from(set));
}


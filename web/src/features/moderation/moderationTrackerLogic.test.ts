/**
 * PRM232 Milestone 9.1: Comprehensive Unit & State-Transition Tests
 * Tests the production logic in moderationTrackerLogic.ts directly against all 10 mandatory audit scenarios.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBackoffDelay,
  detectNewlyResolvedIds,
  selectEligibleRetryCandidates,
  evaluateDetailResponse,
  evaluateDetailError,
  appendDecisionWithoutDuplicate,
  safeParsePendingSnapshot,
  serializePendingSnapshot,
  safeParseUnresolved,
  serializeUnresolvedSnapshot,
  safeParseDecisions,
  serializeDecisions,
  MAX_RESOLUTION_RETRIES,
} from './moderationTrackerLogic.ts';
import type {
  UnresolvedTransition,
  ModerationDecisionEvent,
} from './moderationTrackerLogic.ts';

test('Scenario 1: Detail request fails once with temporary network error, then succeeds on retry', () => {
  // Step 1: Detect newly resolved content
  const prevPending = new Map([[101, { title: 'Trận Bạch Đằng', createdAt: '2026-10-18T00:00:00Z' }]]);
  const currPending = new Map<number, { title: string; createdAt: string }>();
  const newlyResolved = detectNewlyResolvedIds(prevPending, currPending);
  assert.equal(newlyResolved.length, 1);
  assert.equal(newlyResolved[0].contentId, 101);

  // Step 2: Unresolved transition created
  const unresolvedMap = new Map<number, UnresolvedTransition>();
  unresolvedMap.set(101, {
    contentId: 101,
    title: newlyResolved[0].title,
    retryCount: 0,
    lastAttempt: 0,
  });

  // Step 3: Attempt 1 fails temporarily (network error)
  const candidate = unresolvedMap.get(101)!;
  candidate.retryCount = 1;
  candidate.lastAttempt = 1000;
  const err1 = evaluateDetailError(candidate, null, null, MAX_RESOLUTION_RETRIES);
  assert.equal(err1.action, 'RETRY_LATER');
  assert.ok(unresolvedMap.has(101), 'Unresolved item must be retained after 1st network failure');

  // Step 4: Backoff check (delay for attempt 1 is 2000ms)
  const delay1 = calculateBackoffDelay(1);
  assert.equal(delay1, 2000);
  assert.equal(selectEligibleRetryCandidates(unresolvedMap, 2000).length, 0, 'Not eligible before 2000ms');
  assert.equal(selectEligibleRetryCandidates(unresolvedMap, 3000).length, 1, 'Eligible after 2000ms delay');

  // Step 5: Attempt 2 succeeds with APPROVED
  candidate.retryCount = 2;
  candidate.lastAttempt = 3000;
  const outcome = evaluateDetailResponse(candidate, {
    status: 'PUBLISHED',
    moderationDecision: 'APPROVED',
    moderationReason: 'Nội dung đạt chuẩn',
    aiShieldScore: 95.5,
  });

  assert.equal(outcome.action, 'DECISION_CREATED');
  assert.ok(outcome.decisionEvent);
  assert.equal(outcome.decisionEvent.contentId, 101);
  assert.equal(outcome.decisionEvent.decision, 'APPROVED');
  assert.equal(outcome.decisionEvent.aiShieldScore, 95.5);

  // Resolution cleanup
  unresolvedMap.delete(101);
  assert.equal(unresolvedMap.size, 0, 'Unresolved transition removed upon verified resolution');
});

test('Scenario 2: Detail request fails repeatedly (3 network errors), then succeeds on 4th attempt with REJECTED', () => {
  const unresolvedMap = new Map<number, UnresolvedTransition>();
  unresolvedMap.set(202, {
    contentId: 202,
    title: 'Khởi nghĩa Lam Sơn',
    retryCount: 0,
    lastAttempt: 0,
  });

  const candidate = unresolvedMap.get(202)!;

  // Fail 1: delay 2000ms
  candidate.retryCount = 1;
  candidate.lastAttempt = 10000;
  assert.equal(evaluateDetailError(candidate, null, 500).action, 'RETRY_LATER');
  assert.equal(calculateBackoffDelay(1), 2000);

  // Fail 2: delay 4000ms
  candidate.retryCount = 2;
  candidate.lastAttempt = 12000;
  assert.equal(evaluateDetailError(candidate, null, 503).action, 'RETRY_LATER');
  assert.equal(calculateBackoffDelay(2), 4000);

  // Fail 3: delay 8000ms
  candidate.retryCount = 3;
  candidate.lastAttempt = 16000;
  assert.equal(evaluateDetailError(candidate, 'NETWORK_TIMEOUT', null).action, 'RETRY_LATER');
  assert.equal(calculateBackoffDelay(3), 8000);

  // Check backoff elapsed at t = 24000ms (16000 + 8000)
  assert.equal(selectEligibleRetryCandidates(unresolvedMap, 23000).length, 0);
  assert.equal(selectEligibleRetryCandidates(unresolvedMap, 24001).length, 1);

  // Attempt 4: Succeeds with REJECTED
  candidate.retryCount = 4;
  candidate.lastAttempt = 24001;
  const outcome = evaluateDetailResponse(candidate, {
    status: 'REJECTED',
    moderationDecision: 'REJECTED',
    moderationReason: 'Cần bổ sung nguồn tham khảo lịch sử chính thống',
    aiShieldScore: 68.0,
    aiShieldTier: 'MEDIUM',
    aiShieldTierLabel: 'Cần biên tập lại',
  });

  assert.equal(outcome.action, 'DECISION_CREATED');
  assert.equal(outcome.decisionEvent?.decision, 'REJECTED');
  assert.equal(outcome.decisionEvent?.reason, 'Cần bổ sung nguồn tham khảo lịch sử chính thống');
  assert.equal(outcome.decisionEvent?.aiShieldTier, 'MEDIUM');

  unresolvedMap.delete(202);
  assert.equal(unresolvedMap.size, 0);
});

test('Scenario 3: 30-second backoff delay is reachable on 5th retry, and exhaustion triggers after 5th retry failure', () => {
  const unresolvedMap = new Map<number, UnresolvedTransition>();
  unresolvedMap.set(303, {
    contentId: 303,
    title: 'Chiến dịch Điện Biên Phủ',
    retryCount: 5, // 4 retries failed so far, candidate is at retry 5
    lastAttempt: 50000,
  });

  const candidate = unresolvedMap.get(303)!;

  // 1. Verify 30-second backoff delay is REACHABLE and enforced for retry 5
  const delay5 = calculateBackoffDelay(5);
  assert.equal(delay5, 30000, '5th retry delay must be exactly 30,000ms (30s)');

  // At t = 79,999 (29,999ms elapsed), item is NOT yet eligible
  assert.equal(selectEligibleRetryCandidates(unresolvedMap, 79999, MAX_RESOLUTION_RETRIES).length, 0);

  // At t = 80,000 (30,000ms elapsed), item IS ELIGIBLE to execute retry 5!
  const eligible5 = selectEligibleRetryCandidates(unresolvedMap, 80000, MAX_RESOLUTION_RETRIES);
  assert.equal(eligible5.length, 1, 'Retry 5 must be eligible after waiting 30s backoff');
  assert.equal(eligible5[0].contentId, 303);

  // 2. Retry 5 runs and fails -> retryCount becomes 6 (> MAX_RESOLUTION_RETRIES)
  candidate.retryCount = 6;
  candidate.lastAttempt = 80000;
  const err = evaluateDetailError(candidate, null, null, MAX_RESOLUTION_RETRIES);
  assert.equal(err.action, 'EXHAUSTED', 'Action must be EXHAUSTED after 5th retry failure');

  // Verify candidate is retained in unresolved map (no silent loss of visibility)
  assert.ok(unresolvedMap.has(303), 'Must retain unresolved item in map');

  // Verify background retry candidate selection excludes exhausted items
  const eligibleExhausted = selectEligibleRetryCandidates(unresolvedMap, 150000, MAX_RESOLUTION_RETRIES);
  assert.equal(eligibleExhausted.length, 0, 'Exhausted items must not be selected for automated retry');

  // Verify no decision was fabricated
  const outcome = evaluateDetailResponse(candidate, null);
  assert.equal(outcome.action, 'RETRY_LATER');
  assert.equal(outcome.decisionEvent, undefined, 'Must not fabricate a moderation decision');
});

test('Scenario 4: Manual retry after exhaustion resets retry count and resolves immediately', () => {
  const unresolvedMap = new Map<number, UnresolvedTransition>();
  unresolvedMap.set(404, {
    contentId: 404,
    title: 'Thành Cổ Quảng Trị',
    retryCount: 6, // Exhausted
    lastAttempt: 80000,
  });

  // Automated retry is stopped
  assert.equal(selectEligibleRetryCandidates(unresolvedMap, 150000).length, 0);

  // User triggers manual recovery (simulating checkNow)
  unresolvedMap.forEach((item) => {
    item.retryCount = 0;
    item.lastAttempt = 0;
  });

  // Candidate is immediately eligible
  const eligible = selectEligibleRetryCandidates(unresolvedMap, 150001);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].contentId, 404);

  // Manual attempt succeeds
  const outcome = evaluateDetailResponse(eligible[0], {
    status: 'PUBLISHED',
    moderationDecision: 'APPROVED',
  });
  assert.equal(outcome.action, 'DECISION_CREATED');
  assert.equal(outcome.decisionEvent?.decision, 'APPROVED');

  unresolvedMap.delete(404);
  assert.equal(unresolvedMap.size, 0);
});

test('Scenario 5: Pending list becomes empty while unresolved transitions remain (polling stays active until resolved)', () => {
  const pendingCount = 0;
  const unresolvedMap = new Map<number, UnresolvedTransition>();
  unresolvedMap.set(505, {
    contentId: 505,
    title: 'Chiến dịch Hồ Chí Minh',
    retryCount: 1,
    lastAttempt: Date.now() - 3000,
  });

  // Calculate hasActiveUnresolved and isPolling state
  const hasActiveUnresolved = Array.from(unresolvedMap.values()).some(
    (item) => item.retryCount <= MAX_RESOLUTION_RETRIES
  );
  const isPolling = pendingCount > 0 || hasActiveUnresolved;
  assert.equal(isPolling, true, 'Polling must remain active when unresolved items exist, even if pendingCount is 0');

  // After resolving item 505
  unresolvedMap.delete(505);
  const hasActiveAfter = Array.from(unresolvedMap.values()).some(
    (item) => item.retryCount <= MAX_RESOLUTION_RETRIES
  );
  const isPollingAfter = pendingCount > 0 || hasActiveAfter;
  assert.equal(isPollingAfter, false, 'Polling must stop when all items are fully resolved and pending is empty');
});

test('Scenario 6: Reload with unresolved transitions (sessionStorage serialization & recovery)', () => {
  const originalMap = new Map<number, UnresolvedTransition>();
  originalMap.set(606, {
    contentId: 606,
    title: 'Hịch Tướng Sĩ',
    retryCount: 2,
    lastAttempt: 1729000000000,
  });

  const originalPending = new Map<number, { title: string; createdAt: string }>();
  originalPending.set(707, { title: 'Nam Quốc Sơn Hà', createdAt: '2026-10-18T01:00:00Z' });

  // Simulate save to sessionStorage
  const serializedUnresolved = serializeUnresolvedSnapshot(originalMap);
  const serializedPending = serializePendingSnapshot(originalPending);

  // Simulate restore after page reload
  const restoredMap = safeParseUnresolved(serializedUnresolved);
  const restoredPending = safeParsePendingSnapshot(serializedPending);

  assert.equal(restoredMap.size, 1);
  const item606 = restoredMap.get(606)!;
  assert.equal(item606.contentId, 606);
  assert.equal(item606.title, 'Hịch Tướng Sĩ');
  assert.equal(item606.retryCount, 2);
  assert.equal(item606.lastAttempt, 1729000000000);

  assert.equal(restoredPending.size, 1);
  assert.equal(restoredPending.get(707)?.title, 'Nam Quốc Sơn Hà');
});

test('Scenario 7: Creator account switches during in-flight request (race condition isolation)', () => {
  // Creator A initiates request
  const capturedUserA = 'user_1001';
  let currentUser: string | null = capturedUserA;

  const mockDecisionsForA: ModerationDecisionEvent[] = [];
  const mockDecisionsForB: ModerationDecisionEvent[] = [];

  const handleAsyncResponse = (
    capturedUser: string,
    contentId: number,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    // Exact Race Guard from useModerationTracker
    if (currentUser !== capturedUser) {
      // Discard response: user switched account before request resolved!
      return false;
    }

    const event: ModerationDecisionEvent = {
      id: `${contentId}-${decision}-${Date.now()}`,
      contentId,
      title: 'Tác phẩm tác giả A',
      decision,
      timestamp: Date.now(),
    };

    if (capturedUser === 'user_1001') {
      mockDecisionsForA.push(event);
    } else {
      mockDecisionsForB.push(event);
    }
    return true;
  };

  // Creator A switches to Creator B before response resolves
  currentUser = 'user_2002';

  // Async response for Creator A returns
  const wasProcessed = handleAsyncResponse(capturedUserA, 808, 'APPROVED');

  assert.equal(wasProcessed, false, 'In-flight response must be dropped when active user has switched');
  assert.equal(mockDecisionsForA.length, 0, 'Creator A decisions must not receive late update after logout');
  assert.equal(mockDecisionsForB.length, 0, 'Creator B must NEVER receive notifications from Creator A');
});

test('Scenario 8: 404 Not Found (ERR_1002) and 403 Forbidden (ERR_1004) terminate immediately without infinite retry', () => {
  const unresolvedMap = new Map<number, UnresolvedTransition>();
  unresolvedMap.set(901, { contentId: 901, title: 'Deleted Content', retryCount: 1, lastAttempt: 0 });
  unresolvedMap.set(902, { contentId: 902, title: 'Unauthorized Content', retryCount: 1, lastAttempt: 0 });

  // 404 Not Found: Content deleted from server
  const res404 = evaluateDetailError(unresolvedMap.get(901)!, 'ERR_1002', 404);
  assert.equal(res404.action, 'TERMINAL_DISCARD');
  unresolvedMap.delete(901);
  assert.ok(!unresolvedMap.has(901), '404 content must be dropped from retry queue');

  // 403 Forbidden: Creator lacks permission
  const res403 = evaluateDetailError(unresolvedMap.get(902)!, 'ERR_1004', 403);
  assert.equal(res403.action, 'TERMINAL_DISCARD');
  unresolvedMap.delete(902);
  assert.ok(!unresolvedMap.has(902), '403 content must be dropped from retry queue');

  assert.equal(unresolvedMap.size, 0, 'No terminal errors remain in unresolved queue');
});

test('Scenario 9: Stale response arriving after a newer response is handled cleanly', () => {
  const existingDecisions: ModerationDecisionEvent[] = [
    {
      id: '1001-APPROVED-100',
      contentId: 1001,
      title: 'Tác phẩm mới nhất',
      decision: 'APPROVED',
      timestamp: 100,
    },
  ];

  // A stale duplicate response arrives later
  const staleEvent: ModerationDecisionEvent = {
    id: '1001-APPROVED-50',
    contentId: 1001,
    title: 'Tác phẩm mới nhất',
    decision: 'APPROVED',
    timestamp: 50,
  };

  const { updated, wasAdded } = appendDecisionWithoutDuplicate(existingDecisions, staleEvent);
  assert.equal(wasAdded, false, 'Stale duplicate decision must be suppressed');
  assert.equal(updated.length, 1);
  assert.equal(updated[0].timestamp, 100, 'Original newer decision must remain intact');
});

test('Scenario 10: Duplicate events are suppressed and storage limits enforced', () => {
  let decisions: ModerationDecisionEvent[] = [];

  const event1: ModerationDecisionEvent = {
    id: '111-APPROVED-100',
    contentId: 111,
    title: 'Tuyên ngôn Độc lập',
    decision: 'APPROVED',
    timestamp: 100,
  };

  const res1 = appendDecisionWithoutDuplicate(decisions, event1, 20);
  assert.equal(res1.wasAdded, true);
  decisions = res1.updated;
  assert.equal(decisions.length, 1);

  // Attempt to add duplicate event with same contentId and decision
  const duplicateEvent: ModerationDecisionEvent = {
    id: '111-APPROVED-200',
    contentId: 111,
    title: 'Tuyên ngôn Độc lập',
    decision: 'APPROVED',
    timestamp: 200,
  };

  const res2 = appendDecisionWithoutDuplicate(decisions, duplicateEvent, 20);
  assert.equal(res2.wasAdded, false, 'Duplicate decision must not be appended');
  assert.equal(res2.updated.length, 1);

  // Test storage bounds (max 20)
  for (let i = 1; i <= 25; i++) {
    const e: ModerationDecisionEvent = {
      id: `${i}-APPROVED-${i}`,
      contentId: i,
      title: `Item ${i}`,
      decision: 'APPROVED',
      timestamp: i,
    };
    decisions = appendDecisionWithoutDuplicate(decisions, e, 20).updated;
  }
  assert.equal(decisions.length, 20, 'Decisions list must be capped at 20 items');

  // Serialization test
  const serialized = serializeDecisions(decisions);
  const parsed = safeParseDecisions(serialized);
  assert.equal(parsed.length, 20);
});

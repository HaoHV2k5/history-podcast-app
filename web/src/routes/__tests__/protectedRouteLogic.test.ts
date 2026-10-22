import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRouteAccess } from '../protectedRouteLogic.ts';

describe('ProtectedRoute Authorization Regression Tests', () => {
  // 1. Loading/bootstrap behavior
  test('1. While authentication is loading, route returns LOADING without redirecting', () => {
    const decision = evaluateRouteAccess({
      isLoading: true,
      isAuthenticated: false,
      userRoles: [],
      allowedRoles: ['ADMIN'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(decision, 'LOADING');
  });

  // 2. Unauthenticated user redirected to Login
  test('2. Unauthenticated user is redirected to LOGIN_REDIRECT', () => {
    const decision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: false,
      userRoles: [],
      allowedRoles: ['ADMIN'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(decision, 'LOGIN_REDIRECT');
  });

  // 3. Authenticated user with incorrect role redirected to Forbidden
  test('3. Authenticated user with CREATOR role trying to access ADMIN route is redirected to FORBIDDEN_REDIRECT', () => {
    const decision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['CREATOR'],
      allowedRoles: ['ADMIN'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(decision, 'FORBIDDEN_REDIRECT');
  });

  // 4. Authorized ADMIN access
  test('4. Authenticated user with ADMIN role is AUTHORIZED for admin routes', () => {
    const decision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['ADMIN'],
      allowedRoles: ['ADMIN'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(decision, 'AUTHORIZED');
  });

  // 5. Authorized CREATOR access
  test('5. Authenticated user with CREATOR role is AUTHORIZED for creator routes', () => {
    const decision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['CREATOR'],
      allowedRoles: ['CREATOR'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(decision, 'AUTHORIZED');
  });

  // 6. Dual role access (both ADMIN and CREATOR)
  test('6. User with both ADMIN and CREATOR roles is AUTHORIZED for both areas', () => {
    const adminDecision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['ADMIN', 'CREATOR'],
      allowedRoles: ['ADMIN'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(adminDecision, 'AUTHORIZED');

    const creatorDecision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['ADMIN', 'CREATOR'],
      allowedRoles: ['CREATOR'],
      isDev: false,
      hasDevBypassParamOrSession: false,
    });
    assert.equal(creatorDecision, 'AUTHORIZED');
  });

  // 7. DEV QA bypass strictly disabled in production builds (isDev: false)
  test('7. DEV QA bypass parameter is strictly ignored in production conditions (isDev: false)', () => {
    const unauthenticatedDecision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: false,
      userRoles: [],
      allowedRoles: ['ADMIN'],
      isDev: false, // Production build!
      hasDevBypassParamOrSession: true, // Attacker passes ?dev=true or session flag
    });
    // Must still redirect to login, cannot bypass!
    assert.equal(unauthenticatedDecision, 'LOGIN_REDIRECT');

    const unauthorizedRoleDecision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      userRoles: ['CREATOR'],
      allowedRoles: ['ADMIN'],
      isDev: false, // Production build!
      hasDevBypassParamOrSession: true,
    });
    // Must still redirect to forbidden, cannot bypass!
    assert.equal(unauthorizedRoleDecision, 'FORBIDDEN_REDIRECT');
  });

  // 8. DEV QA bypass allowed in local development (isDev: true)
  test('8. DEV QA bypass allows developer inspection when isDev is true', () => {
    const decision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: false,
      userRoles: [],
      allowedRoles: ['ADMIN'],
      isDev: true,
      hasDevBypassParamOrSession: true,
    });
    assert.equal(decision, 'AUTHORIZED');
  });

  // 9. Production checkHasRole callback integration (matches authStore.hasRole)
  test('9. checkHasRole callback correctly authorizes user based on custom store logic', () => {
    const mockHasRole = (role: string) => role === 'CREATOR';
    const creatorAccess = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      allowedRoles: ['CREATOR'],
      isDev: false,
      hasDevBypassParamOrSession: false,
      checkHasRole: mockHasRole,
    });
    assert.equal(creatorAccess, 'AUTHORIZED');

    const adminAccess = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      allowedRoles: ['ADMIN'],
      isDev: false,
      hasDevBypassParamOrSession: false,
      checkHasRole: mockHasRole,
    });
    assert.equal(adminAccess, 'FORBIDDEN_REDIRECT');
  });

  // 10. Empty allowedRoles allows any authenticated user
  test('10. Route with empty or undefined allowedRoles allows any authenticated user', () => {
    const decision = evaluateRouteAccess({
      isLoading: false,
      isAuthenticated: true,
      isDev: false,
      hasDevBypassParamOrSession: false,
      checkHasRole: () => false,
    });
    assert.equal(decision, 'AUTHORIZED');
  });
});

/**
 * Pure route authorization evaluation logic for ProtectedRoute.
 * Enables unit testing of authentication decisions, role gating, and dev bypass safety.
 */

export interface RouteAuthCheckParams {
  isLoading: boolean;
  isAuthenticated: boolean;
  userRoles?: string[];
  allowedRoles?: string[];
  isDev: boolean;
  hasDevBypassParamOrSession: boolean;
  checkHasRole?: (role: string) => boolean;
}

export type RouteDecision = 'LOADING' | 'LOGIN_REDIRECT' | 'FORBIDDEN_REDIRECT' | 'AUTHORIZED';

export function evaluateRouteAccess(params: RouteAuthCheckParams): RouteDecision {
  const isDevBypass = Boolean(params.isDev && params.hasDevBypassParamOrSession);

  if (params.isLoading) {
    return 'LOADING';
  }

  if (!params.isAuthenticated && !isDevBypass) {
    return 'LOGIN_REDIRECT';
  }

  if (!isDevBypass && params.allowedRoles && params.allowedRoles.length > 0) {
    const isAuthorized = params.allowedRoles.some((role) => {
      if (params.checkHasRole) {
        return params.checkHasRole(role);
      }
      return params.userRoles?.includes(role) ?? false;
    });
    if (!isAuthorized) {
      return 'FORBIDDEN_REDIRECT';
    }
  }

  return 'AUTHORIZED';
}

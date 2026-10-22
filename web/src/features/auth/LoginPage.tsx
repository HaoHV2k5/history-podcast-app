import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/api/auth';
import { useAuthStore } from '@/store/authStore';
import { gsap } from 'gsap';
import { isReducedMotion, MOTION_CONFIG } from '@/utils/motion';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Địa chỉ email không đúng định dạng'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formRef = React.useRef<HTMLDivElement>(null);
  const editorialRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Form entrance: opacity 0 -> 1, y: 8px -> 0
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { opacity: 0, y: MOTION_CONFIG.distance.md },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_CONFIG.duration.loginForm,
            ease: MOTION_CONFIG.ease,
            clearProps: 'transform,opacity',
          }
        );
      }

      // 2. Editorial entrance: subtle staggered reveal of heritage blocks
      if (editorialRef.current) {
        const items = editorialRef.current.querySelectorAll('.editorial-motion-item');
        if (items.length > 0) {
          gsap.fromTo(
            items,
            { opacity: 0, y: MOTION_CONFIG.distance.lg },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_CONFIG.duration.loginEditorial,
              stagger: MOTION_CONFIG.duration.stagger,
              ease: MOTION_CONFIG.ease,
              clearProps: 'transform,opacity',
            }
          );
        }
      }
    });

    return () => ctx.revert();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: import.meta.env.DEV ? 'creator@example.com' : '',
      password: import.meta.env.DEV ? 'Creator@123' : '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.login(values);
      const authData = response.data;

      if (!authData || !authData.accessToken) {
        throw new Error('Dữ liệu xác thực không hợp lệ');
      }

      // Check for supported roles: ADMIN or CREATOR
      const roles = authData.roles || (authData.role ? [authData.role] : []);
      const isAdmin = roles.includes('ADMIN') || authData.role === 'ADMIN';
      const isCreator = roles.includes('CREATOR') || authData.role === 'CREATOR';

      if (!isAdmin && !isCreator) {
        setApiError('Tài khoản này chưa có quyền Quản trị viên (ADMIN) hoặc Nhà sáng tạo (CREATOR) để truy cập không gian làm việc.');
        setIsSubmitting(false);
        return;
      }

      // Store in memory & sessionStorage
      try {
        sessionStorage.removeItem('su_ky_admin_dev_mode');
      } catch {
        // ignore
      }
      useAuthStore.getState().setAccessToken(authData.accessToken);
      let profileData = undefined;
      try {
        const meRes = await authApi.getCurrentUser();
        profileData = meRes.data;
      } catch {
        // fallback to login response fields if /me fails
      }
      setAuth(authData, profileData);

      // Navigate to intended destination or role-based default
      const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;

      // Check if fromPath is safe and authorized for this user
      if (fromPath && fromPath !== '/login' && fromPath !== '/forbidden') {
        if (fromPath.startsWith('/admin') && isAdmin) {
          navigate(fromPath, { replace: true });
          return;
        }
        if (fromPath.startsWith('/creator') && isCreator) {
          navigate(fromPath, { replace: true });
          return;
        }
      }

      // Default destination: prefer ADMIN if user has both ADMIN and CREATOR
      if (isAdmin) {
        navigate('/admin/overview', { replace: true });
      } else if (isCreator) {
        navigate('/creator', { replace: true });
      } else {
        navigate('/forbidden', { replace: true });
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-canvas selection:bg-accent-soft selection:text-accent">
      {/* =========================================================================
          LEFT COLUMN: 40% AUTHENTICATION PANEL (100% on Mobile/Tablet)
         ========================================================================= */}
      <section
        aria-label="Khu vực đăng nhập tài khoản"
        className="w-full lg:w-[42%] xl:w-[38%] 2xl:w-[34%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 bg-surface lg:border-r border-border z-10 shadow-subtle"
      >
        {/* Top Header Masthead */}
        <header className="flex items-center justify-between mb-8 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-canvas shadow-subtle">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M6 14h6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-ink leading-tight">
                SỬ KÝ
              </span>
              <span className="text-[11px] uppercase tracking-widest text-muted font-medium">
                Cổng Điều Hành & Sáng Tạo
              </span>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-subtle text-[11px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success-text" />
            <span>Hệ thống trực tuyến</span>
          </div>
        </header>

        {/* Center Authentication Form */}
        <div ref={formRef} className="w-full max-w-sm mx-auto my-auto py-2">
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-2">
              Đăng nhập tài khoản
            </h1>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Truy cập không gian làm việc dành cho Quản trị viên và Nhà sáng tạo Sử Ký.
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg border border-status-error-text/30 bg-status-error-bg p-3.5 text-xs text-status-error-text"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-ink"
              >
                Địa chỉ Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@suky.vn"
                autoComplete="email"
                autoFocus
                leftIcon={<Mail className="h-4 w-4 text-muted" />}
                error={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-status-error-text">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-ink"
              >
                Mật khẩu
              </label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4 text-muted" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-muted hover:text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                error={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-status-error-text">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full justify-center text-sm font-semibold shadow-card hover:shadow-subtle transition-all"
              >
                <span>Đăng nhập hệ thống</span>
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center space-y-3">
            <p className="text-[11px] text-muted leading-relaxed">
              Cổng xác thực nội bộ. Quyền hạn tài khoản được phân định tự động theo vai trò (ADMIN / CREATOR).
            </p>
            {import.meta.env.DEV && (
              <div className="pt-2 border-t border-dashed border-border/80">
                <Button
                  id="dev-qa-login-btn"
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await authApi.login({
                        email: 'creator@example.com',
                        password: 'Creator@123',
                      });
                      if (res.data) {
                        useAuthStore.getState().setAccessToken(res.data.accessToken);
                        let profileData = undefined;
                        try {
                          const meRes = await authApi.getCurrentUser();
                          profileData = meRes.data;
                        } catch {
                          // ignore
                        }
                        setAuth(res.data, profileData);
                        navigate('/creator');
                        return;
                      }
                    } catch {
                      // fallback to mock dev user
                    }
                    const devUser = {
                      id: 1,
                      email: 'creator@example.com',
                      fullName: 'Demo Creator Sử Ký',
                      roleName: 'CREATOR',
                      roles: ['ADMIN', 'CREATOR'],
                      isAdmin: true,
                      isCreator: true,
                      status: 'ACTIVE',
                      createdAt: '2026-01-01T00:00:00Z',
                    };
                    sessionStorage.setItem('su_ky_admin_dev_mode', 'true');
                    sessionStorage.setItem('su_ky_admin_access_token', 'dev-admin-token');
                    sessionStorage.setItem('su_ky_admin_user_data', JSON.stringify(devUser));
                    useAuthStore.getState().setAuth(
                      {
                        accessToken: 'dev-admin-token',
                        refreshToken: 'dev-admin-refresh',
                        tokenType: 'Bearer',
                        userId: 1,
                        email: 'creator@example.com',
                        role: 'CREATOR',
                        roles: ['ADMIN', 'CREATOR'],
                      },
                      devUser
                    );
                    navigate('/creator');
                  }}
                  className="text-xs text-muted hover:text-ink min-h-[36px] px-3 w-full border border-dashed border-border hover:bg-surface-subtle"
                >
                  Chế độ xem xét giao diện (Dev QA)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Platform Footer */}
        <footer className="pt-6 mt-auto text-center border-t border-border/40">
          <span className="text-[10px] text-muted font-mono tracking-tight">
            Sử Ký Platform © 2026 • Hệ Thống Điều Hành & Không Gian Sáng Tạo
          </span>
        </footer>
      </section>

      {/* =========================================================================
          RIGHT COLUMN: 60% BRANDED EDITORIAL VISUAL PRESENTATION (Hidden on Mobile)
         ========================================================================= */}
      <aside
        aria-label="Giới thiệu nền tảng Sử Ký"
        className="hidden lg:flex flex-1 relative bg-canvas overflow-hidden items-center justify-center p-8 lg:p-12 xl:p-16"
      >
        {/* Layered Editorial Paper Geometries (Pure Vector & SVG, no external stock images) */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-40">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-border-line/60 bg-surface-subtle/30" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-border-line/40" />
          <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] rounded-full border border-border-line/50 bg-surface-subtle/20" />
        </div>

        {/* Main Content Presentation */}
        <div ref={editorialRef} className="relative z-10 max-w-xl w-full space-y-8">
          {/* Heritage Tag Badge */}
          <div className="editorial-motion-item inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-accent/25 bg-accent-soft/60 text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Không Gian Sáng Tác & Điều Hành
            </span>
          </div>

          {/* Editorial Heading & Mission Narrative */}
          <div className="editorial-motion-item space-y-4">
            <h2 className="font-serif text-3xl xl:text-4xl font-bold tracking-tight text-ink leading-[1.22]">
              Tái hiện dòng chảy lịch sử qua âm thanh và hình ảnh
            </h2>
            <div className="editorial-divider" />
            <p className="text-sm xl:text-base text-muted leading-relaxed font-sans">
              Sử Ký kết nối tư liệu lịch sử Đại Việt Sử Ký Toàn Thư cùng công nghệ AI thẩm định RAG, hỗ trợ Nhà sáng tạo và Ban điều hành gìn giữ và lan tỏa di sản văn hóa Việt Nam.
            </p>
          </div>

          {/* 3 Real Platform Pillars */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {/* Pillar 1: Historical Documentation */}
            <div className="editorial-motion-item flex items-start gap-4 p-4 rounded-xl border border-border bg-surface/85 shadow-subtle hover:border-accent/40 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-accent border border-border">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink">Kho Sử Liệu Biên Niên</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Hệ tri thức RAG thẩm định kịch bản sử học theo chuẩn tư liệu chính sử nước nhà.
                </p>
              </div>
            </div>

            {/* Pillar 2: Narration & Voice Studio */}
            <div className="editorial-motion-item flex items-start gap-4 p-4 rounded-xl border border-border bg-surface/85 shadow-subtle hover:border-accent/40 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-accent border border-border">
                <Radio className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink">Âm Thanh Thuyết Minh Đa Giọng</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Công nghệ chuyển hóa văn bản thành podcast truyền cảm với danh mục giọng đọc phong phú.
                </p>
              </div>
            </div>

            {/* Pillar 3: AI Video Production Studio */}
            <div className="editorial-motion-item flex items-start gap-4 p-4 rounded-xl border border-border bg-surface/85 shadow-subtle hover:border-accent/40 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-accent border border-border">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink">Xưởng Sản Xuất Hoạt Họa AI</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Tự động tạo phân cảnh storyboard, video bảng trắng và hỗ trợ phát sóng trực tiếp.
                </p>
              </div>
            </div>
          </div>

          {/* Subline Editorial Signoff */}
          <div className="editorial-motion-item pt-2 flex items-center justify-between text-xs text-muted">
            <span className="font-serif italic text-ink/80">
              “Dân ta phải biết sử ta, cho tường gốc tích nước nhà Việt Nam”
            </span>
            <span className="font-mono text-[11px] tabular-nums">Sử Ký © 2026</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

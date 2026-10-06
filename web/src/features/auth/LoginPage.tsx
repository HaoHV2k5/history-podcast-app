import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/api/auth';
import { useAuthStore } from '@/store/authStore';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
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

      // Check for ADMIN role authorization
      const roles = authData.roles || (authData.role ? [authData.role] : []);
      const isAdminUser = roles.includes('ADMIN') || authData.role === 'ADMIN';

      if (!isAdminUser) {
        setApiError('Tài khoản này không có quyền Quản trị viên (ADMIN) để truy cập cổng.');
        setIsSubmitting(false);
        return;
      }

      // Store in memory & sessionStorage
      setAuth(authData);

      // Navigate to intended destination or overview
      const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/overview';
      navigate(fromPath, { replace: true });
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
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        {/* Masthead Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-canvas shadow-xs">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <path d="M6 14h6" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink mb-1">
            SỬ KÝ
          </h1>
          <p className="text-xs uppercase tracking-widest text-muted font-medium">
            Cổng Quản Trị & Vận Hành
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-surface p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-ink">Đăng nhập tài khoản</h2>
            <p className="text-xs text-muted mt-1">
              Nhập email quản trị viên và mật khẩu để tiếp tục
            </p>
          </div>

          {apiError && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-status-error-text/30 bg-status-error-bg p-3.5 text-xs text-status-error-text">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-ink"
              >
                Địa chỉ Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@suky.vn"
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
                className="block text-xs font-medium text-ink"
              >
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4 text-muted" />}
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
                className="w-full justify-center"
              >
                <span>Đăng nhập hệ thống</span>
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-[11px] text-muted">
              Cổng nội bộ dành riêng cho Quản trị viên và Điều hành viên Sử Ký
            </p>
            {import.meta.env.DEV && (
              <div className="mt-3 pt-2 border-t border-dashed border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sessionStorage.setItem('su_ky_admin_dev_mode', 'true');
                    window.location.href = '/admin/overview';
                  }}
                  className="text-xs text-muted hover:text-ink h-8 px-2"
                >
                  Chế độ xem xét giao diện (Dev QA)
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

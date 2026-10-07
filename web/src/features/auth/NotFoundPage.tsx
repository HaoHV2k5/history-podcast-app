import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle text-muted">
          <Compass className="h-7 w-7" />
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink mb-2">
          404
        </h1>

        <h2 className="text-base font-semibold text-ink mb-2">
          Không tìm thấy trang
        </h2>

        <p className="text-sm text-muted mb-6 leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại trong hệ thống quản trị Sử Ký hoặc đã được chuyển dời.
        </p>

        <Button
          variant="primary"
          onClick={() => navigate('/admin/overview')}
          className="w-full justify-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Về trang tổng quan
        </Button>
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  PlusCircle,
  BookOpen,
  UserCheck,
  Radio,
  ArrowLeft,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModuleConfig {
  title: string;
  subtitle: string;
  milestone: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  content: {
    title: 'Thư viện nội dung',
    subtitle: 'Quản lý tác phẩm video và podcast lịch sử',
    milestone: 'Milestone 4 — Content Library & Publishing',
    description:
      'Mô-đun quản lý danh sách các tập podcast/video đã xuất bản, bản nháp, trạng thái kiểm duyệt nội dung, lượt nghe và tương tác của khán giả.',
    icon: Video,
  },
  create: {
    title: 'Tạo nội dung mới',
    subtitle: 'Xưởng biên kịch và sản xuất đa phương tiện',
    milestone: 'Milestone 4 — AI Studio & Multimodal Pipeline',
    description:
      'Quy trình soạn thảo kịch bản podcast lịch sử, tích hợp giọng đọc AI tiếng Việt chuyên sâu, tạo ảnh hoạt họa phối cảnh và dựng video tự động.',
    icon: PlusCircle,
  },
  series: {
    title: 'Tuyển tập tác phẩm',
    subtitle: 'Phân loại tác phẩm theo thời kỳ và chủ đề lịch sử',
    milestone: 'Milestone 4 — Series & Album Collections',
    description:
      'Tổ chức các tập podcast thành từng bộ tuyển tập hoàn chỉnh (theo triều đại, trận đánh tiêu biểu hoặc nhân vật lịch sử) giúp người nghe dễ dàng theo dõi liền mạch.',
    icon: BookOpen,
  },
  kyc: {
    title: 'Xác thực định danh KYC',
    subtitle: 'Hồ sơ pháp lý và hợp đồng nhà sáng tạo',
    milestone: 'Milestone 3 — Creator KYC & Onboarding',
    description:
      'Quy trình nộp hồ sơ căn cước/hộ chiếu, xác minh thông tin tác giả và chấp thuận điều khoản nền tảng Sử Ký để kích hoạt quyền xuất bản chính thức.',
    icon: UserCheck,
  },
  channel: {
    title: 'Quản lý Kênh Podcast',
    subtitle: 'Thiết lập nhận diện thương hiệu và kênh phát thanh',
    milestone: 'Milestone 3 — Channel Management & Branding',
    description:
      'Tùy chỉnh tên kênh, ảnh đại diện, ảnh bìa nghệ thuật, phần giới thiệu kênh và liên kết các trang mạng xã hội của nhà sáng tạo.',
    icon: Radio,
  },
};

interface CreatorModulePlaceholderProps {
  moduleKey: 'content' | 'create' | 'series' | 'kyc' | 'channel';
}

export const CreatorModulePlaceholder: React.FC<CreatorModulePlaceholderProps> = ({ moduleKey }) => {
  const navigate = useNavigate();
  const config = MODULE_CONFIGS[moduleKey] || {
    title: 'Mô-đun Studio',
    subtitle: 'Không gian chức năng nhà sáng tạo',
    milestone: 'Milestone kế tiếp',
    description: 'Tính năng đang được chuẩn bị trong lộ trình phát triển Creator Core.',
    icon: Sparkles,
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/creator')}
            className="min-h-[40px] px-3 text-muted hover:text-ink cursor-pointer"
            aria-label="Quay lại Tổng quan Studio"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>Tổng quan</span>
          </Button>
          <div className="space-y-0.5">
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink">
              {config.title}
            </h1>
            <p className="text-xs text-muted">{config.subtitle}</p>
          </div>
        </div>

        <Badge variant="outline" className="self-start sm:self-auto text-xs py-1 px-2.5 font-mono">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-accent" />
          {config.milestone.split(' — ')[0]}
        </Badge>
      </div>

      {/* Main Status Panel */}
      <div className="rounded-lg border border-border bg-surface p-6 md:p-10 shadow-xs text-center max-w-2xl mx-auto space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-surface-subtle border border-border text-accent">
          <Icon className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-medium bg-canvas">
            Chưa triển khai giao diện nghiệp vụ
          </Badge>
          <h2 className="font-serif text-xl font-bold text-ink">
            {config.title} đang được hoàn thiện
          </h2>
          <p className="text-xs md:text-sm text-muted leading-relaxed max-w-lg mx-auto">
            {config.description}
          </p>
        </div>

        {/* Informational Callout */}
        <div className="rounded-md border border-border bg-surface-subtle p-4 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Info className="h-4 w-4 text-accent shrink-0" />
            <span>Kế hoạch triển khai kỹ thuật ({config.milestone})</span>
          </div>
          <p className="text-muted leading-relaxed">
            Hệ thống thanh điều hướng và khung layout của Milestone 2 đã định tuyến chính xác tới đường dẫn này. Logic nghiệp vụ biểu mẫu, tích hợp API backend và giao dịch dữ liệu sẽ được kích hoạt theo đúng thứ tự lộ trình.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            id="creator-back-to-home-btn"
            variant="primary"
            onClick={() => navigate('/creator')}
            className="min-h-[44px] px-6 cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Quay về Tổng quan Studio</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

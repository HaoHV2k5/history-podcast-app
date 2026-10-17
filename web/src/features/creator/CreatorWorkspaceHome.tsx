import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  PlusCircle,
  BookOpen,
  UserCheck,
  Radio,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  BookMarked,
  ScrollText,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';

interface ModuleLinkCard {
  title: string;
  description: string;
  to: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULE_CARDS: ModuleLinkCard[] = [
  {
    title: 'Xác thực định danh KYC',
    description:
      'Hồ sơ tác giả và thông tin thụ hưởng để kích hoạt đầy đủ quyền khởi tạo kênh và xuất bản tác phẩm.',
    to: '/creator/kyc',
    badge: 'Khả dụng',
    icon: UserCheck,
  },
  {
    title: 'Thiết lập & Quản lý Kênh',
    description:
      'Nhận diện kênh podcast, thương hiệu nhà sáng tạo, tiểu sử và ảnh bìa nghệ thuật.',
    to: '/creator/channel',
    badge: 'Khả dụng',
    icon: Radio,
  },

  {
    title: 'Thư viện nội dung',
    description:
      'Lưu trữ, rà soát và theo dõi trạng thái các tác phẩm video/podcast đã phát hành.',
    to: '/creator/content',
    badge: 'Milestone 4',
    icon: Video,
  },
  {
    title: 'Tạo nội dung mới',
    description:
      'Xưởng biên kịch podcast, chuyển đổi giọng đọc thuyết minh và dựng phối cảnh AI.',
    to: '/creator/create',
    badge: 'Milestone 4',
    icon: PlusCircle,
  },
  {
    title: 'Tuyển tập Podcast',
    description:
      'Nhóm các tập podcast theo từng triều đại, chủ đề hoặc chiến dịch lịch sử Việt Nam.',
    to: '/creator/series',
    badge: 'Milestone 4',
    icon: BookOpen,
  },
];

export const CreatorWorkspaceHome: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      {/* Editorial Masthead */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
          <Sparkles className="h-4 w-4" />
          <span>Xưởng Sản Xuất Nội Dung Sử Ký</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Creator Studio
        </h1>
        <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
          Không gian nghiên cứu sử liệu, biên soạn kịch bản và sản xuất tác phẩm âm thanh, hình ảnh hoạt họa lịch sử Việt Nam dành cho các Nhà sáng tạo nội dung.
        </p>
      </div>

      {/* Milestone 2 Foundation Notice */}
      <div className="rounded-lg border border-status-success-text/30 bg-status-success-bg/50 p-5">
        <div className="flex items-start gap-3.5">
          <CheckCircle2 className="h-5 w-5 text-status-success-text shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-status-success-text">
              Khung Điều Hướng & Không Gian Làm Việc (Milestone 2) Đã Sẵn Sàng
            </h2>
            <p className="text-xs text-status-success-text/90 leading-relaxed">
              Khung giao diện Studio, thanh điều hướng phân cấp, menu tài khoản đa vai trò và cơ chế chuyển đổi không gian đã được thiết lập hoàn chỉnh. Các mô-đun nghiệp vụ chuyên sâu sẽ được tích hợp theo lộ trình tiếp theo.
            </p>
          </div>
        </div>
      </div>

      {/* Session Identity & Workspace Details */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
          Thông tin phiên làm việc nhà sáng tạo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1 p-3 rounded-md border border-border bg-surface-subtle">
            <span className="text-muted block text-[11px]">Tài khoản xác thực</span>
            <span className="font-mono font-medium text-ink truncate block">
              {user?.email || 'N/A'}
            </span>
          </div>

          <div className="space-y-1 p-3 rounded-md border border-border bg-surface-subtle">
            <span className="text-muted block text-[11px]">Mã định danh tác giả</span>
            <span className="font-mono font-medium text-ink block">
              #{user?.id ? String(user.id).padStart(4, '0') : 'N/A'}
            </span>
          </div>

          <div className="space-y-1 p-3 rounded-md border border-border bg-surface-subtle">
            <span className="text-muted block text-[11px]">Không gian làm việc</span>
            <span className="font-medium text-accent block">
              Creator Studio (Chính thức)
            </span>
          </div>

          <div className="space-y-1 p-3 rounded-md border border-border bg-surface-subtle">
            <span className="text-muted block text-[11px]">Vai trò được cấp phép</span>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {user?.roles && user.roles.length > 0 ? (
                user.roles.map((r) => (
                  <Badge
                    key={r}
                    variant={r === 'CREATOR' ? 'default' : 'outline'}
                    className="text-[10px] py-0 px-1.5 font-mono"
                  >
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="font-mono text-muted">CREATOR</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Modules Navigation Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-ink">
            Các phân hệ chức năng Studio
          </h2>
          <p className="text-xs text-muted mt-1">
            Lộ trình phát triển các công cụ hỗ trợ nhà sáng tạo nội dung Sử Ký
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group relative flex flex-col justify-between rounded-lg border border-border bg-surface p-5 hover:border-accent/40 hover:bg-surface-subtle transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-subtle border border-border text-ink group-hover:bg-accent-soft group-hover:text-accent group-hover:border-accent/20 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono py-0.5 px-2">
                      {card.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-serif text-base font-semibold text-ink group-hover:text-accent transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted mt-1.5 leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-xs text-muted group-hover:text-accent font-medium transition-colors">
                  <span>Khám phá phân hệ</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Editorial Guidelines & Standards Section */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BookMarked className="h-4 w-4 text-accent" />
          <span>Nguyên tắc biên tập & Tiêu chuẩn nội dung Sử Ký</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted leading-relaxed">
          <div className="p-3.5 rounded-md border border-border bg-surface-subtle space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <ScrollText className="h-3.5 w-3.5 text-accent" />
              <span>Chính xác sử liệu</span>
            </div>
            <p>
              Mọi kịch bản podcast và hoạt họa cần căn cứ trên các bộ chính sử (Đại Việt Sử Ký Toàn Thư, Khâm Định Việt Sử Thông Giám Cương Mục) hoặc tư liệu lịch sử được kiểm chứng.
            </p>
          </div>

          <div className="p-3.5 rounded-md border border-border bg-surface-subtle space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              <span>Bản quyền & Tác quyền</span>
            </div>
            <p>
              Âm nhạc nền, hiệu ứng âm thanh và tạo hình nhân vật hoạt họa phải tuân thủ quyền tác giả, khuyến khích sáng tác nguyên bản mang âm hưởng văn hóa dân tộc.
            </p>
          </div>

          <div className="p-3.5 rounded-md border border-border bg-surface-subtle space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Chuẩn mực diễn ngôn</span>
            </div>
            <p>
              Giọng đọc truyền cảm, phát âm tiếng Việt chuẩn mực, tôn vinh các tiền nhân và công cuộc dựng nước, giữ nước của dân tộc Việt Nam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

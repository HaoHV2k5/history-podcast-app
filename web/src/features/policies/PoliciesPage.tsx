import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Shield, Edit3, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AiShieldBadge } from '@/features/moderation/components/AiShieldBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { moderationApi } from '@/services/api/moderation';
import { AiShieldPolicyConfig } from '@/types/moderation';

export const PoliciesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<AiShieldPolicyConfig | null>(null);
  const [thresholdScore, setThresholdScore] = useState<number>(0);
  const [label, setLabel] = useState('');
  const [action, setAction] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-ai-shield-policies'],
    queryFn: () => moderationApi.getPolicyConfigs(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ tier, payload }: { tier: string; payload: Partial<AiShieldPolicyConfig> }) =>
      moderationApi.updatePolicyConfig(tier, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-shield-policies'] });
      setEditingConfig(null);
    },
  });

  const configs = data?.data || [];

  const handleOpenEdit = (config: AiShieldPolicyConfig) => {
    setEditingConfig(config);
    setThresholdScore(config.thresholdScore);
    setLabel(config.label);
    setAction(config.action);
    setDescription(config.description);
  };

  const handleSave = () => {
    if (!editingConfig) return;
    updateMutation.mutate({
      tier: editingConfig.tier,
      payload: {
        thresholdScore,
        label,
        action,
        description,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chính sách & Cấu hình Thẩm định"
        description="Quản trị các phân tầng quy chuẩn kiểm duyệt tự động AI Shield và ngưỡng xử lý nội dung"
      />

      {/* Scope Disclaimer */}
      <div className="rounded-lg border border-border bg-surface-subtle p-4 text-xs text-muted leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-ink mb-1">
          <Sliders className="h-4 w-4 text-accent" />
          <span>Phạm vi cấu hình phân quyền quản trị</span>
        </div>
        <p>
          Phần thiết lập này tập trung quản trị 4 phân tầng quy chuẩn kiểm duyệt nội dung của <strong>AI Shield</strong>. Các phân hệ cấu hình kỹ thuật hệ thống và mẫu email thông báo được quản lý theo tiêu chuẩn nội bộ.
        </p>
      </div>

      {isError && (
        <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-4 text-xs text-status-error-text flex items-center justify-between">
          <span>Không thể tải danh sách chính sách AI Shield. Vui lòng thử lại.</span>
          <Button variant="outline" onClick={() => refetch()} className="min-h-[44px] px-3 text-xs">
            Tải lại
          </Button>
        </div>
      )}

      {/* Policy Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-xs text-muted">
            Đang tải dữ liệu cấu hình chính sách...
          </div>
        ) : configs.length > 0 ? (
          configs.map((cfg) => (
            <div
              key={cfg.tier}
              className="rounded-lg border border-border bg-surface p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <AiShieldBadge tier={cfg.tier} label={cfg.label} />
                  <span className="font-mono tabular-nums text-xs font-semibold text-ink bg-canvas px-2.5 py-1 rounded-sm border border-border">
                    Ngưỡng: {cfg.thresholdScore} điểm
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
                    Hành động quy định:
                  </span>
                  <p className="text-xs font-medium text-ink bg-surface-subtle/50 p-2.5 rounded-md border border-border font-mono">
                    {cfg.action || 'Chưa định nghĩa hành động'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
                    Mô tả tiêu chuẩn:
                  </span>
                  <p className="text-xs text-muted leading-relaxed">
                    {cfg.description || 'Không có mô tả chi tiết'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleOpenEdit(cfg)}
                  className="min-h-[44px] px-3.5 text-xs text-ink hover:text-accent hover:border-accent"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Điều chỉnh cấu hình</span>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
            Chưa có phân tầng chính sách AI Shield nào được cấu hình.
          </div>
        )}
      </div>

      {/* Edit Config Modal */}
      {editingConfig && (
        <Dialog open={Boolean(editingConfig)} onOpenChange={(open) => !open && setEditingConfig(null)}>
          <DialogContent maxWidth="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <span>Điều chỉnh cấu hình: {editingConfig.tier}</span>
              </DialogTitle>
              <DialogDescription>
                Cập nhật ngưỡng điểm, nhãn tiếng Việt và hành động tương ứng cho phân tầng AI Shield.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-ink block">Nhãn hiển thị tiếng Việt</label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ví dụ: Báo động đỏ, Tốt..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink block">Ngưỡng điểm số AI Shield (0 - 100)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdScore}
                  onChange={(e) => setThresholdScore(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink block">Hành động quy định</label>
                <Input
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Ví dụ: BLOCK_VIDEO, FLAG_FOR_REVIEW..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink block">Mô tả tiêu chuẩn thẩm định</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Nêu rõ căn cứ tiêu chuẩn phân tầng..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingConfig(null)} className="min-h-[44px]">
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                isLoading={updateMutation.isPending}
                onClick={handleSave}
                className="min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

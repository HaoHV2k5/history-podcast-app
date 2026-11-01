import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BookOpen, Link2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { KycProfile } from '@/types/kyc';

interface KycBioEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: KycProfile;
  onSaveBio: (newBio: string, newPortfolioUrl: string) => Promise<void>;
}

export const KycBioEditModal: React.FC<KycBioEditModalProps> = ({
  open,
  onOpenChange,
  profile,
  onSaveBio,
}) => {
  const [bio, setBio] = useState(profile.bio || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setBio(profile.bio || '');
      setPortfolioUrl(profile.portfolioUrl || '');
      setError(null);
      setSuccess(false);
    }
  }, [open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (portfolioUrl && !portfolioUrl.startsWith('http://') && !portfolioUrl.startsWith('https://')) {
      setError('Đường dẫn hồ sơ cá nhân cần bắt đầu bằng http:// hoặc https://');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveBio(bio, portfolioUrl);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thông tin lúc này');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-lg" className="border-[#EBE4D8] bg-[#FDFBF7]">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#A31D24]">
            <BookOpen className="h-5 w-5" />
            <span className="font-serif text-xs font-bold uppercase tracking-wider">
              HỒ SƠ TÁC GIẢ SỬ KÝ
            </span>
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-[#1C1615]">
            Chỉnh Sửa Tiểu Sử & Kênh Cá Nhân
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#5C524F]">
            Cập nhật phong cách nghiên cứu và liên kết dự án lịch sử để độc giả và ban biên tập dễ dàng tiếp cận.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Bio Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Tiểu sử tác giả & Phong cách sáng tác
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Nghiên cứu về các chiến dịch quân sự Đại Việt, khảo cứu sử liệu..."
              rows={4}
              maxLength={500}
              className="bg-white border-[#D9D0C3] focus:border-[#A31D24] focus:ring-[#A31D24]/20 text-xs sm:text-sm"
            />
            <div className="flex justify-between text-[11px] text-[#736B66]">
              <span>Tối đa 500 ký tự</span>
              <span>{bio.length}/500</span>
            </div>
          </div>

          {/* Portfolio URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C1615] block">
              Liên kết Kênh cá nhân / Portfolio
            </label>
            <Input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://youtube.com/@su-ky-dai-viet"
              leftIcon={<Link2 className="h-4 w-4 text-[#736B66]" />}
              className="bg-white border-[#D9D0C3] focus:border-[#A31D24] focus:ring-[#A31D24]/20 font-mono text-xs sm:text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg p-2.5 bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Đã cập nhật tiểu sử tác giả thành công!</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#D9D0C3] text-[#5C524F]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              isLoading={isSaving}
              className="bg-[#A31D24] hover:bg-[#881313] text-white gap-2"
            >
              <Save className="h-4 w-4" />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

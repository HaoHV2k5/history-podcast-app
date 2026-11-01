import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  Database,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KycSecurityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KycSecurityModal: React.FC<KycSecurityModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-xl" className="border-[#F3DFDF] bg-[#FCF7F7]">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#991B1B]">
            <Lock className="h-5 w-5" />
            <span className="font-serif text-xs font-bold uppercase tracking-wider">
              CAM KẾT AN TOÀN DỮ LIỆU SỬ KÝ
            </span>
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-[#1C1615]">
            Bảo Mật Thông Tin Định Danh & Tài Khoản
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#5C524F]">
            Hệ sinh thái Sử Ký áp dụng các tiêu chuẩn an ninh mạng nghiêm ngặt nhất để bảo vệ thông tin cá nhân của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 pt-2 text-xs sm:text-sm text-[#38302E]">
          {/* Privacy Commitment 1 */}
          <div className="p-3.5 rounded-xl border border-[#F3DFDF] bg-white flex items-start gap-3 shadow-2xs">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDE8E8] text-[#A31D24]"
              aria-hidden="true"
            >
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-[#1C1615] block">
                Chỉ Phục Vụ Đối Soát Danh Tính & Quyền Tác Giả
              </span>
              <p className="text-xs text-[#5C524F] leading-relaxed">
                Thông tin cá nhân (họ tên, số điện thoại, email) được sử dụng duy nhất cho mục đích xác thực tác giả và bảo vệ quyền sở hữu trí tuệ đối với các tác phẩm podcast bạn xuất bản trên Sử Ký.
              </p>
            </div>
          </div>

          {/* Privacy Commitment 2 */}
          <div className="p-3.5 rounded-xl border border-[#F3DFDF] bg-white flex items-start gap-3 shadow-2xs">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDE8E8] text-[#A31D24]"
              aria-hidden="true"
            >
              <Building2 className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-[#1C1615] block">
                Bảo Vệ Thông Tin Tài Khoản Ngân Hàng
              </span>
              <p className="text-xs text-[#5C524F] leading-relaxed">
                Thông tin số tài khoản và ngân hàng thụ hưởng chỉ được dùng để Ban Quản trị đối soát và giải ngân các khoản thù lao nhuận bút từ tác phẩm của bạn, tuyệt đối không dùng vào mục đích khác.
              </p>
            </div>
          </div>

          {/* Privacy Commitment 3 */}
          <div className="p-3.5 rounded-xl border border-[#F3DFDF] bg-white flex items-start gap-3 shadow-2xs">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDE8E8] text-[#A31D24]"
              aria-hidden="true"
            >
              <Lock className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-[#1C1615] block">
                Không Chia Sẻ Dữ Liệu Cho Bên Thứ Ba
              </span>
              <p className="text-xs text-[#5C524F] leading-relaxed">
                Ban Quản trị Sử Ký cam kết bảo mật thông tin hồ sơ của bạn, không chia sẻ hay cung cấp dữ liệu định danh của Nhà sáng tạo cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hoặc thương mại.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#F0D5D5] text-[#A31D24] hover:bg-[#FAF4F4]"
          >
            Đã hiểu & Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

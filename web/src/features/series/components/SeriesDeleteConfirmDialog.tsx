import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SeriesCardData } from './SeriesCard';

interface SeriesDeleteConfirmDialogProps {
  series: SeriesCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const SeriesDeleteConfirmDialog: React.FC<SeriesDeleteConfirmDialogProps> = ({
  series,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Xác nhận xóa tuyển tập</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5C524F] pt-1 leading-relaxed">
            Bạn có chắc chắn muốn xóa tuyển tập <strong>{series?.title}</strong>? Các podcast và video
            gốc bên trong vẫn sẽ được bảo lưu nguyên vẹn trong Thư viện nội dung của bạn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 border-t border-[#EBE4D8]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl border-[#EBE4D8]"
            title="Hủy bỏ thao tác xóa"
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            title="Xác nhận xóa vĩnh viễn tuyển tập này"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Xác nhận xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

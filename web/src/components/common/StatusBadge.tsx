import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  if (!status) return <Badge variant="outline" className={className}>Chưa xác định</Badge>;

  const normalized = status.toUpperCase();

  if (label) {
    // If explicit label is passed, pick variant based on normalized status
    let variant: 'default' | 'outline' | 'success' | 'pending' | 'error' | 'processing' | 'accent' = 'outline';
    if (['APPROVED', 'COMPLETED', 'ACTIVE', 'EXCELLENT', 'GOOD', 'RELEASED'].includes(normalized)) {
      variant = 'success';
    } else if (['PENDING', 'PENDING_REVIEW', 'FAIR', 'REFUNDED'].includes(normalized)) {
      variant = 'pending';
    } else if (['PROCESSING', 'IN_PROGRESS', 'HELD'].includes(normalized)) {
      variant = 'processing';
    } else if (['REJECTED', 'FAILED', 'LOCKED', 'INACTIVE', 'RED_ALERT', 'FROZEN', 'CANCELLED'].includes(normalized)) {
      variant = 'error';
    } else if (['SUBMITTED'].includes(normalized)) {
      variant = 'accent';
    }
    return <Badge variant={variant} className={className}>{label}</Badge>;
  }

  switch (normalized) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'EXCELLENT':
    case 'GOOD':
    case 'RELEASED':
      return (
        <Badge variant="success" className={className}>
          {normalized === 'APPROVED' && 'Đã phê duyệt'}
          {normalized === 'COMPLETED' && 'Đã hoàn tất'}
          {normalized === 'ACTIVE' && 'Đang hoạt động'}
          {normalized === 'EXCELLENT' && 'Xuất sắc'}
          {normalized === 'GOOD' && 'Tốt'}
          {normalized === 'RELEASED' && 'Đã giải ngân'}
        </Badge>
      );

    case 'PENDING':
    case 'PENDING_REVIEW':
    case 'FAIR':
    case 'REFUNDED':
      return (
        <Badge variant="pending" className={className}>
          {normalized === 'PENDING' && 'Chờ xử lý'}
          {normalized === 'PENDING_REVIEW' && 'Chờ kiểm duyệt'}
          {normalized === 'FAIR' && 'Khá'}
          {normalized === 'REFUNDED' && 'Đã hoàn trả'}
        </Badge>
      );

    case 'PROCESSING':
    case 'IN_PROGRESS':
    case 'HELD':
      return (
        <Badge variant="processing" className={className}>
          {normalized === 'PROCESSING' && 'Đang xử lý'}
          {normalized === 'IN_PROGRESS' && 'Đang thực hiện'}
          {normalized === 'HELD' && 'Đang giữ ký quỹ'}
        </Badge>
      );

    case 'SUBMITTED':
      return (
        <Badge variant="accent" className={className}>
          Đã nộp bài
        </Badge>
      );

    case 'REJECTED':
    case 'FAILED':
    case 'LOCKED':
    case 'INACTIVE':
    case 'RED_ALERT':
    case 'FROZEN':
    case 'CANCELLED':
      return (
        <Badge variant="error" className={className}>
          {normalized === 'REJECTED' && 'Bị từ chối'}
          {normalized === 'FAILED' && 'Thất bại'}
          {normalized === 'LOCKED' && 'Đã tạm khóa'}
          {normalized === 'INACTIVE' && 'Ngừng hoạt động'}
          {normalized === 'RED_ALERT' && 'Báo động đỏ'}
          {normalized === 'FROZEN' && 'Tạm đóng băng'}
          {normalized === 'CANCELLED' && 'Đã hủy'}
        </Badge>
      );

    case 'UNFUNDED':
      return (
        <Badge variant="outline" className={className}>
          Chưa ký quỹ
        </Badge>
      );

    case 'WAITING':
      return (
        <Badge variant="outline" className={className}>
          Chờ thực hiện
        </Badge>
      );

    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}

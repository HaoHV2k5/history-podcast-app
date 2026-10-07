import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return <Badge variant="outline" className={className}>Chưa xác định</Badge>;

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'EXCELLENT':
    case 'GOOD':
      return (
        <Badge variant="success" className={className}>
          {normalized === 'APPROVED' && 'Đã phê duyệt'}
          {normalized === 'COMPLETED' && 'Đã hoàn tất'}
          {normalized === 'ACTIVE' && 'Đang hoạt động'}
          {normalized === 'EXCELLENT' && 'Xuất sắc'}
          {normalized === 'GOOD' && 'Tốt'}
        </Badge>
      );

    case 'PENDING':
    case 'PENDING_REVIEW':
    case 'FAIR':
      return (
        <Badge variant="pending" className={className}>
          {normalized === 'PENDING' && 'Chờ xử lý'}
          {normalized === 'PENDING_REVIEW' && 'Chờ kiểm duyệt'}
          {normalized === 'FAIR' && 'Khá'}
        </Badge>
      );

    case 'PROCESSING':
      return (
        <Badge variant="processing" className={className}>
          Đang xử lý
        </Badge>
      );

    case 'REJECTED':
    case 'FAILED':
    case 'LOCKED':
    case 'INACTIVE':
    case 'RED_ALERT':
      return (
        <Badge variant="error" className={className}>
          {normalized === 'REJECTED' && 'Bị từ chối'}
          {normalized === 'FAILED' && 'Thất bại'}
          {normalized === 'LOCKED' && 'Đã tạm khóa'}
          {normalized === 'INACTIVE' && 'Ngừng hoạt động'}
          {normalized === 'RED_ALERT' && 'Báo động đỏ'}
        </Badge>
      );

    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}

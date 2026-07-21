import type { OrderStatus, ProductStatus } from '../types';

const labels: Record<OrderStatus | ProductStatus, string> = {
  pending: 'Chờ xác nhận',
  preparing: 'Đang pha chế',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  active: 'Đang bán',
  hidden: 'Đã ẩn',
  out_of_stock: 'Hết hàng',
};

export function StatusBadge({ status }: { status: OrderStatus | ProductStatus }) {
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}

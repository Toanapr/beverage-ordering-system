import { CheckCircle, Clock, CookingPot, XCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { money, normalizePage, request, shortDate } from '../lib/api';
import type { Order, OrderStatus, Paginated } from '../types';

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock size={21} />,
  preparing: <CookingPot size={21} />,
  completed: <CheckCircle size={21} />,
  cancelled: <XCircle size={21} />,
};

export function OrdersPage() {
  const { token } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const created = (location.state as { created?: string } | null)?.created;

  function load() {
    setLoading(true);
    request<Paginated<Order> | Order[]>('/orders/history?page=1&limit=50', {}, token)
      .then((data) => setOrders(normalizePage(data).items))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function cancel(order: Order) {
    const cancelReason = window.prompt('Lý do hủy đơn:');
    if (!cancelReason?.trim()) return;
    try {
      await request(`/orders/${order.id}/cancel`, { method: 'PATCH', body: JSON.stringify({ cancelReason }) }, token);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể hủy đơn.');
    }
  }

  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return (
    <section className="orders-page page-container page-space">
      <div className="page-title"><div><span className="eyebrow">Tài khoản</span><h1>Đơn hàng của bạn</h1><p>Theo dõi quá trình cửa hàng chuẩn bị từng đơn.</p></div></div>
      {created && <div className="success-banner"><CheckCircle size={23} weight="fill" /><span>Đặt hàng thành công. Mã đơn của bạn là <strong>{created}</strong>.</span></div>}
      <div className="filter-tabs" role="tablist">
        {([['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['preparing', 'Đang pha chế'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)}>{label}</button>)}
      </div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} retry={load} /> : visible.length === 0 ? <EmptyState title="Chưa có đơn hàng" description="Các đơn phù hợp với bộ lọc sẽ xuất hiện tại đây." /> : (
        <div className="order-list">
          {visible.map((order) => (
            <article className="order-card" key={order.id}>
              <div className={`order-status-icon status-icon-${order.status}`}>{statusIcons[order.status]}</div>
              <div className="order-main"><div className="order-card-head"><div><span>Đơn #{order.orderCode}</span><small>{shortDate(new Date(order.createdAt))}</small></div><StatusBadge status={order.status} /></div><div className="order-meta"><span>Thanh toán COD</span><span>{money(order.totalAmount)}</span></div>{order.cancelReason && <p className="cancel-reason">Lý do hủy: {order.cancelReason}</p>}</div>
              {order.status === 'pending' && <button className="button button-danger button-small" type="button" onClick={() => cancel(order)}>Hủy đơn</button>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

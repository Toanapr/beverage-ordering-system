import { Check, CookingPot, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { money, normalizePage, request, shortDate, withQuery } from '../lib/api';
import type { Order, OrderStatus, Paginated } from '../types';

export function StaffOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    request<Paginated<Order> | Order[]>(withQuery('/orders/staff', { page: 1, limit: 50, status: filter === 'all' ? undefined : filter }), {}, token)
      .then((data) => setOrders(normalizePage(data).items))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [filter, token]);

  async function advance(order: Order) {
    const status = order.status === 'pending' ? 'preparing' : 'completed';
    try {
      await request(`/orders/staff/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật đơn.');
    }
  }

  async function cancel(order: Order) {
    const cancelReason = window.prompt('Lý do cửa hàng hủy đơn:');
    if (!cancelReason?.trim()) return;
    try {
      await request(`/orders/staff/${order.id}/cancel`, { method: 'PATCH', body: JSON.stringify({ cancelReason }) }, token);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể hủy đơn.');
    }
  }

  return (
    <>
      <div className="dashboard-heading"><div><span>Vận hành</span><h1>Quản lý đơn hàng</h1><p>Xác nhận, pha chế và hoàn tất đơn theo đúng thứ tự.</p></div></div>
      <div className="filter-tabs dashboard-filters">{([['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['preparing', 'Đang pha chế'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)}>{label}</button>)}</div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} retry={load} /> : orders.length === 0 ? <EmptyState title="Không có đơn trong trạng thái này" description="Các đơn mới sẽ tự xuất hiện khi khách hàng hoàn tất đặt món." /> : (
        <div className="staff-order-grid">
          {orders.map((order) => (
            <article className="staff-order-card" key={order.id}>
              <header><div><span>#{order.orderCode}</span><small>{shortDate(new Date(order.createdAt))}</small></div><StatusBadge status={order.status} /></header>
              <div className="customer-block"><strong>{order.receiverName || 'Khách hàng'}</strong><span>{order.receiverPhone}</span><p>{order.deliveryAddress}</p></div>
              {order.items?.length ? <div className="order-items">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.productName}</span><strong>{money(item.lineTotal)}</strong></div>)}</div> : <p className="muted-copy">Mở chi tiết qua API để xem danh sách món.</p>}
              <div className="staff-order-total"><span>Tổng thanh toán</span><strong>{money(order.totalAmount)}</strong></div>
              {(order.status === 'pending' || order.status === 'preparing') && <footer>{order.status === 'pending' && <button className="button button-danger button-small" type="button" onClick={() => cancel(order)}><X size={17} /> Hủy đơn</button>}<button className="button button-primary button-small" type="button" onClick={() => advance(order)}>{order.status === 'pending' ? <><CookingPot size={17} /> Nhận pha chế</> : <><Check size={17} /> Hoàn tất</>}</button></footer>}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

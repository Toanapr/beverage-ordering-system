import { MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { money, normalizePage, request, shortDate, withQuery } from '../lib/api';
import type { Order, OrderStatus, Paginated } from '../types';

export function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() { setLoading(true); request<Paginated<Order> | Order[]>(withQuery('/orders/admin', { page: 1, limit: 100, status: filter === 'all' ? undefined : filter }), {}, token).then((data) => setOrders(normalizePage(data).items)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }
  useEffect(load, [filter, token]);
  const visible = query ? orders.filter((order) => order.orderCode.toLowerCase().includes(query.toLowerCase()) || order.receiverName?.toLowerCase().includes(query.toLowerCase())) : orders;

  return <><div className="dashboard-heading"><div><span>Giám sát toàn hệ thống</span><h1>Tất cả đơn hàng</h1><p>Tra cứu trạng thái, khách hàng và giá trị đơn theo thời gian.</p></div><label className="search-field dashboard-search"><MagnifyingGlass size={19} /><span className="sr-only">Tìm đơn</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mã đơn hoặc người nhận" /></label></div><div className="filter-tabs dashboard-filters">{([['all', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['preparing', 'Đang pha chế'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)}>{label}</button>)}</div>{error && <ErrorState message={error} retry={load} />}{loading ? <PageLoader /> : visible.length === 0 ? <EmptyState title="Không tìm thấy đơn hàng" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." /> : <section className="dashboard-section table-section"><div className="responsive-table"><table><thead><tr><th>Mã đơn</th><th>Người nhận</th><th>Thời gian</th><th>Trạng thái</th><th>Tổng tiền</th></tr></thead><tbody>{visible.map((order) => <tr key={order.id}><td><strong>#{order.orderCode}</strong></td><td><div className="two-line"><strong>{order.receiverName || 'Khách hàng'}</strong><small>{order.receiverPhone || order.customerId.slice(0, 8)}</small></div></td><td>{shortDate(new Date(order.createdAt))}</td><td><StatusBadge status={order.status} /></td><td><strong>{money(order.totalAmount)}</strong></td></tr>)}</tbody></table></div></section>}</>;
}

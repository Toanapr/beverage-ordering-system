import { CheckCircle, Clock, CurrencyCircleDollar, Receipt } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, PageLoader } from '../components/Feedback';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { money, normalizePage, request, shortDate } from '../lib/api';
import type { Order, Paginated } from '../types';

interface StaffStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completedRevenue: number;
}

export function StaffDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  function load() {
    setError('');
    Promise.all([
      request<StaffStats>('/orders/staff/statistics', {}, token),
      request<Paginated<Order> | Order[]>('/orders/staff?page=1&limit=6', {}, token),
    ]).then(([statData, orderData]) => {
      setStats(statData);
      setOrders(normalizePage(orderData).items);
    }).catch((reason: Error) => setError(reason.message));
  }
  useEffect(load, [token]);

  if (error) return <ErrorState message={error} retry={load} />;
  if (!stats) return <PageLoader />;

  const pending = orders.filter((order) => order.status === 'pending').length;
  return (
    <>
      <div className="dashboard-heading"><div><span>Ca làm việc</span><h1>Tổng quan cửa hàng</h1><p>Nắm nhanh tình hình đơn và doanh thu đã hoàn tất.</p></div><Link className="button button-primary" to="/staff/orders">Xử lý đơn mới</Link></div>
      <div className="metric-grid staff-metrics">
        <article className="metric-card metric-card-primary"><span className="metric-icon"><CurrencyCircleDollar size={22} /></span><p>Doanh thu hoàn tất</p><strong>{money(stats.completedRevenue)}</strong><small>Từ các đơn đã hoàn thành</small></article>
        <article className="metric-card"><span className="metric-icon"><Receipt size={22} /></span><p>Tổng đơn</p><strong>{stats.totalOrders}</strong><small>Toàn bộ lịch sử cửa hàng</small></article>
        <article className="metric-card"><span className="metric-icon"><Clock size={22} /></span><p>Đang chờ</p><strong>{pending}</strong><small>Cần được xác nhận</small></article>
        <article className="metric-card"><span className="metric-icon"><CheckCircle size={22} /></span><p>Đã hoàn tất</p><strong>{stats.completedOrders}</strong><small>{stats.cancelledOrders} đơn đã hủy</small></article>
      </div>
      <section className="dashboard-section">
        <div className="section-title-row"><div><h2>Đơn gần đây</h2><p>Ưu tiên đơn đang chờ xác nhận.</p></div><Link to="/staff/orders">Xem tất cả</Link></div>
        <div className="data-list">
          {orders.map((order) => <div className="data-row" key={order.id}><div className="data-primary"><strong>#{order.orderCode}</strong><span>{order.receiverName || 'Khách hàng'} · {shortDate(new Date(order.createdAt))}</span></div><StatusBadge status={order.status} /><span>{money(order.totalAmount)}</span><Link className="row-action" to="/staff/orders">Xử lý</Link></div>)}
        </div>
      </section>
    </>
  );
}

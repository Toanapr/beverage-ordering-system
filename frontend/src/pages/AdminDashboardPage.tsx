import { CurrencyCircleDollar, Package, Storefront, Users } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { ErrorState, PageLoader } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { money, request } from '../lib/api';
import type { AdminStatistics, OrderDistribution, TopProduct, TopStore, TrendItem } from '../types';

export function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStatistics | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [topStores, setTopStores] = useState<TopStore[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [distribution, setDistribution] = useState<OrderDistribution | null>(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    Promise.all([
      request<AdminStatistics>('/statistics/admin', {}, token),
      request<TrendItem[]>('/statistics/admin/trends?range=day', {}, token),
      request<TopStore[]>('/statistics/admin/top-stores?limit=5', {}, token),
      request<TopProduct[]>('/statistics/admin/top-products?limit=5', {}, token),
      request<OrderDistribution>('/statistics/admin/order-status', {}, token),
    ]).then(([statData, trendData, storeData, productData, distributionData]) => {
      setStats(statData); setTrends(trendData); setTopStores(storeData); setTopProducts(productData); setDistribution(distributionData);
    }).catch((reason: Error) => setError(reason.message));
  }
  useEffect(load, [token]);

  const maxRevenue = useMemo(() => Math.max(...trends.map((item) => item.revenue), 1), [trends]);
  if (error) return <ErrorState message={error} retry={load} />;
  if (!stats) return <PageLoader />;

  return (
    <>
      <div className="dashboard-heading"><div><span>Toàn hệ thống</span><h1>Bức tranh vận hành</h1><p>Theo dõi tăng trưởng, doanh thu và chất lượng mạng lưới cửa hàng.</p></div><select className="period-select" aria-label="Khoảng thời gian"><option>7 ngày gần đây</option><option>30 ngày gần đây</option></select></div>
      <div className="metric-grid admin-metrics">
        <article className="metric-card metric-card-primary"><span className="metric-icon"><CurrencyCircleDollar size={22} /></span><p>Tổng doanh thu</p><strong>{money(stats.totalRevenue)}</strong><small>Từ đơn đã hoàn tất</small></article>
        <article className="metric-card"><span className="metric-icon"><Package size={22} /></span><p>Tổng đơn hàng</p><strong>{stats.totalOrders}</strong><small>Trên toàn hệ thống</small></article>
        <article className="metric-card"><span className="metric-icon"><Storefront size={22} /></span><p>Cửa hàng</p><strong>{stats.totalStores}</strong><small>Đã được khởi tạo</small></article>
        <article className="metric-card"><span className="metric-icon"><Users size={22} /></span><p>Người dùng</p><strong>{stats.totalUsers}</strong><small>Gồm khách hàng và nhân viên</small></article>
      </div>
      <div className="analytics-grid">
        <section className="dashboard-section revenue-panel"><div className="section-title-row"><div><h2>Doanh thu theo ngày</h2><p>Giá trị của các đơn đã hoàn tất.</p></div></div>{trends.length ? <div className="bar-chart">{trends.slice(-10).map((item) => <div className="bar-column" key={item.date}><div className="bar-value" style={{ height: `${Math.max(8, (item.revenue / maxRevenue) * 100)}%` }} title={money(item.revenue)} /><span>{new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span></div>)}</div> : <p className="muted-copy">Chưa có doanh thu trong khoảng thời gian này.</p>}</section>
        <section className="dashboard-section status-panel"><div className="section-title-row"><div><h2>Trạng thái đơn</h2><p>Phân bổ toàn hệ thống.</p></div></div>{distribution && <div className="distribution-list">{Object.entries(distribution).map(([status, value]) => <div key={status}><span className={`distribution-swatch swatch-${status}`} /><span>{translateStatus(status)}</span><strong>{value}</strong></div>)}</div>}</section>
      </div>
      <div className="analytics-grid bottom-analytics">
        <section className="dashboard-section"><div className="section-title-row"><div><h2>Cửa hàng dẫn đầu</h2><p>Xếp theo doanh thu hoàn tất.</p></div></div><div className="rank-list">{topStores.map((store, index) => <div key={store.storeId}><span>{index + 1}</span><div><strong>{store.storeName}</strong><small>{store.totalOrders} đơn · {store.ratingAvg || 0} điểm</small></div><strong>{money(store.totalRevenue)}</strong></div>)}</div></section>
        <section className="dashboard-section"><div className="section-title-row"><div><h2>Sản phẩm nổi bật</h2><p>Những món được gọi nhiều nhất.</p></div></div><div className="rank-list">{topProducts.map((product, index) => <div key={product.productId}><span>{index + 1}</span><div><strong>{product.productName}</strong><small>{product.storeName} · {product.quantitySold} món</small></div><strong>{money(product.totalRevenue)}</strong></div>)}</div></section>
      </div>
    </>
  );
}

function translateStatus(status: string) {
  return ({ pending: 'Chờ xác nhận', preparing: 'Đang pha chế', completed: 'Hoàn tất', cancelled: 'Đã hủy' } as Record<string, string>)[status] || status;
}

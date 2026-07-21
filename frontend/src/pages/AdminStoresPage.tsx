import { Lock, LockOpen, MapPin, Plus, Storefront } from '@phosphor-icons/react';
import { FormEvent, useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { normalizePage, request } from '../lib/api';
import type { Paginated, Store } from '../types';

export function AdminStoresPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  function load() { setLoading(true); request<Paginated<Store> | Store[]>('/stores/admin?page=1&limit=100', {}, token).then((data) => setStores(normalizePage(data).items)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }
  useEffect(load, [token]);

  async function toggle(store: Store) {
    try { await request(`/stores/${store.id}/${store.isLocked ? 'unlock' : 'lock'}`, { method: 'PATCH' }, token); load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật cửa hàng.'); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { await request('/stores', { method: 'POST', body: JSON.stringify({ name: String(data.get('name')), phone: String(data.get('phone')), address: String(data.get('address')), isOpen: true }) }, token); setShowCreate(false); load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo cửa hàng.'); }
  }

  return <><div className="dashboard-heading"><div><span>Mạng lưới</span><h1>Quản lý cửa hàng</h1><p>Tạo cửa hàng mới và kiểm soát quyền hoạt động trên hệ thống.</p></div><button className="button button-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={18} /> Thêm cửa hàng</button></div>{error && <ErrorState message={error} retry={load} />}{loading ? <PageLoader /> : stores.length === 0 ? <EmptyState title="Chưa có cửa hàng" description="Tạo cửa hàng đầu tiên để bắt đầu vận hành." /> : <div className="management-grid">{stores.map((store) => <article className="management-card" key={store.id}><header><span className="management-icon"><Storefront size={23} /></span><span className={`open-label ${store.isOpen && !store.isLocked ? 'is-open' : ''}`}>{store.isLocked ? 'Đã khóa' : store.isOpen ? 'Đang mở' : 'Tạm đóng'}</span></header><h2>{store.name}</h2><p><MapPin size={16} /> {store.address}</p><small>{store.phone}</small><footer><span>{store.ratingAvg || 0} điểm từ {store.ratingCount || 0} đánh giá</span><button className={`button button-small ${store.isLocked ? 'button-primary' : 'button-danger'}`} type="button" onClick={() => toggle(store)}>{store.isLocked ? <LockOpen size={17} /> : <Lock size={17} />}{store.isLocked ? 'Mở khóa' : 'Khóa'}</button></footer></article>)}</div>}{showCreate && <Modal title="Tạo cửa hàng" onClose={() => setShowCreate(false)}><form className="modal-form" onSubmit={create}><label className="field"><span>Tên cửa hàng</span><input name="name" required maxLength={100} placeholder="Mộc Nguyễn Huệ" /></label><label className="field"><span>Số điện thoại</span><input name="phone" required maxLength={20} placeholder="0901 234 567" /></label><label className="field"><span>Địa chỉ</span><textarea name="address" rows={3} required placeholder="Số nhà, đường, quận/huyện" /></label><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setShowCreate(false)}>Đóng</button><button className="button button-primary" type="submit">Tạo cửa hàng</button></div></form></Modal>}</>;
}

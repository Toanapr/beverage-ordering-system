import { MapPin, Phone, Storefront } from '@phosphor-icons/react';
import { FormEvent, useEffect, useState } from 'react';
import { ErrorState, PageLoader } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { request } from '../lib/api';
import type { Store } from '../types';

export function StaffStorePage() {
  const { token } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function load() { request<Store>('/staff/store', {}, token).then(setStore).catch((reason: Error) => setError(reason.message)); }
  useEffect(load, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const updated = await request<Store>('/staff/store', { method: 'PATCH', body: JSON.stringify({ name: String(data.get('name')), phone: String(data.get('phone')), address: String(data.get('address')), isOpen: data.get('isOpen') === 'on' }) }, token);
      setStore(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật cửa hàng.'); }
  }

  if (!store && !error) return <PageLoader />;
  if (!store) return <ErrorState message={error} retry={load} />;
  return (
    <>
      <div className="dashboard-heading"><div><span>Hồ sơ cửa hàng</span><h1>Thông tin hoạt động</h1><p>Cập nhật thông tin khách hàng nhìn thấy và trạng thái nhận đơn.</p></div></div>
      {error && <ErrorState message={error} />}
      <div className="store-settings-grid">
        <form className="settings-form" onSubmit={submit}><h2>Thông tin công khai</h2><label className="field"><span>Tên cửa hàng</span><div className="input-icon"><Storefront size={18} /><input name="name" required defaultValue={store.name} /></div></label><label className="field"><span>Số điện thoại</span><div className="input-icon"><Phone size={18} /><input name="phone" required defaultValue={store.phone} /></div></label><label className="field"><span>Địa chỉ</span><div className="input-icon textarea-icon"><MapPin size={18} /><textarea name="address" required rows={4} defaultValue={store.address} /></div></label><label className="switch-field"><span><strong>Nhận đơn hàng</strong><small>Tắt khi cửa hàng tạm nghỉ hoặc quá tải.</small></span><input type="checkbox" name="isOpen" defaultChecked={store.isOpen} /><i /></label><button className="button button-primary" type="submit">Lưu thay đổi</button>{saved && <p className="inline-notice" role="status">Đã cập nhật thông tin cửa hàng.</p>}</form>
        <aside className="store-preview"><span>Xem trước</span><div className="store-preview-card"><div className="store-preview-visual"><Storefront size={44} /></div><div><span className={`open-label ${store.isOpen ? 'is-open' : ''}`}>{store.isOpen ? 'Đang nhận đơn' : 'Tạm đóng cửa'}</span><h2>{store.name}</h2><p><MapPin size={16} /> {store.address}</p><p><Phone size={16} /> {store.phone}</p></div></div></aside>
      </div>
    </>
  );
}

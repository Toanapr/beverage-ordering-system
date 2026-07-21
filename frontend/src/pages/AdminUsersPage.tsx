import { Lock, LockOpen, Plus, UserCircle } from '@phosphor-icons/react';
import { FormEvent, useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { normalizePage, request, shortDate } from '../lib/api';
import type { Paginated, Role, Store, User } from '../types';

export function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filter, setFilter] = useState<Role | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  function load() { setLoading(true); Promise.all([request<Paginated<User> | User[]>(`/admin/users?page=1&limit=100${filter === 'all' ? '' : `&role=${filter}`}`, {}, token), request<Paginated<Store> | Store[]>('/stores/admin?page=1&limit=100', {}, token)]).then(([userData, storeData]) => { setUsers(normalizePage(userData).items); setStores(normalizePage(storeData).items); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }
  useEffect(load, [filter, token]);

  async function toggle(user: User) { try { await request(`/admin/users/${user.id}/${user.isBanned ? 'unlock' : 'lock'}`, { method: 'PATCH' }, token); load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật tài khoản.'); } }

  async function createStaff(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); try { await request('/admin/staff', { method: 'POST', body: JSON.stringify({ fullName: String(data.get('fullName')), email: String(data.get('email')), password: String(data.get('password')), storeId: String(data.get('storeId')) }) }, token); setShowCreate(false); load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo nhân viên.'); } }

  return <><div className="dashboard-heading"><div><span>Phân quyền và tài khoản</span><h1>Quản lý người dùng</h1><p>Theo dõi khách hàng, nhân viên và trạng thái truy cập.</p></div><button className="button button-primary" type="button" onClick={() => setShowCreate(true)}><Plus size={18} /> Thêm nhân viên</button></div><div className="filter-tabs dashboard-filters">{([['all', 'Tất cả'], ['customer', 'Khách hàng'], ['staff', 'Nhân viên'], ['admin', 'Admin']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} type="button" onClick={() => setFilter(value)}>{label}</button>)}</div>{error && <ErrorState message={error} retry={load} />}{loading ? <PageLoader /> : users.length === 0 ? <EmptyState title="Không có tài khoản phù hợp" description="Thử thay đổi bộ lọc vai trò." /> : <section className="dashboard-section table-section"><div className="responsive-table"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Ngày tham gia</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="user-cell"><span><UserCircle size={22} /></span><div><strong>{user.fullName}</strong><small>{user.email}</small></div></div></td><td><span className="role-label">{translateRole(user.role)}</span></td><td>{shortDate(new Date(user.createdAt))}</td><td><span className={`account-state ${user.isBanned ? 'is-locked' : ''}`}>{user.isBanned ? 'Đã khóa' : 'Hoạt động'}</span></td><td><button className="table-action" type="button" onClick={() => toggle(user)}>{user.isBanned ? <LockOpen size={17} /> : <Lock size={17} />}{user.isBanned ? 'Mở khóa' : 'Khóa'}</button></td></tr>)}</tbody></table></div></section>}{showCreate && <Modal title="Tạo tài khoản nhân viên" onClose={() => setShowCreate(false)}><form className="modal-form" onSubmit={createStaff}><label className="field"><span>Họ và tên</span><input name="fullName" required placeholder="Trần Minh Khôi" /></label><label className="field"><span>Email</span><input type="email" name="email" required placeholder="staff@example.com" /></label><label className="field"><span>Mật khẩu tạm</span><input type="password" name="password" minLength={6} required placeholder="Tối thiểu 6 ký tự" /></label><label className="field"><span>Cửa hàng phụ trách</span><select name="storeId" required defaultValue=""><option value="" disabled>Chọn cửa hàng</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setShowCreate(false)}>Đóng</button><button className="button button-primary" type="submit">Tạo nhân viên</button></div></form></Modal>}</>;
}

function translateRole(role: Role) { return { customer: 'Khách hàng', staff: 'Nhân viên', admin: 'Quản trị viên' }[role]; }

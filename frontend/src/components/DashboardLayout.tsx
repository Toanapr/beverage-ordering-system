import {
  ChartDonut,
  Coffee,
  House,
  List,
  Package,
  Receipt,
  SignOut,
  Storefront,
  Users,
  X,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';

const staffLinks = [
  { to: '/staff', label: 'Tổng quan', icon: House, end: true },
  { to: '/staff/orders', label: 'Đơn hàng', icon: Receipt },
  { to: '/staff/menu', label: 'Thực đơn', icon: Coffee },
  { to: '/staff/store', label: 'Cửa hàng', icon: Storefront },
];

const adminLinks = [
  { to: '/admin', label: 'Tổng quan', icon: ChartDonut, end: true },
  { to: '/admin/stores', label: 'Cửa hàng', icon: Storefront },
  { to: '/admin/users', label: 'Tài khoản', icon: Users },
  { to: '/admin/orders', label: 'Đơn hàng', icon: Package },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? adminLinks : staffLinks;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand"><Brand /><button className="icon-button sidebar-close" type="button" onClick={() => setOpen(false)} aria-label="Đóng menu"><X size={20} /></button></div>
        <div className="workspace-label">
          <span>{isAdmin ? 'Quản trị hệ thống' : 'Không gian cửa hàng'}</span>
          <strong>{isAdmin ? 'Mộc Operations' : 'Ca làm việc hôm nay'}</strong>
        </div>
        <nav className="dashboard-nav" aria-label="Điều hướng quản trị">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}><Icon size={20} />{label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/" className="back-store"><Storefront size={19} /> Xem trang khách hàng</a>
          <button type="button" onClick={handleLogout}><SignOut size={19} /> Đăng xuất</button>
        </div>
      </aside>
      {open && <button className="sidebar-scrim" type="button" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="icon-button dashboard-menu" type="button" onClick={() => setOpen(true)} aria-label="Mở menu"><List size={22} /></button>
          <div className="topbar-title"><span>Xin chào,</span><strong>{user?.fullName}</strong></div>
          <div className="topbar-actions"><ThemeToggle /><span className="avatar">{user?.fullName.charAt(0).toUpperCase()}</span></div>
        </header>
        <main className="dashboard-content"><Outlet /></main>
      </div>
    </div>
  );
}

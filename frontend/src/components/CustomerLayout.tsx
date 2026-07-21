import {
  List,
  ShoppingBag,
  SignOut,
  UserCircle,
  X,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Điều hướng chính">
            <NavLink to="/" end onClick={() => setOpen(false)}>Khám phá</NavLink>
            {user?.role === 'customer' && <NavLink to="/orders" onClick={() => setOpen(false)}>Đơn hàng</NavLink>}
            {user?.role === 'staff' && <NavLink to="/staff" onClick={() => setOpen(false)}>Khu vực nhân viên</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setOpen(false)}>Trang quản trị</NavLink>}
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link className="cart-button" to="/cart" aria-label={`Giỏ hàng có ${count} sản phẩm`}>
              <ShoppingBag size={20} />
              {count > 0 && <span>{count}</span>}
            </Link>
            {user ? (
              <div className="profile-menu">
                <span className="user-chip"><UserCircle size={20} /> {user.fullName.split(' ')[0]}</span>
                <button className="icon-button" type="button" aria-label="Đăng xuất" onClick={handleLogout}><SignOut size={19} /></button>
              </div>
            ) : (
              <Link className="button button-primary button-small" to="/login">Đăng nhập</Link>
            )}
            <button className="icon-button mobile-menu" type="button" aria-label={open ? 'Đóng menu' : 'Mở menu'} onClick={() => setOpen(!open)}>
              {open ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div><Brand /><p>Đồ uống bạn thích, từ quán bạn tin.</p></div>
        <div className="footer-links"><Link to="/">Cửa hàng</Link><Link to="/orders">Đơn hàng</Link><a href="http://localhost:3000/api-docs">API Docs</a></div>
        <small>© 2026 Mộc. Nền tảng đặt đồ uống đa cửa hàng.</small>
      </footer>
    </div>
  );
}

import { ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { roleHome, useAuth } from '../context/AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const values = new FormData(event.currentTarget);
    try {
      const user = mode === 'login'
        ? await login(String(values.get('email')), String(values.get('password')))
        : await register({ email: String(values.get('email')), password: String(values.get('password')), fullName: String(values.get('fullName')) });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || roleHome(user.role), { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tiếp tục.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Brand />
        <div className="auth-visual-copy"><span>Đặt món theo cách nhẹ nhàng hơn</span><h1>Chọn món.<br />Mộc lo phần còn lại.</h1><p>Khám phá cửa hàng, đặt món và theo dõi trạng thái ngay trên một giao diện.</p></div>
        <img src="/images/cold-brew.jpg" alt="Cold brew được phục vụ cùng đá" />
      </section>
      <section className="auth-form-wrap">
        <Link className="auth-back" to="/">Về trang chủ</Link>
        <form className="auth-form" onSubmit={submit}>
          <header><span>{mode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu cùng Mộc'}</span><h2>{mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}</h2><p>{mode === 'login' ? 'Nhập thông tin để tiếp tục.' : 'Đăng ký để lưu và theo dõi đơn hàng.'}</p></header>
          {mode === 'register' && <label className="field"><span>Họ và tên</span><input name="fullName" autoComplete="name" required placeholder="Nguyễn Minh Anh" /></label>}
          <label className="field"><span>Email</span><input type="email" name="email" autoComplete="email" required placeholder="ban@example.com" /></label>
          <label className="field"><span>Mật khẩu</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} name="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required placeholder="Tối thiểu 6 ký tự" /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeSlash size={19} /> : <Eye size={19} />}</button></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-full" type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} {!loading && <ArrowRight size={18} />}</button>
          <p className="auth-switch">{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</Link></p>
          {mode === 'login' && <div className="demo-accounts"><strong>Tài khoản demo</strong><span>demo.customer@example.com</span><span>demo.staff@example.com</span><span>demo.admin@example.com</span><small>Mật khẩu: password123</small></div>}
        </form>
      </section>
    </main>
  );
}

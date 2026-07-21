import { ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="not-found"><span>404</span><h1>Trang này không tồn tại</h1><p>Đường dẫn có thể đã thay đổi hoặc không còn khả dụng.</p><Link className="button button-primary" to="/"><ArrowLeft size={18} /> Về trang chủ</Link></main>;
}

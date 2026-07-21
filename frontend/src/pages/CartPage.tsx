import { ArrowRight, Minus, Plus, Trash } from '@phosphor-icons/react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl, money, request } from '../lib/api';
import type { Order } from '../types';

export function CartPage() {
  const cart = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      const order = await request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          storeId: cart.storeId,
          receiverName: String(form.get('receiverName')),
          receiverPhone: String(form.get('receiverPhone')),
          deliveryAddress: String(form.get('deliveryAddress')),
          items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        }),
      }, token);
      cart.clear();
      navigate('/orders', { state: { created: order.orderCode } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo đơn hàng.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return <div className="page-container page-space"><EmptyState title="Giỏ hàng đang trống" description="Chọn một món bạn thích để bắt đầu đơn hàng." action={<Link className="button button-primary" to="/">Khám phá thực đơn</Link>} /></div>;
  }

  return (
    <section className="cart-page page-container page-space">
      <div className="page-title"><div><span className="eyebrow">Giỏ hàng</span><h1>Kiểm tra đơn của bạn</h1></div><span>{cart.count} sản phẩm</span></div>
      <form className="checkout-grid" onSubmit={checkout}>
        <div className="cart-list">
          {cart.items.map((item) => (
            <article className="cart-item" key={item.product.id}>
              <img src={imageUrl(item.product.imageUrl) || '/images/peach-tea.jpg'} alt={item.product.name} />
              <div className="cart-item-main"><h2>{item.product.name}</h2><p>{money(item.product.price)}</p><div className="quantity-control"><button type="button" aria-label="Giảm số lượng" onClick={() => cart.setQuantity(item.product.id, item.quantity - 1)}><Minus size={16} /></button><span>{item.quantity}</span><button type="button" aria-label="Tăng số lượng" onClick={() => cart.setQuantity(item.product.id, item.quantity + 1)}><Plus size={16} /></button></div></div>
              <strong>{money(item.product.price * item.quantity)}</strong>
              <button className="remove-button" type="button" aria-label={`Xóa ${item.product.name}`} onClick={() => cart.setQuantity(item.product.id, 0)}><Trash size={19} /></button>
            </article>
          ))}
          <Link className="back-link" to="/">Tiếp tục chọn món</Link>
        </div>
        <aside className="checkout-panel">
          <h2>Thông tin giao hàng</h2>
          <label className="field"><span>Người nhận</span><input name="receiverName" defaultValue={user?.fullName || ''} required placeholder="Họ và tên" /></label>
          <label className="field"><span>Số điện thoại</span><input name="receiverPhone" inputMode="tel" required placeholder="09xx xxx xxx" /></label>
          <label className="field"><span>Địa chỉ giao hàng</span><textarea name="deliveryAddress" required rows={3} placeholder="Số nhà, đường, phường/xã, quận/huyện" /></label>
          <div className="payment-method"><span>Thanh toán</span><strong>Tiền mặt khi nhận hàng</strong></div>
          <div className="order-summary"><div><span>Tạm tính</span><span>{money(cart.subtotal)}</span></div><div><span>Phí giao hàng</span><span>{money(0)}</span></div><div className="summary-total"><strong>Tổng cộng</strong><strong>{money(cart.subtotal)}</strong></div></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-full" type="submit" disabled={submitting}>{submitting ? 'Đang tạo đơn...' : user ? 'Đặt hàng' : 'Đăng nhập để đặt hàng'} {!submitting && <ArrowRight size={18} />}</button>
        </aside>
      </form>
    </section>
  );
}

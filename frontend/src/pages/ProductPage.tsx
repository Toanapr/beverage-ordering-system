import { ArrowLeft, Minus, Plus, ShoppingBag, Star } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, PageLoader } from '../components/Feedback';
import { useCart } from '../context/CartContext';
import { imageUrl, money, request } from '../lib/api';
import type { Product } from '../types';

export function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const cart = useCart();

  useEffect(() => {
    request<Product>(`/products/public/${id}`).then(setProduct).catch((reason: Error) => setError(reason.message));
  }, [id]);

  if (error) return <div className="page-container page-space"><ErrorState message={error} /></div>;
  if (!product) return <div className="page-container page-space"><PageLoader /></div>;

  function add() {
    if (!product) return;
    let result: 'added' | 'different-store' = 'added';
    for (let index = 0; index < quantity; index += 1) result = cart.addItem(product);
    setNotice(result === 'added' ? `Đã thêm ${quantity} sản phẩm vào giỏ.` : 'Sản phẩm thuộc cửa hàng khác với giỏ hiện tại.');
  }

  return (
    <section className="product-detail page-container page-space">
      <Link className="back-link" to="/"><ArrowLeft size={18} /> Quay lại thực đơn</Link>
      <div className="product-detail-grid">
        <div className="detail-image"><img src={imageUrl(product.imageUrl) || '/images/brown-sugar-milk-tea.jpg'} alt={product.name} /></div>
        <div className="detail-copy">
          <span className="rating"><Star size={15} weight="fill" /> 4.8 / 5</span>
          <h1>{product.name}</h1>
          <p>{product.description || 'Được pha mới theo đơn với nguyên liệu chọn lọc và hương vị cân bằng.'}</p>
          <strong className="detail-price">{money(product.price)}</strong>
          <div className="detail-actions">
            <div className="quantity-control"><button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={17} /></button><span>{quantity}</span><button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity(quantity + 1)}><Plus size={17} /></button></div>
            <button className="button button-primary" type="button" onClick={add}><ShoppingBag size={19} /> Thêm vào giỏ</button>
          </div>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          <div className="product-facts"><div><span>Thanh toán</span><strong>Tiền mặt khi nhận</strong></div><div><span>Chuẩn bị</span><strong>Sau khi xác nhận</strong></div></div>
        </div>
      </div>
    </section>
  );
}

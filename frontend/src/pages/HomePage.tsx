import { ArrowRight, MagnifyingGlass, MapPin, Plus, Star } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { useCart } from '../context/CartContext';
import { imageUrl, money, normalizePage, request, withQuery } from '../lib/api';
import type { Paginated, Product, Store } from '../types';

export function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const cart = useCart();

  function load() {
    setLoading(true);
    setError('');
    Promise.all([
      request<Paginated<Store> | Store[]>('/stores?page=1&limit=12'),
      request<Paginated<Product> | Product[]>(withQuery('/products/public', { page: 1, limit: 24, storeId: selectedStore || undefined })),
    ])
      .then(([storeData, productData]) => {
        setStores(normalizePage(storeData).items);
        setProducts(normalizePage(productData).items);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [selectedStore]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? products.filter((product) => `${product.name} ${product.description || ''}`.toLowerCase().includes(normalized))
      : products;
  }, [products, query]);

  function add(product: Product) {
    const result = cart.addItem(product);
    setNotice(result === 'added' ? `Đã thêm ${product.name} vào giỏ.` : 'Mỗi đơn chỉ nhận món từ một cửa hàng. Hãy hoàn tất hoặc xóa giỏ hiện tại.');
    window.setTimeout(() => setNotice(''), 2800);
  }

  return (
    <>
      <section className="customer-hero">
        <div className="hero-copy">
          <span className="eyebrow">Đặt nhanh, uống đúng gu</span>
          <h1>Một ly ngon.<br />Một ngày dễ chịu.</h1>
          <p>Tìm đồ uống yêu thích từ các cửa hàng gần bạn và theo dõi đơn trong một nơi.</p>
          <a className="button button-primary" href="#menu">Xem thực đơn <ArrowRight size={18} /></a>
        </div>
        <div className="hero-visual" aria-label="Bộ sưu tập đồ uống nổi bật">
          <figure className="hero-image hero-image-main"><img src="/images/brown-sugar-milk-tea.jpg" alt="Trà sữa đường nâu" /></figure>
          <figure className="hero-image hero-image-small"><img src="/images/vietnamese-iced-coffee.jpg" alt="Cà phê sữa đá" /></figure>
          <div className="hero-note"><strong>8 món</strong><span>đang được yêu thích</span></div>
        </div>
      </section>

      <section className="store-strip page-container" aria-labelledby="stores-title">
        <div className="section-heading compact-heading"><h2 id="stores-title">Chọn cửa hàng</h2><p>Mỗi giỏ hàng được chuẩn bị trọn vẹn tại một cửa hàng.</p></div>
        <div className="store-scroller">
          <button className={`store-choice ${selectedStore === '' ? 'is-active' : ''}`} type="button" onClick={() => setSelectedStore('')}><span className="store-symbol">M</span><span><strong>Tất cả cửa hàng</strong><small>Xem toàn bộ menu</small></span></button>
          {stores.map((store) => (
            <button className={`store-choice ${selectedStore === store.id ? 'is-active' : ''}`} type="button" key={store.id} onClick={() => setSelectedStore(store.id)}>
              <span className="store-symbol">{store.name.charAt(0)}</span>
              <span><strong>{store.name}</strong><small><MapPin size={13} /> {store.address}</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="menu-section page-container" id="menu">
        <div className="menu-toolbar">
          <div className="section-heading"><h2>Hôm nay uống gì?</h2><p>Những lựa chọn dễ uống, được chuẩn bị ngay khi bạn đặt.</p></div>
          <label className="search-field"><MagnifyingGlass size={19} /><span className="sr-only">Tìm món</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm cà phê, trà sữa..." /></label>
        </div>
        {loading ? <PageLoader /> : error ? <ErrorState message={error} retry={load} /> : visibleProducts.length === 0 ? <EmptyState title="Không tìm thấy món phù hợp" description="Thử từ khóa khác hoặc chọn lại cửa hàng." /> : (
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <Link className="product-image" to={`/products/${product.id}`}><img src={imageUrl(product.imageUrl) || `/images/${fallbackImage(index)}`} alt={product.name} /></Link>
                <div className="product-info">
                  <div><span className="rating"><Star size={14} weight="fill" /> 4.8</span><h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3><p>{product.description || 'Hương vị cân bằng, pha mới sau khi đặt.'}</p></div>
                  <div className="product-bottom"><strong>{money(product.price)}</strong><button className="add-button" type="button" onClick={() => add(product)} aria-label={`Thêm ${product.name} vào giỏ`}><Plus size={19} weight="bold" /></button></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </>
  );
}

function fallbackImage(index: number) {
  const images = ['cold-brew.jpg', 'brown-sugar-milk-tea.jpg', 'espresso.jpg', 'peach-tea.jpg', 'seasonal-strawberry-milk-tea.jpg', 'vietnamese-iced-coffee.jpg', 'sparkling-water.jpg', 'cola.jpg'];
  return images[index % images.length];
}

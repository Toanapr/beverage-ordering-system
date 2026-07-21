import { ImageSquare, PencilSimple, Plus } from '@phosphor-icons/react';
import { FormEvent, useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageLoader } from '../components/Feedback';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { imageUrl, money, normalizePage, request } from '../lib/api';
import type { Category, Paginated, Product, ProductStatus } from '../types';

export function StaffMenuPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'product' | 'category' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  function load() {
    setLoading(true);
    setError('');
    Promise.all([
      request<Paginated<Product> | Product[]>('/products?page=1&limit=100', {}, token),
      request<Paginated<Category> | Category[]>('/categories?page=1&limit=100', {}, token),
    ]).then(([productData, categoryData]) => {
      setProducts(normalizePage(productData).items);
      setCategories(normalizePage(categoryData).items);
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await request('/categories', { method: 'POST', body: JSON.stringify({ name: String(data.get('name')) }) }, token);
      setModal(null);
      load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo danh mục.'); }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      let uploadedImage = editing?.imageUrl || undefined;
      const file = data.get('image');
      if (file instanceof File && file.size > 0) {
        const body = new FormData();
        body.set('image', file);
        const uploaded = await request<{ imageUrl: string }>('/uploads/images', { method: 'POST', body }, token);
        uploadedImage = uploaded.imageUrl;
      }
      const payload = {
        categoryId: String(data.get('categoryId')),
        name: String(data.get('name')),
        description: String(data.get('description')) || null,
        price: Number(data.get('price')),
        status: String(data.get('status')) as ProductStatus,
        ...(uploadedImage ? { imageUrl: uploadedImage } : {}),
      };
      await request(editing ? `/products/${editing.id}` : '/products', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) }, token);
      setModal(null);
      setEditing(null);
      load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu sản phẩm.'); }
  }

  function openProduct(product?: Product) {
    setEditing(product || null);
    setModal('product');
  }

  return (
    <>
      <div className="dashboard-heading"><div><span>Danh mục và sản phẩm</span><h1>Thực đơn cửa hàng</h1><p>Quản lý món, giá bán, hình ảnh và tình trạng phục vụ.</p></div><div className="heading-actions"><button className="button button-secondary" type="button" onClick={() => setModal('category')}><Plus size={18} /> Thêm danh mục</button><button className="button button-primary" type="button" onClick={() => openProduct()}><Plus size={18} /> Thêm sản phẩm</button></div></div>
      <div className="category-summary">{categories.map((category) => <span key={category.id}>{category.name}<strong>{products.filter((product) => product.categoryId === category.id).length}</strong></span>)}</div>
      {error && <ErrorState message={error} retry={load} />}
      {loading ? <PageLoader /> : products.length === 0 ? <EmptyState title="Thực đơn chưa có sản phẩm" description="Tạo danh mục trước, sau đó thêm món đầu tiên cho cửa hàng." action={<button className="button button-primary" type="button" onClick={() => openProduct()}>Thêm sản phẩm</button>} /> : (
        <div className="menu-management-grid">
          {products.map((product) => <article className="menu-product" key={product.id}><div className="menu-product-image">{product.imageUrl ? <img src={imageUrl(product.imageUrl) || ''} alt={product.name} /> : <ImageSquare size={28} />}</div><div className="menu-product-copy"><StatusBadge status={product.status} /><h2>{product.name}</h2><p>{product.description || 'Chưa có mô tả.'}</p><strong>{money(product.price)}</strong></div><button className="icon-button" type="button" aria-label={`Sửa ${product.name}`} onClick={() => openProduct(product)}><PencilSimple size={19} /></button></article>)}
        </div>
      )}
      {modal === 'category' && <Modal title="Thêm danh mục" onClose={() => setModal(null)}><form className="modal-form" onSubmit={submitCategory}><label className="field"><span>Tên danh mục</span><input name="name" required maxLength={100} placeholder="Ví dụ: Cà phê" /></label><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setModal(null)}>Đóng</button><button className="button button-primary" type="submit">Tạo danh mục</button></div></form></Modal>}
      {modal === 'product' && <Modal title={editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'} onClose={() => { setModal(null); setEditing(null); }}><form className="modal-form" onSubmit={submitProduct}><div className="form-grid"><label className="field field-wide"><span>Tên sản phẩm</span><input name="name" required maxLength={100} defaultValue={editing?.name} placeholder="Trà đào cam sả" /></label><label className="field"><span>Danh mục</span><select name="categoryId" required defaultValue={editing?.categoryId || ''}><option value="" disabled>Chọn danh mục</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Giá bán</span><input type="number" name="price" min={0} step={1000} required defaultValue={editing?.price} placeholder="35000" /></label><label className="field field-wide"><span>Mô tả</span><textarea name="description" rows={3} defaultValue={editing?.description || ''} placeholder="Mô tả ngắn về hương vị" /></label><label className="field"><span>Trạng thái</span><select name="status" defaultValue={editing?.status || 'active'}><option value="active">Đang bán</option><option value="out_of_stock">Hết hàng</option><option value="hidden">Đã ẩn</option></select></label><label className="field"><span>Ảnh sản phẩm</span><input type="file" name="image" accept="image/png,image/jpeg,image/webp" /></label></div><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setModal(null)}>Đóng</button><button className="button button-primary" type="submit">Lưu sản phẩm</button></div></form></Modal>}
    </>
  );
}

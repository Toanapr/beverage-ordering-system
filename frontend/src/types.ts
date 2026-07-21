export type Role = 'customer' | 'staff' | 'admin';
export type ProductStatus = 'active' | 'hidden' | 'out_of_stock';
export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: Role;
  storeId: string | null;
  fullName: string;
  avatarUrl: string | null;
  isBanned: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  phone: string;
  address: string;
  isOpen: boolean;
  isLocked: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: ProductStatus;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  storeId: string;
  receiverName?: string;
  receiverPhone?: string;
  deliveryAddress?: string;
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'COD';
  status: OrderStatus;
  cancelReason: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminStatistics {
  totalStores: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface TrendItem {
  date: string;
  revenue: number;
  ordersCount: number;
}

export interface TopStore {
  storeId: string;
  storeName: string;
  totalRevenue: number;
  totalOrders: number;
  ratingAvg: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  storeName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface OrderDistribution {
  pending: number;
  preparing: number;
  completed: number;
  cancelled: number;
}

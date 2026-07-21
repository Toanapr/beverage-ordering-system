import { createContext, useContext, useState } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  storeId: string | null;
  addItem: (product: Product) => 'added' | 'different-store';
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'moc_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  });

  function commit(next: CartItem[]) {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }

  function addItem(product: Product) {
    if (items.length && items[0].product.storeId !== product.storeId) {
      return 'different-store' as const;
    }
    const existing = items.find((item) => item.product.id === product.id);
    commit(
      existing
        ? items.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...items, { product, quantity: 1 }],
    );
    return 'added' as const;
  }

  function setQuantity(productId: string, quantity: number) {
    commit(
      quantity <= 0
        ? items.filter((item) => item.product.id !== productId)
        : items.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    );
  }

  const value = {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    storeId: items[0]?.product.storeId ?? null,
    addItem,
    setQuantity,
    clear: () => commit([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

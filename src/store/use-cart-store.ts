import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const qty = product.quantity || 1;
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + qty }
              : item
          ),
        };
      }
      return {
        items: [...state.items, { ...product, quantity: qty }],
      };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((item) => item.id !== id)
          : state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
    })),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  },
  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },
}));

export const cartStore = {
  getState: () => useCartStore.getState(),
  addItem: (product: Omit<CartItem, "quantity"> & { quantity?: number }) =>
    useCartStore.getState().addItem(product),
  removeItem: (id: string) => useCartStore.getState().removeItem(id),
  updateQuantity: (id: string, quantity: number) =>
    useCartStore.getState().updateQuantity(id, quantity),
  clearCart: () => useCartStore.getState().clearCart(),
  getTotal: () => useCartStore.getState().getTotal(),
  getItemCount: () => useCartStore.getState().getItemCount(),
  subscribe: (listener: (state: CartStore) => void) =>
    useCartStore.subscribe(listener),
};

export default useCartStore;


import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: number;
  title: string;
  image_url: string | null;
  size: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.size === item.size
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.size === item.size
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                title: item.title,
                image_url: item.image_url,
                size: item.size,
                price: item.price,
                quantity: item.quantity || 1,
              },
            ],
          };
        }),
      removeFromCart: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        })),
      updateQuantity: (productId, size, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (i) => !(i.productId === productId && i.size === size)
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId && i.size === size
                ? { ...i, quantity }
                : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
    }
  )
);

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
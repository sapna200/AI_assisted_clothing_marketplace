import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: number;
  title: string;
  image_url: string | null;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }
          return { items: [...state.items, item] };
        }),
      removeFromWishlist: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      isInWishlist: (productId) =>
        get().items.some((i) => i.productId === productId),
    }),
    {
      name: "wishlist-storage",
    }
  )
);
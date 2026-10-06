import { create } from "zustand";

export type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
};

type WishlistStore = {
  items: WishlistItem[];

  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;

  isInWishlist: (id: string) => boolean;

  setItems: (items: WishlistItem[]) => void;
  clearWishlist: () => void;

  getCount: () => number;
};

export const useWishlistStore = create<WishlistStore>(
  (set, get) => ({
    items: [],

    addToWishlist: (item) => {
      set((state) => {
        const exists = state.items.some(
          (wishlistItem) =>
            wishlistItem.id === item.id
        );

        if (exists) {
          return state;
        }

        return {
          items: [...state.items, item],
        };
      });
    },

    removeFromWishlist: (id) => {
      set((state) => ({
        items: state.items.filter(
          (item) => item.id !== id
        ),
      }));
    },

    toggleWishlist: (item) => {
      const exists = get().items.some(
        (wishlistItem) =>
          wishlistItem.id === item.id
      );

      if (exists) {
        set((state) => ({
          items: state.items.filter(
            (wishlistItem) =>
              wishlistItem.id !== item.id
          ),
        }));
      } else {
        set((state) => ({
          items: [...state.items, item],
        }));
      }
    },

    isInWishlist: (id) => {
      return get().items.some(
        (item) => item.id === id
      );
    },

    setItems: (items) => {
      set({
        items,
      });
    },

    clearWishlist: () => {
      set({
        items: [],
      });
    },

    getCount: () => {
      return get().items.length;
    },
  })
);
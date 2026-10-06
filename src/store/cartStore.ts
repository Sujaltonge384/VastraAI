import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];

  addToCart: (
    item: Omit<CartItem, "quantity">
  ) => void;

  removeFromCart: (
    id: string,
    size?: string,
    color?: string
  ) => void;

  increaseQuantity: (
    id: string,
    size?: string,
    color?: string
  ) => void;

  decreaseQuantity: (
    id: string,
    size?: string,
    color?: string
  ) => void;

  setItems: (items: CartItem[]) => void;

  clearCart: () => void;

  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>(
  (set, get) => ({
    items: [],

    addToCart: (item) => {
      set((state) => {
        const existingItem = state.items.find(
          (cartItem) =>
            cartItem.id === item.id &&
            cartItem.size === item.size &&
            cartItem.color === item.color
        );

        if (existingItem) {
          return {
            items: state.items.map((cartItem) =>
              cartItem.id === item.id &&
              cartItem.size === item.size &&
              cartItem.color === item.color
                ? {
                    ...cartItem,
                    quantity:
                      cartItem.quantity + 1,
                  }
                : cartItem
            ),
          };
        }

        return {
          items: [
            ...state.items,
            {
              ...item,
              quantity: 1,
            },
          ],
        };
      });
    },

    removeFromCart: (id, size, color) => {
      set((state) => ({
        items: state.items.filter(
          (item) =>
            !(
              item.id === id &&
              item.size === size &&
              item.color === color
            )
        ),
      }));
    },

    increaseQuantity: (id, size, color) => {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id &&
          item.size === size &&
          item.color === color
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        ),
      }));
    },

    decreaseQuantity: (id, size, color) => {
      set((state) => ({
        items: state.items
          .map((item) =>
            item.id === id &&
            item.size === size &&
            item.color === color
              ? {
                  ...item,
                  quantity: item.quantity - 1,
                }
              : item
          )
          .filter(
            (item) => item.quantity > 0
          ),
      }));
    },

    // Load cart items from PostgreSQL
    setItems: (items) => {
      set({
        items,
      });
    },

    clearCart: () => {
      set({
        items: [],
      });
    },

    getTotalItems: () => {
      return get().items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      );
    },

    getTotalPrice: () => {
      return get().items.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );
    },
  })
);
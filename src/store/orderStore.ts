import { create } from "zustand";

export type OrderItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status:
    | "Placed"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled";
  paymentStatus:
    | "Pending"
    | "Paid"
    | "Failed"
    | "Refunded";
  paymentMethod: string;
  createdAt: string;
};

type OrderStore = {
  orders: Order[];

  addOrder: (order: Order) => void;

  setOrders: (orders: Order[]) => void;

  getOrder: (
    id: string
  ) => Order | undefined;
};

export const useOrderStore =
  create<OrderStore>((set, get) => ({
    orders: [],

    addOrder: (order) => {
      set((state) => ({
        orders: [
          order,
          ...state.orders,
        ],
      }));
    },

    setOrders: (orders) => {
      set({
        orders,
      });
    },

    getOrder: (id) => {
      return get().orders.find(
        (order) => order.id === id
      );
    },
  }));
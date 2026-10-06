import { create } from "zustand";

type ToastStore = {
  message: string;
  visible: boolean;
  showToast: (message: string) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  message: "",
  visible: false,

  showToast: (message) => {
    set({
      message,
      visible: true,
    });

    setTimeout(() => {
      set({
        visible: false,
      });
    }, 2500);
  },

  hideToast: () => {
    set({
      visible: false,
    });
  },
}));
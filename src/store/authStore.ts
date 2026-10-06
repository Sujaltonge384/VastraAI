import { create } from "zustand";

type User = {
  name: string;
  email: string;
  password: string;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;

  register: (
    name: string,
    email: string,
    password: string
  ) => boolean;

  login: (
    email: string,
    password: string
  ) => boolean;

  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  register: (name, email, password) => {
    if (typeof window === "undefined") {
      return false;
    }

    const existingUser = localStorage.getItem(
      "vastra-user"
    );

    if (existingUser) {
      return false;
    }

    const user = {
      name,
      email,
      password,
    };

    localStorage.setItem(
      "vastra-user",
      JSON.stringify(user)
    );

    set({
      user,
      isAuthenticated: true,
    });

    return true;
  },

  login: (email, password) => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedUser = localStorage.getItem(
      "vastra-user"
    );

    if (!storedUser) {
      return false;
    }

    const user: User = JSON.parse(storedUser);

    if (
      user.email !== email ||
      user.password !== password
    ) {
      return false;
    }

    set({
      user,
      isAuthenticated: true,
    });

    return true;
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
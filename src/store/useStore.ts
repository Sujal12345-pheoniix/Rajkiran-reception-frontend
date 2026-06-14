// store/usePersistentStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const loggedUser = {
  email: "reception@rajkiran.com",
  password: "password123",
};

interface UserState {
  user: { email: string; password: string } | null;
  setUser: (user: { email: string; password: string } | null) => void;
  login: (user: { email: string; password: string } | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => {
        if (user) set({ user });
      },
      logout: () => set({ user: null }),
      login: (user) => {
        if (user) {
          if (
            user.email == loggedUser.email &&
            user.password == loggedUser.password
          ) {
            console.log(user);
            return set({ user });
          }
        }
      },
    }),
    {
      name: "user-storage", // unique name for storage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

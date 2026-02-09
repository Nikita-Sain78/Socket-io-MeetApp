import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: sessionStorage.getItem("chat-theme") || "dark",
  setTheme: (theme) => {
    sessionStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
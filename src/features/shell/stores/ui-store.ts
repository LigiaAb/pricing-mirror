import { create } from "zustand";

interface UIState {
  fullWidth: boolean;
  setFullWidth: (fullWidth: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  fullWidth: false,
  setFullWidth: (fullWidth) => set({ fullWidth }),
}));

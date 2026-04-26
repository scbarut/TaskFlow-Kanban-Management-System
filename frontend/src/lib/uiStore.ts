import { create } from "zustand";

interface UiState {
  isGlobalLoading: boolean;
  activeRequests: number;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  isGlobalLoading: false,
  activeRequests: 0,
  startLoading: () => {
    const next = get().activeRequests + 1;
    set({ activeRequests: next, isGlobalLoading: true });
  },
  stopLoading: () => {
    const next = Math.max(0, get().activeRequests - 1);
    set({ activeRequests: next, isGlobalLoading: next > 0 });
  },
}));

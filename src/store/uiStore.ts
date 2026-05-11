import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface UIState {
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error') => void;
  removeToast: (id: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

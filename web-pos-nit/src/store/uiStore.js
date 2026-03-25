import { create } from 'zustand';

export const useUIStore = create((set) => ({
    isFullScreen: false,
    toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
    setFullScreen: (value) => set({ isFullScreen: value }),
}));

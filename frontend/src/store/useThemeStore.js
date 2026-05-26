import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'luxury',
  
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'luxury' ? 'light' : 'luxury';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    return { theme: nextTheme };
  }),
  
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    set({ theme });
  }
}));

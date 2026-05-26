import { create } from 'zustand';

export const useBookingStore = create((set) => ({
  activeBookingId: null,
  bookingsList: [],
  filters: {
    status: 'all',
  },
  
  setActiveBookingId: (id) => set({ activeBookingId: id }),
  setBookingsList: (bookings) => set({ bookingsList: bookings }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: { status: 'all' } }),
}));

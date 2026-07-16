import { create } from 'zustand';

interface TimesheetsState {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  
  dateRange: { from?: string; to?: string };
  setDateRange: (range: { from?: string; to?: string }) => void;
}

export const useTimesheetsStore = create<TimesheetsState>((set) => ({
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),
  
  dateRange: {},
  setDateRange: (range) => set({ dateRange: range }),
}));

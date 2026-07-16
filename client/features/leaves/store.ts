import { create } from 'zustand';

interface LeavesState {
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected';
  setFilterStatus: (status: 'all' | 'pending' | 'approved' | 'rejected') => void;
  
  filterType: string;
  setFilterType: (type: string) => void;
  
  // Store a draft state if needed (for complex multi-step modals)
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
}

export const useLeavesStore = create<LeavesState>((set) => ({
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),
  
  filterType: 'all',
  setFilterType: (type) => set({ filterType: type }),
  
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
}));

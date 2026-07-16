import { create } from 'zustand';

interface LeadsState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
}

export const useLeadsStore = create<LeadsState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status }),
  
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
}));

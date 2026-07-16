import { create } from 'zustand';

interface DesignationsState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
}

export const useDesignationsStore = create<DesignationsState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
}));

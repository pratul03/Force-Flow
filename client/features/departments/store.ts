import { create } from 'zustand';

interface DepartmentsState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
  
  editingDepartmentId: string | null;
  setEditingDepartmentId: (id: string | null) => void;
}

export const useDepartmentsStore = create<DepartmentsState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  
  editingDepartmentId: null,
  setEditingDepartmentId: (id) => set({ editingDepartmentId: id }),
}));

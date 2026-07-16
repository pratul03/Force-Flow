import { create } from 'zustand';

interface EmployeesState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  departmentFilter: string;
  setDepartmentFilter: (dept: string) => void;
  
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const useEmployeesStore = create<EmployeesState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  departmentFilter: 'all',
  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),
  
  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status }),
}));

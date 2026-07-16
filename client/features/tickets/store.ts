import { create } from 'zustand';

interface TicketsState {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;
}

export const useTicketsStore = create<TicketsState>((set) => ({
  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status }),
  
  priorityFilter: 'all',
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  
  isCreateModalOpen: false,
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
}));

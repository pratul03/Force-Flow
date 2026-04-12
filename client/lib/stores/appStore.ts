'use client';

import { create } from 'zustand';
import { Employee, LeaveRequest, TimesheetEntry } from '../types';
import { getJsonCookie, setJsonCookie } from '../cookies';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  currentPage: string;
  theme: 'light' | 'dark';

  // Data State
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  timesheetEntries: TimesheetEntry[];

  // Loading and Error states
  isLoading: boolean;
  error: string | null;
}

interface AppStore extends AppState {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Navigation actions
  setCurrentPage: (page: string) => void;

  // Theme actions
  setTheme: (theme: 'light' | 'dark') => void;

  // Employee actions
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Leave request actions
  setLeaveRequests: (requests: LeaveRequest[]) => void;
  addLeaveRequest: (request: LeaveRequest) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;

  // Timesheet actions
  setTimesheetEntries: (entries: TimesheetEntry[]) => void;
  addTimesheetEntry: (entry: TimesheetEntry) => void;
  updateTimesheetEntry: (id: string, updates: Partial<TimesheetEntry>) => void;

  // Loading and error actions
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Persistence
  initializeFromCookies: () => void;
}

const APP_STATE_COOKIE = 'app_state';

export const useAppStore = create<AppStore>((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  theme: 'light',
  employees: [],
  leaveRequests: [],
  timesheetEntries: [],
  isLoading: false,
  error: null,

  toggleSidebar: () =>
    set((state) => {
      const newState = { sidebarOpen: !state.sidebarOpen };
      persistAppState();
      return newState;
    }),

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
    persistAppState();
  },

  toggleSidebarCollapsed: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    persistAppState();
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    persistAppState();
  },

  setCurrentPage: (page) =>
    set({
      currentPage: page,
    }),

  setTheme: (theme) => {
    set({ theme });
    persistAppState();
  },

  setEmployees: (employees) =>
    set({
      employees,
    }),

  addEmployee: (employee) =>
    set((state) => ({
      employees: [...state.employees, employee],
    })),

  updateEmployee: (id, updates) =>
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates } : emp
      ),
    })),

  deleteEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    })),

  setLeaveRequests: (requests) =>
    set({
      leaveRequests: requests,
    }),

  addLeaveRequest: (request) =>
    set((state) => ({
      leaveRequests: [...state.leaveRequests, request],
    })),

  updateLeaveRequest: (id, updates) =>
    set((state) => ({
      leaveRequests: state.leaveRequests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    })),

  setTimesheetEntries: (entries) =>
    set({
      timesheetEntries: entries,
    }),

  addTimesheetEntry: (entry) =>
    set((state) => ({
      timesheetEntries: [...state.timesheetEntries, entry],
    })),

  updateTimesheetEntry: (id, updates) =>
    set((state) => ({
      timesheetEntries: state.timesheetEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    })),

  setIsLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setError: (error) =>
    set({
      error,
    }),

  initializeFromCookies: () => {
    const savedState = getJsonCookie<Partial<AppState>>(APP_STATE_COOKIE);
    if (savedState) {
      set({
        sidebarOpen: savedState.sidebarOpen ?? true,
        sidebarCollapsed: savedState.sidebarCollapsed ?? false,
        theme: savedState.theme ?? 'light',
      });
    }
  },
}));

function persistAppState() {
  const state = useAppStore.getState();
  setJsonCookie(
    APP_STATE_COOKIE,
    {
      sidebarOpen: state.sidebarOpen,
      sidebarCollapsed: state.sidebarCollapsed,
      theme: state.theme,
    },
    { maxAge: 30 * 24 * 60 * 60 } // 30 days
  );
}

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/appStore';

export function useApp() {
  const {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    currentPage,
    setCurrentPage,
    theme,
    setTheme,
    employees,
    setEmployees,
    leaveRequests,
    setLeaveRequests,
    timesheetEntries,
    setTimesheetEntries,
    isLoading,
    setIsLoading,
    error,
    setError,
    initializeFromCookies,
  } = useAppStore();

  // Initialize app state from cookies on mount
  useEffect(() => {
    initializeFromCookies();
  }, [initializeFromCookies]);

  return {
    // Sidebar
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    // Navigation
    currentPage,
    setCurrentPage,
    // Theme
    theme,
    setTheme,
    // Data
    employees,
    setEmployees,
    leaveRequests,
    setLeaveRequests,
    timesheetEntries,
    setTimesheetEntries,
    // Loading & Error
    isLoading,
    setIsLoading,
    error,
    setError,
  };
}

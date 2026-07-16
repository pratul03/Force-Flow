import { QueryClient } from '@tanstack/react-query';

// Centralized Query Client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      gcTime: 1000 * 60 * 15, // Unused data is garbage collected after 15 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't aggressively refetch on window focus
    },
    mutations: {
      retry: 1, // Only retry mutations once by default
    },
  },
});

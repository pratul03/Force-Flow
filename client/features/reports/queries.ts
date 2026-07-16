import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";

export const reportsKeys = {
  all: ["reports"] as const,
  overview: () => [...reportsKeys.all, "overview"] as const,
};

export function useReportsOverview() {
  return useQuery({
    queryKey: reportsKeys.overview(),
    queryFn: async () => {
      const response = await reportsApi.overview();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch reports overview");
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

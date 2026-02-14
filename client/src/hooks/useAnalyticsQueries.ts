import { useQuery } from "@tanstack/react-query";
import analyticsService from "../services/analytics.service";

export const analyticsKeys = {
  all: ["analytics"],
  dashboard: () => [...analyticsKeys.all, "dashboard"],
  trends: (days: number) => [...analyticsKeys.all, "trends", days],
};

export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: async () => {
      const response = await analyticsService.getDashboardAnalytics();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useIncidentTrends = (days: number = 30) => {
  return useQuery({
    queryKey: analyticsKeys.trends(days),
    queryFn: async () => {
      const response = await analyticsService.getIncidentTrends(days);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

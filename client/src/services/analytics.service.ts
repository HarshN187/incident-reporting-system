import api from "./api";
import type { DashboardAnalytics, ApiResponse } from "../types";

class AnalyticsService {
  async getDashboardAnalytics(): Promise<ApiResponse<DashboardAnalytics>> {
    return api.get<ApiResponse<DashboardAnalytics>>("/analytics/dashboard");
  }

  async getIncidentTrends(days: number = 30): Promise<ApiResponse<any[]>> {
    return api.get<ApiResponse<any[]>>(`/analytics/trends?days=${days}`);
  }
}

export default new AnalyticsService();
  
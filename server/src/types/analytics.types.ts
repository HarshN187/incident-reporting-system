export interface IStatusStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  rejected: number;
}

export interface ICategoryData {
  category: string;
  count: number;
}

export interface IPriorityStats {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface IResolutionTimeData {
  date: string;
  avgResolutionTime: number;
  count: number;
}

export interface IDashboardAnalytics {
  totalIncidents: number;
  statusStats: IStatusStats;
  categoryData: ICategoryData[];
  averageResolutionTime: {
    minutes: number;
    hours: string;
  };
  resolutionTimeTrend: IResolutionTimeData[];
  priorityStats: IPriorityStats;
}

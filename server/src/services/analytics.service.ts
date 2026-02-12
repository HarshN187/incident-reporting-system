import { IncidentModel, UserModel } from "../models";
import {
  IDashboardAnalytics,
  IStatusStats,
  ICategoryData,
  IPriorityStats,
  IResolutionTimeData,
} from "../types/analytics.types";
import { IncidentStatus } from "../types/incident.types";

export class AnalyticsService {
  static async getDashboardAnalytics(): Promise<IDashboardAnalytics> {
    // Total incidents count
    const totalIncidents = await IncidentModel.countDocuments();

    // Status breakdown
    const statusBreakdown = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats: IStatusStats = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
    };

    statusBreakdown.forEach((item: any) => {
      statusStats[item._id as keyof IStatusStats] = item.count;
    });

    // Category breakdown
    const categoryBreakdown = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const categoryData: ICategoryData[] = categoryBreakdown.map(
      (item: any) => ({
        category: item._id,
        count: item.count,
      }),
    );

    // Average resolution time
    const avgResolutionTime = await IncidentModel.aggregate([
      {
        $match: {
          status: IncidentStatus.RESOLVED,
          resolutionTime: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$resolutionTime" },
        },
      },
    ]);

    const averageResolutionTimeMinutes =
      avgResolutionTime.length > 0
        ? Math.round(avgResolutionTime[0].avgTime)
        : 0;

    const averageResolutionTimeHours = (
      averageResolutionTimeMinutes / 60
    ).toFixed(2);

    // Resolution time trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolutionTimeTrend = await IncidentModel.aggregate([
      {
        $match: {
          resolvedAt: { $gte: thirtyDaysAgo },
          status: IncidentStatus.RESOLVED,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$resolvedAt" },
          },
          avgResolutionTime: { $avg: "$resolutionTime" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const trendData: IResolutionTimeData[] = resolutionTimeTrend.map(
      (item: any) => ({
        date: item._id,
        avgResolutionTime: parseFloat((item.avgResolutionTime / 60).toFixed(2)),
        count: item.count,
      }),
    );

    // Priority distribution
    const priorityBreakdown = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats: IPriorityStats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    priorityBreakdown.forEach((item: any) => {
      priorityStats[item._id as keyof IPriorityStats] = item.count;
    });

    return {
      totalIncidents,
      statusStats,
      categoryData,
      averageResolutionTime: {
        minutes: averageResolutionTimeMinutes,
        hours: averageResolutionTimeHours,
      },
      resolutionTimeTrend: trendData,
      priorityStats,
    };
  }

  static async getIncidentTrends(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await IncidentModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          openCount: {
            $sum: { $cond: [{ $eq: ["$status", IncidentStatus.OPEN] }, 1, 0] },
          },
          resolvedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", IncidentStatus.RESOLVED] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return trends;
  }

  static async getCategoryBreakdown(): Promise<ICategoryData[]> {
    const breakdown = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return breakdown.map((item: any) => ({
      category: item._id,
      count: item.count,
    }));
  }

  static async getStatusBreakdown(): Promise<IStatusStats> {
    const breakdown = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats: IStatusStats = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
    };

    breakdown.forEach((item: any) => {
      stats[item._id as keyof IStatusStats] = item.count;
    });

    return stats;
  }

  static async getResolutionTimeAnalytics(): Promise<any> {
    const result = await IncidentModel.aggregate([
      {
        $match: {
          status: IncidentStatus.RESOLVED,
          resolutionTime: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$resolutionTime" },
          minTime: { $min: "$resolutionTime" },
          maxTime: { $max: "$resolutionTime" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        averageMinutes: 0,
        averageHours: "0.00",
        minMinutes: 0,
        maxMinutes: 0,
        count: 0,
      };
    }

    const data = result[0];

    return {
      averageMinutes: Math.round(data.avgTime),
      averageHours: (data.avgTime / 60).toFixed(2),
      minMinutes: data.minTime,
      maxMinutes: data.maxTime,
      count: data.count,
    };
  }

  static async getUserActivityStats(): Promise<any> {
    const totalUsers = await UserModel.countDocuments();

    const activeUsers = await UserModel.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const usersByRole = await UserModel.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const topReporters = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$reportedBy",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          email: "$user.email",
          count: 1,
        },
      },
    ]);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      topReporters,
    };
  }

  static async getPriorityDistribution(): Promise<IPriorityStats> {
    const distribution = await IncidentModel.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats: IPriorityStats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    distribution.forEach((item: any) => {
      stats[item._id as keyof IPriorityStats] = item.count;
    });

    return stats;
  }
}

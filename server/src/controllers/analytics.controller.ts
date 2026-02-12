import { Response } from "express";
import { IAuthRequest, IApiResponse } from "../types/api.types";
import { asyncHandler } from "../middlewares";
import { AnalyticsService } from "../services";
// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin/Super Admin)
export const getDashboardAnalytics = asyncHandler(
  async (_req: IAuthRequest, res: Response) => {
    const analytics = await AnalyticsService.getDashboardAnalytics();

    const response: IApiResponse = {
      success: true,
      data: analytics,
    };

    res.status(200).json(response);
  },
);

// @desc    Get incident trends
// @route   GET /api/v1/analytics/trends
// @access  Private (Admin/Super Admin)
export const getIncidentTrends = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);

    const trends = await AnalyticsService.getIncidentTrends(daysNum);

    const response: IApiResponse = {
      success: true,
      data: trends,
    };

    res.status(200).json(response);
  },
);

// @desc    Get category breakdown
// @route   GET /api/v1/analytics/category-breakdown
// @access  Private (Admin/Super Admin)
export const getCategoryBreakdown = asyncHandler(
  async (_req: IAuthRequest, res: Response) => {
    const breakdown = await AnalyticsService.getCategoryBreakdown();

    const response: IApiResponse = {
      success: true,
      data: breakdown,
    };

    res.status(200).json(response);
  },
);

// @desc    Get status breakdown
// @route   GET /api/v1/analytics/status-breakdown
// @access  Private (Admin/Super Admin)
export const getStatusBreakdown = asyncHandler(
  async (_req: IAuthRequest, res: Response) => {
    const breakdown = await AnalyticsService.getStatusBreakdown();

    const response: IApiResponse = {
      success: true,
      data: breakdown,
    };

    res.status(200).json(response);
  },
);

// @desc    Get resolution time analytics
// @route   GET /api/v1/analytics/resolution-time
// @access  Private (Admin/Super Admin)
export const getResolutionTimeAnalytics = asyncHandler(
  async (_req: IAuthRequest, res: Response) => {
    const analytics = await AnalyticsService.getResolutionTimeAnalytics();

    const response: IApiResponse = {
      success: true,
      data: analytics,
    };

    res.status(200).json(response);
  },
);

// @desc    Get user activity stats
// @route   GET /api/v1/analytics/user-activity
// @access  Private (Admin/Super Admin)
export const getUserActivityStats = asyncHandler(
  async (_req: IAuthRequest, res: Response) => {
    const stats = await AnalyticsService.getUserActivityStats();

    const response: IApiResponse = {
      success: true,
      data: stats,
    };

    res.status(200).json(response);
  },
);

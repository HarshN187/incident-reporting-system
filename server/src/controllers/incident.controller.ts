import { Response } from "express";
import {
  IAuthRequest,
  IApiResponse,
  IPaginationResult,
} from "../types/api.types";
import {
  IIncidentCreate,
  IIncidentUpdate,
  IIncidentDocument,
  IncidentStatus,
  IBulkUpdate,
  IIncident,
} from "../types/incident.types";
import { UserRole } from "../types/user.types";
import { asyncHandler } from "../middlewares";
import { IncidentModel } from "../models";
import { AuditService } from "../services";
import { AuditAction, AuditTargetType } from "../types";

// @desc    Create new incident
// @route   POST /api/v1/incidents
// @access  Private
export const createIncident = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const {
      title,
      description,
      category,
      priority,
      evidenceFiles,
      tags,
    }: IIncidentCreate = req.body;

    const incident = await IncidentModel.create({
      title,
      description,
      category,
      priority: priority || "medium",
      reportedBy: req.user!.userId,
      incidentDate: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      evidenceFiles: evidenceFiles || [],
      tags: tags || [],
    });

    // Log incident creation
    await AuditService.logIncidentCreated(req, incident);

    // Emit socket event to admins
    const io = req.app.get("io");
    io.to("role:admin").to("role:superadmin").emit("incident:created", {
      incidentId: incident._id.toString(),
      title: incident.title,
      category: incident.category,
      priority: incident.priority,
      reportedBy: req.user!.username,
    });

    const response: IApiResponse<IIncidentDocument> = {
      success: true,
      message: "Incident created successfully",
      data: incident,
    };

    res.status(201).json(response);
  },
);

// @desc    Get incidents (filtered by role)
// @route   GET /api/v1/incidents
// @access  Private
export const getIncidents = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      status,
      category,
      priority,
      sortBy = "-createdAt",
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build query based on user role
    const query: any = {};

    // Users can only see their own incidents
    if (req.user!.role === UserRole.USER) {
      query.reportedBy = req.user!.userId;
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    console.log(query);
    // Execute query with pagination
    const totalCount = await IncidentModel.countDocuments(query);

    const incidents = await IncidentModel.find(query)
      .populate("reportedBy", "username email")
      .populate("assignedTo", "username email")
      .populate("resolvedBy", "username email")
      .sort(sortBy as string)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean<IIncident[]>();

    const response: IApiResponse<IPaginationResult<IIncident>> = {
      success: true,
      data: {
        data: incidents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
        },
      },
    };

    res.status(200).json(response);
  },
);

// @desc    Get single incident
// @route   GET /api/v1/incidents/:id
// @access  Private
export const getIncident = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const incident = await IncidentModel.findById(id)
      .populate("reportedBy", "username email firstName lastName")
      .populate("assignedTo", "username email firstName lastName")
      .populate("resolvedBy", "username email firstName lastName");

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      } as IApiResponse);
      return;
    }

    // Check permissions
    if (req.user!.role === UserRole.USER) {
      if (incident.reportedBy._id.toString() !== req.user!.userId) {
        res.status(403).json({
          success: false,
          message: "You can only view your own incidents",
        } as IApiResponse);
        return;
      }
    }

    const response: IApiResponse<IIncidentDocument> = {
      success: true,
      data: incident,
    };

    res.status(200).json(response);
  },
);

// @desc    Update incident
// @route   PATCH /api/v1/incidents/:id
// @access  Private (Admin/Super Admin)
export const updateIncident = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData: IIncidentUpdate = req.body;

    const incident = await IncidentModel.findById(id);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      } as IApiResponse);
      return;
    }

    // Store old data for audit
    const oldData = incident.toObject();

    // Update fields
    if (updateData.title) incident.title = updateData.title;
    if (updateData.description) incident.description = updateData.description;
    if (updateData.category) incident.category = updateData.category;
    if (updateData.priority) incident.priority = updateData.priority;
    if (updateData.severity) incident.severity = updateData.severity;
    if (updateData.status) incident.status = updateData.status;
    if (updateData.assignedTo) incident.assignedTo = updateData.assignedTo;
    if (updateData.resolutionNotes)
      incident.resolutionNotes = updateData.resolutionNotes;
    if (updateData.tags) incident.tags = updateData.tags;

    await incident.save();

    // Log update
    await AuditService.logIncidentUpdated(req, incident, oldData);

    // Notify incident owner
    const io = req.app.get("io");
    io.to(`user:${incident.reportedBy}`).emit("incident:updated", {
      incidentId: incident._id.toString(),
      title: incident.title,
      status: incident.status,
      message: "Your incident has been updated",
    });

    const response: IApiResponse<IIncidentDocument> = {
      success: true,
      message: "Incident updated successfully",
      data: incident,
    };

    res.status(200).json(response);
  },
);

// @desc    Update incident status
// @route   PATCH /api/v1/incidents/:id/status
// @access  Private (Admin/Super Admin)
export const updateIncidentStatus = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { status, resolutionNotes } = req.body;
    const { id } = req.params;

    const incident = await IncidentModel.findById(id);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      } as IApiResponse);
      return;
    }

    const oldStatus = incident.status;

    // Update status
    incident.status = status as IncidentStatus;

    // If resolving, add resolution data
    if (status === IncidentStatus.RESOLVED) {
      incident.resolvedAt = new Date();
      incident.resolvedBy = req.user!.userId;
      incident.resolutionNotes = resolutionNotes || "";

      // Calculate resolution time
      const resolutionTime = Math.floor(
        (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60000,
      );
      incident.resolutionTime = resolutionTime;
    }

    // Add to activity log
    incident.activityLog.push({
      action: "status_changed",
      performedBy: req.user!.userId,
      timestamp: new Date(),
      details: `Status changed from ${oldStatus} to ${status}`,
    });

    await incident.save();

    // Log status change
    await AuditService.logIncidentUpdated(req, incident, { status: oldStatus });

    // Notify incident owner
    const io = req.app.get("io");
    io.to(`user:${incident.reportedBy}`).emit("incident:status-changed", {
      incidentId: incident._id.toString(),
      title: incident.title,
      oldStatus,
      newStatus: status,
      message: `Your incident status has been updated to: ${status}`,
    });

    const response: IApiResponse<IIncidentDocument> = {
      success: true,
      message: "Incident status updated successfully",
      data: incident,
    };

    res.status(200).json(response);
  },
);

// @desc    Assign incident to admin
// @route   PATCH /api/v1/incidents/:id/assign
// @access  Private (Admin/Super Admin)
export const assignIncident = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const incident = await IncidentModel.findById(id);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      } as IApiResponse);
      return;
    }

    const oldAssignee = incident.assignedTo;
    incident.assignedTo = assignedTo;

    // Add to activity log
    incident.activityLog.push({
      action: "assigned",
      performedBy: req.user!.userId,
      timestamp: new Date(),
      details: `Assigned to ${assignedTo}`,
    });

    await incident.save();

    // Log assignment
    await AuditService.logIncidentUpdated(req, incident, {
      assignedTo: oldAssignee,
    });

    // Notify assignee
    const io = req.app.get("io");
    io.to(`user:${assignedTo}`).emit("incident:assigned", {
      incidentId: incident._id.toString(),
      message: `You have been assigned to incident: ${incident.title}`,
    });

    const response: IApiResponse<IIncidentDocument> = {
      success: true,
      message: "Incident assigned successfully",
      data: incident,
    };

    res.status(200).json(response);
  },
);

// @desc    Bulk update incidents
// @route   PATCH /api/v1/incidents/bulk-update
// @access  Private (Admin/Super Admin)
export const bulkUpdateIncidents = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { incidentIds, status, assignedTo, resolutionNotes }: IBulkUpdate =
      req.body;
    console.log("🚀 ~ incidentIds:", incidentIds);

    if (!incidentIds || incidentIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "No incident IDs provided",
      } as IApiResponse);
      return;
    }

    // Get incidents before update
    // const incidents = await IncidentModel.find({ _id: { $in: incidentIds } });
    // const beforeStates = incidents.map((inc) => ({
    //   id: inc._id.toString(),
    //   status: inc.status,
    // }));

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;

      // If resolving, add resolution data
      if (status === IncidentStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user!.userId;
        if (resolutionNotes) {
          updateData.resolutionNotes = resolutionNotes;
        }
      }
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    // Perform bulk update
    const result = await IncidentModel.updateMany(
      { _id: { $in: incidentIds } },
      { $set: updateData },
    );

    // Calculate resolution time for resolved incidents
    if (status === IncidentStatus.RESOLVED) {
      for (const id of incidentIds) {
        const incident = await IncidentModel.findById(id);
        if (incident && incident.resolvedAt) {
          const resolutionTime = Math.floor(
            (incident.resolvedAt.getTime() - incident.createdAt.getTime()) /
              60000,
          );
          await IncidentModel.findByIdAndUpdate(id, { resolutionTime });
        }
      }
    }

    // Log bulk action
    await AuditService.logBulkAction(
      req,
      "bulk_status_update",
      incidentIds.length,
      {
        status,
        assignedTo,
        incidentIds,
      },
    );

    // Notify users
    const updatedIncidents = await IncidentModel.find({
      _id: { $in: incidentIds },
    }).populate("reportedBy", "email username");

    const io = req.app.get("io");
    updatedIncidents.forEach((incident) => {
      io.to(`user:${incident.reportedBy._id}`).emit("incident:updated", {
        incidentId: incident._id.toString(),
        title: incident.title,
        status: incident.status,
        message: "Your incident has been updated",
      });
    });

    const response: IApiResponse<{ modifiedCount: number }> = {
      success: true,
      message: `Successfully updated ${result.modifiedCount} incidents`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    };

    res.status(200).json(response);
  },
);

// @desc    Delete incident
// @route   DELETE /api/v1/incidents/:id
// @access  Private (Super Admin only)
export const deleteIncident = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const incident = await IncidentModel.findById(id);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      } as IApiResponse);
      return;
    }

    await incident.deleteOne();

    // Log deletion
    await AuditService.log({
      action: AuditAction.INCIDENT_DELETED,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.INCIDENT,
      targetId: id,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      description: `Deleted incident: ${incident.title}`,
    });

    const response: IApiResponse = {
      success: true,
      message: "Incident deleted successfully",
    };

    res.status(200).json(response);
  },
);

// Add this method to the incident controller

// @desc    Get my incidents (current user)
// @route   GET /api/v1/incidents/my-incidents
// @access  Private
export const getMyIncidents = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      status,
      category,
      priority,
      sortBy = "-createdAt",
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const query: any = {
      reportedBy: req.user!.userId,
    };

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const totalCount = await IncidentModel.countDocuments(query);

    const incidents = await IncidentModel.find(query)
      .populate("assignedTo", "username email")
      .populate("resolvedBy", "username email")
      .sort(sortBy as string)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean<IIncident[]>();

    const response: IApiResponse<IPaginationResult<IIncident>> = {
      success: true,
      data: {
        data: incidents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
        },
      },
    };

    res.status(200).json(response);
  },
);

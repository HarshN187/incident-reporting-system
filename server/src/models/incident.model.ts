import mongoose, { Schema, Model } from "mongoose";
import {
  IIncidentDocument,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
} from "../types";

const evidenceFileSchema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const activityLogSchema = new Schema({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
});

const incidentSchema = new Schema<IIncidentDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: Object.values(IncidentCategory),
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(IncidentPriority),
      default: IncidentPriority.MEDIUM,
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    status: {
      type: String,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.OPEN,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    evidenceFiles: [evidenceFileSchema],
    resolutionNotes: {
      type: String,
      maxlength: [1000, "Resolution notes cannot exceed 1000 characters"],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    resolutionTime: {
      type: Number,
      default: null,
    },
    incidentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    activityLog: [activityLogSchema],
  },
  {
    timestamps: true,
  },
);

// Indexes
incidentSchema.index({ reportedBy: 1, createdAt: -1 });
incidentSchema.index({ status: 1, category: 1 });
incidentSchema.index({ assignedTo: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ priority: 1, status: 1 });

// Pre-save middleware to calculate resolution time
incidentSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === IncidentStatus.RESOLVED &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
    this.resolutionTime = Math.floor(
      (this.resolvedAt.getTime() - this.createdAt.getTime()) / 60000,
    );
  }
  next();
});

// Virtual for age of incident
incidentSchema.virtual("ageInDays").get(function (this: IIncidentDocument) {
  return Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
});

export const IncidentModel: Model<IIncidentDocument> =
  mongoose.model<IIncidentDocument>("incidents", incidentSchema);

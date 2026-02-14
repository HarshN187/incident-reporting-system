import mongoose, { Schema, Model } from "mongoose";
import { ISessionDocument } from "../types";

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
sessionSchema.index({ userId: 1, isValid: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel: Model<ISessionDocument> =
  mongoose.model<ISessionDocument>("session", sessionSchema);

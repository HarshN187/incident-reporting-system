import Joi from "joi";

export const createIncidentSchema = Joi.object({
  title: Joi.string().min(5).max(200).required().trim(),
  description: Joi.string().min(10).max(2000).required().trim(),
  category: Joi.string()
    .valid(
      "phishing",
      "malware",
      "ransomware",
      "unauthorized_access",
      "data_breach",
      "ddos",
      "social_engineering",
      "insider_threat",
      "other",
    )
    .required(),
  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .optional()
    .default("medium"),
  severity: Joi.number().integer().min(1).max(10).optional().default(5),
  evidenceFiles: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().required(),
        originalName: Joi.string().required(),
        mimeType: Joi.string().required(),
        size: Joi.number().required(),
        url: Joi.string().required(),
      }),
    )
    .max(5)
    .optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
});

export const updateIncidentSchema = Joi.object({
  title: Joi.string().min(5).max(200).trim().optional(),
  description: Joi.string().min(10).max(2000).trim().optional(),
  category: Joi.string()
    .valid(
      "phishing",
      "malware",
      "ransomware",
      "unauthorized_access",
      "data_breach",
      "ddos",
      "social_engineering",
      "insider_threat",
      "other",
    )
    .optional(),
  priority: Joi.string().valid("low", "medium", "high", "critical").optional(),
  severity: Joi.number().integer().min(1).max(10).optional(),
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed", "rejected")
    .optional(),
  resolutionNotes: Joi.string().max(1000).optional().allow(""),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed", "rejected")
    .required(),
  resolutionNotes: Joi.string().max(1000).optional().allow(""),
});

export const bulkUpdateSchema = Joi.object({
  incidentIds: Joi.array()
    // .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(100)
    .required(),
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "closed", "rejected")
    .optional(),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  resolutionNotes: Joi.string().max(1000).optional().allow(""),
}).or("status", "assignedTo");

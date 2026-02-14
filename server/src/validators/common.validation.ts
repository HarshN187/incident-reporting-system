import Joi from "joi";

// MongoDB ObjectId validation
export const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
});

// Date range validation
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
}).with("startDate", "endDate");

// File upload validation
export const fileUploadSchema = Joi.object({
  filename: Joi.string().required(),
  originalName: Joi.string().required(),
  mimeType: Joi.string()
    .valid(
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    .required(),
  size: Joi.number().max(10485760).required(), // 10MB max
  url: Joi.string().uri().required(),
});

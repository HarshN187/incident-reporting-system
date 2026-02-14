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

import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(2).max(50).optional().allow(""),
  lastName: Joi.string().min(2).max(50).optional().allow(""),
  role: Joi.string()
    .valid("user", "admin", "superadmin")
    .optional()
    .default("user"),
  department: Joi.string().max(100).optional().allow(""),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  department: Joi.string().max(100).optional().allow(""),
});

export const changeRoleSchema = Joi.object({
  role: Joi.string().valid("user", "admin", "superadmin").required(),
});

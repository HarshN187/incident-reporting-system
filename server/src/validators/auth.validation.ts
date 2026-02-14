import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(2).max(50).optional().allow(""),
  lastName: Joi.string().min(2).max(50).optional().allow(""),
  department: Joi.string().max(100).optional().allow(""),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

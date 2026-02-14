import { Response, NextFunction } from "express";
import Joi from "joi";
import { IAuthRequest } from "../types";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: "Query validation failed",
        errors,
      });
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: "Parameter validation failed",
        errors,
      });
      return;
    }

    req.params = value;
    next();
  };
};

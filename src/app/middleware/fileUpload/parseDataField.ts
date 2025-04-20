/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import AppError from "../../errors/AppError";

export const parseDataField =
  (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.body[fieldName]) {
        req.body = JSON.parse(req.body[fieldName]);

        next();
      } else {
        next();
      }
    } catch (error: any) {
      throw new AppError(500, "Invalid JSON string");
    }
  };

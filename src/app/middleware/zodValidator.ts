/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AnyZodObject } from "zod";
import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

const zodValidator = (schema: AnyZodObject) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({ body: req.body });
    next();
  });
export default zodValidator;

/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequestHandler } from "express";

export const noRouteFound: RequestHandler = (req, res, next) => {
  res.status(404).send({
    success: false,
    statusCode: 404,
    message: "Api not found!",
  });
};

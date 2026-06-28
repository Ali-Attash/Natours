import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/factories/appError";

export function errRouteHandle(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  throw new AppError(`Could not find the: ${req.originalUrl} route`, 404);
}

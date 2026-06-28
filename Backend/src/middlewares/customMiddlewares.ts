import { NextFunction, Request, Response } from "express";

export function myLogger(req: Request, res: Response, next: NextFunction) {
  console.log(req.params.id);
  next();
}

export function aliasTopFiveCheap(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.query.limit = "5";
  req.query.sort = "price,-ratingsAverage";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
}

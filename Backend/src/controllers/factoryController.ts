import { Model } from "mongoose";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/factories/appError";

export function deleteOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc)
      return next(new AppError("there is no document with that ID", 404));

    res.status(204).send();
  };
}

export function createOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const doc = await model.create(req.body);
    if (!doc)
      return next(new AppError("there is no document with that ID", 404));

    res.status(201).json({
      status: "success",
      data: doc,
    });
  };
}

export function updateOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const update = { review: req.body.review, ratings: req.body.ratings };
    const doc = await model.findByIdAndUpdate(req.params.id, update);
    if (!doc)
      return next(new AppError("there is no document with that ID", 404));

    res.status(200).json({
      status: "success",
      message: "the doc was updated",
      doc,
    });
  };
}

export function get<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    let filter = {};
    if (req.params.id) filter = { review: req.params.id };
    const doc = await model.find(filter);
    if (!doc)
      return next(new AppError("there is no document with that ID", 404));

    res.status(200).json({
      status: "success",
      data: doc,
    });
  };
}

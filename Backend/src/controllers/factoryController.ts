import { Model } from "mongoose";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/factories/appError";
import Review from "../models/reviewModel";

export function deleteOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError("No document found with that ID", 404));

    res.status(204).send();
  };
}

export function createOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const doc = await model.create(req.body);
    if (!doc) return next(new AppError("Could not create the document", 404));

    res.status(201).json({
      status: "success",
      data: doc,
    });
  };
}

export function updateOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!document)
      return next(new AppError("there is no document with that ID", 404));

    res.status(200).json({
      status: "success",
      message: "the doc was updated",
      document,
    });
  };
}

export function getOne<T extends Model<any>>(model: T) {
  return async function (req: Request, res: Response, next: NextFunction) {
    let filter = {};
    if (req.params.id) filter = { _id: req.params.id };
    const doc = await model.find(filter);
    if (!doc)
      return next(new AppError("there is no document with that ID", 404));

    res.status(200).json({
      status: "success",
      data: doc,
    });
  };
}

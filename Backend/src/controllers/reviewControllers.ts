import Review from "../models/reviewModel";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/factories/appError";

export async function getAllReviews(req: Request, res: Response) {
  const allReviews = await Review.find();

  res.status(200).json({
    status: "success",
    data: allReviews,
  });
}

export async function postNewReview(req: Request, res: Response) {
  const review = req.body;
  if (!review) throw new AppError("A review can not be submitted empty", 401);

  const postedReview = await Review.create(review);
  res.status(200).json({
    status: "success",
    data: postedReview,
  });
}

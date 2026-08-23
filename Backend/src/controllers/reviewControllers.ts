import Review from "../models/reviewModel";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/factories/appError";
import { tourParams } from "../types/toursAPiTypes";

export async function getAllReviews(req: Request, res: Response) {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const allReviews = await Review.find(filter);

  res.status(200).json({
    status: "success",
    data: allReviews,
  });
}

export async function postNewReview(req: Request<tourParams>, res: Response) {
  if (!req.user)
    throw new AppError("The user must be logged in to post a review", 401);
  if (!req.body.review || !req.body.ratings)
    throw new AppError("A review can not be submitted empty", 401);

  const review = {
    review: req.body.review,
    ratings: req.body.ratings,
    user: req.user._id,
    tour: req.params.tourId,
  };

  const postedReview = await Review.create(review);
  res.status(200).json({
    status: "success",
    data: postedReview,
  });
}

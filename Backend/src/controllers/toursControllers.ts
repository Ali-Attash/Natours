import { Request, Response } from "express";
import Tours from "../models/tourModel";
import APIFeatures from "../utils/factories/APIFeatures";
import { AppError } from "../utils/factories/appError";

export async function getAllTours(req: Request, res: Response): Promise<void> {
  const features = new APIFeatures(Tours.find(), req.query)
    .filter()
    .sort()
    .field()
    .paginate();

  const allTours = await features.mongooseQuery;

  res.status(200).json({
    status: "success",
    results: allTours.length,
    data: {
      tours: allTours,
    },
  });
}

export async function getTourByID(req: Request, res: Response): Promise<void> {
  const theTour = await Tours.findById(req.params.id);

  if (!theTour) {
    throw new AppError("Could not find the tour with this ID", 404);
  }

  res.status(200).json({
    status: "success",
    tour: theTour,
  });
}

export async function postTour(req: Request, res: Response): Promise<void> {
  const postedTour = await Tours.create(req.body);

  res.status(201).json({
    status: "success",
    message: "The new tour has been added",
    newTour: postedTour,
  });
}

export async function updateUserByID(
  req: Request,
  res: Response,
): Promise<void> {
  const updatedTour = await Tours.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!updatedTour) {
    throw new AppError("Could not find the tour with this ID", 404);
  }

  res.status(200).json({
    status: "success",
    message: "The tour has been updated",
    updatedTour,
  });
}

export async function deleteTourByID(
  req: Request,
  res: Response,
): Promise<void> {
  const deletedTour = await Tours.findByIdAndDelete(req.params.id);

  if (!deletedTour) {
    throw new AppError("Could not find the tour with this ID", 404);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
}

export async function getToursStats(
  req: Request,
  res: Response,
): Promise<void> {
  const stats = await Tours.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: stats,
  });
}

export async function toursMontlyPlan(
  req: Request,
  res: Response,
): Promise<void> {
  const year = Number(req.params.year);

  const plan = await Tours.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: "$startDates",
        },
        numTourStars: {
          $sum: 1,
        },
        tours: {
          $push: "$name",
        },
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStars: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: plan,
  });
}

export async function getTourRevenue(
  req: Request,
  res: Response,
): Promise<void> {
  const tourRevenue = await Tours.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5,
        },
      },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        totalRevenue: { $sum: "$price" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: tourRevenue,
  });
}

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/factories/appError";
import mongoose from "mongoose";

function handleCastErrorDB(err: mongoose.Error.CastError) {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
}

function handleDuplicatedFieldDB(err: any) {
  let value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value.`;

  return new AppError(message, 400);
}

function handleValidationErrorDB(err: any) {
  const errors = Object.values(err.errors).map(
    (el) => (el as { message: string }).message,
  );

  const message = `Invalid Input Data. ${errors.join(". ")}`;

  return new AppError(message, 400);
}

function sendErrDev(err: AppError, res: Response) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

function sendErrProd(err: AppError, res: Response) {
  const statusCode = err.statusCode || 500;

  if (err.isOperational) {
    res.status(statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("💥 UNKNOWN ERROR:", err);

    res.status(500).json({
      status: "error",
      message: "Something Went Wrong!!!",
    });
  }
}

export function globalErrorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = err;

    if (error.name === "CastError") error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicatedFieldDB(error);

    if (err.name === "ValidationError") error = handleValidationErrorDB(error);

    sendErrProd(error, res);
  }
}

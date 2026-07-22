import { Request, Response } from "express";
import Users from "../models/userModel";
import APIFeatures from "../utils/factories/APIFeatures";
import { AppError } from "../utils/factories/appError";

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  const allUsers = await Users.find();

  res.status(200).json({
    status: "success",
    results: allUsers.length,
    data: {
      users: allUsers,
    },
  });
}

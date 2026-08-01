import { NextFunction, Request, Response } from "express";
import Users from "../models/userModel";
import APIFeatures from "../utils/factories/APIFeatures";
import { AppError } from "../utils/factories/appError";

const updateFilterer = (
  obj: Record<string, any>,
  ...allowedFields: string[]
) => {
  const newObj: Record<string, any> = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

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

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.body.password || req.body.passwordConfirm) {
    throw new AppError(
      "This route is not defined for changing password, please use updatePassword route",
      400,
    );
  }

  const filteredUpdates = updateFilterer(req.body, "name", "email");

  const updatedUser = await Users.findByIdAndUpdate(
    req.user?.id,
    filteredUpdates,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  res.status(200).json({
    status: "success",
    user: updatedUser,
  });
}

export async function deleteMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user)
    throw new AppError("You are not allowed to proceed with this action", 401);

  await Users.findByIdAndUpdate(user.id, { active: false });

  res.status(204).json({
    status: "sucess",
    data: null,
  });
}

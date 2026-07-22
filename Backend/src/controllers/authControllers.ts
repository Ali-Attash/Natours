import Users from "../models/userModel";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/factories/appError";
import mongoose, { Document, Types } from "mongoose";
import { UserType, UserMethods } from "../types/toursAPiTypes";
import * as email from "../utils/factories/email";

// Create a combined type helper for the controller handlers
type UserDocument = Document<unknown, {}, UserType> &
  UserType &
  UserMethods & {
    _id: Types.ObjectId;
  };

async function tokenSign(id: mongoose.Types.ObjectId) {
  const JWT_SECRET = process.env.JWT_SECRET!;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

  return jwt.sign({ id: id._id.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

export async function signUp(req: Request, res: Response, next: NextFunction) {
  // Cast the created document to our fully-typed UserDocument
  const newUser = (await Users.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  })) as UserDocument;

  const token = await tokenSign(newUser._id);

  // Cast plain object explicitly to make 'password' property safely deletable
  const userResponse = newUser.toObject() as Partial<UserType> & {
    password?: string;
  };
  delete userResponse.password;

  res.status(201).json({
    status: "success",
    token,
    message: "The new user has been added",
    newUser: userResponse,
  });
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  // check whether email and password exist
  if (!email || !password)
    throw new AppError("Please enter email and password", 400);

  // cast the database result to UserDocument to unlock instance methods
  const user = (await Users.findOne({ email }).select(
    "+password",
  )) as UserDocument | null;

  // check whether the user with that email and password exists or no
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = await tokenSign(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  // Creating the token variable for adding the value of the token comes from client
  let token: string | undefined;

  // Creating the authHeader variable and adding the value inside the request header
  const authHeader = req.headers.authorization as string;

  // Checking whether the authHeader variable has a vlue & it starts with "Bearer"
  // If possitive the value inside the variable authHeader should get split by space and the second value of it
  // and get assigned inside the variable token
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  // Checking whether the value has been assigned in to token variable.
  // If negative the AppError is used to throw new error to be catched by global error handling middleware
  if (!token)
    throw new AppError(
      "You are not logged in! Please log in to get access",
      401,
    );

  // Extracting the jwt secret & adding in to JWT_SECRET variable
  const JWT_SECRET = process.env.JWT_SECRET!;

  // Creating a variable called decoded & value is assigned by the jwt.verify() which returns the payload
  const decoded = (await jwt.verify(token, JWT_SECRET)) as jwt.JwtPayload;

  // Checking whether the variable decoded has value or no
  // If there is a value (payload) so we go forward
  // If not the AppError class is used to throw new error
  if (!decoded) throw new AppError("Invalid token", 401);

  // The step to verify whether the user exist in database or no
  // Extracting the user's Id inside the decoded variable which has the jwt payload inside it.
  // Assign the id field which contains the user's id
  const userId = decoded.id;

  // Querying the database for finding the user based on id which got extracted!
  // And adding the value of the query inside the cuurentUser variable
  const currentUser = await Users.findById(userId);

  // Checking if the curentUser variable has value in it
  // If not the AppError class is being used to throw the error
  if (!currentUser)
    throw new AppError(
      "The user belonging to this token does no longer exist",
      401,
    );

  // Checking if the password has been changed after the token is issued
  if (decoded.iat && currentUser.passwordChangedAfter(decoded.iat)) {
    throw new AppError(
      "The password was changed after the token is issuded, please login again",
      401,
    );
  }

  req.user = currentUser;
  // If everything condition was met by the user, the user is granted to access the route
  next();
}

export function restrictTo(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("The user does not exist", 401);
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }
    next();
  };
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = await Users.findOne({ email: req.body.email });

  if (!user) throw new AppError("The user with this email does not exist", 404);

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  res.status(200).json({
    status: "success",
  });
}

export function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {}

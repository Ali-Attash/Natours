import Users from "../models/userModel";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/factories/appError";
import mongoose, { Document, Types } from "mongoose";
import { UserType, UserMethods } from "../types/toursAPiTypes";

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
  let token: string | undefined;
  const authHeader = req.headers.authorization as string;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token)
    throw new AppError(
      "You are not logged in! Please log in to get access",
      401,
    );

  const JWT_SECRET = process.env.JWT_SECRET!;

  const decoded = (await jwt.verify(token, JWT_SECRET)) as jwt.JwtPayload;

  if (!decoded) throw new AppError("Invalid token", 401);

  const userId = decoded.id;

  const verification = await Users.findById(userId);

  if (!verification)
    throw new AppError(
      "The user belonging to this token does no longer exist",
      401,
    );

  if (decoded.iat && verification.passwordChangedAfter(decoded.iat)) {
    throw new AppError(
      "The password was changed after the token is issuded, please login again",
      401,
    );
  }

  next();
}

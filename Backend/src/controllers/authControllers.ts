import Users from "../models/userModel";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/factories/appError";
import mongoose, { Document, Types } from "mongoose";
import { UserType, UserMethods } from "../types/Types";
import * as email from "../utils/factories/email";
import crypto from "crypto";
import { UserDocument } from "../types/Types";

// Create a combined type helper for the controller handlers

function tokenSign(id: mongoose.Types.ObjectId) {
  const JWT_SECRET = process.env.JWT_SECRET!;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

  return jwt.sign({ id: id._id.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

function createSendToken(
  user: UserDocument,
  statusCode: number,
  res: Response,
) {
  const token = tokenSign(user._id);
  const JWT_COOKIES_EXPIRES_IN = Number(process.env.JWT_COOKIES_EXPIRES_IN);
  let cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIES_EXPIRES_IN * 60 * 1000),
    secure: false,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
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

  // Cast plain object explicitly to make 'password' property safely deletable
  const userResponse = newUser.toObject() as Partial<UserType> & {
    password?: string;
  };
  delete userResponse.password;

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
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
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

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
  // If every condition was met by the user, the user is granted to access the route
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

  try {
    await email.sendEmail({
      to: req.body.email,
      subject: "Your password reset token valid for (10 min)",
      text: message,
    });
  } catch (err) {
    // Database Cleanup: Clear tokens if email delivery failed
    user.set("passwordResetToken", undefined);
    user.set("passwordResetExpires", undefined);
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      "There was an error sending the email. Try again later.",
      500,
    );
  }
  res.status(200).json({
    status: "success",
    message: "the reset token has been sent to your email",
  });
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 1) Get user based on the token
  const resetToken = String(req.params.token);

  const hashedPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await Users.findOne({
    passwordResetToken: hashedPasswordToken,
    passwordResetExpired: { $gt: Date.now() },
  });
  if (!user) throw new AppError("the token is invlid or has been expired", 400);

  // 2) If token has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined!;
  user.passwordResetExpired = undefined!;

  // 3) Update changedPasswordAt property for the user

  user.save();
  // 4) Log the user in send the JWT
  createSendToken(user, 200, res);
}

export async function updatePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 0) Check whether the the field currentPassword, newPassword, and confirmNewPassword exist
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError("Please fill all the fields", 401);
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError("New passwords do not match", 400);
  }
  // 1) Verify the Identity
  const userId = req.user?.id;
  const user = await Users.findById(userId).select("+password");
  if (!user) throw new AppError("The user no longer exist", 401);
  // 2) Compare password

  const isMatched = await user.correctPassword(currentPassword, user.password);
  if (!isMatched)
    throw new AppError(
      "Incorrect current password, please provide a correct password",
      400,
    );
  // 3) Updating the client's password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
}

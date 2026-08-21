import mongoose, { Document, Types } from "mongoose";

type RouteParams = {
  id: string;
};

type Tour = {
  id: number;
  [key: string]: any;
};

// The raw mongoose document for document users
export type UserDocument = Document<unknown, {}, UserType> &
  UserType &
  UserMethods & {
    _id: Types.ObjectId;
  };

// 1. The document fields stored in MongoDB
type UserType = {
  name: string;
  email: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  password?: string | undefined;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  photo?: string;
  passwordResetToken?: string;
  passwordResetExpired?: Date;
  active?: boolean;
};

// 2. The custom methods available on the document instances
interface UserMethods {
  correctPassword(
    candidatePassword: string,
    userPassword?: string,
  ): Promise<boolean>;
  passwordChangedAfter(JWTTimeStamp: number): boolean;

  createPasswordResetToken(): void;
}

// Review Document stored in MongoDB
type ReviewType = {
  review: string;
  ratings: number;
  createdAt: Date;
  user: mongoose.Types.ObjectId;
  tour: mongoose.Types.ObjectId;
};

export type { RouteParams, Tour, UserType, UserMethods, ReviewType };

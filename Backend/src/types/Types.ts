import mongoose, { Document, Types } from "mongoose";

type RouteParams = {
  id: string;
};

type tourParams = {
  tourId: string;
};

// 1. Interfaces for Embedded GeoJSON Objects
export interface IGeoLocation {
  type: "Point";
  coordinates: number[]; // [longitude, latitude]
  address?: string;
  description?: string;
}

export interface IRouteLocation extends IGeoLocation {
  day?: number;
}

export interface ITourDocument extends ITour, Document {
  // defining virtual properties later using .virtual(), later if needed
  // durationWeeks: number;
}

// 2. Base Document Interface representing the core properties
export interface ITour {
  name: string;
  slug?: string;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";
  ratingsAverage?: number;
  ratingsQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images?: string[];
  createdAt?: Date;
  startDates?: Date[];
  VIPTour?: boolean;
  startLocation?: IGeoLocation;
  locations?: IRouteLocation[];
  guides?: mongoose.Types.ObjectId[]; // Array of references to the User model
}

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

export type { RouteParams, UserType, UserMethods, ReviewType, tourParams };

import { HydratedDocument } from "mongoose";
import { UserType, UserMethods } from "./toursApiTypes";

type UserDocument = HydratedDocument<UserType, UserMethods>;

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};

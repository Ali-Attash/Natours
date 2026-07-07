import mongoose from "mongoose";
export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  passwordChangedAt: Date;

  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
}

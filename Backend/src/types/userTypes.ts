import mongoose from "mongoose";
export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;

  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
}

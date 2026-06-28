import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { UserType } from "../types/toursAPiTypes";

const userSchema = new mongoose.Schema<UserType>({
  name: {
    type: String,
    require: [true, "Please provide your name"],
  },
  email: {
    type: String,
    require: [true, "Please provide your email"],
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    require: [true, "A user must have a password"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: true,
    validate: {
      validator: function (value: string): boolean {
        return value == this.password;
      },
      message: "Passwords do not match",
    },
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const hashedPassword = await bcrypt.hash(this.password as string, 12);
  this.password = hashedPassword;
  this.set("passwordConfirm", undefined);
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Users = mongoose.model<UserType>("Users", userSchema);

export default Users;

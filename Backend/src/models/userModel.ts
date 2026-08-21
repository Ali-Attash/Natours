import crypto from "crypto";
import mongoose, { Model } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { UserType, UserMethods } from "../types/toursAPiTypes";

// Pass UserType and UserMethods into the Schema generics
const userSchema = new mongoose.Schema<
  UserType,
  Model<UserType, {}, UserMethods>,
  UserMethods
>({
  name: {
    type: String,
    required: [true, "Please provide your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "guid", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "A user must have a password"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (this: any, value: string): boolean {
        return value === this.password;
      },
      message: "Passwords do not match",
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpired: String,
});

userSchema.pre("save", async function (this: any) {
  if (!this.isModified("password")) return;

  const hashedPassword = await bcrypt.hash(this.password as string, 12);
  this.password = hashedPassword;
  this.set("passwordConfirm", undefined);
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword?: string,
): Promise<boolean> {
  if (!userPassword) return false;
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (
  this: any,
  JWTTimeStamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
    );

    return JWTTimeStamp < changedTimestamp;
  }

  return false;
};

userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;

  this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpired = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

userSchema.pre(/^find/, function (this: any) {
  this.find({ active: { $ne: false } });
});

// Created the model using both the document interface and methods interface
const Users = mongoose.model<UserType, Model<UserType, {}, UserMethods>>(
  "User",
  userSchema,
);

export default Users;

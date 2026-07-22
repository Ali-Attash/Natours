type RouteParams = {
  id: string;
};

type Tour = {
  id: number;
  [key: string]: any;
};

// 1. The document fields stored in MongoDB
type UserType = {
  name: string;
  email: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  password?: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  photo?: string;
  passwordResetToken?: string;
  passwordResetExpired?: Date;
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

export type { RouteParams, Tour, UserType, UserMethods };

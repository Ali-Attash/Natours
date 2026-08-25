import mongoose, { Model } from "mongoose";
import { ReviewType } from "../types/Types";

//review , ratings, createdAt, ref-user, ref-tour
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be submitted empty"],
    },
    ratings: {
      type: Number,
      min: [1, "The review ratings can not be below 1"],
      max: [5, "The review ratings can not be above 5"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
  this.populate({
    path: "user",
    select: "name photo",
  });
});

const Review = mongoose.model<ReviewType, Model<ReviewType, {}>>(
  "Review",
  reviewSchema,
);

export default Review;

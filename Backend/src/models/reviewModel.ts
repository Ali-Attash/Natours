import mongoose, { Model } from "mongoose";
import { ReviewType } from "../types/Types";
import Tour from "./tourModel";

// review, ratings, createdAt, ref-user, ref-tour
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be submitted empty"],
    },
    rating: {
      type: Number,
      min: [1, "The review ratings can not be below 1"],
      max: [5, "The review ratings can not be above 5"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
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

// Populate the user when fetching reviews.
reviewSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
  this.populate({
    path: "user",
    select: "name photo",
  });
});

// Calculate and save the rating statistics for a tour.
reviewSchema.statics.calcAverageRatings = async function (
  tourId: mongoose.Types.ObjectId,
): Promise<void> {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        averageRating: { $avg: "$rating" },
        numberOfRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].averageRating,
      ratingsQuantity: stats[0].numberOfRatings,
    });
  } else {
    // No reviews remain for this tour.
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post("save", async function (doc) {
  await (doc.constructor as any).calcAverageRatings(doc.tour);
});

// Keep the existing review before an update or deletion.
reviewSchema.pre(
  /^findOneAnd/,
  async function (this: mongoose.Query<any, any>) {
    (this as any)._review = await this.model.findOne(this.getQuery());
  },
);

// Recalculate after findOneAndUpdate or findOneAndDelete.
reviewSchema.post(
  /^findOneAnd/,
  async function (this: mongoose.Query<any, any>) {
    const review = (this as any)._review;

    if (review) {
      await (this.model as any).calcAverageRatings(review.tour);
    }
  },
);

const Review = mongoose.model<ReviewType, Model<ReviewType, {}>>(
  "Review",
  reviewSchema,
);

export default Review;

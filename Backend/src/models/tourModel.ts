import mongoose from "mongoose";
import slugify from "slugify";
import validator from "validator";

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name for this document is needed"],
      unique: true,
      trim: true,
      maxLength: [40, "A Tour name must be less than 40 character"],
      minLength: [10, "A Tour name must be more than 10 character"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "hard"],
        message: "The difficulty of tours is either easy, medium or hard",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "A tour rating can not be below 1"],
      max: [5, `A tour's rating can be abov 5`],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price for this document is needed"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: any, value: number) {
          return value < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    VIPTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.pre("save", function () {
  this.slug = slugify(this.name, { lower: true });
});

tourSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
  this.find({ VIPTour: { $ne: true } });
});

tourSchema.pre("aggregate", function () {
  this.pipeline().unshift({ $match: { VIPTour: { $ne: true } } });
});

const Tours = mongoose.model("Tours", tourSchema);

export default Tours;

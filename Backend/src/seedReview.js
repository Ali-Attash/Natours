const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.join(__dirname, "configs", "development.env"),
});

const User = require("../dist/models/userModel").default;
const Tour = require("../dist/models/tourModel").default;
const Review = require("../dist/models/reviewModel").default;

const usersData = require("../dev-data/data/users.json");
const reviewsData = require("../dev-data/data/reviews.json");

const DB = process.env.DB_URI;

async function seedReviews() {
  try {
    // --------------------------------------------------
    // 1. Connect to MongoDB
    // --------------------------------------------------

    await mongoose.connect(DB);

    console.log("DB connection successful!");

    // --------------------------------------------------
    // 2. Get all users currently in MongoDB
    // --------------------------------------------------

    const users = await User.find().select("_id email");

    console.log(`Found ${users.length} users in database.`);

    // --------------------------------------------------
    // 3. Build a map:
    //
    // OLD USER ID -> CURRENT DATABASE USER ID
    //
    // We use email as the bridge between users.json
    // and the users that currently exist in MongoDB.
    // --------------------------------------------------

    const emailToCurrentUserId = new Map();

    for (const user of users) {
      emailToCurrentUserId.set(user.email, user._id);
    }

    const oldUserIdToCurrentUserId = new Map();

    for (const oldUser of usersData) {
      const currentUserId = emailToCurrentUserId.get(oldUser.email);

      if (!currentUserId) {
        throw new Error(
          `Could not find current database user with email: ${oldUser.email}`,
        );
      }

      oldUserIdToCurrentUserId.set(oldUser._id.toString(), currentUserId);
    }

    console.log("User ID mapping created successfully.");

    // --------------------------------------------------
    // 4. Verify that every tour referenced by reviews
    //    actually exists
    // --------------------------------------------------

    const tourIds = [
      ...new Set(reviewsData.map((review) => review.tour.toString())),
    ];

    const existingTours = await Tour.find({
      _id: { $in: tourIds },
    }).select("_id");

    const existingTourIds = new Set(
      existingTours.map((tour) => tour._id.toString()),
    );

    const missingTours = tourIds.filter(
      (tourId) => !existingTourIds.has(tourId),
    );

    if (missingTours.length > 0) {
      throw new Error(
        `These tour IDs do not exist in the database:\n${missingTours.join(
          "\n",
        )}`,
      );
    }

    console.log("All review tour references are valid.");

    // --------------------------------------------------
    // 5. Transform reviews
    //
    // rating -> ratings
    //
    // OLD user ID -> CURRENT user ID
    // --------------------------------------------------

    const reviews = reviewsData.map((review) => {
      const currentUserId = oldUserIdToCurrentUserId.get(
        review.user.toString(),
      );

      if (!currentUserId) {
        throw new Error(`Could not map review user ID: ${review.user}`);
      }

      return {
        _id: review._id,
        review: review.review,

        // Your schema calls this "ratings"
        ratings: review.rating,

        user: currentUserId,

        // Tour IDs are already correct
        tour: new mongoose.Types.ObjectId(review.tour),
      };
    });

    // --------------------------------------------------
    // 6. Insert reviews
    // --------------------------------------------------

    console.log(`Preparing to insert ${reviews.length} reviews...`);

    await Review.insertMany(reviews);

    console.log(`Successfully imported ${reviews.length} reviews!`);

    // --------------------------------------------------
    // 7. Close connection
    // --------------------------------------------------

    await mongoose.connection.close();

    console.log("Database connection closed.");
  } catch (err) {
    console.error("Review import failed:");
    console.error(err);

    await mongoose.connection.close();

    process.exit(1);
  }
}

seedReviews();

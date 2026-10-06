const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// --------------------------------------------------
// Load environment variables
// --------------------------------------------------

dotenv.config({
  path: path.join(__dirname, "src", "configs", "development.env"),
});

// --------------------------------------------------
// Models
// --------------------------------------------------

const User = require("./dist/models/userModel").default;
const Tour = require("./dist/models/tourModel").default;
const Review = require("./dist/models/reviewModel").default;

// --------------------------------------------------
// Data
// --------------------------------------------------

const usersData = require("./dev-data/data/users.json");
const toursData = require("./dev-data/data/tours.json");
const reviewsData = require("./dev-data/data/reviews.json");

const DB = process.env.DB_URI;

// --------------------------------------------------
// Seed database
// --------------------------------------------------

async function seedDatabase() {
  try {
    if (!DB) {
      throw new Error("DB_URI is not defined in development.env");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(DB);

    console.log("Database connection successful!\n");

    // ------------------------------------------------
    // 1. Import Users
    // ------------------------------------------------

    console.log(`Importing ${usersData.length} users...`);

    const users = usersData.map((user) => ({
      ...user,
      passwordConfirm: user.password,
    }));

    await User.insertMany(users);

    console.log("✓ Users imported successfully.");

    // ------------------------------------------------
    // 2. Import Tours
    // ------------------------------------------------

    console.log(`Importing ${toursData.length} tours...`);

    await Tour.insertMany(toursData);

    console.log("✓ Tours imported successfully.");

    // ------------------------------------------------
    // 3. Import Reviews
    //
    // Your current schema uses `rating`, not `ratings`.
    // The JSON already uses `rating`, so no transformation
    // is necessary.
    // ------------------------------------------------

    console.log(`Importing ${reviewsData.length} reviews...`);

    await Review.insertMany(reviewsData);

    console.log("✓ Reviews imported successfully.");

    // ------------------------------------------------
    // Finished
    // ------------------------------------------------

    console.log("\n======================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY");
    console.log("======================================");

    console.log(`Users:   ${usersData.length}`);
    console.log(`Tours:   ${toursData.length}`);
    console.log(`Reviews: ${reviewsData.length}`);

    await mongoose.connection.close();

    console.log("\nDatabase connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("\n======================================");
    console.error("DATABASE SEEDING FAILED");
    console.error("======================================");

    console.error(err);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error("Could not close database connection.");
    }

    process.exit(1);
  }
}

seedDatabase();

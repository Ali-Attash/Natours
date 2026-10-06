const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.join(__dirname, "configs", "development.env"),
});

const User = require("../dist/models/userModel").default;
const Tour = require("../dist/models/tourModel").default;

const usersData = require("../dev-data/data/users.json");
const toursData = require("../dev-data/data/tours.json");

const DB = process.env.DB_URI;

async function seedTourGuides() {
  try {
    // --------------------------------------------------
    // 1. Connect to MongoDB
    // --------------------------------------------------

    await mongoose.connect(DB);

    console.log("DB connection successful!");

    // --------------------------------------------------
    // 2. Get current users from MongoDB
    // --------------------------------------------------

    const users = await User.find().select("_id email");

    console.log(`Found ${users.length} users in database.`);

    // --------------------------------------------------
    // 3. Create:
    //
    // EMAIL -> CURRENT USER ID
    // --------------------------------------------------

    const emailToCurrentUserId = new Map();

    for (const user of users) {
      emailToCurrentUserId.set(user.email, user._id);
    }

    // --------------------------------------------------
    // 4. Create:
    //
    // OLD USER ID -> CURRENT USER ID
    //
    // using email as the bridge
    // --------------------------------------------------

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
    // 5. Validate all tour guide references
    //
    // BEFORE modifying anything
    // --------------------------------------------------

    for (const tour of toursData) {
      for (const oldGuideId of tour.guides || []) {
        const currentUserId = oldUserIdToCurrentUserId.get(
          oldGuideId.toString(),
        );

        if (!currentUserId) {
          throw new Error(
            `Could not map guide ID ${oldGuideId} for tour "${tour.name}"`,
          );
        }
      }
    }

    console.log("All tour guide references are valid.");

    // --------------------------------------------------
    // 6. Update tours
    // --------------------------------------------------

    let updatedTours = 0;

    for (const tourData of toursData) {
      const currentGuideIds = (tourData.guides || []).map((oldGuideId) =>
        oldUserIdToCurrentUserId.get(oldGuideId.toString()),
      );

      await Tour.updateOne(
        { _id: tourData._id },
        {
          $set: {
            guides: currentGuideIds,
          },
        },
      );

      updatedTours++;
    }

    console.log(`Successfully updated guides for ${updatedTours} tours!`);

    // --------------------------------------------------
    // 7. Close connection
    // --------------------------------------------------

    await mongoose.connection.close();

    console.log("Database connection closed.");
  } catch (err) {
    console.error("Tour guide update failed:");
    console.error(err);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

seedTourGuides();

import express from "express";
const router = express.Router();
import * as toursController from "../controllers/toursControllers";
import * as middlewares from "../middlewares/customMiddlewares";
import * as authController from "./../controllers/authControllers";
import reviewsRoute from "./reviewsRoutes";

router
  .route("/top-5-cheap")
  .get(middlewares.aliasTopFiveCheap, toursController.getAllTours);

router
  .route("/monthly-plan/:year")
  .get(
    authController.restrictTo("admin", "lead-guide"),
    toursController.toursMontlyPlan,
  );

router.route("/tours-stats").get(toursController.getToursStats);

router.route("/tours-revenue").get(toursController.getTourRevenue);

router
  .route("/")
  .get(authController.protect, toursController.getAllTours)
  .post(authController.restrictTo("admin"), toursController.postTour);

// Mounting the review router inside the tour router
router.use("/:tourId/review", reviewsRoute);

// These routes and operation are dedicated for admins only
// But some routes are shared between client side & admin side
// Like: Getting a specific tour => Client & Admin
router
  .route("/:id")
  .get(authController.protect, toursController.getTourByID)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    toursController.updateTourByID,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    toursController.deleteTourByID,
  );

export default router;

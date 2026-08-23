import express from "express";
const router = express.Router();
import * as toursController from "../controllers/toursControllers";
import * as middlewares from "../middlewares/customMiddlewares";
import * as authController from "./../controllers/authControllers";
import reviewsRoute from "./reviewsRoutes";

router
  .route("/top-5-cheap")
  .get(middlewares.aliasTopFiveCheap, toursController.getAllTours);

router.route("/monthly-plan/:year").get(toursController.toursMontlyPlan);

router.route("/tours-stats").get(toursController.getToursStats);

router.route("/tours-revenue").get(toursController.getTourRevenue);

router
  .route("/")
  .get(authController.protect, toursController.getAllTours)
  .post(toursController.postTour);

// Mounting the review router inside the tour router
router.use("/:tourId/review", reviewsRoute);

router
  .route("/:id")
  .get(toursController.getTourByID)
  .patch(toursController.updateUserByID)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    toursController.deleteTourByID,
  );

export default router;

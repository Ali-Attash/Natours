import express from "express";
const router = express.Router({ mergeParams: true });
import * as reviewController from "../controllers/reviewControllers";
import * as authController from "../controllers/authControllers";

router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    reviewController.getAllReviews,
  )
  .post(
    authController.protect,
    authController.restrictTo("user", "admin"),
    reviewController.postNewReview,
  );

router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview,
  )
  .patch(
    authController.protect,
    authController.restrictTo("user", "admin"),
    reviewController.updateReview,
  );

export default router;

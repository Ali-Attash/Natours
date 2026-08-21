import express from "express";
const router = express.Router();
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
    authController.restrictTo("user"),
    reviewController.postNewReview,
  );

export default router;

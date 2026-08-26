import express from "express";
const router = express.Router({ mergeParams: true });
import * as reviewController from "../controllers/reviewControllers";
import * as authController from "../controllers/authControllers";

router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo("user"), reviewController.postNewReview);

router
  .route("/:id")
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview,
  );

export default router;

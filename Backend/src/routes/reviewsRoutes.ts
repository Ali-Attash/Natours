import express from "express";
const router = express.Router({ mergeParams: true });
import * as reviewController from "../controllers/reviewControllers";
import * as authController from "../controllers/authControllers";
import Review from "../models/reviewModel";
import { deleteOne, updateOne, get } from "../controllers/factoryController";

router
  .route("/")
  .get(authController.protect, authController.restrictTo("admin"), get(Review))
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.postNewReview,
  );

router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restrictTo("user"),
    deleteOne(Review),
  )
  .patch(
    authController.protect,
    authController.restrictTo("user"),
    updateOne(Review),
  );

export default router;

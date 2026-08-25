import express from "express";
const router = express.Router();
import { myLogger } from "../middlewares/customMiddlewares";
import * as authController from "../controllers/authControllers";
import * as usersController from "../controllers/usersControllers";

// For the logged in users
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.patch(
  "/updatePassword",
  authController.protect,
  authController.updatePassword,
);

router.patch("/updateMe", authController.protect, usersController.updateMe);
router.delete("/deleteMe", authController.protect, usersController.deleteMe);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// These routes are dedicated for admins only
router.route("/").get(usersController.getAllUsers);
router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    usersController.deleteUser,
  )
  .patch(usersController.updateUser);

export default router;

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

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protect Middleware for the rest of the routes
router.use(authController.protect);

router.patch("/updateMe", usersController.updateMe);
router.delete("/deleteMe", usersController.deleteMe);

router.get("/me", authController.restrictTo("user"), usersController.getMe);

// These routes are dedicated for admins only
router.use(authController.restrictTo("admin", "lead-guide"));

router.route("/").get(usersController.getAllUsers);
router
  .route("/:id")
  .delete(usersController.deleteUser)
  .patch(usersController.updateUser);

export default router;

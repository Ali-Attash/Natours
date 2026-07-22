import express from "express";
const router = express.Router();
import { myLogger } from "../middlewares/customMiddlewares";
import * as authController from "../controllers/authControllers";
import * as usersController from "../controllers/usersControllers";

router.post("/signup", authController.signUp);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.route("/").get(usersController.getAllUsers);
//   .post(usersController.postUser);

export default router;

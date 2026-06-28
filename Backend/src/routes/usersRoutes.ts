import express from "express";
const router = express.Router();
import { myLogger } from "../middlewares/customMiddlewares";
import * as authController from "../controllers/authControllers";
import * as usersController from "../controllers/usersControllers";

router.post("/signup", authController.signUp);
router.post("/login", authController.login);

router.route("/").get(usersController.getAllTours);
//   .post(usersController.postUser);

export default router;

import express, { Application } from "express";
import toursRoute from "./routes/toursRoutes";
import usersRoute from "./routes/usersRoutes";
import { errRouteHandle } from "./middlewares/errorHandlingMiddleware";
import { globalErrorMiddleware } from "./middlewares/globalErrorHandlingMiddleware";
import { AppError } from "./utils/factories/appError";
const app: Application = express();
app.use(express.json());
app.use("/api/v1/tours", toursRoute);
app.use("/api/v1/users", usersRoute);

app.all("/{*splat}", errRouteHandle);

app.use(globalErrorMiddleware);

export default app;

import express, { Application } from "express";
import toursRoute from "./routes/toursRoutes";
import usersRoute from "./routes/usersRoutes";
import { errRouteHandle } from "./middlewares/errorHandlingMiddleware";
import { globalErrorMiddleware } from "./middlewares/globalErrorHandlingMiddleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
const app: Application = express();

const rateLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again after an hour",
});
// Setting HTTP Header Security
app.use(helmet());
// Rate limiting
app.use("/api", rateLimiter);
// Read Body JSON
app.use(express.json({ limit: "20kb" }));
// Main Routes
app.use("/api/v1/tours", toursRoute);
app.use("/api/v1/users", usersRoute);
// 404 Not Found Middleware
app.all("/{*splat}", errRouteHandle);
// Global Error Handler Middleware
app.use(globalErrorMiddleware);

export default app;

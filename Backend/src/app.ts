import express, { Application, Request, Response, NextFunction } from "express";
import toursRoute from "./routes/toursRoutes";
import usersRoute from "./routes/usersRoutes";
import reviewsRoute from "./routes/reviewsRoutes";
import { errRouteHandle } from "./middlewares/errorHandlingMiddleware";
import { globalErrorMiddleware } from "./middlewares/globalErrorHandlingMiddleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitizer from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import hpp from "hpp";
const app: Application = express();

const rateLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again after an hour",
});

app.use((req: Request, res: Response, next: NextFunction) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
// Setting HTTP Header Security
app.use(helmet());
// Rate limiting
app.use("/api", rateLimiter);
// Read Body JSON
app.use(express.json({ limit: "20kb" }));
// Data Sanitization against NoSQL query injection
app.use(mongoSanitizer());
// Data Sanitization against XSS
app.use(xss());
// Prevent HTTP Parameter Polution
app.use(
  hpp({
    whitelist: [
      "duration",
      "difficulty",
      "ratingsAverage",
      "ratingsQuantity",
      "price",
      "maxGroupSize",
    ],
  }),
);

// Main Routes
app.use("/api/v1/tours", toursRoute);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/reviews", reviewsRoute);
// 404 Not Found Middleware
app.all("/{*splat}", errRouteHandle);
// Global Error Handler Middleware
app.use(globalErrorMiddleware);

export default app;

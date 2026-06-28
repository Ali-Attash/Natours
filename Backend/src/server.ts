import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import http, { Server } from "http";
import app from "./app";

process.on("uncaughtException", (err) => {
  const errorName = err instanceof Error ? err.name : "UncaughtException";
  const errorMessage = err instanceof Error ? err.message : String(err);

  console.error(`UNCAUGHT EXCEPTION! 💥 ${errorName}: ${errorMessage}`);

  if (err instanceof Error && err.stack) {
    console.error(err.name, err.message);
  }

  server.close();

  setTimeout(() => {
    console.log("Exiting process now.");
    process.exit(1);
  }, 1000).unref();
});

const envFile =
  process.env.NODE_ENV === "production" ? "production.env" : "development.env";

dotenv.config({
  path: path.resolve(__dirname, `../src/configs/${envFile}`),
});

const PORT = process.env.PORT || 5050;
const server: Server = http.createServer(app);

async function serverStart(dbURI: string | undefined) {
  if (!dbURI) {
    throw new Error(
      "Database URI is undefined. Check your .env path and variables.",
    );
  }

  await mongoose.connect(dbURI);
  console.log(
    `Connection to ${process.env.NODE_ENV || "development"} Database was successful`,
  );

  server.listen(PORT, () => {
    console.log(`The Server is Listening on PORT:${PORT}`);
  });
}

serverStart(process.env.DB_URI);

process.on("unhandledRejection", (err) => {
  const errorName = err instanceof Error ? err.name : "UnhandledRejection";
  const errorMessage = err instanceof Error ? err.message : String(err);

  console.error(`UNHANDLED REJECTION! 💥 ${errorName}: ${errorMessage}`);

  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }

  server.close(() => {
    console.log("Server gracefully closed. Shutting down...");
    process.exit(1);
  });

  setTimeout(() => {
    console.error("Forcing shutdown due to timeout.");
    process.exit(1);
  }, 10000).unref();
});

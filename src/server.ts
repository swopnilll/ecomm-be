import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

import logger from "#utils/logger.js";
import mainRoutes from "./routes/index.js";
import connectToDatabase from "./db/db.js";

const app = express();
const port = process.env.PORT || 3000;

// Morgan stream using Winston logger for HTTP logs
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const allowedOrigins = ["http://localhost:5174"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middlewares
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Using Morgan with custom Winston stream
app.use(morgan(":method :url :status :res[content-length] - :response-time ms", { stream: morganStream }));

app.use("/api/v1", mainRoutes);

app.get("/health", (req, res) => {
  res.send("Health check Passed");
  logger.info("Response sent for /health");
});

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Ecomm Api listening on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error("Failed to connect to the database:", error);
    process.exit(1);
  });

export default app;

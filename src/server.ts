import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import compression from "compression";

import logger from "#utils/logger.js";
import connectToDatabase from "./db/db.js";

const app = express();
const port = process.env.PORT || 3000;

// Morgan stream using Winston logger for HTTP logs
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Using Morgan with custom Winston stream
app.use(morgan(":method :url :status :res[content-length] - :response-time ms", { stream: morganStream }));

app.get("/", (req, res) => {
  res.send("Hello World 123!");
  logger.info("Response sent for /");
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

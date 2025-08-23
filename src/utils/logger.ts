import { createLogger, format, transports, addColors } from "winston";

// custom colors for log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "bold red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "cyan",
  },
};

addColors(customLevels.colors);

const logger = createLogger({
  levels: customLevels.levels,
  level: "debug", // Minimum level to log
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    // For console logs: colorize the level and customize output
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      return stack ? `${timestamp} [${level}] ${message} - ${stack}` : `${timestamp} [${level}] ${message}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;

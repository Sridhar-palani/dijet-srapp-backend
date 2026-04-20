import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, colorize, printf, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack ? `${ts} ${level}: ${message}\n${stack}` : `${ts} ${level}: ${message}`
  )
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

// ── Daily rotating file transports (production only) ─────────────────────────
const fileTransports =
  process.env.NODE_ENV === "production"
    ? [
        new winston.transports.DailyRotateFile({
          filename: "logs/error-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxSize: "20m",      // rotate if file exceeds 20MB
          maxFiles: "30d",     // keep 30 days of error logs
          zippedArchive: true,
        }),
        new winston.transports.DailyRotateFile({
          filename: "logs/combined-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "14d",     // keep 14 days of combined logs
          zippedArchive: true,
        }),
      ]
    : [];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "http"),
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [new winston.transports.Console(), ...fileTransports],
});

export default logger;

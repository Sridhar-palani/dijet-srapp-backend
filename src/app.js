import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import errorHandler from "./middlewares/error.middleware.js";
import { protect } from "./middlewares/auth.middleware.js";
import logger from "./utils/logger.js";
import config from "./config/env.js";

import quotationRoutes from "./modules/quotation/quotation.routes.js";
import pdfRoutes from "./modules/pdf/pdf.routes.js";
import itemRoutes from "./modules/item/item.routes.js";
import vendorRoutes from "./modules/vendor/vendor.routes.js";
import customerPORoutes from "./modules/customer_po/customer_po.routes.js";
import purchaseOrderRoutes from "./modules/purchase_order/purchase_order.routes.js";
import grnRoutes from "./modules/grn/grn.routes.js";
import deliveryNoteRoutes from "./modules/delivery_note/delivery_note.routes.js";
import invoiceRoutes from "./modules/invoice/invoice.routes.js";
import customerRoutes from "./modules/customer/customer.routes.js";
import debtorsRoutes from "./modules/debtors/debtors.routes.js";
import creditorsRoutes from "./modules/creditors/creditors.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import expenseRoutes from "./modules/expense/expense.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import exportRoutes from "./modules/export/export.routes.js";
import investmentRoutes from "./modules/investment/investment.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";

const app = express();

// ── Security headers ───────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.allowedOrigins === "*" ? "*" : config.allowedOrigins.split(","),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── NoSQL injection protection ─────────────────────────────────────────────────
// Sanitize req.body and req.params only — req.query is read-only in modern Node.js
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// ── HTTP request logging ───────────────────────────────────────────────────────
app.use(
  morgan("dev", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ── Health check ───────────────────────────────────────────────────────────────
const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: DB_STATES[mongoose.connection.readyState] || "unknown",
  });
});

// ── API docs ───────────────────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ─────────────────────────────────────────────────────────────────────
// Auth (public — login endpoint lives here)
app.use("/api/auth", authRoutes);

// All routes below require a valid JWT
app.use("/api", protect);

app.use("/api/quotations", quotationRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/customer-po", customerPORoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/delivery-notes", deliveryNoteRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/debtors", debtorsRoutes);
app.use("/api/creditors", creditorsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/settings", settingsRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

export default app;

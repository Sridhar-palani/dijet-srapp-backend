import express from "express";
import * as debtorsController from "./debtors.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", debtorsController.getAllDebtorsController);
router.get("/summary", debtorsController.getDebtorsSummaryController);
router.get("/:invoiceId", validateObjectId, debtorsController.getInvoicePaymentsController);
router.post("/:invoiceId/payment", validateObjectId, adminOnly, debtorsController.recordPaymentController);

export default router;

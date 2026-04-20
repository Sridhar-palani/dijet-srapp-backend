import express from "express";
import * as exportController from "./export.controller.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.get("/invoices",          exportController.exportInvoicesController);
router.get("/purchase-orders",   exportController.exportPurchaseOrdersController);
router.get("/delivery-notes",    exportController.exportDeliveryNotesController);
router.get("/expenses",          exportController.exportExpensesController);        // ?category=Salary
router.get("/stock",             exportController.exportStockController);
router.get("/debtors",           exportController.exportDebtorsController);
router.get("/investments",       exportController.exportInvestmentsController);   // ?category=Equipment
router.get("/customer-pos",      exportController.exportCustomerPosController);
router.get("/quotations",        exportController.exportQuotationsController);
router.get("/grns",              exportController.exportGRNsController);
router.get("/creditors",         exportController.exportCreditorsController);

export default router;

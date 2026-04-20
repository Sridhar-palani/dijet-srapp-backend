import express from "express";
import * as reportsController from "./reports.controller.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.get("/dashboard", reportsController.getDashboardController);
router.get("/sales/monthly", reportsController.getMonthlySalesController);
router.get("/customers/top", reportsController.getTopCustomersController);
router.get("/vendors/top", reportsController.getTopVendorsController);
router.get("/stock", reportsController.getStockReportController);
router.get("/pending", reportsController.getPendingReportController);
router.get("/dc-pending", reportsController.getDCPendingReportController);
router.get("/profit-loss", reportsController.getProfitLossReportController);
router.get("/aging/debtors", reportsController.getDebtorAgingReportController);
router.get("/items/sales", reportsController.getItemSalesReportController);
router.get("/vendors/performance", reportsController.getVendorPerformanceReportController);
router.get("/customers/payment-behaviour", reportsController.getCustomerPaymentBehaviourReportController);

export default router;

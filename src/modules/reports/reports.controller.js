import * as ReportsService from "./reports.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const getDashboardController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getDashboard();
  sendResponse(res, 200, data);
});

export const getMonthlySalesController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getMonthlySales(req.query.year);
  sendResponse(res, 200, data);
});

export const getTopCustomersController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getTopCustomers(Number(req.query.limit) || 10);
  sendResponse(res, 200, data);
});

export const getTopVendorsController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getTopVendors(Number(req.query.limit) || 10);
  sendResponse(res, 200, data);
});

export const getStockReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getStockReport();
  sendResponse(res, 200, data);
});

export const getPendingReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getPendingReport();
  sendResponse(res, 200, data);
});

export const getDCPendingReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getDCPendingReport();
  sendResponse(res, 200, data);
});

export const getProfitLossReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getProfitLossReport(req.query.year);
  sendResponse(res, 200, data);
});

export const getDebtorAgingReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getDebtorAgingReport();
  sendResponse(res, 200, data);
});

export const getItemSalesReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getItemSalesReport(req.query.year);
  sendResponse(res, 200, data);
});

export const getVendorPerformanceReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getVendorPerformanceReport();
  sendResponse(res, 200, data);
});

export const getCustomerPaymentBehaviourReportController = asyncHandler(async (req, res) => {
  const data = await ReportsService.getCustomerPaymentBehaviourReport();
  sendResponse(res, 200, data);
});

import * as DebtorsService from "./debtors.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const getAllDebtorsController = asyncHandler(async (req, res) => {
  const settled = req.query.settled === "true";
  const debtors = await DebtorsService.getAllDebtors({ settled });
  sendResponse(res, 200, debtors);
});

export const getDebtorsSummaryController = asyncHandler(async (req, res) => {
  const summary = await DebtorsService.getDebtorsSummary();
  sendResponse(res, 200, summary);
});

export const recordPaymentController = asyncHandler(async (req, res) => {
  const invoice = await DebtorsService.recordPayment(req.params.invoiceId, req.body);
  sendResponse(res, 200, invoice, "Payment recorded successfully");
});

export const getInvoicePaymentsController = asyncHandler(async (req, res) => {
  const data = await DebtorsService.getInvoicePayments(req.params.invoiceId);
  sendResponse(res, 200, data);
});

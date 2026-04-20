import * as CreditorsService from "./creditors.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const getAllCreditorsController = asyncHandler(async (req, res) => {
  const settled = req.query.settled === "true";
  const creditors = await CreditorsService.getAllCreditors({ settled });
  sendResponse(res, 200, creditors);
});

export const getCreditorsSummaryController = asyncHandler(async (req, res) => {
  const summary = await CreditorsService.getCreditorsSummary();
  sendResponse(res, 200, summary);
});

export const recordPaymentController = asyncHandler(async (req, res) => {
  const po = await CreditorsService.recordPayment(req.params.poId, req.body);
  sendResponse(res, 200, po, "Payment recorded successfully");
});

export const getPOPaymentsController = asyncHandler(async (req, res) => {
  const data = await CreditorsService.getPOPayments(req.params.poId);
  sendResponse(res, 200, data);
});

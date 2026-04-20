import * as QuotationService from "./quotation.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createQuotationController = asyncHandler(async (req, res) => {
  const quotation = await QuotationService.createQuotation(req.body);
  logAudit(req, "CREATE", "Quotation", quotation._id, `Created quotation ${quotation.quotationNumber}`, quotation.quotationNumber);
  sendResponse(res, 201, quotation, "Quotation created successfully");
});

export const getAllQuotationsController = asyncHandler(async (req, res) => {
  const result = await QuotationService.getAllQuotations(req.query);
  sendResponse(res, 200, result);
});

export const getQuotationByIdController = asyncHandler(async (req, res) => {
  const quotation = await QuotationService.getQuotationById(req.params.id);
  if (!quotation) throw new AppError("Quotation not found", 404);
  sendResponse(res, 200, quotation);
});

export const updateQuotationController = asyncHandler(async (req, res) => {
  const quotation = await QuotationService.updateQuotation(req.params.id, req.body);
  if (!quotation) throw new AppError("Quotation not found", 404);
  logAudit(req, "UPDATE", "Quotation", quotation._id, `Updated quotation ${quotation.quotationNumber}`, quotation.quotationNumber);
  sendResponse(res, 200, quotation, "Quotation updated successfully");
});

export const deleteQuotationController = asyncHandler(async (req, res) => {
  const deleted = await QuotationService.deleteQuotation(req.params.id);
  if (!deleted) throw new AppError("Quotation not found", 404);
  logAudit(req, "DELETE", "Quotation", req.params.id, `Deleted quotation ${deleted.quotationNumber}`, deleted.quotationNumber);
  sendResponse(res, 200, null, "Quotation deleted successfully");
});

export const approveQuotationController = asyncHandler(async (req, res) => {
  const quotation = await QuotationService.approveQuotation(req.params.id);
  logAudit(req, "UPDATE", "Quotation", quotation._id, `Approved quotation ${quotation.quotationNumber}`, quotation.quotationNumber);
  sendResponse(res, 200, quotation, "Quotation approved successfully");
});

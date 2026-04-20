import * as InvoiceService from "./invoice.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createInvoiceController = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.createInvoice(req.body);
  logAudit(req, "CREATE", "Invoice", invoice._id, `Created invoice ${invoice.invoiceNumber}`, invoice.invoiceNumber);
  sendResponse(res, 201, invoice, "Invoice created successfully");
});

export const getAllInvoicesController = asyncHandler(async (req, res) => {
  const result = await InvoiceService.getAllInvoices(req.query);
  sendResponse(res, 200, result);
});

export const getInvoiceByIdController = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.getInvoiceById(req.params.id);
  sendResponse(res, 200, invoice);
});

export const updateInvoiceController = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.updateInvoice(req.params.id, req.body);
  logAudit(req, "UPDATE", "Invoice", invoice._id, `Updated invoice ${invoice.invoiceNumber}`, invoice.invoiceNumber);
  sendResponse(res, 200, invoice, "Invoice updated successfully");
});

export const deleteInvoiceController = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.deleteInvoice(req.params.id);
  logAudit(req, "DELETE", "Invoice", invoice._id, `Deleted invoice ${invoice.invoiceNumber}`, invoice.invoiceNumber);
  sendResponse(res, 200, null, "Invoice deleted successfully");
});

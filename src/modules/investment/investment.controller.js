import * as InvestmentService from "./investment.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createInvestmentController = asyncHandler(async (req, res) => {
  const inv = await InvestmentService.createInvestment(req.body);
  logAudit(req, "CREATE", "Investment", inv._id, `Created investment ${inv.name}`, inv.name);
  sendResponse(res, 201, inv, "Investment created successfully");
});

export const getAllInvestmentsController = asyncHandler(async (req, res) => {
  const result = await InvestmentService.getAllInvestments(req.query);
  sendResponse(res, 200, result);
});

export const getInvestmentSummaryController = asyncHandler(async (req, res) => {
  const summary = await InvestmentService.getInvestmentSummary();
  sendResponse(res, 200, summary);
});

export const getInvestmentByIdController = asyncHandler(async (req, res) => {
  const inv = await InvestmentService.getInvestmentById(req.params.id);
  sendResponse(res, 200, inv);
});

export const updateInvestmentController = asyncHandler(async (req, res) => {
  const inv = await InvestmentService.updateInvestment(req.params.id, req.body);
  logAudit(req, "UPDATE", "Investment", inv._id, `Updated investment ${inv.name}`, inv.name);
  sendResponse(res, 200, inv, "Investment updated successfully");
});

export const deleteInvestmentController = asyncHandler(async (req, res) => {
  const inv = await InvestmentService.deleteInvestment(req.params.id);
  logAudit(req, "DELETE", "Investment", inv._id, `Deleted investment ${inv.name}`, inv.name);
  sendResponse(res, 200, null, "Investment deleted successfully");
});

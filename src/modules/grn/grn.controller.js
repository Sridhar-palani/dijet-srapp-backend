import * as GRNService from "./grn.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createGRNController = asyncHandler(async (req, res) => {
  const grn = await GRNService.createGRN(req.body);
  logAudit(req, "CREATE", "GRN", grn._id, `Created GRN ${grn.grnNumber}`, grn.grnNumber);
  sendResponse(res, 201, grn, "GRN created successfully");
});

export const getAllGRNController = asyncHandler(async (req, res) => {
  const result = await GRNService.getAllGRNs(req.query);
  sendResponse(res, 200, result);
});

export const getGRNByIdController = asyncHandler(async (req, res) => {
  const grn = await GRNService.getGRNById(req.params.id);
  sendResponse(res, 200, grn);
});

export const updateGRNController = asyncHandler(async (req, res) => {
  const grn = await GRNService.updateGRN(req.params.id, req.body);
  logAudit(req, "UPDATE", "GRN", grn._id, `Updated GRN ${grn.grnNumber}`, grn.grnNumber);
  sendResponse(res, 200, grn, "GRN updated successfully");
});

export const deleteGRNController = asyncHandler(async (req, res) => {
  const grn = await GRNService.deleteGRN(req.params.id);
  logAudit(req, "DELETE", "GRN", grn._id, `Deleted GRN ${grn.grnNumber}`, grn.grnNumber);
  sendResponse(res, 200, null, "GRN deleted successfully");
});

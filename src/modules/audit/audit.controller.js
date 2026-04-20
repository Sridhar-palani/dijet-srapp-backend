import * as AuditService from "./audit.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const getAuditLogsController = asyncHandler(async (req, res) => {
  const result = await AuditService.getAuditLogs(req.query);
  sendResponse(res, 200, result);
});

import * as SettingsService from "./settings.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const getSettingsController = asyncHandler(async (req, res) => {
  const settings = await SettingsService.getSettings();
  sendResponse(res, 200, settings);
});

export const updateOpeningBalanceController = asyncHandler(async (req, res) => {
  const settings = await SettingsService.updateOpeningBalance(req.body);
  sendResponse(res, 200, settings, "Opening balance updated");
});

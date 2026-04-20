import * as VendorService from "./vendor.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const createVendorController = asyncHandler(async (req, res) => {
  const vendor = await VendorService.createVendor(req.body);
  sendResponse(res, 201, vendor, "Vendor created successfully");
});

export const getAllVendorsController = asyncHandler(async (req, res) => {
  const result = await VendorService.getAllVendors(req.query);
  sendResponse(res, 200, result);
});

export const getVendorByIdController = asyncHandler(async (req, res) => {
  const vendor = await VendorService.getVendorById(req.params.id);
  sendResponse(res, 200, vendor);
});

export const updateVendorController = asyncHandler(async (req, res) => {
  const vendor = await VendorService.updateVendor(req.params.id, req.body);
  sendResponse(res, 200, vendor, "Vendor updated successfully");
});

export const deleteVendorController = asyncHandler(async (req, res) => {
  await VendorService.deleteVendor(req.params.id);
  sendResponse(res, 200, null, "Vendor deleted successfully");
});

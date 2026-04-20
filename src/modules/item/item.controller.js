import * as itemService from "./item.service.js";
import { ITEM_TYPE_HSN_MAP } from "./item.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const getItemTypesController = asyncHandler(async (req, res) => {
  sendResponse(res, 200, ITEM_TYPE_HSN_MAP);
});

export const createItemController = asyncHandler(async (req, res) => {
  const newItem = await itemService.createItem(req);
  sendResponse(res, 201, newItem, "Item created successfully");
});

export const getAllItemsController = asyncHandler(async (req, res) => {
  const result = await itemService.getAllItems(req.query);
  sendResponse(res, 200, result);
});

export const getItemByIdController = asyncHandler(async (req, res) => {
  const item = await itemService.getItemById(req.params.id);
  if (!item) throw new AppError("Item not found", 404);
  sendResponse(res, 200, item);
});

export const updateItemController = asyncHandler(async (req, res) => {
  const updatedItem = await itemService.updateItem(req, req.params.id);
  sendResponse(res, 200, updatedItem, "Item updated successfully");
});

export const deleteItemController = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.params.id);
  sendResponse(res, 200, null, "Item deleted successfully");
});

export const approveItemController = asyncHandler(async (req, res) => {
  const item = await itemService.approveItem(req.params.id);
  logAudit(req, "UPDATE", "Item", item._id, `Approved item ${item.name}`, item.name);
  sendResponse(res, 200, item, "Item approved successfully");
});

export const rejectItemController = asyncHandler(async (req, res) => {
  const item = await itemService.rejectItem(req.params.id);
  logAudit(req, "DELETE", "Item", item._id, `Rejected item ${item.name}`, item.name);
  sendResponse(res, 200, null, "Item rejected and deleted");
});

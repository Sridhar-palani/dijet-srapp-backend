import * as POService from "./purchase_order.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createPOController = asyncHandler(async (req, res) => {
  const po = await POService.createPurchaseOrder(req.body);
  logAudit(req, "CREATE", "PurchaseOrder", po._id, `Created PO ${po.poNumber}`, po.poNumber);
  sendResponse(res, 201, po, "Purchase Order created successfully");
});

export const createFromCPOController = asyncHandler(async (req, res) => {
  const pos = await POService.createFromCPO(req.params.cpoId, req.body);
  pos.forEach((po) => logAudit(req, "CREATE", "PurchaseOrder", po._id, `Created PO ${po.poNumber} from CPO`, po.poNumber));
  sendResponse(res, 201, pos, "Purchase Order(s) created from Customer PO");
});

export const getAllPOController = asyncHandler(async (req, res) => {
  const result = await POService.getAllPurchaseOrders(req.query);
  sendResponse(res, 200, result);
});

export const getPOByIdController = asyncHandler(async (req, res) => {
  const po = await POService.getPurchaseOrderById(req.params.id);
  sendResponse(res, 200, po);
});

export const updatePOController = asyncHandler(async (req, res) => {
  const po = await POService.updatePurchaseOrder(req.params.id, req.body);
  logAudit(req, "UPDATE", "PurchaseOrder", po._id, `Updated PO ${po.poNumber}`, po.poNumber);
  sendResponse(res, 200, po, "Purchase Order updated successfully");
});

export const deletePOController = asyncHandler(async (req, res) => {
  const po = await POService.deletePurchaseOrder(req.params.id);
  logAudit(req, "DELETE", "PurchaseOrder", po._id, `Deleted PO ${po.poNumber}`, po.poNumber);
  sendResponse(res, 200, null, "Purchase Order deleted successfully");
});

export const getPOGRNsController = asyncHandler(async (req, res) => {
  const data = await POService.getPOGRNs(req.params.id);
  sendResponse(res, 200, data);
});

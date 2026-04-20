import * as DNService from "./delivery_note.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createDNController = asyncHandler(async (req, res) => {
  const dn = await DNService.createDeliveryNote(req.body);
  logAudit(req, "CREATE", "DeliveryNote", dn._id, `Created Delivery Note ${dn.dnNumber}`, dn.dnNumber);
  sendResponse(res, 201, dn, "Delivery Note created successfully");
});

export const createFromCPOController = asyncHandler(async (req, res) => {
  const dn = await DNService.createFromCPO(req.params.cpoId, req.body);
  logAudit(req, "CREATE", "DeliveryNote", dn._id, `Created Delivery Note ${dn.dnNumber} from CPO`, dn.dnNumber);
  sendResponse(res, 201, dn, "Delivery Note created from Customer PO");
});

export const getAllDNController = asyncHandler(async (req, res) => {
  const result = await DNService.getAllDeliveryNotes(req.query);
  sendResponse(res, 200, result);
});

export const getDNByIdController = asyncHandler(async (req, res) => {
  const dn = await DNService.getDeliveryNoteById(req.params.id);
  sendResponse(res, 200, dn);
});

export const updateDNController = asyncHandler(async (req, res) => {
  const dn = await DNService.updateDeliveryNote(req.params.id, req.body);
  logAudit(req, "UPDATE", "DeliveryNote", dn._id, `Updated Delivery Note ${dn.dnNumber}`, dn.dnNumber);
  sendResponse(res, 200, dn, "Delivery Note updated successfully");
});

export const deleteDNController = asyncHandler(async (req, res) => {
  const dn = await DNService.deleteDeliveryNote(req.params.id);
  logAudit(req, "DELETE", "DeliveryNote", dn._id, `Deleted Delivery Note ${dn.dnNumber}`, dn.dnNumber);
  sendResponse(res, 200, null, "Delivery Note deleted successfully");
});

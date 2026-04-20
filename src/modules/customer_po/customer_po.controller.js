import * as CPOService from "./customer_po.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createCPOController = asyncHandler(async (req, res) => {
  const cpo = await CPOService.createCustomerPO(req.body);
  logAudit(req, "CREATE", "CustomerPO", cpo._id, `Created Customer PO ${cpo.cpoNumber}`, cpo.cpoNumber);
  sendResponse(res, 201, cpo, "Customer PO created successfully");
});

export const createFromQuotationController = asyncHandler(async (req, res) => {
  const cpo = await CPOService.createFromQuotation(req.params.quotationId, req.body);
  logAudit(req, "CREATE", "CustomerPO", cpo._id, `Created Customer PO ${cpo.cpoNumber} from quotation`, cpo.cpoNumber);
  sendResponse(res, 201, cpo, "Customer PO created from Quotation");
});

export const getAllCPOController = asyncHandler(async (req, res) => {
  const result = await CPOService.getAllCustomerPOs(req.query);
  sendResponse(res, 200, result);
});

export const getCPOByIdController = asyncHandler(async (req, res) => {
  const cpo = await CPOService.getCustomerPOById(req.params.id);
  sendResponse(res, 200, cpo);
});

export const updateCPOController = asyncHandler(async (req, res) => {
  const cpo = await CPOService.updateCustomerPO(req.params.id, req.body);
  logAudit(req, "UPDATE", "CustomerPO", cpo._id, `Updated Customer PO ${cpo.cpoNumber}`, cpo.cpoNumber);
  sendResponse(res, 200, cpo, "Customer PO updated successfully");
});

export const deleteCPOController = asyncHandler(async (req, res) => {
  const cpo = await CPOService.deleteCustomerPO(req.params.id);
  logAudit(req, "DELETE", "CustomerPO", cpo._id, `Deleted Customer PO ${cpo.cpoNumber}`, cpo.cpoNumber);
  sendResponse(res, 200, null, "Customer PO deleted successfully");
});

export const getCPODeliveryNotesController = asyncHandler(async (req, res) => {
  const data = await CPOService.getCPODeliveryNotes(req.params.id);
  sendResponse(res, 200, data);
});

export const getCPOInvoicesController = asyncHandler(async (req, res) => {
  const data = await CPOService.getCPOInvoices(req.params.id);
  sendResponse(res, 200, data);
});

export const getLastPriceController = asyncHandler(async (req, res) => {
  const { customerId, itemId } = req.query;
  const data = await CPOService.getLastCustomerItemPrice(customerId, itemId);
  sendResponse(res, 200, data);
});
